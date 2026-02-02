import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  calculateLiquidityAllocation,
  calculateTreasuryDeposit,
  generatePoolConfig,
  PLATFORM_WALLET,
  DEFAULT_PLATFORM_FEE_PERCENT,
  MIN_PLATFORM_FEE_LAMPORTS,
  GUILD_BIN_STEPS,
  LaunchPhase,
} from '../../../lib/launchpad';

/**
 * Token Launch Endpoint
 *
 * Creates a new token launch record and returns instructions for:
 * 1. Creating the SPL token (client-side)
 * 2. Setting up metadata (client-side via Metaplex)
 * 3. Creating Meteora DLMM pool
 *
 * The actual on-chain transactions happen client-side.
 * This endpoint orchestrates the flow and records state.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      name,
      symbol,
      description,
      imageUrl,
      totalSupply,
      decimals = 6,
      creatorWallet,
      initialSolLiquidity = 1, // Default 1 SOL
      tokenLiquidityPercent = 10, // Default 10% of supply
      roadId,
      tek8Guild,
      nationName,
    } = body;

    // Validation
    if (!name || !symbol || !totalSupply || !creatorWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: name, symbol, totalSupply, creatorWallet',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (symbol.length > 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Symbol must be 10 characters or less',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (totalSupply < 1_000_000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Minimum supply is 1,000,000 tokens',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Check for existing launch from this wallet
    const existingLaunch = await sql`
      SELECT id FROM token_launches
      WHERE creator_wallet = ${creatorWallet}
      AND phase NOT IN ('cancelled', 'failed')
      AND created_at > NOW() - INTERVAL '24 hours'
    `;

    if (existingLaunch.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have a pending launch. Please complete or cancel it first.',
        existingLaunchId: existingLaunch[0].id,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Calculate allocations
    const allocation = calculateLiquidityAllocation(totalSupply, tokenLiquidityPercent);

    // Determine guild bin step for Meteora pool
    const binStep = tek8Guild ? GUILD_BIN_STEPS[tek8Guild] || 25 : 25;

    // Calculate platform fee
    const platformFeeLamports = Math.max(
      MIN_PLATFORM_FEE_LAMPORTS,
      Math.floor(initialSolLiquidity * 1e9 * (DEFAULT_PLATFORM_FEE_PERCENT / 100))
    );

    // Create launch record
    const launchResult = await sql`
      INSERT INTO token_launches (
        creator_wallet,
        name,
        symbol,
        description,
        image_url,
        total_supply,
        decimals,
        liquidity_tokens,
        creator_tokens,
        treasury_tokens,
        initial_sol_liquidity,
        platform_fee_lamports,
        bin_step,
        tek8_guild,
        road_id,
        nation_name,
        phase,
        created_at
      ) VALUES (
        ${creatorWallet},
        ${name},
        ${symbol.toUpperCase()},
        ${description || ''},
        ${imageUrl || null},
        ${totalSupply},
        ${decimals},
        ${allocation.liquidityTokens},
        ${allocation.creatorTokens},
        ${allocation.treasuryTokens},
        ${initialSolLiquidity},
        ${platformFeeLamports},
        ${binStep},
        ${tek8Guild || null},
        ${roadId || null},
        ${nationName || null},
        'preparation',
        NOW()
      )
      RETURNING *
    `;

    const launch = launchResult[0];

    // Generate launch instructions for client
    const instructions = {
      step1_createToken: {
        action: 'CREATE_SPL_TOKEN',
        params: {
          decimals,
          supply: totalSupply,
          mintAuthority: creatorWallet,
          freezeAuthority: null, // No freeze for community tokens
        },
        description: 'Create the SPL token on Solana',
      },
      step2_setMetadata: {
        action: 'SET_TOKEN_METADATA',
        params: {
          name,
          symbol: symbol.toUpperCase(),
          uri: '', // Will be set after image upload
          sellerFeeBasisPoints: 0,
          creators: [{ address: creatorWallet, share: 100 }],
        },
        description: 'Set token metadata via Metaplex',
      },
      step3_distributionAndPool: {
        action: 'DISTRIBUTE_AND_CREATE_POOL',
        params: {
          treasuryDeposit: allocation.treasuryTokens,
          liquidityTokens: allocation.liquidityTokens,
          creatorTokens: allocation.creatorTokens,
          initialSol: initialSolLiquidity,
          platformFee: platformFeeLamports,
          platformWallet: PLATFORM_WALLET,
          binStep,
        },
        description: 'Distribute tokens and create Meteora DLMM pool',
      },
    };

    return new Response(JSON.stringify({
      success: true,
      launch: {
        id: launch.id,
        name: launch.name,
        symbol: launch.symbol,
        phase: launch.phase,
        allocation,
        fees: {
          platformFeeLamports,
          platformFeeSOL: platformFeeLamports / 1e9,
        },
        poolConfig: {
          binStep,
          strategy: tek8Guild ? 'TEK8-optimized' : 'Standard',
        },
      },
      instructions,
      message: `Launch "${name}" prepared. Complete the on-chain steps to go live.`,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Launch creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET endpoint to check launch status
// Supports verification filtering: ?verified=true|false|all (default: true for public listings)
export const GET: APIRoute = async ({ url }) => {
  try {
    const launchId = url.searchParams.get('id');
    const wallet = url.searchParams.get('wallet');
    const verified = url.searchParams.get('verified'); // true, false, or all
    const featured = url.searchParams.get('featured') === 'true';

    const sql = getDb();

    let launches;

    if (launchId) {
      // Get specific launch by ID
      launches = await sql`
        SELECT * FROM token_launches WHERE id = ${launchId}
      `;
    } else if (wallet) {
      // Get user's own launches (they can see their own regardless of verification)
      launches = await sql`
        SELECT * FROM token_launches
        WHERE creator_wallet = ${wallet}
        ORDER BY created_at DESC
        LIMIT 10
      `;
    } else if (featured) {
      // Get featured tokens only (verified + featured)
      launches = await sql`
        SELECT
          id, name, symbol, image_url, total_supply, decimals,
          token_mint, pool_address, phase, initial_sol_liquidity,
          tek8_guild, nation_name, verification_status, is_featured,
          created_at, live_at
        FROM token_launches
        WHERE phase IN ('live', 'graduated')
        AND verification_status = 'verified'
        AND is_featured = true
        ORDER BY live_at DESC NULLS LAST
        LIMIT 20
      `;
    } else if (verified === 'false') {
      // Get unverified tokens (pending, under_review, flagged)
      // Used when user accepts disclaimer to view unverified tokens
      launches = await sql`
        SELECT
          id, name, symbol, image_url, total_supply, decimals,
          token_mint, pool_address, phase, initial_sol_liquidity,
          tek8_guild, nation_name, verification_status, is_featured,
          created_at, live_at
        FROM token_launches
        WHERE phase IN ('live', 'graduated')
        AND verification_status NOT IN ('verified', 'rejected')
        ORDER BY live_at DESC NULLS LAST
        LIMIT 50
      `;
    } else if (verified === 'all') {
      // Get all non-rejected tokens (for admin or special views)
      launches = await sql`
        SELECT
          id, name, symbol, image_url, total_supply, decimals,
          token_mint, pool_address, phase, initial_sol_liquidity,
          tek8_guild, nation_name, verification_status, is_featured,
          created_at, live_at
        FROM token_launches
        WHERE phase IN ('live', 'graduated')
        AND verification_status != 'rejected'
        ORDER BY
          CASE WHEN is_featured THEN 0 ELSE 1 END,
          CASE WHEN verification_status = 'verified' THEN 0 ELSE 1 END,
          live_at DESC NULLS LAST
        LIMIT 50
      `;
    } else {
      // Default: Get verified tokens only (safe for public display)
      launches = await sql`
        SELECT
          id, name, symbol, image_url, total_supply, decimals,
          token_mint, pool_address, phase, initial_sol_liquidity,
          tek8_guild, nation_name, verification_status, is_featured,
          created_at, live_at
        FROM token_launches
        WHERE phase IN ('live', 'graduated')
        AND verification_status = 'verified'
        ORDER BY
          CASE WHEN is_featured THEN 0 ELSE 1 END,
          live_at DESC NULLS LAST
        LIMIT 20
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      launches,
      filter: {
        verified: verified || 'true',
        featured: featured
      }
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
