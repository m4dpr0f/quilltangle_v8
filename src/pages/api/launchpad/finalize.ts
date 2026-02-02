import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { PLATFORM_WALLET } from '../../../lib/launchpad';

/**
 * Finalize Launch Endpoint
 *
 * Called after client-side transactions complete:
 * 1. Token minted
 * 2. Metadata set
 * 3. Pool created on Meteora
 *
 * Updates launch record and creates nation if applicable.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      launchId,
      tokenMint,
      poolAddress,
      lpMint,
      mintTx,
      metadataTx,
      poolTx,
      walletAddress,
      phase, // 'minted', 'pooled', 'live'
    } = body;

    if (!launchId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing launchId or walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Verify ownership
    const launchResult = await sql`
      SELECT * FROM token_launches
      WHERE id = ${launchId} AND creator_wallet = ${walletAddress}
    `;

    if (launchResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Launch not found or unauthorized',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const launch = launchResult[0];

    // Update based on phase
    if (phase === 'minted' && tokenMint) {
      await sql`
        UPDATE token_launches
        SET
          token_mint = ${tokenMint},
          mint_tx = ${mintTx || null},
          metadata_tx = ${metadataTx || null},
          phase = 'seeding',
          minted_at = NOW()
        WHERE id = ${launchId}
      `;

      // Register token in tokens table
      await sql`
        INSERT INTO tokens (
          mint_address, name, symbol, decimals, total_supply,
          creator_wallet, realm, description, is_gcn_entry
        ) VALUES (
          ${tokenMint},
          ${launch.name},
          ${launch.symbol},
          ${launch.decimals},
          ${launch.total_supply},
          ${walletAddress},
          'GCN',
          ${launch.description || ''},
          true
        )
        ON CONFLICT (mint_address) DO UPDATE SET
          name = EXCLUDED.name,
          symbol = EXCLUDED.symbol
      `;

      // Add to reciprocity pool
      const tokenResult = await sql`SELECT id FROM tokens WHERE mint_address = ${tokenMint}`;
      if (tokenResult.length > 0) {
        const tokenId = tokenResult[0].id;
        const treasuryAmount = launch.treasury_tokens * Math.pow(10, launch.decimals);

        await sql`
          INSERT INTO reciprocity_pool (
            token_id, mint_address, deposited_amount, available_amount, depositor_wallet
          ) VALUES (
            ${tokenId}, ${tokenMint}, ${treasuryAmount}, ${treasuryAmount}, ${walletAddress}
          )
          ON CONFLICT DO NOTHING
        `;

        await sql`
          INSERT INTO metaphysics_index (token_id, mint_address)
          VALUES (${tokenId}, ${tokenMint})
          ON CONFLICT DO NOTHING
        `;
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Token minted successfully. Ready for pool creation.',
        launch: {
          id: launchId,
          phase: 'seeding',
          tokenMint,
        },
        nextStep: 'Create Meteora DLMM pool',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (phase === 'pooled' && poolAddress) {
      await sql`
        UPDATE token_launches
        SET
          pool_address = ${poolAddress},
          lp_mint = ${lpMint || null},
          pool_tx = ${poolTx || null},
          phase = 'live',
          pool_created_at = NOW(),
          live_at = NOW()
        WHERE id = ${launchId}
      `;

      // If this launch has a road_id, create the nation
      if (launch.road_id && launch.nation_name) {
        // Create GCN entry
        await sql`
          INSERT INTO gcn_entries (
            road_id, creator_wallet, gcn_name, tek8_guild, status
          ) VALUES (
            ${launch.road_id},
            ${walletAddress},
            ${launch.nation_name},
            ${launch.tek8_guild},
            'active'
          )
          ON CONFLICT (road_id) DO NOTHING
        `;

        // Create nation
        await sql`
          INSERT INTO nations (
            mint_address, name, emoji, founder_wallet, total_territory_count
          ) VALUES (
            ${launch.token_mint || tokenMint},
            ${launch.nation_name},
            '🏴',
            ${walletAddress},
            0
          )
          ON CONFLICT (mint_address) DO NOTHING
        `;
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Launch is LIVE! Pool created on Meteora.',
        launch: {
          id: launchId,
          phase: 'live',
          tokenMint: launch.token_mint || tokenMint,
          poolAddress,
          lpMint,
        },
        links: {
          meteora: `https://app.meteora.ag/dlmm/${poolAddress}`,
          solscan: `https://solscan.io/token/${launch.token_mint || tokenMint}`,
          birdeye: `https://birdeye.so/token/${launch.token_mint || tokenMint}?chain=solana`,
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid phase or missing required data',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Finalize error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
