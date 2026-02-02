import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

const DICE_TYPES = ['D2', 'D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];
const DIRECTIONS = ['OUT', 'UP', 'DWN', 'U45', 'D45'];

export const GET: APIRoute = async () => {
  try {
    const sql = getDb();

    // Get all territories with nation info
    const territories = await sql`
      SELECT
        t.id,
        t.road_id,
        t.dice_type,
        t.direction,
        t.realm,
        t.grid_x,
        t.grid_y,
        t.status,
        t.defense_level,
        t.total_staked,
        t.claimed_at,
        t.last_contested_at,
        n.id as nation_id,
        n.name as nation_name,
        n.emoji as nation_emoji,
        n.founder_wallet,
        n.defense_rating,
        n.attack_rating
      FROM territories t
      LEFT JOIN nations n ON t.nation_id = n.id
      ORDER BY t.grid_y, t.grid_x
    `;

    // Get all active nations for legend
    const nations = await sql`
      SELECT
        id,
        name,
        emoji,
        total_territory_count,
        total_staked,
        defense_rating,
        attack_rating
      FROM nations
      ORDER BY total_territory_count DESC
    `;

    // Get active contests
    const contests = await sql`
      SELECT
        tc.id,
        tc.territory_id,
        t.road_id,
        tc.status,
        tc.defense_deadline,
        an.name as attacker_name,
        an.emoji as attacker_emoji,
        dn.name as defender_name,
        dn.emoji as defender_emoji
      FROM territory_contests tc
      JOIN territories t ON tc.territory_id = t.id
      LEFT JOIN nations an ON tc.attacker_nation_id = an.id
      LEFT JOIN nations dn ON tc.defender_nation_id = dn.id
      WHERE tc.status IN ('pending', 'active')
    `;

    // Build 2D grid array
    const grid: any[][] = [];
    for (let y = 0; y < 5; y++) {
      const row: any[] = [];
      for (let x = 0; x < 8; x++) {
        const territory = territories.find(
          (t: any) => t.grid_x === x && t.grid_y === y
        );
        if (territory) {
          const activeContest = contests.find(
            (c: any) => c.territory_id === territory.id
          );
          row.push({
            road_id: territory.road_id,
            dice_type: territory.dice_type,
            direction: territory.direction,
            realm: territory.realm,
            status: activeContest ? 'contested' : territory.status,
            defense_level: territory.defense_level,
            total_staked: territory.total_staked,
            nation: territory.nation_id ? {
              id: territory.nation_id,
              name: territory.nation_name,
              emoji: territory.nation_emoji,
            } : null,
            contest: activeContest ? {
              id: activeContest.id,
              attacker: activeContest.attacker_name,
              attacker_emoji: activeContest.attacker_emoji,
              deadline: activeContest.defense_deadline,
            } : null,
          });
        } else {
          row.push(null);
        }
      }
      grid.push(row);
    }

    // Calculate stats
    const claimed = territories.filter((t: any) => t.status === 'claimed').length;
    const contested = contests.length;
    const fortified = territories.filter((t: any) => t.status === 'fortified').length;

    return new Response(JSON.stringify({
      success: true,
      grid,
      diceTypes: DICE_TYPES,
      directions: DIRECTIONS,
      nations,
      contests,
      stats: {
        total: 40,
        claimed,
        contested,
        fortified,
        unclaimed: 40 - claimed - fortified,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
