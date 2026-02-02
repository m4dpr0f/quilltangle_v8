import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Memory API
 *
 * Memory Tracks and Writings act as "save points" for Garu.
 * Players can record musical tracks and journal entries during their Garu's life.
 * These memories can later be used to resurrect perished Garu.
 *
 * POST: Create a memory (track or writing)
 * GET: Get memories for a Garu
 */

// Memory types
const MEMORY_TYPES = ['track', 'writing', 'milestone'] as const;

// Milestone events that auto-create memories
const MILESTONE_EVENTS = [
  'hatching',
  'first_race_won',
  'level_10',
  'level_25',
  'level_50',
  'first_fusion',
  'composite_achieved',
  'territory_mastery',
];

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const garuId = url.searchParams.get('garuId');
    const includeDeceased = url.searchParams.get('includeDeceased') === 'true';

    if (!wallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    let memories;
    if (garuId) {
      // Get memories for specific Garu
      memories = await sql`
        SELECT * FROM garu_memories
        WHERE garu_id = ${garuId}
        AND owner_wallet = ${wallet}
        ORDER BY created_at DESC
      `;
    } else {
      // Get all memories for wallet, optionally filtering to deceased Garu only
      if (includeDeceased) {
        memories = await sql`
          SELECT m.*, g.name as garu_name, g.phase, g.primary_element
          FROM garu_memories m
          JOIN garu g ON m.garu_id = g.id
          WHERE m.owner_wallet = ${wallet}
          AND g.phase = 'dead'
          ORDER BY m.created_at DESC
        `;
      } else {
        memories = await sql`
          SELECT m.*, g.name as garu_name, g.phase, g.primary_element
          FROM garu_memories m
          JOIN garu g ON m.garu_id = g.id
          WHERE m.owner_wallet = ${wallet}
          ORDER BY m.created_at DESC
        `;
      }
    }

    // Group by type
    const tracks = memories.filter((m: any) => m.memory_type === 'track');
    const writings = memories.filter((m: any) => m.memory_type === 'writing');
    const milestones = memories.filter((m: any) => m.memory_type === 'milestone');

    return new Response(JSON.stringify({
      success: true,
      memories: memories.map((m: any) => ({
        id: m.id,
        garuId: m.garu_id,
        garuName: m.garu_name,
        type: m.memory_type,
        title: m.title,
        description: m.description,
        content: m.content,
        audioUrl: m.audio_url,
        snapshotLevel: m.snapshot_level,
        snapshotStats: m.snapshot_stats,
        snapshotBond: m.snapshot_bond,
        createdAt: m.created_at,
        element: m.primary_element,
        phase: m.phase,
      })),
      byType: {
        tracks: tracks.length,
        writings: writings.length,
        milestones: milestones.length,
      },
      total: memories.length,
    }), { headers: { 'Content-Type': 'application/json' } });

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
      garuId,
      memoryType, // 'track' | 'writing' | 'milestone'
      title,
      description,
      content, // For writings
      audioUrl, // For tracks (IPFS or similar)
      milestoneEvent, // For auto-milestones
    } = body;

    if (!walletAddress || !garuId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet and Garu ID required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!MEMORY_TYPES.includes(memoryType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid memory type. Must be: track, writing, or milestone',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Verify ownership and get current Garu state for snapshot
    const garuResult = await sql`
      SELECT * FROM garu
      WHERE id = ${garuId}
      AND owner_wallet = ${walletAddress}
    `;

    if (garuResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Garu not found or not owned by you',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const garu = garuResult[0];

    // Can't create new memories for dead Garu (they're already gone)
    if (garu.phase === 'dead') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot create new memories for a perished Garu',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Create snapshot of current state
    const snapshot = {
      level: garu.level,
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
      bond: garu.bond_level || garu.rider_bond,
      experience: garu.xp || garu.experience,
      phase: garu.phase,
      generation: garu.generation,
    };

    // Validate based on type
    if (memoryType === 'track' && !audioUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Audio URL required for track memories',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (memoryType === 'writing' && !content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content required for writing memories',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check for duplicate milestones
    if (memoryType === 'milestone' && milestoneEvent) {
      const existing = await sql`
        SELECT id FROM garu_memories
        WHERE garu_id = ${garuId}
        AND memory_type = 'milestone'
        AND milestone_event = ${milestoneEvent}
      `;
      if (existing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'This milestone has already been recorded',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Create the memory
    const memory = await sql`
      INSERT INTO garu_memories (
        garu_id,
        owner_wallet,
        memory_type,
        title,
        description,
        content,
        audio_url,
        milestone_event,
        snapshot_level,
        snapshot_stats,
        snapshot_bond,
        snapshot_experience,
        snapshot_phase,
        snapshot_generation
      ) VALUES (
        ${garuId},
        ${walletAddress},
        ${memoryType},
        ${title || `${memoryType} - ${new Date().toLocaleDateString()}`},
        ${description || null},
        ${content || null},
        ${audioUrl || null},
        ${milestoneEvent || null},
        ${snapshot.level},
        ${JSON.stringify(snapshot.stats)},
        ${snapshot.bond},
        ${snapshot.experience},
        ${snapshot.phase},
        ${snapshot.generation}
      )
      RETURNING *
    `;

    // Update Garu's memory count
    await sql`
      UPDATE garu
      SET
        memory_count = COALESCE(memory_count, 0) + 1,
        last_memory_at = NOW(),
        updated_at = NOW()
      WHERE id = ${garuId}
    `;

    const typeLabels = {
      track: 'Musical Memory',
      writing: 'Written Memory',
      milestone: 'Milestone Memory',
    };

    return new Response(JSON.stringify({
      success: true,
      message: `${typeLabels[memoryType as keyof typeof typeLabels]} created for ${garu.name}`,
      memory: {
        id: memory[0].id,
        type: memoryType,
        title: memory[0].title,
        snapshotLevel: snapshot.level,
        snapshotBond: snapshot.bond,
      },
      hint: memoryType === 'track'
        ? 'This musical track can be used to resurrect your Garu if they ever perish.'
        : memoryType === 'writing'
        ? 'This journal entry preserves a piece of your journey together.'
        : 'Milestone achieved! This moment is forever preserved.',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Memory creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
