import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  buildLaunchTransaction,
  createQuillverseMetadata,
  calculateAllocations,
  GUILD_BIN_STEPS,
  PLATFORM_FEE_PERCENT,
  MIN_PLATFORM_FEE,
} from '../../../lib/tokenLaunchService';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Automated Token Launch API
 *
 * Like pump.fun - server builds transaction, client signs and submits.
 *
 * POST: Build launch transaction
 * Returns base64 transaction + mint keypair for client to sign
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      // Required
      name,
      symbol,
      description,
      imageUrl,
      totalSupply,
      creatorWallet,
      nationName,

      // Optional liquidity config
      initialSolLiquidity = 1,
      tokenLiquidityPercent = 10,
      decimals = 6,

      // Rainbow Roads integration
      tek8Guild,
      roadId,

      // Quillverse pillars
      qlxInstrument,
      qlyCampaignUrl,
      qlzTechnology,

      // Social links
      website,
      twitter,
      telegram,
      discord,

      // Royalties (Token-2022 transfer fee)
      creatorRoyaltyPercent = 0,
      distributeToHolders = false,
      creatorShareOfRoyalties = 100, // % of royalties to creator (rest to top 10 holders)
    } = body;

    // Validation
    if (!name || !symbol || !totalSupply || !creatorWallet || !nationName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: name, symbol, totalSupply, creatorWallet, nationName',
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

    // Check for existing pending launch
    const existingLaunch = await sql`
      SELECT id FROM token_launches
      WHERE creator_wallet = ${creatorWallet}
      AND phase NOT IN ('cancelled', 'failed', 'live', 'graduated')
      AND created_at > NOW() - INTERVAL '1 hour'
    `;

    if (existingLaunch.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have a pending launch. Complete or wait for it to expire.',
        existingLaunchId: existingLaunch[0].id,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Build the transaction (Token-2022 with transfer fees for royalties!)
    const launchResult = await buildLaunchTransaction({
      name,
      symbol: symbol.toUpperCase(),
      description: description || '',
      imageUrl: imageUrl || '',
      totalSupply: parseInt(totalSupply),
      decimals,
      initialSolLiquidity: parseFloat(initialSolLiquidity),
      tokenLiquidityPercent: parseInt(tokenLiquidityPercent),
      creatorWallet,
      nationName,
      tek8Guild,
      roadId,
      qlxInstrument,
      qlyCampaignUrl,
      qlzTechnology,
      // Social links
      website: website || '',
      twitter: twitter || '',
      telegram: telegram || '',
      discord: discord || '',
      // Royalties - enforced via Token-2022 transfer fees
      creatorRoyaltyPercent: parseFloat(creatorRoyaltyPercent) || 0,
    });

    if (!launchResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: launchResult.error,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Calculate allocations for DB
    const allocations = calculateAllocations(
      parseInt(totalSupply),
      parseInt(tokenLiquidityPercent)
    );

    // Calculate bin step based on guild
    const binStep = tek8Guild ? GUILD_BIN_STEPS[tek8Guild] || 25 : 25;

    // Royalty distribution config (stored as JSON)
    const royaltyConfig = {
      feePercent: parseFloat(creatorRoyaltyPercent) || 0,
      distributeToHolders: distributeToHolders || false,
      creatorShare: parseInt(creatorShareOfRoyalties) || 100,
      holderShare: distributeToHolders ? (100 - parseInt(creatorShareOfRoyalties)) : 0,
    };

    // Save launch to database
    // New tokens start as 'pending' verification - must be reviewed by admin before appearing publicly
    const dbResult = await sql`
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
        token_mint,
        phase,
        royalty_config,
        verification_status,
        created_at
      ) VALUES (
        ${creatorWallet},
        ${name},
        ${symbol.toUpperCase()},
        ${description || ''},
        ${imageUrl || null},
        ${parseInt(totalSupply)},
        ${decimals},
        ${allocations.liquidityTokens},
        ${allocations.creatorTokens},
        ${allocations.treasuryTokens},
        ${parseFloat(initialSolLiquidity)},
        ${launchResult.platformFeeLamports},
        ${binStep},
        ${tek8Guild || null},
        ${roadId || null},
        ${nationName},
        ${launchResult.tokenMint},
        'pending_signature',
        ${JSON.stringify(royaltyConfig)},
        'pending',
        NOW()
      )
      RETURNING id
    `;

    const launchId = dbResult[0].id;

    // Generate metadata for IPFS upload (includes socials and royalty info)
    const metadata = createQuillverseMetadata({
      name,
      symbol: symbol.toUpperCase(),
      description: description || '',
      imageUrl: imageUrl || '',
      totalSupply: parseInt(totalSupply),
      initialSolLiquidity: parseFloat(initialSolLiquidity),
      tokenLiquidityPercent: parseInt(tokenLiquidityPercent),
      creatorWallet,
      nationName,
      tek8Guild,
      roadId,
      qlxInstrument,
      qlyCampaignUrl,
      qlzTechnology,
      // Social links for metadata
      website: website || '',
      twitter: twitter || '',
      telegram: telegram || '',
      discord: discord || '',
      // Royalty info (also enforced on-chain via Token-2022)
      creatorRoyaltyPercent: parseFloat(creatorRoyaltyPercent) || 0,
    });

    return new Response(JSON.stringify({
      success: true,
      launchId,

      // Transaction for client to sign
      transaction: launchResult.transaction,

      // Mint keypair (client needs to include this signer)
      mintKeypair: launchResult.mintKeypair,

      // Token info
      tokenMint: launchResult.tokenMint,

      // Allocations
      allocations: {
        liquidity: launchResult.liquidityTokens,
        creator: launchResult.creatorTokens,
        treasury: launchResult.treasuryTokens,
      },

      // Fees
      fees: {
        platformLamports: launchResult.platformFeeLamports,
        platformSOL: (launchResult.platformFeeLamports || 0) / LAMPORTS_PER_SOL,
      },

      // Pool config
      poolConfig: {
        binStep,
        tek8Guild: tek8Guild || 'none',
      },

      // Royalty config (Token-2022 transfer fees)
      royalties: {
        percent: parseFloat(creatorRoyaltyPercent) || 0,
        basisPoints: Math.floor((parseFloat(creatorRoyaltyPercent) || 0) * 100),
        enforced: true, // Token-2022 enforces this on-chain
      },

      // Metadata for IPFS
      metadata,

      message: 'Transaction ready. Sign with your wallet to launch! (Token-2022 with enforced royalties)',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Launch creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * POST to confirm launch after client signs and submits
 */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { launchId, signature, poolAddress } = body;

    if (!launchId || !signature) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing launchId or signature',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Update launch status
    await sql`
      UPDATE token_launches
      SET
        phase = 'live',
        pool_address = ${poolAddress || null},
        live_at = NOW(),
        minted_at = NOW()
      WHERE id = ${launchId}
    `;

    // Get the launch details
    const launch = await sql`
      SELECT * FROM token_launches WHERE id = ${launchId}
    `;

    if (launch.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Launch not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Create nation entry if road_id specified
    if (launch[0].road_id && launch[0].nation_name) {
      await sql`
        INSERT INTO nations (
          mint_address,
          name,
          founder_wallet,
          total_territory_count,
          created_at
        ) VALUES (
          ${launch[0].token_mint},
          ${launch[0].nation_name},
          ${launch[0].creator_wallet},
          0,
          NOW()
        )
        ON CONFLICT (mint_address) DO NOTHING
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      launch: launch[0],
      message: 'Token launched successfully! Your GCN is now live.',
      explorerUrl: `https://solscan.io/tx/${signature}`,
      meteoraUrl: poolAddress ? `https://app.meteora.ag/dlmm/${poolAddress}` : null,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Launch confirmation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * GET launch status
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const launchId = url.searchParams.get('id');
    const wallet = url.searchParams.get('wallet');

    const sql = getDb();

    let launches;

    if (launchId) {
      launches = await sql`
        SELECT * FROM token_launches WHERE id = ${launchId}
      `;
    } else if (wallet) {
      launches = await sql`
        SELECT * FROM token_launches
        WHERE creator_wallet = ${wallet}
        ORDER BY created_at DESC
        LIMIT 10
      `;
    } else {
      // Get recent live launches
      launches = await sql`
        SELECT * FROM token_launches
        WHERE phase = 'live'
        ORDER BY live_at DESC
        LIMIT 20
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      launches,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
