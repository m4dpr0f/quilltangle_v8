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
    const { stakeId, walletAddress, amount } = body;

    // Validate required fields
    if (!stakeId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: stakeId, walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get stake
    const stakeResult = await sql`
      SELECT
        ts.*,
        t.id as territory_id,
        t.road_id,
        t.total_staked as territory_staked,
        t.status as territory_status,
        n.id as nation_id,
        n.name as nation_name
      FROM territory_stakes ts
      JOIN territories t ON ts.territory_id = t.id
      JOIN nations n ON ts.nation_id = n.id
      WHERE ts.id = ${stakeId}
    `;

    if (stakeResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Stake not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const stake = stakeResult[0];

    // Verify ownership
    if (stake.staker_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only the staker can unstake',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if active
    if (!stake.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Stake already withdrawn',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check lock period
    if (stake.locked_until && new Date(stake.locked_until) > new Date()) {
      const daysRemaining = Math.ceil(
        (new Date(stake.locked_until).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return new Response(JSON.stringify({
        success: false,
        error: `Stake is locked for ${daysRemaining} more days`,
        locked_until: stake.locked_until,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if territory is under contest - cannot unstake during active battles
    const activeContests = await sql`
      SELECT id FROM territory_contests
      WHERE territory_id = ${stake.territory_id}
      AND status IN ('pending', 'active')
    `;

    if (activeContests.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot unstake while territory is under attack',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Determine unstake amount (partial or full)
    const unstakeAmount = amount && amount > 0 && amount < Number(stake.amount)
      ? amount
      : Number(stake.amount);

    const remainingAmount = Number(stake.amount) - unstakeAmount;

    // Update or deactivate stake
    if (remainingAmount > 0) {
      await sql`
        UPDATE territory_stakes
        SET amount = ${remainingAmount}, updated_at = NOW()
        WHERE id = ${stakeId}
      `;
    } else {
      await sql`
        UPDATE territory_stakes
        SET is_active = false, unstaked_at = NOW()
        WHERE id = ${stakeId}
      `;
    }

    // Update territory total staked and defense level
    const newTotalStaked = Math.max(0, Number(stake.territory_staked) - unstakeAmount);
    const newDefenseLevel = calculateDefenseLevel(newTotalStaked, stake.territory_status === 'fortified');

    // Check if should downgrade from fortified (defense < 50)
    let newStatus = stake.territory_status;
    if (stake.territory_status === 'fortified' && newDefenseLevel < 50) {
      newStatus = 'claimed';
    }

    await sql`
      UPDATE territories
      SET
        total_staked = ${newTotalStaked},
        defense_level = ${newDefenseLevel},
        status = ${newStatus},
        updated_at = NOW()
      WHERE id = ${stake.territory_id}
    `;

    // Update nation total staked
    await sql`
      UPDATE nations
      SET
        total_staked = GREATEST(0, total_staked - ${unstakeAmount}),
        defense_rating = GREATEST(0, defense_rating - ${Math.floor(unstakeAmount / 100000)}),
        updated_at = NOW()
      WHERE id = ${stake.nation_id}
    `;

    // Log event
    await sql`
      INSERT INTO territory_events (territory_id, event_type, actor_nation_id, actor_wallet, details)
      VALUES (
        ${stake.territory_id},
        'unstaked',
        ${stake.nation_id},
        ${walletAddress},
        ${JSON.stringify({
          amount: unstakeAmount,
          remaining: remainingAmount,
          stake_id: stakeId,
        })}
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: remainingAmount > 0 ? 'Partial unstake successful' : 'Full unstake successful',
      unstake: {
        amount: unstakeAmount,
        remaining: remainingAmount,
        stake_id: stakeId,
      },
      territory: {
        road_id: stake.road_id,
        total_staked: newTotalStaked,
        defense_level: newDefenseLevel,
        status: newStatus,
        downgraded: newStatus === 'claimed' && stake.territory_status === 'fortified',
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
