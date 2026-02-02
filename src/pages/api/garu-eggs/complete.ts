import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Egg Completion API
 *
 * POST: Submit final answer for verification
 * PUT: Elder verification of an answer (admin only)
 */

const MIN_ANSWER_LENGTH = 200;
const MIN_DAYS = 25;
const MIN_JOURNAL_ENTRIES = 18;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, eggNumber, answer } = body;

    if (!walletAddress || eggNumber === undefined || !answer) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet, egg number, and answer required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (answer.length < MIN_ANSWER_LENGTH) {
      return new Response(JSON.stringify({
        success: false,
        error: `Answer must be at least ${MIN_ANSWER_LENGTH} characters. Share your full understanding.`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get progress
    const progress = await sql`
      SELECT ep.*, ge.name, ge.hatching_duration_days, ge.elements
      FROM egg_progress ep
      JOIN garu_eggs ge ON ep.egg_id = ge.id
      WHERE ep.user_wallet = ${walletAddress}
      AND ge.egg_number = ${eggNumber}
    `;

    if (progress.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have not started this egg journey',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const p = progress[0];

    if (p.completed_at) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This egg has already been completed',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check minimum requirements
    const startDate = new Date(p.started_at);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const journalCount = (p.journal_entries || []).length;

    const errors = [];
    if (daysPassed < MIN_DAYS) {
      errors.push(`Wait ${MIN_DAYS - daysPassed} more days (minimum ${MIN_DAYS} days required)`);
    }
    if (journalCount < MIN_JOURNAL_ENTRIES) {
      errors.push(`Add ${MIN_JOURNAL_ENTRIES - journalCount} more journal entries (minimum ${MIN_JOURNAL_ENTRIES} required)`);
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not ready for completion',
        requirements: errors,
        progress: { daysPassed, journalCount },
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Submit for verification
    await sql`
      UPDATE egg_progress
      SET
        answer_text = ${answer},
        phase = 'pending_verification'
      WHERE id = ${p.id}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Your answer has been submitted for elder verification',
      status: 'pending_verification',
      eggName: p.name,
      elements: p.elements,
      journeyDays: daysPassed,
      journalEntries: journalCount,
      answerLength: answer.length,
      estimatedReviewTime: '3-5 days',
      nextSteps: [
        'Your answer will be reviewed by nation elders',
        'Continue your wellness practices while waiting',
        'Consider starting another egg journey',
      ],
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Egg completion POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// PUT: Elder verification (requires admin/elder status)
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { elderWallet, progressId, action, feedback } = body;

    if (!elderWallet || !progressId || !action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Elder wallet, progress ID, and action required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Verify elder has completed this egg themselves (or is admin)
    const elderProfile = await sql`
      SELECT * FROM tek8_profiles WHERE user_wallet = ${elderWallet}
    `;

    // Get the progress being verified
    const progress = await sql`
      SELECT ep.*, ge.egg_number, ge.name, ge.elements
      FROM egg_progress ep
      JOIN garu_eggs ge ON ep.egg_id = ge.id
      WHERE ep.id = ${progressId}
    `;

    if (progress.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Progress not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const p = progress[0];

    if (p.phase !== 'pending_verification') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This egg is not pending verification',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if elder has completed this egg
    const elderCompletion = await sql`
      SELECT * FROM egg_progress ep
      JOIN garu_eggs ge ON ep.egg_id = ge.id
      WHERE ep.user_wallet = ${elderWallet}
      AND ge.egg_number = ${p.egg_number}
      AND ep.completed_at IS NOT NULL
    `;

    const isElder = elderCompletion.length > 0;

    // TODO: Also check for admin status from ADMIN_WALLETS env
    if (!isElder) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You must complete this egg yourself before verifying others',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'approve') {
      // Mark as completed
      await sql`
        UPDATE egg_progress
        SET
          phase = 'complete',
          completed_at = NOW(),
          verified_by = ${elderWallet},
          verification_notes = ${feedback || 'Approved by elder'}
        WHERE id = ${progressId}
      `;

      // Update user's TEK8 profile - increase elemental affinity
      // Each completed egg adds +5° to associated elements (capped at adjusting 360° total)
      const elements = p.elements || [];
      if (elements.length > 0 && elderProfile.length > 0) {
        const profile = elderProfile[0];
        const distribution = profile.element_distribution || {};

        // Small boost to associated elements for completing egg
        // (This could be expanded to actually modify the distribution)
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Egg completion verified!',
        status: 'complete',
        eggName: p.name,
        playerWallet: p.user_wallet.slice(0, 8) + '...',
        verifiedBy: elderWallet.slice(0, 8) + '...',
        newUnlocks: `Player can now claim ${p.elements[0]}-aligned roads and mentor others on this egg`,
      }), { headers: { 'Content-Type': 'application/json' } });

    } else if (action === 'request_revision') {
      // Send back for more work
      await sql`
        UPDATE egg_progress
        SET
          phase = 'integration',
          verification_notes = COALESCE(verification_notes, '') || ${'\n[Revision requested] ' + (feedback || 'Please deepen your understanding')}
        WHERE id = ${progressId}
      `;

      return new Response(JSON.stringify({
        success: true,
        message: 'Revision requested',
        feedback: feedback || 'Please deepen your understanding and resubmit',
      }), { headers: { 'Content-Type': 'application/json' } });

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid action. Use "approve" or "request_revision"',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error('Egg verification PUT error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET: List eggs pending verification (for elders)
export const GET: APIRoute = async ({ url }) => {
  try {
    const elderWallet = url.searchParams.get('elder');

    if (!elderWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Elder wallet required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get eggs the elder has completed (can verify those)
    const elderCompletions = await sql`
      SELECT ge.egg_number FROM egg_progress ep
      JOIN garu_eggs ge ON ep.egg_id = ge.id
      WHERE ep.user_wallet = ${elderWallet}
      AND ep.completed_at IS NOT NULL
    `;

    const completedEggs = elderCompletions.map((e: any) => e.egg_number);

    if (completedEggs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        canVerify: [],
        pending: [],
        message: 'Complete eggs to become an elder and verify others',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Get pending verifications for eggs the elder can verify
    const pending = await sql`
      SELECT
        ep.id as progress_id,
        ep.user_wallet,
        ep.started_at,
        ep.answer_text,
        ep.journal_entries,
        ge.egg_number,
        ge.name,
        ge.question,
        ge.elements
      FROM egg_progress ep
      JOIN garu_eggs ge ON ep.egg_id = ge.id
      WHERE ep.phase = 'pending_verification'
      AND ge.egg_number = ANY(${completedEggs})
      AND ep.user_wallet != ${elderWallet}
      ORDER BY ep.started_at ASC
    `;

    return new Response(JSON.stringify({
      success: true,
      canVerify: completedEggs,
      pending: pending.map((p: any) => ({
        progressId: p.progress_id,
        playerWallet: p.user_wallet.slice(0, 8) + '...',
        eggNumber: p.egg_number,
        eggName: p.name,
        question: p.question,
        elements: p.elements,
        journalCount: (p.journal_entries || []).length,
        answerPreview: p.answer_text?.slice(0, 200) + '...',
        startedAt: p.started_at,
      })),
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Pending verifications GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
