import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createWithdrawWithheldTokensFromMintInstruction,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getMint,
  getTransferFeeConfig,
  getAccount,
} from '@solana/spl-token';

const RPC_URL = import.meta.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Platform wallet that pays for cron transactions
// Fund this with ~0.1 SOL to cover months of harvesting
const PLATFORM_PAYER_SECRET = import.meta.env.PLATFORM_PAYER_SECRET;

/**
 * Cron Job: Auto-Harvest Royalties
 *
 * Called by Cloudflare Cron Trigger (e.g., every hour)
 * Harvests transfer fees and distributes according to each token's config
 *
 * Set up in wrangler.toml:
 * [triggers]
 * crons = ["0 * * * *"]  # Every hour
 */
export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret (optional security)
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = import.meta.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!PLATFORM_PAYER_SECRET) {
    return new Response(JSON.stringify({
      error: 'Platform payer not configured. Set PLATFORM_PAYER_SECRET env var.',
      setup: 'Generate a keypair, fund with 0.1 SOL, add base64 secret key to env'
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const results: any[] = [];
  const errors: any[] = [];

  try {
    const sql = getDb();
    const connection = new Connection(RPC_URL, 'confirmed');

    // Decode platform payer keypair
    const payerKeypair = Keypair.fromSecretKey(
      Buffer.from(PLATFORM_PAYER_SECRET, 'base64')
    );

    // Get all live tokens with royalty config
    const tokens = await sql`
      SELECT
        id,
        token_mint,
        creator_wallet,
        name,
        symbol,
        royalty_config
      FROM token_launches
      WHERE phase = 'live'
        AND token_mint IS NOT NULL
        AND royalty_config IS NOT NULL
        AND (royalty_config->>'feePercent')::float > 0
    `;

    console.log(`[Cron] Processing ${tokens.length} tokens with royalties`);

    for (const token of tokens) {
      try {
        const mintPubkey = new PublicKey(token.token_mint);
        const creatorPubkey = new PublicKey(token.creator_wallet);
        const config = token.royalty_config;

        // Get mint info with transfer fee config
        const mintInfo = await getMint(
          connection,
          mintPubkey,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );

        const feeConfig = getTransferFeeConfig(mintInfo);
        if (!feeConfig) {
          continue; // Skip tokens without transfer fee
        }

        const withheldAmount = feeConfig.withheldAmount;

        // Skip if nothing to collect
        if (withheldAmount === 0n) {
          results.push({
            token: token.symbol,
            status: 'skipped',
            reason: 'No fees to collect',
          });
          continue;
        }

        // Get or create creator's token account
        const creatorAta = await getAssociatedTokenAddress(
          mintPubkey,
          creatorPubkey,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        // Build transaction
        const transaction = new Transaction();

        // Check if creator ATA exists, create if not
        try {
          await getAccount(connection, creatorAta, 'confirmed', TOKEN_2022_PROGRAM_ID);
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              payerKeypair.publicKey, // payer
              creatorAta,
              creatorPubkey,
              mintPubkey,
              TOKEN_2022_PROGRAM_ID
            )
          );
        }

        // Withdraw withheld tokens to creator
        // Note: Creator must be the withdrawWithheldAuthority
        // Since creator isn't signing, we can only withdraw to their account
        // They'll need to sign for distribution to holders
        transaction.add(
          createWithdrawWithheldTokensFromMintInstruction(
            mintPubkey,
            creatorAta,
            creatorPubkey, // withdraw authority (creator)
            [], // multisig signers
            TOKEN_2022_PROGRAM_ID
          )
        );

        // Set transaction params
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = payerKeypair.publicKey;

        // NOTE: This will only work if the platform wallet is the withdrawWithheldAuthority
        // For creator-owned tokens, we need to notify them to collect manually
        // Or we need the creator to delegate withdrawal authority to platform

        // For now, just record what's available
        results.push({
          token: token.symbol,
          mint: token.token_mint,
          withheldAmount: withheldAmount.toString(),
          withheldFormatted: Number(withheldAmount) / Math.pow(10, mintInfo.decimals),
          creatorWallet: token.creator_wallet,
          config: config,
          status: 'pending_creator_action',
          message: 'Creator needs to collect - they are the withdraw authority',
        });

      } catch (err: any) {
        errors.push({
          token: token.symbol,
          error: err.message,
        });
      }
    }

    // Update database with pending royalties info
    for (const result of results) {
      if (result.withheldAmount && BigInt(result.withheldAmount) > 0n) {
        await sql`
          UPDATE token_launches
          SET royalty_config = royalty_config || ${JSON.stringify({
            lastChecked: new Date().toISOString(),
            pendingAmount: result.withheldAmount,
          })}::jsonb
          WHERE token_mint = ${result.mint}
        `;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: tokens.length,
      results,
      errors,
      timestamp: new Date().toISOString(),
      note: 'Creators are withdraw authorities - they must sign to collect. Cron updates pending amounts.',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[Cron] Harvest error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results,
      errors,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * POST: Manually trigger harvest for a specific token
 * Creator must sign this transaction
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tokenMint, creatorWallet, distributeToHolders } = body;

    if (!tokenMint || !creatorWallet) {
      return new Response(JSON.stringify({
        error: 'Missing tokenMint or creatorWallet',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const mintPubkey = new PublicKey(tokenMint);
    const creatorPubkey = new PublicKey(creatorWallet);

    // Get mint info
    const mintInfo = await getMint(
      connection,
      mintPubkey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    const feeConfig = getTransferFeeConfig(mintInfo);
    if (!feeConfig) {
      return new Response(JSON.stringify({
        error: 'Token does not have transfer fees enabled',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const withheldAmount = feeConfig.withheldAmount;

    // Get creator's token account
    const creatorAta = await getAssociatedTokenAddress(
      mintPubkey,
      creatorPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Build transaction
    const transaction = new Transaction();

    // Withdraw all withheld tokens to creator
    transaction.add(
      createWithdrawWithheldTokensFromMintInstruction(
        mintPubkey,
        creatorAta,
        creatorPubkey, // withdraw authority must sign
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    // If distributing to holders, we'll handle that client-side after this tx
    // Since we need to know balances at time of distribution

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = creatorPubkey;

    // Serialize for client signing
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    return new Response(JSON.stringify({
      success: true,
      transaction: serializedTx,
      withheldAmount: withheldAmount.toString(),
      withheldFormatted: Number(withheldAmount) / Math.pow(10, mintInfo.decimals),
      decimals: mintInfo.decimals,
      message: 'Sign this transaction to collect your royalties!',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
