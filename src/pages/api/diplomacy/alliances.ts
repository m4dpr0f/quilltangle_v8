import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const sql = getDb();
    const wallet = url.searchParams.get('wallet');
    const nationId = url.searchParams.get('nationId');
    const status = url.searchParams.get('status'); // proposed, active, broken, expired

    let alliances;

    if (wallet) {
      // Get user's nation first
      const nationResult = await sql`
        SELECT id FROM nations WHERE founder_wallet = ${wallet}
      `;

      if (nationResult.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          alliances: [],
          message: 'No nation found for this wallet',
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      const userNationId = nationResult[0].id;

      // Get all alliances involving user's nation
      alliances = await sql`
        SELECT
          a.*,
          pn.name as proposer_name,
          pn.emoji as proposer_emoji,
          pn.total_territory_count as proposer_territories,
          tn.name as target_name,
          tn.emoji as target_emoji,
          tn.total_territory_count as target_territories,
          CASE
            WHEN a.proposer_nation_id = ${userNationId} THEN 'proposer'
            ELSE 'target'
          END as user_role
        FROM alliances a
        JOIN nations pn ON a.proposer_nation_id = pn.id
        JOIN nations tn ON a.target_nation_id = tn.id
        WHERE (a.proposer_nation_id = ${userNationId} OR a.target_nation_id = ${userNationId})
        ${status ? sql`AND a.status = ${status}` : sql``}
        ORDER BY
          CASE a.status
            WHEN 'proposed' THEN 1
            WHEN 'active' THEN 2
            ELSE 3
          END,
          a.proposed_at DESC
      `;

    } else if (nationId) {
      // Get alliances for specific nation
      alliances = await sql`
        SELECT
          a.*,
          pn.name as proposer_name,
          pn.emoji as proposer_emoji,
          tn.name as target_name,
          tn.emoji as target_emoji
        FROM alliances a
        JOIN nations pn ON a.proposer_nation_id = pn.id
        JOIN nations tn ON a.target_nation_id = tn.id
        WHERE (a.proposer_nation_id = ${nationId} OR a.target_nation_id = ${nationId})
        ${status ? sql`AND a.status = ${status}` : sql`AND a.status = 'active'`}
        ORDER BY a.accepted_at DESC
      `;

    } else {
      // Get all active alliances (global alliance map)
      alliances = await sql`
        SELECT
          a.*,
          pn.name as proposer_name,
          pn.emoji as proposer_emoji,
          pn.total_territory_count as proposer_territories,
          tn.name as target_name,
          tn.emoji as target_emoji,
          tn.total_territory_count as target_territories
        FROM alliances a
        JOIN nations pn ON a.proposer_nation_id = pn.id
        JOIN nations tn ON a.target_nation_id = tn.id
        WHERE a.status = 'active'
        ORDER BY a.accepted_at DESC
        LIMIT 100
      `;
    }

    // Group by status for easier UI rendering
    const grouped = {
      pending: alliances.filter((a: any) => a.status === 'proposed' && a.user_role === 'target'),
      outgoing: alliances.filter((a: any) => a.status === 'proposed' && a.user_role === 'proposer'),
      active: alliances.filter((a: any) => a.status === 'active'),
      broken: alliances.filter((a: any) => ['broken', 'rejected', 'expired', 'countered'].includes(a.status)),
    };

    return new Response(JSON.stringify({
      success: true,
      alliances,
      grouped: wallet ? grouped : undefined,
      count: alliances.length,
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

// POST endpoint to break an alliance
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { allianceId, walletAddress, action } = body;

    if (action !== 'break') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Use /api/diplomacy/propose for new alliances, /api/diplomacy/respond for responses',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!allianceId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: allianceId, walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get alliance
    const allianceResult = await sql`
      SELECT
        a.*,
        pn.id as proposer_id,
        pn.name as proposer_name,
        pn.founder_wallet as proposer_wallet,
        tn.id as target_id,
        tn.name as target_name,
        tn.founder_wallet as target_wallet
      FROM alliances a
      JOIN nations pn ON a.proposer_nation_id = pn.id
      JOIN nations tn ON a.target_nation_id = tn.id
      WHERE a.id = ${allianceId}
    `;

    if (allianceResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Alliance not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const alliance = allianceResult[0];

    // Verify user is part of this alliance
    const isProposer = alliance.proposer_wallet === walletAddress;
    const isTarget = alliance.target_wallet === walletAddress;

    if (!isProposer && !isTarget) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You are not part of this alliance',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    if (alliance.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot break alliance with status: ${alliance.status}`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const breakerId = isProposer ? alliance.proposer_id : alliance.target_id;

    // Break the alliance
    await sql`
      UPDATE alliances
      SET status = 'broken', broken_at = NOW(), broken_by = ${breakerId}
      WHERE id = ${allianceId}
    `;

    // Remove alliance effects
    await removeAllianceEffects(sql, alliance);

    // Diplomatic penalty for breaker
    await sql`
      UPDATE nations
      SET diplomatic_standing = diplomatic_standing - 10, updated_at = NOW()
      WHERE id = ${breakerId}
    `;

    // Small compensation for betrayed nation
    const betrayedId = isProposer ? alliance.target_id : alliance.proposer_id;
    await sql`
      UPDATE nations
      SET diplomatic_standing = diplomatic_standing + 2, updated_at = NOW()
      WHERE id = ${betrayedId}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Alliance broken. Your diplomatic standing has decreased.',
      alliance: {
        id: allianceId,
        status: 'broken',
        brokenBy: isProposer ? alliance.proposer_name : alliance.target_name,
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

/**
 * Remove alliance effects when broken
 */
async function removeAllianceEffects(sql: any, alliance: any) {
  const terms = typeof alliance.terms === 'string' ? JSON.parse(alliance.terms) : alliance.terms;

  switch (alliance.alliance_type) {
    case 'defense':
      const defenseBonus = terms.defense_bonus || 25;
      await sql`
        UPDATE nations
        SET defense_rating = GREATEST(0, defense_rating - ${defenseBonus}), updated_at = NOW()
        WHERE id IN (${alliance.proposer_id}, ${alliance.target_id})
      `;
      break;

    case 'federation':
      await sql`
        UPDATE nations
        SET
          defense_rating = GREATEST(0, defense_rating - 50),
          attack_rating = GREATEST(0, attack_rating - 25),
          updated_at = NOW()
        WHERE id IN (${alliance.proposer_id}, ${alliance.target_id})
      `;
      break;
  }
}
