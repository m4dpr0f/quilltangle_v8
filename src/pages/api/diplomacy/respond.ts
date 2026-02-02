import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { allianceId, action, walletAddress, counterTerms } = body;

    // Validate required fields
    if (!allianceId || !action || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: allianceId, action, walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!['accept', 'reject', 'counter'].includes(action)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Action must be: accept, reject, or counter',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get alliance with nation details
    const allianceResult = await sql`
      SELECT
        a.*,
        pn.id as proposer_id,
        pn.name as proposer_name,
        pn.emoji as proposer_emoji,
        pn.founder_wallet as proposer_wallet,
        tn.id as target_id,
        tn.name as target_name,
        tn.emoji as target_emoji,
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

    // Verify responder is the target nation
    if (alliance.target_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only the target nation can respond to this proposal',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check alliance status
    if (alliance.status !== 'proposed') {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot respond to alliance with status: ${alliance.status}`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let responseMessage = '';
    let newStatus = alliance.status;

    if (action === 'accept') {
      // Accept the alliance
      await sql`
        UPDATE alliances
        SET status = 'active', accepted_at = NOW()
        WHERE id = ${allianceId}
      `;
      newStatus = 'active';

      // Apply alliance effects
      await applyAllianceEffects(sql, alliance);

      // Update diplomatic standings for both nations
      await sql`
        UPDATE nations
        SET diplomatic_standing = diplomatic_standing + 5, updated_at = NOW()
        WHERE id IN (${alliance.proposer_id}, ${alliance.target_id})
      `;

      responseMessage = `Alliance accepted! ${alliance.proposer_emoji} ${alliance.proposer_name} and ${alliance.target_emoji} ${alliance.target_name} are now allied.`;

    } else if (action === 'reject') {
      // Reject the alliance
      await sql`
        UPDATE alliances
        SET status = 'rejected', broken_at = NOW(), broken_by = ${alliance.target_id}
        WHERE id = ${allianceId}
      `;
      newStatus = 'rejected';

      // Small diplomatic penalty for rejector
      await sql`
        UPDATE nations
        SET diplomatic_standing = diplomatic_standing - 1, updated_at = NOW()
        WHERE id = ${alliance.target_id}
      `;

      responseMessage = `Alliance proposal rejected.`;

    } else if (action === 'counter') {
      // Counter-proposal (swap proposer/target, update terms)
      if (!counterTerms) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Counter-proposal requires counterTerms',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Mark original as countered
      await sql`
        UPDATE alliances
        SET status = 'countered'
        WHERE id = ${allianceId}
      `;

      // Create new counter-proposal (roles swapped)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const counterResult = await sql`
        INSERT INTO alliances (
          proposer_nation_id,
          target_nation_id,
          alliance_type,
          terms,
          status,
          expires_at
        ) VALUES (
          ${alliance.target_id},
          ${alliance.proposer_id},
          ${alliance.alliance_type},
          ${JSON.stringify({ ...JSON.parse(alliance.terms), ...counterTerms, counter_to: allianceId })},
          'proposed',
          ${expiresAt}
        )
        RETURNING *
      `;

      newStatus = 'countered';
      responseMessage = `Counter-proposal sent to ${alliance.proposer_name}.`;

      return new Response(JSON.stringify({
        success: true,
        message: responseMessage,
        originalAlliance: { id: allianceId, status: 'countered' },
        counterAlliance: {
          id: counterResult[0].id,
          status: 'proposed',
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: responseMessage,
      alliance: {
        id: allianceId,
        type: alliance.alliance_type,
        status: newStatus,
        proposer: {
          name: alliance.proposer_name,
          emoji: alliance.proposer_emoji,
        },
        target: {
          name: alliance.target_name,
          emoji: alliance.target_emoji,
        },
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
 * Apply alliance effects based on type
 */
async function applyAllianceEffects(sql: any, alliance: any) {
  const terms = typeof alliance.terms === 'string' ? JSON.parse(alliance.terms) : alliance.terms;

  switch (alliance.alliance_type) {
    case 'defense':
      // Boost defense ratings for both nations
      const defenseBonus = terms.defense_bonus || 25;
      await sql`
        UPDATE nations
        SET defense_rating = defense_rating + ${defenseBonus}, updated_at = NOW()
        WHERE id IN (${alliance.proposer_id}, ${alliance.target_id})
      `;
      break;

    case 'federation':
      // Major boosts for federation
      await sql`
        UPDATE nations
        SET
          defense_rating = defense_rating + 50,
          attack_rating = attack_rating + 25,
          updated_at = NOW()
        WHERE id IN (${alliance.proposer_id}, ${alliance.target_id})
      `;
      break;

    // trade and border don't have immediate stat effects
    // They affect gameplay rules (checked during swaps/attacks)
  }
}
