import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Daily Care API
 *
 * POST: Log wellness care for a Garu
 * GET: Get today's care status and streak
 *
 * The 8 wellness dimensions:
 * - physical: Exercise, nutrition, sleep
 * - emotional: Journal feelings, process emotions
 * - intellectual: Learn something new
 * - social: Connect with others
 * - occupational: Work on meaningful projects
 * - spiritual: Meditation, reflection
 * - environmental: Care for space, nature
 * - financial: Track spending, plan resources
 */

const WELLNESS_DIMENSIONS = [
  'physical', 'emotional', 'intellectual', 'social',
  'occupational', 'spiritual', 'environmental', 'financial'
];

// Element boosts from each wellness dimension
const DIMENSION_ELEMENT_MAP: Record<string, string[]> = {
  physical: ['earth', 'fire'],
  emotional: ['water', 'ether'],
  intellectual: ['air', 'order'],
  social: ['coin', 'water'],
  occupational: ['fire', 'order'],
  spiritual: ['ether', 'chaos'],
  environmental: ['earth', 'air'],
  financial: ['coin', 'order'],
};

// XP rewards
const XP_PER_DIMENSION = 10;
const XP_BONUS_ALL_EIGHT = 50;
const BOND_INCREASE_PER_CARE = 1;
const STAT_INCREASE_CHANCE = 0.3; // 30% chance to increase stat

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const garuId = url.searchParams.get('garuId');

    if (!wallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get player's active Garu
    let garu;
    if (garuId) {
      const result = await sql`
        SELECT * FROM garu
        WHERE id = ${garuId} AND owner_wallet = ${wallet}
        AND phase IN ('egg', 'hatched')
      `;
      garu = result[0];
    } else {
      const result = await sql`
        SELECT * FROM garu
        WHERE owner_wallet = ${wallet}
        AND phase IN ('egg', 'hatched')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      garu = result[0];
    }

    if (!garu) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No active Garu found. Claim an egg first!',
        hasGaru: false,
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Get today's care log
    const todayCare = await sql`
      SELECT * FROM garu_care_logs
      WHERE garu_id = ${garu.id}
      AND care_date = CURRENT_DATE
    `;

    // Get streak info
    const streakInfo = await sql`
      SELECT
        COUNT(*) as total_days,
        MAX(care_date) as last_care,
        SUM(dimensions_completed) as total_dimensions
      FROM garu_care_logs
      WHERE garu_id = ${garu.id}
    `;

    // Calculate current streak
    let currentStreak = 0;
    const recentCare = await sql`
      SELECT care_date, dimensions_completed FROM garu_care_logs
      WHERE garu_id = ${garu.id}
      ORDER BY care_date DESC
      LIMIT 30
    `;

    // Count consecutive days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < recentCare.length; i++) {
      const careDate = new Date(recentCare[i].care_date);
      careDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (careDate.getTime() === expectedDate.getTime() && recentCare[i].dimensions_completed >= 4) {
        currentStreak++;
      } else if (i === 0 && careDate.getTime() < expectedDate.getTime()) {
        // Haven't cared today yet, check from yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (careDate.getTime() === yesterday.getTime() && recentCare[i].dimensions_completed >= 4) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Calculate wellness "petals" status
    const careToday = todayCare[0] || {};
    const petals = WELLNESS_DIMENSIONS.map(dim => ({
      dimension: dim,
      completed: careToday[dim] || false,
      notes: careToday[`${dim}_notes`] || null,
    }));

    const completedToday = petals.filter(p => p.completed).length;

    return new Response(JSON.stringify({
      success: true,
      garu: {
        id: garu.id,
        name: garu.name,
        phase: garu.phase,
        level: garu.level,
        primaryElement: garu.primary_element,
        riderBond: garu.rider_bond,
        stats: {
          fire: garu.stat_fire,
          earth: garu.stat_earth,
          air: garu.stat_air,
          water: garu.stat_water,
          ether: garu.stat_ether,
          chaos: garu.stat_chaos,
          order: garu.stat_order,
          coin: garu.stat_coin,
        },
      },
      todaysCare: {
        petals,
        completedCount: completedToday,
        allComplete: completedToday === 8,
        instrumentPracticed: careToday.instrument_practiced || false,
        instrumentMinutes: careToday.instrument_minutes || 0,
      },
      streak: {
        current: currentStreak,
        totalDays: parseInt(streakInfo[0]?.total_days || 0),
        totalDimensions: parseInt(streakInfo[0]?.total_dimensions || 0),
      },
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu care GET error:', error);
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
      garuId,
      dimension,  // Which wellness dimension
      notes,      // Optional notes about the activity
      instrumentPracticed,
      instrumentMinutes,
      instrumentName,
    } = body;

    if (!walletAddress || !garuId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet and Garu ID required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (dimension && !WELLNESS_DIMENSIONS.includes(dimension)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid dimension. Must be one of: ${WELLNESS_DIMENSIONS.join(', ')}`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Verify Garu ownership
    const garuResult = await sql`
      SELECT * FROM garu
      WHERE id = ${garuId} AND owner_wallet = ${walletAddress}
      AND phase IN ('egg', 'hatched')
    `;

    if (garuResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Garu not found or not owned by you',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const garu = garuResult[0];

    // Get or create today's care log
    let careLog = await sql`
      SELECT * FROM garu_care_logs
      WHERE garu_id = ${garuId} AND care_date = CURRENT_DATE
    `;

    if (careLog.length === 0) {
      // Create new care log for today
      await sql`
        INSERT INTO garu_care_logs (garu_id, user_wallet, care_date)
        VALUES (${garuId}, ${walletAddress}, CURRENT_DATE)
      `;
      careLog = await sql`
        SELECT * FROM garu_care_logs
        WHERE garu_id = ${garuId} AND care_date = CURRENT_DATE
      `;
    }

    const log = careLog[0];
    let xpGained = 0;
    let bondIncrease = 0;
    let statsIncreased: string[] = [];
    let message = '';

    // Handle dimension care
    if (dimension && !log[dimension]) {
      // Mark dimension as complete
      const notesColumn = `${dimension}_notes`;

      await sql`
        UPDATE garu_care_logs
        SET
          ${sql(dimension)} = true,
          ${sql(notesColumn)} = ${notes || null},
          dimensions_completed = dimensions_completed + 1,
          updated_at = NOW()
        WHERE id = ${log.id}
      `;

      xpGained += XP_PER_DIMENSION;
      bondIncrease += BOND_INCREASE_PER_CARE;

      // Chance to increase associated stats
      const associatedElements = DIMENSION_ELEMENT_MAP[dimension] || [];
      for (const element of associatedElements) {
        if (Math.random() < STAT_INCREASE_CHANCE) {
          const statColumn = `stat_${element}`;
          await sql`
            UPDATE garu
            SET ${sql(statColumn)} = LEAST(${sql(statColumn)} + 1, 100)
            WHERE id = ${garuId}
          `;
          statsIncreased.push(element);
        }
      }

      message = `${dimension.charAt(0).toUpperCase() + dimension.slice(1)} care logged!`;

      // Check if all 8 are now complete
      const updatedLog = await sql`
        SELECT dimensions_completed FROM garu_care_logs
        WHERE id = ${log.id}
      `;

      if (updatedLog[0].dimensions_completed === 8) {
        xpGained += XP_BONUS_ALL_EIGHT;
        bondIncrease += 5;
        message = '🌟 All 8 dimensions complete! Bonus XP earned!';
      }
    } else if (dimension && log[dimension]) {
      return new Response(JSON.stringify({
        success: false,
        error: `${dimension} already completed today`,
        alreadyComplete: true,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Handle instrument practice
    if (instrumentPracticed && instrumentMinutes > 0) {
      await sql`
        UPDATE garu_care_logs
        SET
          instrument_practiced = true,
          instrument_name = ${instrumentName || null},
          instrument_minutes = instrument_minutes + ${instrumentMinutes}
        WHERE id = ${log.id}
      `;

      // Instrument practice boosts ether
      xpGained += Math.min(instrumentMinutes, 30); // Cap at 30 XP
      if (Math.random() < 0.5) {
        await sql`
          UPDATE garu SET stat_ether = LEAST(stat_ether + 1, 100) WHERE id = ${garuId}
        `;
        statsIncreased.push('ether');
      }

      if (!message) message = `🎵 ${instrumentMinutes} minutes of practice logged!`;
    }

    // Apply XP and bond to Garu
    if (xpGained > 0 || bondIncrease > 0) {
      const newXp = garu.experience + xpGained;
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      const leveledUp = newLevel > garu.level;

      await sql`
        UPDATE garu
        SET
          experience = ${newXp},
          level = ${newLevel},
          rider_bond = LEAST(rider_bond + ${bondIncrease}, 100),
          care_streak = CASE
            WHEN last_care_date = CURRENT_DATE - 1 OR last_care_date IS NULL
            THEN care_streak + 1
            WHEN last_care_date = CURRENT_DATE
            THEN care_streak
            ELSE 1
          END,
          total_care_days = total_care_days + CASE
            WHEN last_care_date != CURRENT_DATE OR last_care_date IS NULL
            THEN 1 ELSE 0
          END,
          last_care_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE id = ${garuId}
      `;

      if (leveledUp) {
        message += ` 🎉 Level up! Now level ${newLevel}!`;
      }
    }

    // Get updated Garu state
    const updatedGaru = await sql`SELECT * FROM garu WHERE id = ${garuId}`;
    const updatedLog = await sql`
      SELECT * FROM garu_care_logs WHERE garu_id = ${garuId} AND care_date = CURRENT_DATE
    `;

    return new Response(JSON.stringify({
      success: true,
      message,
      xpGained,
      bondIncrease,
      statsIncreased,
      garu: {
        id: updatedGaru[0].id,
        name: updatedGaru[0].name,
        level: updatedGaru[0].level,
        experience: updatedGaru[0].experience,
        riderBond: updatedGaru[0].rider_bond,
        careStreak: updatedGaru[0].care_streak,
      },
      todaysCare: {
        completedCount: updatedLog[0].dimensions_completed,
        allComplete: updatedLog[0].dimensions_completed === 8,
      },
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu care POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
