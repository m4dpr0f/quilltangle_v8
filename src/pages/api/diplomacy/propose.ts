import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Alliance Types:
 * - trade: Reduced swap fees between nations (terms.fee_reduction: 0.1-0.5)
 * - defense: Shared defense pool, mutual protection (terms.defense_bonus: 10-50)
 * - border: Non-aggression pact, cannot attack each other
 * - federation: Full alliance - shared governance, combined stats
 */

const ALLIANCE_TYPES = ['trade', 'defense', 'border', 'federation'];

const DEFAULT_TERMS: Record<string, any> = {
  trade: { fee_reduction: 0.25 }, // 25% fee reduction
  defense: { defense_bonus: 25, mutual_defense: true },
  border: { non_aggression: true, duration_days: 30 },
  federation: { shared_governance: true, combined_defense: true, revenue_share: 0.1 },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { targetNationId, allianceType, terms, walletAddress, message } = body;

    // Validate required fields
    if (!targetNationId || !allianceType || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: targetNationId, allianceType, walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!ALLIANCE_TYPES.includes(allianceType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid alliance type. Must be one of: ${ALLIANCE_TYPES.join(', ')}`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get proposer's nation
    const proposerResult = await sql`
      SELECT * FROM nations WHERE founder_wallet = ${walletAddress}
    `;

    if (proposerResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You must have a nation to propose alliances',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const proposerNation = proposerResult[0];

    // Get target nation
    const targetResult = await sql`
      SELECT * FROM nations WHERE id = ${targetNationId}
    `;

    if (targetResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Target nation not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const targetNation = targetResult[0];

    // Cannot propose alliance with yourself
    if (proposerNation.id === targetNation.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot propose alliance with your own nation',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check for existing alliance or pending proposal
    const existingAlliance = await sql`
      SELECT * FROM alliances
      WHERE (
        (proposer_nation_id = ${proposerNation.id} AND target_nation_id = ${targetNation.id})
        OR
        (proposer_nation_id = ${targetNation.id} AND target_nation_id = ${proposerNation.id})
      )
      AND status IN ('proposed', 'active')
    `;

    if (existingAlliance.length > 0) {
      const existing = existingAlliance[0];
      if (existing.status === 'active') {
        return new Response(JSON.stringify({
          success: false,
          error: 'An active alliance already exists between these nations',
          allianceId: existing.id,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'A pending alliance proposal already exists',
          allianceId: existing.id,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Merge custom terms with defaults
    const allianceTerms = {
      ...DEFAULT_TERMS[allianceType],
      ...terms,
      message: message || null,
    };

    // Calculate expiration (alliances last 30 days by default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (allianceTerms.duration_days || 30));

    // Create alliance proposal
    const result = await sql`
      INSERT INTO alliances (
        proposer_nation_id,
        target_nation_id,
        alliance_type,
        terms,
        status,
        expires_at
      ) VALUES (
        ${proposerNation.id},
        ${targetNation.id},
        ${allianceType},
        ${JSON.stringify(allianceTerms)},
        'proposed',
        ${expiresAt}
      )
      RETURNING *
    `;

    const alliance = result[0];

    // Update diplomatic standings
    await sql`
      UPDATE nations
      SET diplomatic_standing = diplomatic_standing + 1, updated_at = NOW()
      WHERE id = ${proposerNation.id}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: `Alliance proposal sent to ${targetNation.name}`,
      alliance: {
        id: alliance.id,
        type: allianceType,
        proposer: {
          id: proposerNation.id,
          name: proposerNation.name,
          emoji: proposerNation.emoji,
        },
        target: {
          id: targetNation.id,
          name: targetNation.name,
          emoji: targetNation.emoji,
        },
        terms: allianceTerms,
        status: 'proposed',
        expiresAt,
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
