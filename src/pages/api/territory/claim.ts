import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

// Minimum stake requirements by realm
const STAKE_REQUIREMENTS = {
  QLX: 100000,    // 100k tokens for music realm
  QLY: 250000,    // 250k tokens for business realm
  QLZ: 500000,    // 500k tokens for tech realm
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { roadId, nationId, mintAddress, stakeAmount, walletAddress } = body;

    // Validate required fields
    if (!roadId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: roadId, walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Either nationId or mintAddress required
    if (!nationId && !mintAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either nationId or mintAddress required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get territory
    const territoryResult = await sql`
      SELECT * FROM territories WHERE road_id = ${roadId}
    `;

    if (territoryResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Territory not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const territory = territoryResult[0];

    // Check if already claimed
    if (territory.status !== 'unclaimed') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Territory already claimed',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get nation
    let nation;
    if (nationId) {
      const nationResult = await sql`
        SELECT * FROM nations WHERE id = ${nationId}
      `;
      nation = nationResult[0];
    } else {
      const nationResult = await sql`
        SELECT * FROM nations WHERE mint_address = ${mintAddress}
      `;
      nation = nationResult[0];
    }

    if (!nation) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nation not found. Create a nation first.',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify wallet owns this nation
    if (nation.founder_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only the nation founder can claim territories',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check stake requirement
    const requiredStake = STAKE_REQUIREMENTS[territory.realm as keyof typeof STAKE_REQUIREMENTS];
    const actualStake = stakeAmount || requiredStake;

    if (actualStake < requiredStake) {
      return new Response(JSON.stringify({
        success: false,
        error: `Minimum stake for ${territory.realm} realm is ${requiredStake.toLocaleString()} tokens`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // For MVP, we record the claim intent (on-chain stake verification would be added later)
    // Update territory to claimed
    await sql`
      UPDATE territories
      SET
        nation_id = ${nation.id},
        controller_wallet = ${walletAddress},
        status = 'claimed',
        total_staked = ${actualStake},
        defense_level = ${Math.floor(actualStake / 10000)},
        claimed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${territory.id}
    `;

    // Create stake record
    await sql`
      INSERT INTO territory_stakes (territory_id, nation_id, staker_wallet, token_mint, amount, stake_type)
      VALUES (${territory.id}, ${nation.id}, ${walletAddress}, ${nation.mint_address}, ${actualStake}, 'defense')
    `;

    // Update nation territory count
    await sql`
      UPDATE nations
      SET
        total_territory_count = total_territory_count + 1,
        total_staked = total_staked + ${actualStake},
        updated_at = NOW()
      WHERE id = ${nation.id}
    `;

    // Log event
    await sql`
      INSERT INTO territory_events (territory_id, event_type, actor_nation_id, actor_wallet, details)
      VALUES (
        ${territory.id},
        'claimed',
        ${nation.id},
        ${walletAddress},
        ${JSON.stringify({ stake_amount: actualStake, realm: territory.realm })}
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Territory claimed successfully',
      territory: {
        road_id: roadId,
        realm: territory.realm,
        status: 'claimed',
        defense_level: Math.floor(actualStake / 10000),
      },
      nation: {
        id: nation.id,
        name: nation.name,
        emoji: nation.emoji,
        total_territories: nation.total_territory_count + 1,
      },
      stake: {
        amount: actualStake,
        token_mint: nation.mint_address,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
