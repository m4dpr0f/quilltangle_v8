import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const sql = getDb();
    const status = url.searchParams.get('status'); // pending, active, resolved
    const nationId = url.searchParams.get('nationId');
    const wallet = url.searchParams.get('wallet');

    let contests;

    if (wallet) {
      // Get contests involving user's nations
      contests = await sql`
        SELECT
          tc.*,
          t.road_id,
          t.realm,
          an.name as attacker_name,
          an.emoji as attacker_emoji,
          dn.name as defender_name,
          dn.emoji as defender_emoji,
          wn.name as winner_name,
          wn.emoji as winner_emoji
        FROM territory_contests tc
        JOIN territories t ON tc.territory_id = t.id
        JOIN nations an ON tc.attacker_nation_id = an.id
        JOIN nations dn ON tc.defender_nation_id = dn.id
        LEFT JOIN nations wn ON tc.winner_nation_id = wn.id
        WHERE (an.founder_wallet = ${wallet} OR dn.founder_wallet = ${wallet})
        ${status ? sql`AND tc.status = ${status}` : sql``}
        ORDER BY tc.initiated_at DESC
        LIMIT 50
      `;
    } else if (nationId) {
      // Get contests for specific nation
      contests = await sql`
        SELECT
          tc.*,
          t.road_id,
          t.realm,
          an.name as attacker_name,
          an.emoji as attacker_emoji,
          dn.name as defender_name,
          dn.emoji as defender_emoji,
          wn.name as winner_name,
          wn.emoji as winner_emoji
        FROM territory_contests tc
        JOIN territories t ON tc.territory_id = t.id
        JOIN nations an ON tc.attacker_nation_id = an.id
        JOIN nations dn ON tc.defender_nation_id = dn.id
        LEFT JOIN nations wn ON tc.winner_nation_id = wn.id
        WHERE (tc.attacker_nation_id = ${nationId} OR tc.defender_nation_id = ${nationId})
        ${status ? sql`AND tc.status = ${status}` : sql``}
        ORDER BY tc.initiated_at DESC
        LIMIT 50
      `;
    } else {
      // Get all active/pending contests (global war map)
      contests = await sql`
        SELECT
          tc.*,
          t.road_id,
          t.realm,
          an.name as attacker_name,
          an.emoji as attacker_emoji,
          dn.name as defender_name,
          dn.emoji as defender_emoji,
          wn.name as winner_name,
          wn.emoji as winner_emoji
        FROM territory_contests tc
        JOIN territories t ON tc.territory_id = t.id
        JOIN nations an ON tc.attacker_nation_id = an.id
        JOIN nations dn ON tc.defender_nation_id = dn.id
        LEFT JOIN nations wn ON tc.winner_nation_id = wn.id
        ${status ? sql`WHERE tc.status = ${status}` : sql`WHERE tc.status IN ('pending', 'active')`}
        ORDER BY tc.initiated_at DESC
        LIMIT 100
      `;
    }

    // Calculate time remaining for pending contests
    const contestsWithTime = contests.map((c: any) => ({
      ...c,
      timeRemaining: c.defense_deadline
        ? Math.max(0, new Date(c.defense_deadline).getTime() - Date.now())
        : null,
      hoursRemaining: c.defense_deadline
        ? Math.max(0, (new Date(c.defense_deadline).getTime() - Date.now()) / (1000 * 60 * 60))
        : null,
    }));

    return new Response(JSON.stringify({
      success: true,
      contests: contestsWithTime,
      count: contests.length,
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
