import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Management API
 *
 * GET: Get player's Garu(s)
 * POST: Claim a wild egg
 */

// Element names for display
const ELEMENT_NAMES: Record<string, string> = {
  fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water',
  ether: 'Ether', chaos: 'Chaos', order: 'Order', coin: 'Coin',
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const includeHistory = url.searchParams.get('history') === 'true';

    if (!wallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get active Garu (egg or hatched)
    const activeGaru = await sql`
      SELECT * FROM garu
      WHERE owner_wallet = ${wallet}
      AND phase IN ('egg', 'hatching', 'hatched')
      ORDER BY created_at DESC
    `;

    // Get player's TEK8 profile for context
    const profile = await sql`
      SELECT * FROM tek8_profiles WHERE user_wallet = ${wallet}
    `;

    // Get deceased Garu if requested
    let deceasedGaru: any[] = [];
    if (includeHistory) {
      deceasedGaru = await sql`
        SELECT * FROM garu
        WHERE owner_wallet = ${wallet}
        AND phase = 'dead'
        ORDER BY died_at DESC
        LIMIT 10
      `;
    }

    // Format Garu data
    const formatGaru = (g: any) => ({
      id: g.id,
      name: g.name,
      phase: g.phase,
      primaryElement: g.primary_element,
      secondaryElement: g.secondary_element,
      compositeType: g.composite_type,
      level: g.level,
      experience: g.experience,
      xp: g.xp || g.experience,
      riderBond: g.rider_bond,
      bondLevel: g.bond_level || g.rider_bond,
      generation: g.generation,
      stats: {
        fire: g.stat_fire,
        earth: g.stat_earth,
        air: g.stat_air,
        water: g.stat_water,
        ether: g.stat_ether,
        chaos: g.stat_chaos,
        order: g.stat_order,
        coin: g.stat_coin,
      },
      careStreak: g.care_streak,
      totalCareDays: g.total_care_days,
      createdAt: g.created_at,
      hatchedAt: g.hatched_at,
      diedAt: g.died_at,
      imageUrl: g.image_url,
    });

    const formattedActive = activeGaru.map(formatGaru);
    const formattedDeceased = deceasedGaru.map(formatGaru);

    return new Response(JSON.stringify({
      success: true,
      garu: [...formattedActive, ...formattedDeceased], // All Garu for fusion component
      activeGaru: formattedActive,
      hasActiveGaru: formattedActive.length > 0,
      currentGaru: formattedActive.length > 0 ? formattedActive[0] : null,
      deceasedGaru: formattedDeceased,
      profile: profile[0] ? {
        primaryGuild: profile[0].primary_guild,
        secondaryGuild: profile[0].secondary_guild,
        elementDistribution: profile[0].element_distribution,
      } : null,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST: Claim a wild egg
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, eggId, garuName } = body;

    if (!walletAddress || !eggId || !garuName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet, egg ID, and Garu name required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (garuName.length < 2 || garuName.length > 50) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Garu name must be 2-50 characters',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Check if player already has an active Garu (limit 1 for now)
    const existingGaru = await sql`
      SELECT * FROM garu
      WHERE owner_wallet = ${walletAddress}
      AND phase IN ('egg', 'hatching', 'hatched')
    `;

    if (existingGaru.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You already have an active Garu. Care for them first!',
        existingGaru: {
          id: existingGaru[0].id,
          name: existingGaru[0].name,
          phase: existingGaru[0].phase,
        },
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the egg
    const eggResult = await sql`
      SELECT * FROM garu_eggs_wild
      WHERE id = ${eggId}
      AND claimed_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (eggResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Egg not found, already claimed, or expired',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const egg = eggResult[0];

    // Claim the egg
    await sql`
      UPDATE garu_eggs_wild
      SET
        claimed_by = ${walletAddress},
        claimed_at = NOW()
      WHERE id = ${eggId}
    `;

    // Calculate initial stats based on egg's element
    const baseStats = {
      fire: 10, earth: 10, air: 10, water: 10,
      ether: 10, chaos: 10, order: 10, coin: 10,
    };
    // Boost the primary element stat
    if (egg.primary_element && baseStats[egg.primary_element as keyof typeof baseStats] !== undefined) {
      baseStats[egg.primary_element as keyof typeof baseStats] = 20;
    }
    // Slight boost to secondary element if exists
    if (egg.secondary_element && baseStats[egg.secondary_element as keyof typeof baseStats] !== undefined) {
      baseStats[egg.secondary_element as keyof typeof baseStats] = 15;
    }

    // Create the Garu from the egg
    const garuResult = await sql`
      INSERT INTO garu (
        owner_wallet,
        name,
        primary_element,
        secondary_element,
        phase,
        generation,
        birth_territory,
        egg_id,
        parent_garu_ids,
        stat_fire, stat_earth, stat_air, stat_water,
        stat_ether, stat_chaos, stat_order, stat_coin,
        from_egg_id
      )
      VALUES (
        ${walletAddress},
        ${garuName},
        ${egg.primary_element},
        ${egg.secondary_element || null},
        'egg',
        ${(egg.parent_generation || 0) + 1},
        ${egg.territory_id},
        ${eggId},
        ${egg.parent_garu_id ? [egg.parent_garu_id] : null},
        ${baseStats.fire}, ${baseStats.earth}, ${baseStats.air}, ${baseStats.water},
        ${baseStats.ether}, ${baseStats.chaos}, ${baseStats.order}, ${baseStats.coin},
        ${eggId}
      )
      RETURNING *
    `;

    const newGaru = garuResult[0];

    // Record territory visit (birth location)
    await sql`
      INSERT INTO garu_territory_visits (
        garu_id,
        territory_id,
        visit_type,
        first_visited
      ) VALUES (
        ${newGaru.id},
        ${egg.territory_id},
        'born',
        NOW()
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: `Welcome, ${garuName}! Your egg journey begins.`,
      garu: {
        id: newGaru.id,
        name: newGaru.name,
        phase: newGaru.phase,
        primaryElement: newGaru.primary_element,
        secondaryElement: newGaru.secondary_element,
        generation: newGaru.generation,
        birthTerritory: newGaru.birth_territory,
        parentLegacy: egg.parent_garu_name ? `Child of ${egg.parent_garu_name}` : 'Primordial',
      },
      nextSteps: [
        'Begin daily care across all 8 wellness dimensions',
        'Journal your contemplation journey',
        'Practice your sacred instrument',
        'After 25+ days of care, attempt hatching!',
      ],
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu claim POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
