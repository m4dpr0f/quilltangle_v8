import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Eggs API
 *
 * GET: List all eggs with user progress
 * POST: Start contemplating an egg
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const tier = url.searchParams.get('tier'); // foundational, dual, triple, quad, quint, ultimate
    const element = url.searchParams.get('element'); // Filter by element

    const sql = getDb();

    // Get all eggs
    let eggs;
    if (tier) {
      eggs = await sql`
        SELECT * FROM garu_eggs WHERE tier = ${tier} ORDER BY egg_number
      `;
    } else if (element) {
      eggs = await sql`
        SELECT * FROM garu_eggs WHERE ${element} = ANY(elements) ORDER BY egg_number
      `;
    } else {
      eggs = await sql`
        SELECT * FROM garu_eggs ORDER BY egg_number
      `;
    }

    // Get user progress if wallet provided
    let userProgress: Record<number, any> = {};
    if (wallet) {
      const progress = await sql`
        SELECT ep.*, ge.egg_number
        FROM egg_progress ep
        JOIN garu_eggs ge ON ep.egg_id = ge.id
        WHERE ep.user_wallet = ${wallet}
      `;
      progress.forEach((p: any) => {
        userProgress[p.egg_number] = {
          phase: p.phase,
          startedAt: p.started_at,
          journalEntries: p.journal_entries?.length || 0,
          completedAt: p.completed_at,
          verifiedBy: p.verified_by,
        };
      });
    }

    // Calculate days remaining for in-progress eggs
    const eggsWithProgress = eggs.map((egg: any) => {
      const progress = userProgress[egg.egg_number];
      let daysRemaining = null;

      if (progress && !progress.completedAt) {
        const startDate = new Date(progress.startedAt);
        const today = new Date();
        const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, egg.hatching_duration_days - daysPassed);
      }

      return {
        id: egg.id,
        number: egg.egg_number,
        name: egg.name,
        elements: egg.elements,
        die: egg.die,
        question: egg.question,
        hatchingMethod: egg.hatching_method,
        hatchingDays: egg.hatching_duration_days,
        wellnessBenefits: egg.wellness_benefits,
        prerequisites: egg.prerequisites || [],
        tier: egg.tier,
        userProgress: progress ? {
          ...progress,
          daysRemaining,
        } : null,
      };
    });

    // Group by tier for easier frontend rendering
    const eggsByTier = {
      foundational: eggsWithProgress.filter((e: any) => e.tier === 'foundational'),
      dual: eggsWithProgress.filter((e: any) => e.tier === 'dual'),
      triple: eggsWithProgress.filter((e: any) => e.tier === 'triple'),
      quad: eggsWithProgress.filter((e: any) => e.tier === 'quad'),
      quint: eggsWithProgress.filter((e: any) => e.tier === 'quint'),
      ultimate: eggsWithProgress.filter((e: any) => e.tier === 'ultimate'),
    };

    // Calculate stats
    const completedCount = Object.values(userProgress).filter((p: any) => p.completedAt).length;
    const inProgressCount = Object.values(userProgress).filter((p: any) => !p.completedAt).length;

    return new Response(JSON.stringify({
      success: true,
      eggs: eggsWithProgress,
      eggsByTier,
      stats: {
        total: eggs.length,
        completed: completedCount,
        inProgress: inProgressCount,
        available: eggs.length - completedCount - inProgressCount,
      },
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu eggs GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST: Start contemplating an egg
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, eggNumber } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (eggNumber === undefined || eggNumber === null) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Egg number required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get the egg
    const eggResult = await sql`
      SELECT * FROM garu_eggs WHERE egg_number = ${eggNumber}
    `;

    if (eggResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Egg not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const egg = eggResult[0];

    // Check prerequisites
    if (egg.prerequisites && egg.prerequisites.length > 0) {
      const completedPrereqs = await sql`
        SELECT ge.egg_number FROM egg_progress ep
        JOIN garu_eggs ge ON ep.egg_id = ge.id
        WHERE ep.user_wallet = ${walletAddress}
        AND ep.completed_at IS NOT NULL
        AND ge.egg_number = ANY(${egg.prerequisites})
      `;

      if (completedPrereqs.length < egg.prerequisites.length) {
        const missing = egg.prerequisites.filter(
          (p: number) => !completedPrereqs.some((c: any) => c.egg_number === p)
        );
        return new Response(JSON.stringify({
          success: false,
          error: `Complete these eggs first: ${missing.join(', ')}`,
          missingPrerequisites: missing,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Check if already in progress or completed
    const existing = await sql`
      SELECT * FROM egg_progress
      WHERE user_wallet = ${walletAddress} AND egg_id = ${egg.id}
    `;

    if (existing.length > 0) {
      const progress = existing[0];
      if (progress.completed_at) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You have already completed this egg',
          existingProgress: progress,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      // Already in progress - return existing
      return new Response(JSON.stringify({
        success: true,
        message: 'Egg journey already in progress',
        egg: {
          number: egg.egg_number,
          name: egg.name,
          question: egg.question,
          hatchingMethod: egg.hatching_method,
          hatchingDays: egg.hatching_duration_days,
        },
        progress: {
          phase: progress.phase,
          startedAt: progress.started_at,
          journalEntries: progress.journal_entries?.length || 0,
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Check max concurrent eggs (limit to 3)
    const activeEggs = await sql`
      SELECT COUNT(*) as count FROM egg_progress
      WHERE user_wallet = ${walletAddress} AND completed_at IS NULL
    `;

    if (parseInt(activeEggs[0].count) >= 3) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Maximum 3 eggs can be in progress at once. Complete an egg first.',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Start the egg journey
    await sql`
      INSERT INTO egg_progress (
        user_wallet,
        egg_id,
        phase,
        journal_entries,
        started_at
      ) VALUES (
        ${walletAddress},
        ${egg.id},
        'contemplation',
        '[]'::jsonb,
        NOW()
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: `Your ${egg.name} journey begins. Contemplate for ${egg.hatching_duration_days} days.`,
      egg: {
        number: egg.egg_number,
        name: egg.name,
        elements: egg.elements,
        die: egg.die,
        question: egg.question,
        hatchingMethod: egg.hatching_method,
        hatchingDays: egg.hatching_duration_days,
        wellnessBenefits: egg.wellness_benefits,
      },
      nextSteps: [
        'Read the question daily',
        'Begin journaling your thoughts',
        'Practice your sacred instrument',
        `Complete the hatching method: ${egg.hatching_method}`,
      ],
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu eggs POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
