import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Fusion API
 *
 * Allows players to combine two Garu to create composite elemental types.
 *
 * POST: Propose or accept a fusion
 * GET: View fusion proposals and composite types
 * DELETE: Cancel a fusion proposal
 */

// Fusion requirements
const MIN_LEVEL_FOR_FUSION = 10;
const MIN_BOND_FOR_FUSION = 75;
const FUSION_COOLDOWN_DAYS = 7;

// Element combinations that create composites
const COMPOSITE_RECIPES: Record<string, { elements: string[], name: string, rarity: string }> = {
  magma: { elements: ['fire', 'earth'], name: 'Magma Garu', rarity: 'uncommon' },
  storm: { elements: ['air', 'water'], name: 'Storm Garu', rarity: 'uncommon' },
  lightning: { elements: ['fire', 'air'], name: 'Lightning Garu', rarity: 'uncommon' },
  ice: { elements: ['water', 'air'], name: 'Ice Garu', rarity: 'uncommon' },
  void: { elements: ['chaos', 'ether'], name: 'Void Garu', rarity: 'rare' },
  crystal: { elements: ['earth', 'order'], name: 'Crystal Garu', rarity: 'rare' },
  phoenix: { elements: ['fire', 'ether', 'chaos'], name: 'Phoenix Garu', rarity: 'epic' },
  leviathan: { elements: ['water', 'earth', 'chaos'], name: 'Leviathan Garu', rarity: 'epic' },
  celestial: { elements: ['air', 'ether', 'order'], name: 'Celestial Garu', rarity: 'epic' },
  prism: { elements: ['fire', 'water', 'air', 'earth'], name: 'Prism Garu', rarity: 'legendary' },
  rainbow_bridge: {
    elements: ['fire', 'earth', 'air', 'water', 'ether', 'chaos', 'order', 'coin'],
    name: 'Rainbow Bridge Garu',
    rarity: 'mythic'
  },
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const action = url.searchParams.get('action') || 'proposals';

    const sql = getDb();

    if (action === 'composites') {
      // List all composite types
      const composites = await sql`
        SELECT * FROM garu_composite_types
        ORDER BY
          CASE rarity
            WHEN 'mythic' THEN 1
            WHEN 'legendary' THEN 2
            WHEN 'epic' THEN 3
            WHEN 'rare' THEN 4
            ELSE 5
          END
      `;

      return new Response(JSON.stringify({
        success: true,
        composites: composites.map(c => ({
          name: c.name,
          description: c.description,
          elements: c.required_elements,
          rarity: c.rarity,
          bonus: c.stat_bonuses,
        })),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'proposals' && wallet) {
      // Get pending fusion proposals for this wallet
      const proposals = await sql`
        SELECT
          fp.*,
          g1.name as garu1_name,
          g1.primary_element as garu1_element,
          g1.level as garu1_level,
          g2.name as garu2_name,
          g2.primary_element as garu2_element,
          g2.level as garu2_level
        FROM garu_fusion_proposals fp
        JOIN garu g1 ON fp.garu1_id = g1.id
        JOIN garu g2 ON fp.garu2_id = g2.id
        WHERE fp.status = 'pending'
        AND (fp.proposer_wallet = ${wallet} OR fp.target_wallet = ${wallet})
        ORDER BY fp.created_at DESC
      `;

      return new Response(JSON.stringify({
        success: true,
        proposals: proposals.map(p => ({
          id: p.id,
          garu1: { id: p.garu1_id, name: p.garu1_name, element: p.garu1_element, level: p.garu1_level },
          garu2: { id: p.garu2_id, name: p.garu2_name, element: p.garu2_element, level: p.garu2_level },
          proposedType: p.proposed_composite_type,
          proposer: p.proposer_wallet,
          target: p.target_wallet,
          isProposer: p.proposer_wallet === wallet,
          createdAt: p.created_at,
          expiresAt: p.expires_at,
        })),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'history' && wallet) {
      // Get fusion history
      const fusions = await sql`
        SELECT
          gf.*,
          g.name as result_name,
          g.primary_element,
          g.secondary_element,
          g.composite_type
        FROM garu_fusions gf
        LEFT JOIN garu g ON gf.result_garu_id = g.id
        WHERE gf.owner1_wallet = ${wallet} OR gf.owner2_wallet = ${wallet}
        ORDER BY gf.fused_at DESC
        LIMIT 20
      `;

      return new Response(JSON.stringify({
        success: true,
        fusions: fusions.map(f => ({
          id: f.id,
          parent1: f.parent1_name,
          parent2: f.parent2_name,
          result: {
            id: f.result_garu_id,
            name: f.result_name,
            element: f.primary_element,
            secondary: f.secondary_element,
            composite: f.composite_type,
          },
          fusedAt: f.fused_at,
        })),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Check what composite a fusion would create
    if (action === 'preview') {
      const element1 = url.searchParams.get('element1');
      const element2 = url.searchParams.get('element2');

      if (!element1 || !element2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Both elements required for preview',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const elements = [element1, element2].sort();

      // Find matching composite
      let matchedComposite = null;
      for (const [key, recipe] of Object.entries(COMPOSITE_RECIPES)) {
        const recipeElements = [...recipe.elements].sort();
        if (elements.length === recipeElements.length &&
            elements.every((e, i) => e === recipeElements[i])) {
          matchedComposite = { key, ...recipe };
          break;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        elements,
        result: matchedComposite || {
          name: 'Hybrid Garu',
          rarity: 'common',
          description: 'A fusion of two elements without a named composite type',
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action or missing wallet',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      walletAddress,
      action, // 'propose', 'accept', 'execute'
      garu1Id,
      garu2Id,
      proposalId,
      newGaruName,
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // PROPOSE FUSION
    if (action === 'propose') {
      if (!garu1Id || !garu2Id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Both Garu IDs required',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Get both Garu
      const garu = await sql`
        SELECT * FROM garu
        WHERE id IN (${garu1Id}, ${garu2Id})
        AND phase = 'hatched'
      `;

      if (garu.length !== 2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Both Garu must exist and be hatched',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const garu1 = garu.find(g => g.id === garu1Id)!;
      const garu2 = garu.find(g => g.id === garu2Id)!;

      // Verify ownership (proposer must own garu1)
      if (garu1.owner_wallet !== walletAddress) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You must own the first Garu to propose fusion',
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

      // Check level requirements
      if (garu1.level < MIN_LEVEL_FOR_FUSION || garu2.level < MIN_LEVEL_FOR_FUSION) {
        return new Response(JSON.stringify({
          success: false,
          error: `Both Garu must be at least level ${MIN_LEVEL_FOR_FUSION} for fusion`,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Check bond requirements
      if (garu1.bond_level < MIN_BOND_FOR_FUSION || garu2.bond_level < MIN_BOND_FOR_FUSION) {
        return new Response(JSON.stringify({
          success: false,
          error: `Both Garu must have at least ${MIN_BOND_FOR_FUSION}% bond for fusion`,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Determine composite type
      const elements = [garu1.primary_element, garu2.primary_element];
      if (garu1.secondary_element) elements.push(garu1.secondary_element);
      if (garu2.secondary_element) elements.push(garu2.secondary_element);
      const uniqueElements = [...new Set(elements)].sort();

      let compositeType = null;
      for (const [key, recipe] of Object.entries(COMPOSITE_RECIPES)) {
        const recipeElements = [...recipe.elements].sort();
        if (uniqueElements.length >= recipeElements.length) {
          const hasAll = recipeElements.every(e => uniqueElements.includes(e));
          if (hasAll) {
            compositeType = key;
            // Keep looking for better matches (more elements = better)
          }
        }
      }

      // Check for existing pending proposal
      const existing = await sql`
        SELECT id FROM garu_fusion_proposals
        WHERE status = 'pending'
        AND ((garu1_id = ${garu1Id} AND garu2_id = ${garu2Id})
          OR (garu1_id = ${garu2Id} AND garu2_id = ${garu1Id}))
      `;

      if (existing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'A fusion proposal already exists for these Garu',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Create proposal
      const isSameOwner = garu1.owner_wallet === garu2.owner_wallet;

      const proposal = await sql`
        INSERT INTO garu_fusion_proposals (
          garu1_id,
          garu2_id,
          proposer_wallet,
          target_wallet,
          proposed_composite_type,
          status,
          expires_at
        ) VALUES (
          ${garu1Id},
          ${garu2Id},
          ${walletAddress},
          ${garu2.owner_wallet},
          ${compositeType},
          ${isSameOwner ? 'accepted' : 'pending'},
          NOW() + INTERVAL '7 days'
        )
        RETURNING id
      `;

      // If same owner, auto-accept and return ready to execute
      if (isSameOwner) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Fusion proposal auto-accepted (same owner)',
          proposal: {
            id: proposal[0].id,
            status: 'accepted',
            compositeType,
            readyToExecute: true,
          },
          garu1: { name: garu1.name, element: garu1.primary_element },
          garu2: { name: garu2.name, element: garu2.primary_element },
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Fusion proposal sent',
        proposal: {
          id: proposal[0].id,
          status: 'pending',
          compositeType,
          targetWallet: garu2.owner_wallet,
        },
        garu1: { name: garu1.name, element: garu1.primary_element },
        garu2: { name: garu2.name, element: garu2.primary_element },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ACCEPT FUSION PROPOSAL
    if (action === 'accept') {
      if (!proposalId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Proposal ID required',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const proposal = await sql`
        SELECT * FROM garu_fusion_proposals
        WHERE id = ${proposalId}
        AND target_wallet = ${walletAddress}
        AND status = 'pending'
      `;

      if (proposal.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Proposal not found or already processed',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      await sql`
        UPDATE garu_fusion_proposals
        SET status = 'accepted', accepted_at = NOW()
        WHERE id = ${proposalId}
      `;

      return new Response(JSON.stringify({
        success: true,
        message: 'Fusion proposal accepted! Ready to execute.',
        proposal: {
          id: proposalId,
          status: 'accepted',
          readyToExecute: true,
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // EXECUTE FUSION
    if (action === 'execute') {
      if (!proposalId || !newGaruName) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Proposal ID and new Garu name required',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Get accepted proposal
      const proposals = await sql`
        SELECT * FROM garu_fusion_proposals
        WHERE id = ${proposalId}
        AND status = 'accepted'
        AND (proposer_wallet = ${walletAddress} OR target_wallet = ${walletAddress})
      `;

      if (proposals.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Accepted proposal not found',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      const proposal = proposals[0];

      // Get both Garu
      const parents = await sql`
        SELECT * FROM garu
        WHERE id IN (${proposal.garu1_id}, ${proposal.garu2_id})
        AND phase = 'hatched'
      `;

      if (parents.length !== 2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'One or both Garu are no longer available for fusion',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const garu1 = parents.find(g => g.id === proposal.garu1_id)!;
      const garu2 = parents.find(g => g.id === proposal.garu2_id)!;

      // Calculate new Garu stats (average of parents + bonuses)
      const newGeneration = Math.max(garu1.generation, garu2.generation) + 1;
      const avgLevel = Math.floor((garu1.level + garu2.level) / 2);

      // Combine elements
      const elements = [garu1.primary_element, garu2.primary_element];
      if (garu1.secondary_element) elements.push(garu1.secondary_element);
      if (garu2.secondary_element) elements.push(garu2.secondary_element);
      const uniqueElements = [...new Set(elements)];

      const primaryElement = uniqueElements[0];
      const secondaryElement = uniqueElements.length > 1 ? uniqueElements[1] : null;

      // Average stats with 10% bonus
      const statBonus = 1.1;
      const newStats = {
        fire: Math.floor((garu1.stat_fire + garu2.stat_fire) / 2 * statBonus),
        earth: Math.floor((garu1.stat_earth + garu2.stat_earth) / 2 * statBonus),
        air: Math.floor((garu1.stat_air + garu2.stat_air) / 2 * statBonus),
        water: Math.floor((garu1.stat_water + garu2.stat_water) / 2 * statBonus),
        ether: Math.floor((garu1.stat_ether + garu2.stat_ether) / 2 * statBonus),
        chaos: Math.floor((garu1.stat_chaos + garu2.stat_chaos) / 2 * statBonus),
        order: Math.floor((garu1.stat_order + garu2.stat_order) / 2 * statBonus),
        coin: Math.floor((garu1.stat_coin + garu2.stat_coin) / 2 * statBonus),
      };

      // Create the new fused Garu (owned by the proposer)
      const newGaru = await sql`
        INSERT INTO garu (
          name,
          owner_wallet,
          phase,
          generation,
          level,
          xp,
          primary_element,
          secondary_element,
          composite_type,
          bond_level,
          stat_fire, stat_earth, stat_air, stat_water,
          stat_ether, stat_chaos, stat_order, stat_coin,
          parent1_id,
          parent2_id,
          hatched_at
        ) VALUES (
          ${newGaruName},
          ${proposal.proposer_wallet},
          'hatched',
          ${newGeneration},
          ${avgLevel},
          0,
          ${primaryElement},
          ${secondaryElement},
          ${proposal.proposed_composite_type},
          50,
          ${newStats.fire}, ${newStats.earth}, ${newStats.air}, ${newStats.water},
          ${newStats.ether}, ${newStats.chaos}, ${newStats.order}, ${newStats.coin},
          ${proposal.garu1_id},
          ${proposal.garu2_id},
          NOW()
        )
        RETURNING id
      `;

      // Mark parents as fused (they're consumed in the fusion)
      await sql`
        UPDATE garu
        SET phase = 'fused', fused_into_id = ${newGaru[0].id}, updated_at = NOW()
        WHERE id IN (${proposal.garu1_id}, ${proposal.garu2_id})
      `;

      // Record the fusion
      await sql`
        INSERT INTO garu_fusions (
          parent1_id,
          parent1_name,
          parent2_id,
          parent2_name,
          result_garu_id,
          owner1_wallet,
          owner2_wallet,
          composite_type_achieved
        ) VALUES (
          ${proposal.garu1_id},
          ${garu1.name},
          ${proposal.garu2_id},
          ${garu2.name},
          ${newGaru[0].id},
          ${garu1.owner_wallet},
          ${garu2.owner_wallet},
          ${proposal.proposed_composite_type}
        )
      `;

      // Update proposal status
      await sql`
        UPDATE garu_fusion_proposals
        SET status = 'executed', executed_at = NOW(), result_garu_id = ${newGaru[0].id}
        WHERE id = ${proposalId}
      `;

      // Get composite type details if applicable
      let compositeDetails = null;
      if (proposal.proposed_composite_type) {
        const composite = await sql`
          SELECT * FROM garu_composite_types
          WHERE name = ${proposal.proposed_composite_type}
        `;
        if (composite.length > 0) {
          compositeDetails = {
            name: composite[0].name,
            description: composite[0].description,
            rarity: composite[0].rarity,
          };
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `${garu1.name} and ${garu2.name} have merged to become ${newGaruName}!`,
        ceremony: {
          title: 'Fusion Complete',
          description: compositeDetails
            ? `A rare ${compositeDetails.name} has been born from this fusion!`
            : `Two souls become one. ${newGaruName} emerges stronger than either parent.`,
        },
        newGaru: {
          id: newGaru[0].id,
          name: newGaruName,
          generation: newGeneration,
          level: avgLevel,
          primaryElement,
          secondaryElement,
          compositeType: proposal.proposed_composite_type,
          stats: newStats,
        },
        composite: compositeDetails,
        parents: {
          garu1: garu1.name,
          garu2: garu2.name,
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Fusion error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE: Cancel a fusion proposal
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, proposalId } = body;

    if (!walletAddress || !proposalId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet and proposal ID required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Can only cancel pending proposals you're involved in
    const result = await sql`
      UPDATE garu_fusion_proposals
      SET status = 'cancelled', cancelled_at = NOW()
      WHERE id = ${proposalId}
      AND status = 'pending'
      AND (proposer_wallet = ${walletAddress} OR target_wallet = ${walletAddress})
      RETURNING id
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Proposal not found or cannot be cancelled',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Fusion proposal cancelled',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
