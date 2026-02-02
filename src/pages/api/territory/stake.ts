import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

// Defense level formula: sqrt(totalStaked / 1000) * (1 + fortification bonus)
function calculateDefenseLevel(totalStaked: number, isFortified: boolean = false): number {
  const base = Math.floor(Math.sqrt(totalStaked / 1000));
  const bonus = isFortified ? 1.5 : 1;
  return Math.floor(base * bonus);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { roadId, territoryId, amount, stakeType, walletAddress, lockDays } = body;

    // Validate required fields
    if (!walletAddress || !amount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: walletAddress, amount',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!roadId && !territoryId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either roadId or territoryId required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Amount must be positive',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get territory
    let territory;
    if (territoryId) {
      const result = await sql`SELECT * FROM territories WHERE id = ${territoryId}`;
      territory = result[0];
    } else {
      const result = await sql`SELECT * FROM territories WHERE road_id = ${roadId}`;
      territory = result[0];
    }

    if (!territory) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Territory not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Territory must be claimed to stake
    if (territory.status === 'unclaimed') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot stake to unclaimed territory. Claim it first.',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get nation that controls this territory
    const nationResult = await sql`
      SELECT * FROM nations WHERE id = ${territory.nation_id}
    `;
    const nation = nationResult[0];

    if (!nation) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nation not found for this territory',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify staker is from this nation (founder or citizen)
    // For MVP, allow anyone from the nation's token holders to stake
    // In production, verify on-chain token ownership

    // Calculate lock period
    let lockedUntil = null;
    let bonusMultiplier = 1;
    if (lockDays && lockDays > 0) {
      lockedUntil = new Date(Date.now() + lockDays * 24 * 60 * 60 * 1000);
      // Bonus for longer locks: 7d = 1.1x, 30d = 1.25x, 90d = 1.5x
      if (lockDays >= 90) bonusMultiplier = 1.5;
      else if (lockDays >= 30) bonusMultiplier = 1.25;
      else if (lockDays >= 7) bonusMultiplier = 1.1;
    }

    const effectiveAmount = Math.floor(amount * bonusMultiplier);
    const type = stakeType || 'defense';

    // Create stake record
    const stakeResult = await sql`
      INSERT INTO territory_stakes (
        territory_id, nation_id, staker_wallet, token_mint,
        amount, stake_type, locked_until
      )
      VALUES (
        ${territory.id}, ${nation.id}, ${walletAddress},
        ${nation.mint_address}, ${effectiveAmount}, ${type}, ${lockedUntil}
      )
      RETURNING *
    `;

    // Update territory total staked and defense level
    const newTotalStaked = Number(territory.total_staked) + effectiveAmount;
    const newDefenseLevel = calculateDefenseLevel(newTotalStaked, territory.status === 'fortified');

    // Check if should upgrade to fortified (defense > 100)
    const newStatus = newDefenseLevel >= 100 && territory.status === 'claimed'
      ? 'fortified'
      : territory.status;

    await sql`
      UPDATE territories
      SET
        total_staked = ${newTotalStaked},
        defense_level = ${newDefenseLevel},
        status = ${newStatus},
        updated_at = NOW()
      WHERE id = ${territory.id}
    `;

    // Update nation total staked
    await sql`
      UPDATE nations
      SET
        total_staked = total_staked + ${effectiveAmount},
        defense_rating = defense_rating + ${Math.floor(effectiveAmount / 100000)},
        updated_at = NOW()
      WHERE id = ${nation.id}
    `;

    // Log event
    await sql`
      INSERT INTO territory_events (territory_id, event_type, actor_nation_id, actor_wallet, details)
      VALUES (
        ${territory.id},
        'staked',
        ${nation.id},
        ${walletAddress},
        ${JSON.stringify({
          amount: effectiveAmount,
          original_amount: amount,
          bonus_multiplier: bonusMultiplier,
          stake_type: type,
          lock_days: lockDays || 0,
        })}
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Stake added successfully',
      stake: {
        id: stakeResult[0].id,
        amount: effectiveAmount,
        original_amount: amount,
        bonus: bonusMultiplier > 1 ? `${((bonusMultiplier - 1) * 100).toFixed(0)}%` : null,
        type,
        locked_until: lockedUntil,
      },
      territory: {
        road_id: territory.road_id,
        total_staked: newTotalStaked,
        defense_level: newDefenseLevel,
        status: newStatus,
        upgraded: newStatus === 'fortified' && territory.status !== 'fortified',
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

// GET endpoint to list stakes for a territory
export const GET: APIRoute = async ({ url }) => {
  try {
    const sql = getDb();
    const roadId = url.searchParams.get('roadId');
    const wallet = url.searchParams.get('wallet');

    if (roadId) {
      const stakes = await sql`
        SELECT
          ts.*,
          t.road_id,
          n.name as nation_name,
          n.emoji as nation_emoji
        FROM territory_stakes ts
        JOIN territories t ON ts.territory_id = t.id
        JOIN nations n ON ts.nation_id = n.id
        WHERE t.road_id = ${roadId} AND ts.is_active = true
        ORDER BY ts.amount DESC
      `;

      const totalStaked = stakes.reduce((sum: number, s: any) => sum + Number(s.amount), 0);

      return new Response(JSON.stringify({
        success: true,
        stakes,
        summary: {
          total_staked: totalStaked,
          stake_count: stakes.length,
          top_staker: stakes[0]?.staker_wallet || null,
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (wallet) {
      const stakes = await sql`
        SELECT
          ts.*,
          t.road_id,
          t.realm,
          n.name as nation_name,
          n.emoji as nation_emoji
        FROM territory_stakes ts
        JOIN territories t ON ts.territory_id = t.id
        JOIN nations n ON ts.nation_id = n.id
        WHERE ts.staker_wallet = ${wallet} AND ts.is_active = true
        ORDER BY ts.created_at DESC
      `;

      return new Response(JSON.stringify({
        success: true,
        stakes,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Provide roadId or wallet parameter',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
