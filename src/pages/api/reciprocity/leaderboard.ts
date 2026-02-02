import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Reciprocity Leaderboard API
 *
 * Tracks giving and contributions rather than speculation PnL.
 * Measures:
 * - Life Force: Overall vitality from swaps, stakes, and engagement
 * - Giving Score: Contributions to Commons Treasury
 * - Nation Strength: Territory control + alliance network
 * - Permanence: Long-term commitment (stake duration, holding time)
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category') || 'overall';
    const wallet = url.searchParams.get('wallet');

    const sql = getDb();

    // If specific wallet requested, get their stats
    if (wallet) {
      const userStats = await sql`
        SELECT
          t.mint_address,
          t.symbol,
          t.name,
          COALESCE(mi.life_force_score, 0) as life_force,
          COALESCE(mi.vitality_index, 0) as vitality,
          COALESCE(mi.permanence_score, 0) as permanence,
          COALESCE(mi.total_qlx_inflow, 0) as total_given,
          COALESCE(mi.swap_count_total, 0) as swap_count,
          COALESCE(rp.deposited_amount, 0) as treasury_contribution,
          g.nation_name,
          g.road_id,
          n.total_territory_count as territories,
          (SELECT COUNT(*) FROM alliances a WHERE
            (a.proposer_nation_id = n.id OR a.target_nation_id = n.id)
            AND a.status = 'accepted') as alliance_count
        FROM tokens t
        LEFT JOIN metaphysics_index mi ON t.id = mi.token_id
        LEFT JOIN reciprocity_pool rp ON t.id = rp.token_id
        LEFT JOIN gcn_entries g ON t.id = g.token_id
        LEFT JOIN nations n ON t.mint_address = n.mint_address
        WHERE t.creator_wallet = ${wallet}
        LIMIT 10
      `;

      // Calculate overall giving score
      const givingStats = await sql`
        SELECT
          COUNT(DISTINCT s.id) as total_swaps,
          COALESCE(SUM(CASE WHEN s.direction = 'qlx_to_gcn' THEN s.amount ELSE 0 END), 0) as total_given_via_swap,
          COALESCE(SUM(CASE WHEN s.direction = 'gcn_to_qlx' THEN s.amount ELSE 0 END), 0) as total_received_via_swap
        FROM swaps s
        WHERE s.user_wallet = ${wallet}
      `;

      return new Response(JSON.stringify({
        success: true,
        wallet,
        tokens: userStats,
        swapActivity: givingStats[0],
        reciprocityRatio: givingStats[0].total_given_via_swap > 0
          ? (givingStats[0].total_given_via_swap / (givingStats[0].total_received_via_swap || 1)).toFixed(2)
          : '0',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Main leaderboard queries based on category
    let leaderboard;
    let categoryTitle;
    let categoryDescription;

    switch (category) {
      case 'lifeforce':
        categoryTitle = 'Life Force Champions';
        categoryDescription = 'Highest vitality and engagement scores';
        leaderboard = await sql`
          SELECT
            t.mint_address,
            t.symbol,
            t.name,
            t.image_uri,
            g.nation_name,
            g.road_id,
            COALESCE(mi.life_force_score, 0) as score,
            COALESCE(mi.vitality_index, 0) as vitality,
            COALESCE(mi.swap_count_total, 0) as activity
          FROM metaphysics_index mi
          JOIN tokens t ON mi.token_id = t.id
          LEFT JOIN gcn_entries g ON t.id = g.token_id
          WHERE mi.life_force_score > 0
          ORDER BY mi.life_force_score DESC
          LIMIT ${limit}
        `;
        break;

      case 'giving':
        categoryTitle = 'Greatest Givers';
        categoryDescription = 'Most QLX contributed to the commons';
        leaderboard = await sql`
          SELECT
            t.mint_address,
            t.symbol,
            t.name,
            t.image_uri,
            g.nation_name,
            g.road_id,
            COALESCE(mi.total_qlx_inflow, 0) as score,
            COALESCE(rp.deposited_amount, 0) / 1000000 as treasury_tokens,
            COALESCE(mi.swap_count_total, 0) as swap_count
          FROM tokens t
          LEFT JOIN metaphysics_index mi ON t.id = mi.token_id
          LEFT JOIN reciprocity_pool rp ON t.id = rp.token_id
          LEFT JOIN gcn_entries g ON t.id = g.token_id
          WHERE mi.total_qlx_inflow > 0 OR rp.deposited_amount > 0
          ORDER BY COALESCE(mi.total_qlx_inflow, 0) + COALESCE(rp.deposited_amount, 0) DESC
          LIMIT ${limit}
        `;
        break;

      case 'nations':
        categoryTitle = 'Mightiest Nations';
        categoryDescription = 'Strongest territory control and alliances';
        leaderboard = await sql`
          SELECT
            n.mint_address,
            t.symbol,
            n.name as nation_name,
            n.emoji,
            n.total_territory_count as territories,
            n.defense_bonus,
            COALESCE(n.total_staked, '0')::bigint / 1000000 as total_staked,
            (SELECT COUNT(*) FROM alliances a WHERE
              (a.proposer_nation_id = n.id OR a.target_nation_id = n.id)
              AND a.status = 'accepted') as alliances,
            g.road_id,
            (n.total_territory_count * 100 + n.defense_bonus * 10) as score
          FROM nations n
          JOIN tokens t ON n.mint_address = t.mint_address
          LEFT JOIN gcn_entries g ON t.id = g.token_id
          ORDER BY n.total_territory_count DESC, n.defense_bonus DESC
          LIMIT ${limit}
        `;
        break;

      case 'permanence':
        categoryTitle = 'Eternal Builders';
        categoryDescription = 'Longest commitment and stake duration';
        leaderboard = await sql`
          SELECT
            t.mint_address,
            t.symbol,
            t.name,
            t.image_uri,
            g.nation_name,
            COALESCE(mi.permanence_score, 0) as score,
            t.created_at,
            EXTRACT(DAY FROM NOW() - t.created_at) as days_active,
            COALESCE(mi.swap_count_total, 0) as total_activity
          FROM tokens t
          LEFT JOIN metaphysics_index mi ON t.id = mi.token_id
          LEFT JOIN gcn_entries g ON t.id = g.token_id
          WHERE t.is_gcn_entry = true
          ORDER BY COALESCE(mi.permanence_score, 0) DESC, t.created_at ASC
          LIMIT ${limit}
        `;
        break;

      default: // 'overall'
        categoryTitle = 'Reciprocity Champions';
        categoryDescription = 'Overall contribution to the Quillverse commons';
        leaderboard = await sql`
          SELECT
            t.mint_address,
            t.symbol,
            t.name,
            t.image_uri,
            g.nation_name,
            g.road_id,
            COALESCE(mi.life_force_score, 0) as life_force,
            COALESCE(mi.total_qlx_inflow, 0) as qlx_given,
            COALESCE(mi.swap_count_total, 0) as swaps,
            COALESCE(n.total_territory_count, 0) as territories,
            (
              COALESCE(mi.life_force_score, 0) * 10 +
              COALESCE(mi.total_qlx_inflow, 0) / 1000000 +
              COALESCE(mi.permanence_score, 0) * 5 +
              COALESCE(n.total_territory_count, 0) * 50
            ) as composite_score
          FROM tokens t
          LEFT JOIN metaphysics_index mi ON t.id = mi.token_id
          LEFT JOIN gcn_entries g ON t.id = g.token_id
          LEFT JOIN nations n ON t.mint_address = n.mint_address
          WHERE t.is_gcn_entry = true
          ORDER BY (
            COALESCE(mi.life_force_score, 0) * 10 +
            COALESCE(mi.total_qlx_inflow, 0) / 1000000 +
            COALESCE(mi.permanence_score, 0) * 5 +
            COALESCE(n.total_territory_count, 0) * 50
          ) DESC
          LIMIT ${limit}
        `;
    }

    // Get aggregate stats
    const stats = await sql`
      SELECT
        COUNT(DISTINCT t.id) as total_nations,
        COALESCE(SUM(mi.total_qlx_inflow), 0) as total_qlx_given,
        COALESCE(SUM(mi.swap_count_total), 0) as total_swaps,
        COALESCE(SUM(rp.deposited_amount), 0) / 1000000 as total_treasury_tokens,
        COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as active_alliances
      FROM tokens t
      LEFT JOIN metaphysics_index mi ON t.id = mi.token_id
      LEFT JOIN reciprocity_pool rp ON t.id = rp.token_id
      LEFT JOIN gcn_entries g ON t.id = g.token_id
      LEFT JOIN nations n ON t.mint_address = n.mint_address
      LEFT JOIN alliances a ON n.id = a.proposer_nation_id OR n.id = a.target_nation_id
      WHERE t.is_gcn_entry = true
    `;

    return new Response(JSON.stringify({
      success: true,
      category,
      title: categoryTitle,
      description: categoryDescription,
      leaderboard,
      stats: stats[0],
      challenge: {
        name: 'Reciprocity Challenge',
        motto: 'Compete to Give, Not Just to Win',
        rewards: [
          'Featured placement on 8xM homepage',
          'Priority in Rainbow Roads territory disputes',
          'Quillverse Ambassador status',
        ],
      },
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Reciprocity leaderboard error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
