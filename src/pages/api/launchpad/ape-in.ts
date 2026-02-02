import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { METEORA_API } from '../../../lib/launchpad';

/**
 * Ape In Endpoint
 *
 * One-click liquidity provision inspired by Meteora's Aping Challenge.
 *
 * Flow:
 * 1. User specifies pool and SOL amount
 * 2. Server calculates optimal position parameters
 * 3. Returns transaction for client to sign
 * 4. After signing, position is recorded for leaderboard
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      poolAddress,
      walletAddress,
      solAmount,
      slippageBps = 100, // 1% default
      action, // 'prepare' or 'record'
      positionAddress,
      lpTokens,
      depositedTokens,
      entryPrice,
      entryBinId,
      txSignature,
    } = body;

    if (!poolAddress || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing poolAddress or walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get launch info
    const launchResult = await sql`
      SELECT * FROM token_launches WHERE pool_address = ${poolAddress}
    `;

    const launch = launchResult.length > 0 ? launchResult[0] : null;

    if (action === 'prepare') {
      // Calculate optimal ape-in parameters
      if (!solAmount || solAmount <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid SOL amount',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Fetch current pool state from Meteora API
      let poolInfo;
      try {
        const poolRes = await fetch(METEORA_API.pairByAddress(poolAddress));
        poolInfo = await poolRes.json();
      } catch (e) {
        poolInfo = null;
      }

      // Calculate position parameters
      const binStep = launch?.bin_step || 25;
      const activeBinId = poolInfo?.active_bin_id || 0;

      // Spot strategy: center around active bin
      const minBinId = activeBinId - 10;
      const maxBinId = activeBinId + 10;

      return new Response(JSON.stringify({
        success: true,
        action: 'prepare',
        params: {
          poolAddress,
          walletAddress,
          solAmount,
          slippageBps,
          strategyType: 'Spot',
          minBinId,
          maxBinId,
          binStep,
          activeBinId,
        },
        launch: launch ? {
          id: launch.id,
          name: launch.name,
          symbol: launch.symbol,
          tokenMint: launch.token_mint,
        } : null,
        poolInfo: poolInfo ? {
          name: poolInfo.name,
          currentPrice: poolInfo.current_price,
          liquidity: poolInfo.liquidity,
          volume24h: poolInfo.trade_volume_24h,
          fees24h: poolInfo.fees_24h,
        } : null,
        message: `Ready to Ape In ${solAmount} SOL to ${launch?.symbol || 'pool'}!`,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'record') {
      // Record position after successful on-chain transaction
      if (!positionAddress || !solAmount) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing position data',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      await sql`
        INSERT INTO ape_in_positions (
          launch_id, pool_address, wallet_address, deposited_sol,
          deposited_tokens, lp_tokens, entry_price, entry_bin_id,
          position_address, status
        ) VALUES (
          ${launch?.id || null},
          ${poolAddress},
          ${walletAddress},
          ${solAmount},
          ${depositedTokens || 0},
          ${lpTokens || 0},
          ${entryPrice || 0},
          ${entryBinId || 0},
          ${positionAddress},
          'active'
        )
        ON CONFLICT (pool_address, wallet_address, position_address)
        DO UPDATE SET
          deposited_sol = ape_in_positions.deposited_sol + ${solAmount},
          lp_tokens = ${lpTokens || 0}
      `;

      return new Response(JSON.stringify({
        success: true,
        action: 'recorded',
        position: {
          poolAddress,
          positionAddress,
          depositedSol: solAmount,
          lpTokens,
          entryPrice,
        },
        message: `Aped In ${solAmount} SOL! Position recorded for leaderboard.`,
        leaderboardUrl: '/launchpad/leaderboard',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action. Use "prepare" or "record".',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Ape In error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET: Fetch positions or leaderboard
export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const pool = url.searchParams.get('pool');
    const leaderboard = url.searchParams.get('leaderboard') === 'true';

    const sql = getDb();

    if (leaderboard) {
      // Get top performers by PnL %
      const leaders = await sql`
        SELECT
          ap.wallet_address,
          ap.pool_address,
          tl.name as token_name,
          tl.symbol as token_symbol,
          SUM(ap.deposited_sol) as total_deposited,
          ap.pnl_percent,
          ap.pnl_absolute,
          ap.created_at
        FROM ape_in_positions ap
        LEFT JOIN token_launches tl ON ap.launch_id = tl.id
        WHERE ap.status = 'active'
        AND ap.pnl_percent IS NOT NULL
        GROUP BY ap.wallet_address, ap.pool_address, tl.name, tl.symbol,
                 ap.pnl_percent, ap.pnl_absolute, ap.created_at
        ORDER BY ap.pnl_percent DESC NULLS LAST
        LIMIT 50
      `;

      // Get aggregate stats
      const stats = await sql`
        SELECT
          COUNT(DISTINCT wallet_address) as total_participants,
          COUNT(*) as total_positions,
          SUM(deposited_sol) as total_sol_deposited,
          AVG(pnl_percent) as avg_pnl_percent
        FROM ape_in_positions
        WHERE status = 'active'
      `;

      return new Response(JSON.stringify({
        success: true,
        leaderboard: leaders,
        stats: stats[0],
        challenge: {
          name: 'Aping Challenge',
          description: 'Compete for the best LP position PnL!',
          prizes: ['10,000 USDC pool', 'Top 10 share rewards'],
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (wallet) {
      // Get user's positions
      const positions = await sql`
        SELECT
          ap.*,
          tl.name as token_name,
          tl.symbol as token_symbol,
          tl.image_url as token_image
        FROM ape_in_positions ap
        LEFT JOIN token_launches tl ON ap.launch_id = tl.id
        WHERE ap.wallet_address = ${wallet}
        ORDER BY ap.created_at DESC
      `;

      return new Response(JSON.stringify({
        success: true,
        positions,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (pool) {
      // Get positions for a specific pool
      const positions = await sql`
        SELECT
          wallet_address,
          deposited_sol,
          lp_tokens,
          entry_price,
          pnl_percent,
          created_at
        FROM ape_in_positions
        WHERE pool_address = ${pool}
        AND status = 'active'
        ORDER BY deposited_sol DESC
        LIMIT 100
      `;

      return new Response(JSON.stringify({
        success: true,
        positions,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Specify wallet, pool, or leaderboard=true',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
