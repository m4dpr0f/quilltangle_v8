import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const sql = getDb();
    const leaderboard = await sql`
      SELECT 
        mi.mint_address as "mintAddress",
        t.symbol,
        t.name,
        COALESCE(mi.life_force_score, 0) as "lifeForceScore",
        COALESCE(mi.vitality_index, 0) as "vitalityIndex",
        COALESCE(mi.permanence_score, 0) as "permanenceScore",
        COALESCE(mi.total_qlx_inflow, 0) as "totalQlxInflow",
        COALESCE(mi.total_qlx_outflow, 0) as "totalQlxOutflow",
        COALESCE(mi.swap_count_total, 0) as "swapCountTotal",
        g.nation_name as "nationName",
        g.road_id as "roadId"
      FROM metaphysics_index mi
      JOIN tokens t ON mi.token_id = t.id
      LEFT JOIN gcn_entries g ON t.id = g.token_id
      ORDER BY mi.life_force_score DESC NULLS LAST
      LIMIT ${limit}
    `;
    
    return new Response(JSON.stringify({
      success: true,
      leaderboard
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
