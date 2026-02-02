import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { PublicKey, Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from '@solana/spl-token';
import { getTreasuryPublicKey, getConnection } from '../../../lib/treasury';

/**
 * Reciprocity Pool Deposit API
 *
 * Allows token creators/holders to deposit tokens into the reciprocity pool,
 * making them available for 1:1 swaps with QLX.
 *
 * Flow:
 * 1. POST with action='prepare' - Build deposit transaction
 * 2. Client signs the transaction
 * 3. Client submits to network
 * 4. POST with action='confirm' - Record the deposit in database
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      action = 'prepare',
      tokenMint,
      amount,
      userWallet,
      txSignature,
    } = body;

    if (!tokenMint || !userWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: tokenMint, userWallet',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // ACTION: Prepare deposit transaction
    if (action === 'prepare') {
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid amount',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const treasuryPubkey = getTreasuryPublicKey();
      if (!treasuryPubkey) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Treasury not configured',
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      // Check if token exists in our database
      const tokenResult = await sql`
        SELECT t.*,
               tl.name as launch_name,
               tl.symbol as launch_symbol,
               tl.creator_wallet as launch_creator
        FROM tokens t
        LEFT JOIN token_launches tl ON t.mint_address = tl.token_mint
        WHERE t.mint_address = ${tokenMint}
      `;

      let tokenInfo = tokenResult[0];
      let tokenId = tokenInfo?.id;

      // If token not in database, we can still allow deposit but need to register it
      if (!tokenInfo) {
        // Check if it exists in token_launches
        const launchResult = await sql`
          SELECT * FROM token_launches WHERE token_mint = ${tokenMint}
        `;

        if (launchResult.length > 0) {
          const launch = launchResult[0];
          // Register in tokens table
          const insertResult = await sql`
            INSERT INTO tokens (
              mint_address, name, symbol, decimals, total_supply,
              creator_wallet, realm, description, is_gcn_entry
            ) VALUES (
              ${tokenMint},
              ${launch.name},
              ${launch.symbol},
              ${launch.decimals || 6},
              ${launch.total_supply},
              ${launch.creator_wallet},
              'GCN',
              ${launch.description || ''},
              true
            )
            ON CONFLICT (mint_address) DO UPDATE SET
              name = EXCLUDED.name,
              symbol = EXCLUDED.symbol
            RETURNING id
          `;
          tokenId = insertResult[0]?.id;
          tokenInfo = { ...launch, id: tokenId };
        }
      }

      const connection = getConnection();
      const userPubkey = new PublicKey(userWallet);
      const mintPubkey = new PublicKey(tokenMint);

      // Detect which token program the mint uses
      let tokenProgramId = TOKEN_PROGRAM_ID;
      let mintDecimals = tokenInfo?.decimals || 6;

      try {
        // Try Token-2022 first (8xM uses Token-2022)
        const mint2022 = await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID);
        tokenProgramId = TOKEN_2022_PROGRAM_ID;
        mintDecimals = mint2022.decimals;
        console.log('Token is Token-2022, decimals:', mintDecimals);
      } catch {
        try {
          // Fallback to standard Token Program
          const mint = await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);
          tokenProgramId = TOKEN_PROGRAM_ID;
          mintDecimals = mint.decimals;
          console.log('Token is standard SPL, decimals:', mintDecimals);
        } catch (e) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Could not find token mint. Make sure the address is correct.',
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Get token accounts using the correct program
      const userATA = await getAssociatedTokenAddress(mintPubkey, userPubkey, false, tokenProgramId);
      const treasuryATA = await getAssociatedTokenAddress(mintPubkey, treasuryPubkey, false, tokenProgramId);

      const instructions: TransactionInstruction[] = [];
      const decimals = mintDecimals;
      const amountRaw = BigInt(Math.floor(amount * Math.pow(10, decimals)));

      // Check user has enough tokens
      try {
        const userAccount = await getAccount(connection, userATA, 'confirmed', tokenProgramId);
        if (userAccount.amount < amountRaw) {
          return new Response(JSON.stringify({
            success: false,
            error: `Insufficient token balance. You have ${Number(userAccount.amount) / Math.pow(10, decimals)} tokens.`,
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
      } catch {
        return new Response(JSON.stringify({
          success: false,
          error: 'You do not have a token account for this token.',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Check if treasury ATA exists, create if not
      try {
        await getAccount(connection, treasuryATA, 'confirmed', tokenProgramId);
      } catch {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            userPubkey, // payer
            treasuryATA,
            treasuryPubkey,
            mintPubkey,
            tokenProgramId
          )
        );
      }

      // Transfer tokens to treasury
      instructions.push(
        createTransferInstruction(
          userATA,
          treasuryATA,
          userPubkey,
          amountRaw,
          [],
          tokenProgramId
        )
      );

      // Build transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: userPubkey,
        blockhash,
        lastValidBlockHeight,
      });

      instructions.forEach((ix) => transaction.add(ix));

      // Serialize for client to sign
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return new Response(JSON.stringify({
        success: true,
        action: 'prepared',
        transaction: serialized.toString('base64'),
        message: `Ready to deposit ${amount} tokens to the reciprocity pool.`,
        details: {
          tokenMint,
          amount,
          amountRaw: amountRaw.toString(),
          treasuryAddress: treasuryPubkey.toBase58(),
          tokenName: tokenInfo?.name || tokenInfo?.launch_name || 'Unknown',
          tokenSymbol: tokenInfo?.symbol || tokenInfo?.launch_symbol || '???',
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ACTION: Confirm deposit after user signed and submitted
    if (action === 'confirm') {
      if (!txSignature) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing transaction signature',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      if (!amount) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing amount',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const connection = getConnection();

      // Verify the transaction
      const result = await connection.getSignatureStatus(txSignature, {
        searchTransactionHistory: true,
      });

      const confirmed = result.value?.confirmationStatus === 'confirmed' ||
                        result.value?.confirmationStatus === 'finalized';

      if (!confirmed) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Transaction not confirmed yet. Please wait and try again.',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Get or create token record
      let tokenResult = await sql`SELECT id FROM tokens WHERE mint_address = ${tokenMint}`;
      let tokenId = tokenResult[0]?.id;

      // If token not in tokens table, try to get info from token_launches
      if (!tokenId) {
        const launchResult = await sql`
          SELECT * FROM token_launches WHERE token_mint = ${tokenMint}
        `;

        if (launchResult.length > 0) {
          const launch = launchResult[0];
          const insertResult = await sql`
            INSERT INTO tokens (
              mint_address, name, symbol, decimals, total_supply,
              creator_wallet, realm, description, is_gcn_entry
            ) VALUES (
              ${tokenMint},
              ${launch.name},
              ${launch.symbol},
              ${launch.decimals || 6},
              ${launch.total_supply},
              ${launch.creator_wallet},
              'GCN',
              ${launch.description || ''},
              true
            )
            ON CONFLICT (mint_address) DO UPDATE SET
              name = EXCLUDED.name
            RETURNING id
          `;
          tokenId = insertResult[0].id;
        } else {
          // Create a minimal token record
          const insertResult = await sql`
            INSERT INTO tokens (
              mint_address, name, symbol, decimals, total_supply,
              creator_wallet, realm, is_gcn_entry
            ) VALUES (
              ${tokenMint},
              'Unknown Token',
              '???',
              6,
              0,
              ${userWallet},
              'GCN',
              true
            )
            ON CONFLICT (mint_address) DO NOTHING
            RETURNING id
          `;
          tokenId = insertResult[0]?.id;

          if (!tokenId) {
            tokenResult = await sql`SELECT id FROM tokens WHERE mint_address = ${tokenMint}`;
            tokenId = tokenResult[0]?.id;
          }
        }
      }

      const amountRaw = Math.floor(amount * 1e6);

      // Update or create reciprocity pool entry
      const existingPool = await sql`
        SELECT * FROM reciprocity_pool WHERE mint_address = ${tokenMint}
      `;

      if (existingPool.length > 0) {
        // Add to existing pool
        await sql`
          UPDATE reciprocity_pool
          SET
            deposited_amount = deposited_amount + ${amountRaw},
            available_amount = available_amount + ${amountRaw},
            updated_at = NOW()
          WHERE mint_address = ${tokenMint}
        `;
      } else {
        // Create new pool entry
        await sql`
          INSERT INTO reciprocity_pool (
            token_id, mint_address, deposited_amount, available_amount,
            depositor_wallet, initial_deposit_tx
          ) VALUES (
            ${tokenId},
            ${tokenMint},
            ${amountRaw},
            ${amountRaw},
            ${userWallet},
            ${txSignature}
          )
        `;

        // Also create metaphysics index entry
        await sql`
          INSERT INTO metaphysics_index (token_id, mint_address)
          VALUES (${tokenId}, ${tokenMint})
          ON CONFLICT DO NOTHING
        `;
      }

      // Get updated pool info
      const updatedPool = await sql`
        SELECT rp.*, t.symbol, t.name
        FROM reciprocity_pool rp
        JOIN tokens t ON rp.token_id = t.id
        WHERE rp.mint_address = ${tokenMint}
      `;

      return new Response(JSON.stringify({
        success: true,
        action: 'confirmed',
        txSignature,
        message: `Successfully deposited ${amount} tokens to the reciprocity pool!`,
        pool: updatedPool[0] ? {
          symbol: updatedPool[0].symbol,
          name: updatedPool[0].name,
          totalDeposited: Number(updatedPool[0].deposited_amount) / 1e6,
          availableBalance: Number(updatedPool[0].available_amount) / 1e6,
        } : null,
        explorer: `https://solscan.io/tx/${txSignature}`,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action. Use "prepare" or "confirm".',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Deposit error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET: List depositable tokens (user's tokens not yet in pool or needing more)
export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const sql = getDb();

    if (wallet) {
      // Get user's tokens from launches
      const userTokens = await sql`
        SELECT
          tl.token_mint as mint_address,
          tl.name,
          tl.symbol,
          tl.phase,
          tl.creator_wallet,
          COALESCE(rp.deposited_amount, 0) / 1000000 as pool_balance,
          CASE WHEN rp.id IS NOT NULL THEN true ELSE false END as in_pool
        FROM token_launches tl
        LEFT JOIN reciprocity_pool rp ON tl.token_mint = rp.mint_address
        WHERE tl.creator_wallet = ${wallet}
          AND tl.token_mint IS NOT NULL
          AND tl.phase = 'live'
        ORDER BY tl.created_at DESC
      `;

      return new Response(JSON.stringify({
        success: true,
        tokens: userTokens,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Get all pools summary
    const pools = await sql`
      SELECT
        rp.mint_address,
        t.symbol,
        t.name,
        rp.deposited_amount / 1000000 as total_deposited,
        rp.available_amount / 1000000 as available_balance,
        rp.total_swaps_in,
        rp.total_swaps_out,
        rp.depositor_wallet
      FROM reciprocity_pool rp
      JOIN tokens t ON rp.token_id = t.id
      ORDER BY rp.available_amount DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      pools,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
