import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Hatching API
 *
 * POST: Attempt to hatch an egg
 *
 * Requirements:
 * - 25+ days of care
 * - 70%+ overall wellness (care days * 8 dimensions)
 * - At least 50% bond
 */

const MIN_CARE_DAYS = 25;
const MIN_WELLNESS_PERCENT = 70;
const MIN_BOND = 50;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, garuId } = body;

    if (!walletAddress || !garuId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet and Garu ID required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get the Garu
    const garuResult = await sql`
      SELECT * FROM garu
      WHERE id = ${garuId}
      AND owner_wallet = ${walletAddress}
      AND phase = 'egg'
    `;

    if (garuResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Egg not found, not owned by you, or already hatched',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const garu = garuResult[0];

    // Calculate care statistics
    const careStats = await sql`
      SELECT
        COUNT(*) as total_days,
        SUM(dimensions_completed) as total_dimensions,
        AVG(dimensions_completed) as avg_dimensions,
        SUM(CASE WHEN physical THEN 1 ELSE 0 END) as physical_count,
        SUM(CASE WHEN emotional THEN 1 ELSE 0 END) as emotional_count,
        SUM(CASE WHEN intellectual THEN 1 ELSE 0 END) as intellectual_count,
        SUM(CASE WHEN social THEN 1 ELSE 0 END) as social_count,
        SUM(CASE WHEN occupational THEN 1 ELSE 0 END) as occupational_count,
        SUM(CASE WHEN spiritual THEN 1 ELSE 0 END) as spiritual_count,
        SUM(CASE WHEN environmental THEN 1 ELSE 0 END) as environmental_count,
        SUM(CASE WHEN financial THEN 1 ELSE 0 END) as financial_count,
        SUM(instrument_minutes) as total_instrument_minutes
      FROM garu_care_logs
      WHERE garu_id = ${garuId}
    `;

    const stats = careStats[0];
    const totalDays = parseInt(stats.total_days) || 0;
    const totalDimensions = parseInt(stats.total_dimensions) || 0;
    const maxPossibleDimensions = totalDays * 8;
    const wellnessPercent = maxPossibleDimensions > 0
      ? Math.round((totalDimensions / maxPossibleDimensions) * 100)
      : 0;

    // Check requirements
    const requirements = {
      careDays: {
        required: MIN_CARE_DAYS,
        current: totalDays,
        met: totalDays >= MIN_CARE_DAYS,
      },
      wellness: {
        required: MIN_WELLNESS_PERCENT,
        current: wellnessPercent,
        met: wellnessPercent >= MIN_WELLNESS_PERCENT,
      },
      bond: {
        required: MIN_BOND,
        current: garu.rider_bond,
        met: garu.rider_bond >= MIN_BOND,
      },
    };

    const allRequirementsMet = requirements.careDays.met &&
                               requirements.wellness.met &&
                               requirements.bond.met;

    if (!allRequirementsMet) {
      const missing = [];
      if (!requirements.careDays.met) {
        missing.push(`${MIN_CARE_DAYS - totalDays} more days of care`);
      }
      if (!requirements.wellness.met) {
        missing.push(`Increase wellness to ${MIN_WELLNESS_PERCENT}% (currently ${wellnessPercent}%)`);
      }
      if (!requirements.bond.met) {
        missing.push(`Increase bond to ${MIN_BOND}% (currently ${garu.rider_bond}%)`);
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Not ready to hatch',
        requirements,
        missing,
        encouragement: 'Keep caring for your egg! You\'re making progress.',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Hatching ceremony! 🐣

    // Calculate hatching bonuses based on care quality
    const hatchBonuses = {
      levelBonus: Math.floor(wellnessPercent / 20), // Up to +5 levels
      statBonus: Math.floor(totalDays / 10), // Up to +3 to all stats
      bondBonus: Math.floor((wellnessPercent - 70) / 10) * 5, // Bonus bond for exceeding requirements
    };

    // Apply bonuses and hatch
    await sql`
      UPDATE garu
      SET
        phase = 'hatched',
        hatched_at = NOW(),
        level = level + ${hatchBonuses.levelBonus},
        rider_bond = LEAST(rider_bond + ${hatchBonuses.bondBonus}, 100),
        stat_fire = stat_fire + ${hatchBonuses.statBonus},
        stat_earth = stat_earth + ${hatchBonuses.statBonus},
        stat_air = stat_air + ${hatchBonuses.statBonus},
        stat_water = stat_water + ${hatchBonuses.statBonus},
        stat_ether = stat_ether + ${hatchBonuses.statBonus},
        stat_chaos = stat_chaos + ${hatchBonuses.statBonus},
        stat_order = stat_order + ${hatchBonuses.statBonus},
        stat_coin = stat_coin + ${hatchBonuses.statBonus},
        updated_at = NOW()
      WHERE id = ${garuId}
    `;

    // Record hatching in D8 Wilderness (Air territory)
    await sql`
      INSERT INTO garu_territory_visits (
        garu_id,
        territory_id,
        visit_type
      ) VALUES (
        ${garuId},
        'D8OUT',
        'hatched'
      )
      ON CONFLICT (garu_id, territory_id) DO UPDATE SET
        visit_type = 'hatched',
        last_visited = NOW()
    `;

    // Get updated Garu
    const hatchedGaru = await sql`SELECT * FROM garu WHERE id = ${garuId}`;
    const hatched = hatchedGaru[0];

    // Generate dimension wellness report
    const dimensionReport = {
      physical: parseInt(stats.physical_count) || 0,
      emotional: parseInt(stats.emotional_count) || 0,
      intellectual: parseInt(stats.intellectual_count) || 0,
      social: parseInt(stats.social_count) || 0,
      occupational: parseInt(stats.occupational_count) || 0,
      spiritual: parseInt(stats.spiritual_count) || 0,
      environmental: parseInt(stats.environmental_count) || 0,
      financial: parseInt(stats.financial_count) || 0,
    };

    return new Response(JSON.stringify({
      success: true,
      message: `🐣 ${hatched.name} has hatched!`,
      ceremony: {
        title: 'The Wilderness Emergence',
        description: `In the D8 Wilderness, where air carries whispers of all who came before, ${hatched.name} emerges from their shell. ${totalDays} days of care have forged an unbreakable bond between Rider and Garu.`,
        location: 'D8 Wilderness (Air Territory)',
      },
      garu: {
        id: hatched.id,
        name: hatched.name,
        phase: hatched.phase,
        level: hatched.level,
        primaryElement: hatched.primary_element,
        secondaryElement: hatched.secondary_element,
        riderBond: hatched.rider_bond,
        stats: {
          fire: hatched.stat_fire,
          earth: hatched.stat_earth,
          air: hatched.stat_air,
          water: hatched.stat_water,
          ether: hatched.stat_ether,
          chaos: hatched.stat_chaos,
          order: hatched.stat_order,
          coin: hatched.stat_coin,
        },
      },
      bonuses: {
        levelBonus: hatchBonuses.levelBonus,
        statBonus: hatchBonuses.statBonus,
        bondBonus: hatchBonuses.bondBonus,
        reason: `Your ${wellnessPercent}% wellness care and ${totalDays} days of dedication earned these bonuses!`,
      },
      journeyStats: {
        totalDays,
        wellnessPercent,
        dimensionReport,
        instrumentMinutes: parseInt(stats.total_instrument_minutes) || 0,
      },
      nextSteps: [
        'Gather survival materials in the Wilderness',
        'Continue daily care to strengthen your bond',
        'Explore Rainbow Roads together',
        'Your Garu\'s legacy will scatter eggs when they eventually fall',
      ],
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu hatch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET: Check hatching readiness
export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const garuId = url.searchParams.get('garuId');

    if (!wallet || !garuId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet and Garu ID required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    const garu = await sql`
      SELECT * FROM garu WHERE id = ${garuId} AND owner_wallet = ${wallet}
    `;

    if (garu.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Garu not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (garu[0].phase !== 'egg') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Garu is not an egg',
        phase: garu[0].phase,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get care statistics
    const careStats = await sql`
      SELECT
        COUNT(*) as total_days,
        SUM(dimensions_completed) as total_dimensions
      FROM garu_care_logs
      WHERE garu_id = ${garuId}
    `;

    const stats = careStats[0];
    const totalDays = parseInt(stats.total_days) || 0;
    const totalDimensions = parseInt(stats.total_dimensions) || 0;
    const maxPossible = totalDays * 8;
    const wellnessPercent = maxPossible > 0 ? Math.round((totalDimensions / maxPossible) * 100) : 0;

    const readyToHatch = totalDays >= MIN_CARE_DAYS &&
                         wellnessPercent >= MIN_WELLNESS_PERCENT &&
                         garu[0].rider_bond >= MIN_BOND;

    return new Response(JSON.stringify({
      success: true,
      readyToHatch,
      requirements: {
        careDays: { required: MIN_CARE_DAYS, current: totalDays, met: totalDays >= MIN_CARE_DAYS },
        wellness: { required: MIN_WELLNESS_PERCENT, current: wellnessPercent, met: wellnessPercent >= MIN_WELLNESS_PERCENT },
        bond: { required: MIN_BOND, current: garu[0].rider_bond, met: garu[0].rider_bond >= MIN_BOND },
      },
      daysRemaining: Math.max(0, MIN_CARE_DAYS - totalDays),
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
