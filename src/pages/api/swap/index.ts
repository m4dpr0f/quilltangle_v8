import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  buildReciprocitySwapTransaction,
  verifySwapTransaction,
  getTreasuryBalance,
  getTreasuryPublicKey,
  QLX_MINT,
} from '../../../lib/treasury';

/**
 * Reciprocity Pool Swap API
 *
 * Enables 1:1 swaps between QLX and GCN tokens through the Commons Treasury.
 *
 * Flow:
 * 1. POST with action='prepare' - Build the swap transaction
 * 2. Client signs the transaction
 * 3. Client submits to network
 * 4. POST with action='confirm' - Record the swap in database
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      fromMint,
      toMint,
      amount,
      userWallet,
      action = 'prepare', // 'prepare' or 'confirm'
      txSignature,
    } = body;

    if (!fromMint || !toMint || !userWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: fromMint, toMint, userWallet',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();
    const qlxMint = QLX_MINT.toBase58();
    const isQlxToGcn = fromMint === qlxMint;
    const gcnMint = isQlxToGcn ? toMint : fromMint;

    // Check if token is in reciprocity pool
    const poolResult = await sql`
      SELECT rp.*, t.symbol, t.name
      FROM reciprocity_pool rp
      JOIN tokens t ON rp.token_id = t.id
      WHERE rp.mint_address = ${gcnMint}
    `;

    if (poolResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token not in reciprocity pool',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const pool = poolResult[0];

    // ACTION: Prepare swap transaction
    if (action === 'prepare') {
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid amount',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Check treasury has enough tokens
      const treasuryBalance = await getTreasuryBalance(toMint);
      if (treasuryBalance.formatted < amount) {
        return new Response(JSON.stringify({
          success: false,
          error: `Insufficient liquidity. Available: ${treasuryBalance.formatted.toFixed(2)}`,
          availableBalance: treasuryBalance.formatted,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Build the swap transaction
      const result = await buildReciprocitySwapTransaction({
        userWallet,
        fromMint,
        toMint,
        amount,
      });

      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          error: result.error,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Create pending swap record
      const fromTokenResult = await sql`SELECT id FROM tokens WHERE mint_address = ${fromMint}`;
      const toTokenResult = await sql`SELECT id FROM tokens WHERE mint_address = ${toMint}`;

      const swapRecord = await sql`
        INSERT INTO swaps (
          from_token_id, to_token_id, from_mint, to_mint,
          amount, user_wallet, status, direction
        ) VALUES (
          ${fromTokenResult[0]?.id || null},
          ${toTokenResult[0]?.id || null},
          ${fromMint},
          ${toMint},
          ${amount},
          ${userWallet},
          'pending',
          ${isQlxToGcn ? 'qlx_to_gcn' : 'gcn_to_qlx'}
        )
        RETURNING id
      `;

      return new Response(JSON.stringify({
        success: true,
        action: 'prepared',
        swapId: swapRecord[0].id,
        transaction: result.transaction,
        message: result.message,
        swap: {
          from: isQlxToGcn ? 'QLX' : pool.symbol,
          to: isQlxToGcn ? pool.symbol : 'QLX',
          amount,
          rate: '1:1',
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ACTION: Confirm swap after user signed and submitted
    if (action === 'confirm') {
      if (!txSignature) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing transaction signature',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Verify the transaction
      const verification = await verifySwapTransaction(txSignature);

      if (!verification.success) {
        return new Response(JSON.stringify({
          success: false,
          error: verification.error || 'Failed to verify transaction',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Update swap record
      await sql`
        UPDATE swaps
        SET
          status = ${verification.confirmed ? 'confirmed' : 'submitted'},
          tx_signature = ${txSignature},
          confirmed_at = ${verification.confirmed ? sql`NOW()` : null}
        WHERE user_wallet = ${userWallet}
          AND from_mint = ${fromMint}
          AND to_mint = ${toMint}
          AND status = 'pending'
        ORDER BY id DESC
        LIMIT 1
      `;

      // Update pool balances (database tracking)
      const amountRaw = Math.floor(amount * 1e6);
      if (isQlxToGcn) {
        // User gave QLX, received GCN → treasury GCN decreased
        await sql`
          UPDATE reciprocity_pool
          SET
            available_amount = available_amount - ${amountRaw},
            total_swaps_out = total_swaps_out + 1,
            updated_at = NOW()
          WHERE mint_address = ${gcnMint}
        `;
      } else {
        // User gave GCN, received QLX → treasury GCN increased
        await sql`
          UPDATE reciprocity_pool
          SET
            available_amount = available_amount + ${amountRaw},
            total_swaps_in = total_swaps_in + 1,
            updated_at = NOW()
          WHERE mint_address = ${gcnMint}
        `;
      }

      // Update metaphysics index
      if (isQlxToGcn) {
        await sql`
          UPDATE metaphysics_index
          SET
            total_qlx_inflow = COALESCE(total_qlx_inflow, 0) + ${amountRaw},
            swap_count_total = COALESCE(swap_count_total, 0) + 1,
            last_swap_at = NOW(),
            updated_at = NOW()
          WHERE mint_address = ${gcnMint}
        `;
      } else {
        await sql`
          UPDATE metaphysics_index
          SET
            total_qlx_outflow = COALESCE(total_qlx_outflow, 0) + ${amountRaw},
            swap_count_total = COALESCE(swap_count_total, 0) + 1,
            last_swap_at = NOW(),
            updated_at = NOW()
          WHERE mint_address = ${gcnMint}
        `;
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'confirmed',
        confirmed: verification.confirmed,
        txSignature,
        message: verification.confirmed
          ? 'Swap completed successfully!'
          : 'Swap submitted, awaiting confirmation.',
        explorer: `https://solscan.io/tx/${txSignature}`,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action. Use "prepare" or "confirm".',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Swap error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET: Get pool info and available tokens
export const GET: APIRoute = async ({ url }) => {
  try {
    const sql = getDb();
    const mint = url.searchParams.get('mint');

    // Get specific pool info
    if (mint) {
      const poolResult = await sql`
        SELECT
          rp.*,
          t.symbol,
          t.name,
          t.image_uri,
          g.nation_name,
          g.road_id
        FROM reciprocity_pool rp
        JOIN tokens t ON rp.token_id = t.id
        LEFT JOIN gcn_entries g ON t.id = g.token_id
        WHERE rp.mint_address = ${mint}
      `;

      if (poolResult.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token not found in reciprocity pool',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      const pool = poolResult[0];

      // Get on-chain balance
      const onChainBalance = await getTreasuryBalance(mint);

      return new Response(JSON.stringify({
        success: true,
        pool: {
          mintAddress: pool.mint_address,
          symbol: pool.symbol,
          name: pool.name,
          nationName: pool.nation_name,
          roadId: pool.road_id,
          depositedAmount: pool.deposited_amount,
          availableAmount: pool.available_amount,
          onChainBalance: onChainBalance.formatted,
          totalSwapsIn: pool.total_swaps_in,
          totalSwapsOut: pool.total_swaps_out,
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // List all pools
    const pools = await sql`
      SELECT
        rp.mint_address,
        t.symbol,
        t.name,
        t.image_uri,
        rp.available_amount,
        rp.total_swaps_in,
        rp.total_swaps_out,
        g.nation_name,
        g.road_id
      FROM reciprocity_pool rp
      JOIN tokens t ON rp.token_id = t.id
      LEFT JOIN gcn_entries g ON t.id = g.token_id
      WHERE rp.available_amount > 0
      ORDER BY rp.available_amount DESC
    `;

    // Get treasury info
    const treasuryPubkey = getTreasuryPublicKey();

    return new Response(JSON.stringify({
      success: true,
      treasury: treasuryPubkey ? treasuryPubkey.toBase58() : null,
      qlxMint: QLX_MINT.toBase58(),
      pools: pools.map((p: any) => ({
        mintAddress: p.mint_address,
        symbol: p.symbol,
        name: p.name,
        imageUri: p.image_uri,
        nationName: p.nation_name,
        roadId: p.road_id,
        availableBalance: Number(p.available_amount) / 1e6,
        swapsIn: p.total_swaps_in,
        swapsOut: p.total_swaps_out,
      })),
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
