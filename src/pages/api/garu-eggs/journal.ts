import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Egg Journal API
 *
 * POST: Add a journal entry to an in-progress egg
 * GET: Get journal entries for an egg
 */

const ENTRY_TYPES = ['reflection', 'dream', 'observation', 'practice', 'breakthrough', 'question'];

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const eggNumber = url.searchParams.get('egg');

    if (!wallet || !eggNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet and egg number required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    const progress = await sql`
      SELECT ep.*, ge.name, ge.question, ge.hatching_duration_days
      FROM egg_progress ep
      JOIN garu_eggs ge ON ep.egg_id = ge.id
      WHERE ep.user_wallet = ${wallet}
      AND ge.egg_number = ${parseInt(eggNumber)}
    `;

    if (progress.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No progress found for this egg',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const p = progress[0];
    const startDate = new Date(p.started_at);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, p.hatching_duration_days - daysPassed);

    return new Response(JSON.stringify({
      success: true,
      eggName: p.name,
      question: p.question,
      phase: p.phase,
      startedAt: p.started_at,
      completedAt: p.completed_at,
      daysPassed,
      daysRemaining,
      journalEntries: p.journal_entries || [],
      totalEntries: (p.journal_entries || []).length,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Journal GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, eggNumber, entry, entryType = 'reflection' } = body;

    if (!walletAddress || eggNumber === undefined || !entry) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet, egg number, and entry content required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!ENTRY_TYPES.includes(entryType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Entry type must be one of: ${ENTRY_TYPES.join(', ')}`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get current progress
    const progress = await sql`
      SELECT ep.*, ge.hatching_duration_days, ge.name
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
        error: 'This egg journey is already complete',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Create new journal entry
    const journalEntry = {
      id: Date.now(),
      type: entryType,
      content: entry,
      createdAt: new Date().toISOString(),
    };

    // Calculate current phase based on day and entry count
    const startDate = new Date(p.started_at);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentEntries = p.journal_entries || [];

    let newPhase = p.phase;
    const totalEntries = currentEntries.length + 1;

    // Phase progression:
    // contemplation (days 1-7, 0+ entries)
    // practice (days 8-21, 5+ entries)
    // integration (days 22-30, 15+ entries)
    // ready_for_completion (day 30+, 20+ entries)

    if (daysPassed >= 22 && totalEntries >= 15) {
      newPhase = 'integration';
    } else if (daysPassed >= 8 && totalEntries >= 5) {
      newPhase = 'practice';
    }

    // Can submit answer after day 25 with 18+ entries
    const canSubmitAnswer = daysPassed >= 25 && totalEntries >= 18;

    // Update progress with new entry
    await sql`
      UPDATE egg_progress
      SET
        journal_entries = journal_entries || ${JSON.stringify([journalEntry])}::jsonb,
        phase = ${newPhase}
      WHERE id = ${p.id}
    `;

    // Generate encouragement based on progress
    let encouragement = '';
    if (totalEntries === 1) {
      encouragement = 'Your first entry! The journey of contemplation has begun.';
    } else if (totalEntries === 5) {
      encouragement = 'Five entries! You\'re building momentum. Notice patterns emerging.';
    } else if (totalEntries === 10) {
      encouragement = 'Ten entries! You\'re halfway to the minimum for completion.';
    } else if (totalEntries === 18) {
      encouragement = 'Eighteen entries! You may now submit your final answer when ready.';
    } else if (daysPassed >= 21) {
      encouragement = `Week three of your ${p.name} journey. Begin synthesizing your insights.`;
    } else if (daysPassed >= 14) {
      encouragement = 'Two weeks of contemplation. Your understanding is deepening.';
    } else if (daysPassed >= 7) {
      encouragement = 'One week in. Keep asking yourself the question daily.';
    } else {
      encouragement = 'Keep contemplating. Each entry brings you closer to understanding.';
    }

    // Log wellness activity
    await sql`
      INSERT INTO wellness_activities (
        user_wallet,
        activity_type,
        element,
        duration_minutes,
        notes,
        egg_id
      ) VALUES (
        ${walletAddress},
        'journaling',
        'ether',
        15,
        ${`Journal entry for ${p.name}`},
        ${p.egg_id}
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Journal entry added',
      totalEntries,
      phase: newPhase,
      phaseChanged: newPhase !== p.phase,
      daysPassed,
      daysRemaining: Math.max(0, p.hatching_duration_days - daysPassed),
      canSubmitAnswer,
      encouragement,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Journal POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
