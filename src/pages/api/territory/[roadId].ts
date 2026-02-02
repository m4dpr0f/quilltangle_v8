import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { roadId } = params;

    if (!roadId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Road ID required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get territory with nation info
    const result = await sql`
      SELECT
        t.*,
        n.id as nation_id,
        n.name as nation_name,
        n.emoji as nation_emoji,
        n.founder_wallet,
        n.defense_rating as nation_defense,
        n.attack_rating as nation_attack,
        n.total_territory_count
      FROM territories t
      LEFT JOIN nations n ON t.nation_id = n.id
      WHERE t.road_id = ${roadId}
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Territory not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const territory = result[0];

    // Get stakes for this territory
    const stakes = await sql`
      SELECT
        ts.*,
        n.name as nation_name,
        n.emoji as nation_emoji
      FROM territory_stakes ts
      LEFT JOIN nations n ON ts.nation_id = n.id
      WHERE ts.territory_id = ${territory.id} AND ts.is_active = true
      ORDER BY ts.amount DESC
    `;

    // Get recent events
    const events = await sql`
      SELECT
        te.*,
        n.name as actor_name,
        n.emoji as actor_emoji
      FROM territory_events te
      LEFT JOIN nations n ON te.actor_nation_id = n.id
      WHERE te.territory_id = ${territory.id}
      ORDER BY te.created_at DESC
      LIMIT 10
    `;

    // Get active contest if any
    const contests = await sql`
      SELECT
        tc.*,
        an.name as attacker_name,
        an.emoji as attacker_emoji,
        dn.name as defender_name,
        dn.emoji as defender_emoji
      FROM territory_contests tc
      LEFT JOIN nations an ON tc.attacker_nation_id = an.id
      LEFT JOIN nations dn ON tc.defender_nation_id = dn.id
      WHERE tc.territory_id = ${territory.id} AND tc.status IN ('pending', 'active')
      LIMIT 1
    `;

    // Calculate adjacent territories
    const { grid_x, grid_y } = territory;
    const adjacentCoords = [
      { x: grid_x - 1, y: grid_y },
      { x: grid_x + 1, y: grid_y },
      { x: grid_x, y: grid_y - 1 },
      { x: grid_x, y: grid_y + 1 },
    ].filter(c => c.x >= 0 && c.x <= 7 && c.y >= 0 && c.y <= 4);

    // Build adjacent query with individual conditions
    let adjacent: any[] = [];
    if (adjacentCoords.length > 0) {
      adjacent = await sql`
        SELECT road_id, status, nation_id
        FROM territories
        WHERE ${sql.unsafe(adjacentCoords.map(c => `(grid_x = ${c.x} AND grid_y = ${c.y})`).join(' OR '))}
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      territory: {
        id: territory.id,
        road_id: territory.road_id,
        dice_type: territory.dice_type,
        direction: territory.direction,
        realm: territory.realm,
        grid_x: territory.grid_x,
        grid_y: territory.grid_y,
        status: territory.status,
        defense_level: territory.defense_level,
        total_staked: territory.total_staked,
        claimed_at: territory.claimed_at,
        nation: territory.nation_id ? {
          id: territory.nation_id,
          name: territory.nation_name,
          emoji: territory.nation_emoji,
          founder_wallet: territory.founder_wallet,
          defense_rating: territory.nation_defense,
          attack_rating: territory.nation_attack,
          total_territory_count: territory.total_territory_count,
        } : null,
      },
      stakes,
      events,
      activeContest: contests[0] || null,
      adjacent,
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
