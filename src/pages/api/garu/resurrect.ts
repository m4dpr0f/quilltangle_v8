import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Resurrection API
 *
 * Allows players to resurrect perished Garu using:
 * 1. A descendant Garu (from their legacy eggs)
 * 2. Musical tracks recorded during the Garu's life
 * 3. Written memories/journals
 *
 * The resurrection restores the Garu to the state captured in the memory.
 * The descendant used in the ritual gains a special "Ancestor Bond".
 *
 * GET: Check resurrection requirements for a perished Garu
 * POST: Perform the resurrection ritual
 */

// Minimum requirements for resurrection
const MIN_MEMORIES_REQUIRED = 1;
const MIN_TRACKS_FOR_FULL_RESTORE = 3;
const RESURRECTION_COOLDOWN_DAYS = 7;

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const deceasedGaruId = url.searchParams.get('garuId');

    if (!wallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // If specific Garu requested, check its resurrection status
    if (deceasedGaruId) {
      const deceased = await sql`
        SELECT * FROM garu
        WHERE id = ${deceasedGaruId}
        AND owner_wallet = ${wallet}
        AND phase = 'dead'
      `;

      if (deceased.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Deceased Garu not found',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      const garu = deceased[0];

      // Get memories for this Garu
      const memories = await sql`
        SELECT * FROM garu_memories
        WHERE garu_id = ${deceasedGaruId}
        ORDER BY snapshot_level DESC
      `;

      const tracks = memories.filter((m: any) => m.memory_type === 'track');
      const writings = memories.filter((m: any) => m.memory_type === 'writing');
      const milestones = memories.filter((m: any) => m.memory_type === 'milestone');

      // Find descendants (Garu born from eggs this one spawned)
      const descendants = await sql`
        SELECT g.* FROM garu g
        JOIN garu_eggs_wild e ON g.from_egg_id = e.id
        WHERE e.parent_garu_id = ${deceasedGaruId}
        AND g.owner_wallet = ${wallet}
        AND g.phase IN ('egg', 'hatching', 'hatched')
      `;

      // Check resurrection history
      const previousResurrections = await sql`
        SELECT * FROM garu_resurrections
        WHERE original_garu_id = ${deceasedGaruId}
        ORDER BY resurrected_at DESC
      `;

      const lastResurrection = previousResurrections[0];
      const cooldownActive = lastResurrection &&
        new Date(lastResurrection.resurrected_at).getTime() > Date.now() - (RESURRECTION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

      // Calculate restoration quality based on memories
      let restorationQuality = 'partial';
      if (tracks.length >= MIN_TRACKS_FOR_FULL_RESTORE && writings.length >= 1) {
        restorationQuality = 'full';
      } else if (tracks.length >= 1 || writings.length >= 2) {
        restorationQuality = 'substantial';
      }

      // Best memory to use for restoration
      const bestMemory = memories.length > 0
        ? memories.reduce((best: any, m: any) =>
            (m.snapshot_level > best.snapshot_level) ? m : best
          )
        : null;

      const canResurrect = memories.length >= MIN_MEMORIES_REQUIRED &&
                          descendants.length > 0 &&
                          !cooldownActive;

      return new Response(JSON.stringify({
        success: true,
        garu: {
          id: garu.id,
          name: garu.name,
          level: garu.level,
          generation: garu.generation,
          primaryElement: garu.primary_element,
          diedAt: garu.died_at,
          deathLocation: garu.death_location,
        },
        requirements: {
          memories: {
            required: MIN_MEMORIES_REQUIRED,
            have: memories.length,
            met: memories.length >= MIN_MEMORIES_REQUIRED,
          },
          descendant: {
            required: 1,
            have: descendants.length,
            met: descendants.length > 0,
          },
          cooldown: {
            active: cooldownActive,
            endsAt: lastResurrection
              ? new Date(new Date(lastResurrection.resurrected_at).getTime() + RESURRECTION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
              : null,
          },
        },
        canResurrect,
        restorationQuality,
        memories: {
          tracks: tracks.map((t: any) => ({
            id: t.id,
            title: t.title,
            level: t.snapshot_level,
            bond: t.snapshot_bond,
          })),
          writings: writings.map((w: any) => ({
            id: w.id,
            title: w.title,
            level: w.snapshot_level,
          })),
          milestones: milestones.map((m: any) => ({
            id: m.id,
            event: m.milestone_event,
            level: m.snapshot_level,
          })),
        },
        bestMemory: bestMemory ? {
          id: bestMemory.id,
          type: bestMemory.memory_type,
          title: bestMemory.title,
          level: bestMemory.snapshot_level,
          bond: bestMemory.snapshot_bond,
        } : null,
        descendants: descendants.map((d: any) => ({
          id: d.id,
          name: d.name,
          level: d.level,
          phase: d.phase,
          element: d.primary_element,
        })),
        previousResurrections: previousResurrections.length,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Get all resurrectable Garu for this wallet
    const deceasedGaru = await sql`
      SELECT g.*,
        (SELECT COUNT(*) FROM garu_memories WHERE garu_id = g.id) as memory_count
      FROM garu g
      WHERE g.owner_wallet = ${wallet}
      AND g.phase = 'dead'
      ORDER BY g.died_at DESC
    `;

    const resurrectable = [];
    for (const g of deceasedGaru) {
      // Check for descendants
      const hasDescendant = await sql`
        SELECT 1 FROM garu child
        JOIN garu_eggs_wild e ON child.from_egg_id = e.id
        WHERE e.parent_garu_id = ${g.id}
        AND child.owner_wallet = ${wallet}
        AND child.phase IN ('egg', 'hatching', 'hatched')
        LIMIT 1
      `;

      if (g.memory_count >= MIN_MEMORIES_REQUIRED && hasDescendant.length > 0) {
        resurrectable.push({
          id: g.id,
          name: g.name,
          level: g.level,
          element: g.primary_element,
          generation: g.generation,
          memoryCount: g.memory_count,
          diedAt: g.died_at,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deceasedGaru: deceasedGaru.map((g: any) => ({
        id: g.id,
        name: g.name,
        level: g.level,
        element: g.primary_element,
        memoryCount: parseInt(g.memory_count),
        diedAt: g.died_at,
      })),
      resurrectable,
      hint: 'Create musical tracks and journal entries during your Garu\'s life to enable resurrection.',
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
      deceasedGaruId,
      descendantGaruId,
      memoryId, // Primary memory to use for restoration
      additionalMemoryIds, // Optional additional memories for bonus
      newName, // Optional rename
    } = body;

    if (!walletAddress || !deceasedGaruId || !descendantGaruId || !memoryId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet, deceased Garu ID, descendant ID, and memory ID required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Verify deceased Garu
    const deceased = await sql`
      SELECT * FROM garu
      WHERE id = ${deceasedGaruId}
      AND owner_wallet = ${walletAddress}
      AND phase = 'dead'
    `;

    if (deceased.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Deceased Garu not found or not owned by you',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const originalGaru = deceased[0];

    // Verify descendant (must be from this Garu's eggs)
    const descendant = await sql`
      SELECT g.* FROM garu g
      JOIN garu_eggs_wild e ON g.from_egg_id = e.id
      WHERE g.id = ${descendantGaruId}
      AND e.parent_garu_id = ${deceasedGaruId}
      AND g.owner_wallet = ${walletAddress}
      AND g.phase IN ('egg', 'hatching', 'hatched')
    `;

    if (descendant.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid descendant Garu not found. Must be born from the deceased Garu\'s eggs.',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const channelGaru = descendant[0];

    // Check cooldown
    const recentResurrection = await sql`
      SELECT * FROM garu_resurrections
      WHERE original_garu_id = ${deceasedGaruId}
      AND resurrected_at > NOW() - INTERVAL '${RESURRECTION_COOLDOWN_DAYS} days'
    `;

    if (recentResurrection.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `This Garu was recently resurrected. Please wait ${RESURRECTION_COOLDOWN_DAYS} days between resurrections.`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the primary memory
    const primaryMemory = await sql`
      SELECT * FROM garu_memories
      WHERE id = ${memoryId}
      AND garu_id = ${deceasedGaruId}
    `;

    if (primaryMemory.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Memory not found for this Garu',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const memory = primaryMemory[0];

    // Get additional memories for bonus calculation
    let additionalMemories: any[] = [];
    if (additionalMemoryIds && additionalMemoryIds.length > 0) {
      additionalMemories = await sql`
        SELECT * FROM garu_memories
        WHERE id = ANY(${additionalMemoryIds})
        AND garu_id = ${deceasedGaruId}
      `;
    }

    // Count total memories used
    const totalMemoriesUsed = 1 + additionalMemories.length;
    const trackCount = [memory, ...additionalMemories].filter(m => m.memory_type === 'track').length;
    const writingCount = [memory, ...additionalMemories].filter(m => m.memory_type === 'writing').length;

    // Calculate restoration quality and bonuses
    let levelRestoration = 0.5; // Base 50% of snapshot level
    let statRestoration = 0.5;
    let bondRestoration = 0.5;

    if (trackCount >= 3) {
      levelRestoration = 1.0; // Full level restoration with 3+ tracks
      statRestoration = 0.9;
    } else if (trackCount >= 1) {
      levelRestoration = 0.75;
      statRestoration = 0.7;
    }

    if (writingCount >= 2) {
      bondRestoration = 1.0; // Full bond restoration with 2+ writings
    } else if (writingCount >= 1) {
      bondRestoration = 0.75;
    }

    // Parse snapshot stats
    const snapshotStats = typeof memory.snapshot_stats === 'string'
      ? JSON.parse(memory.snapshot_stats)
      : memory.snapshot_stats;

    // Calculate restored values
    const restoredLevel = Math.max(1, Math.floor(memory.snapshot_level * levelRestoration));
    const restoredBond = Math.floor((memory.snapshot_bond || 50) * bondRestoration);
    const restoredStats = {
      fire: Math.floor((snapshotStats?.fire || 10) * statRestoration),
      earth: Math.floor((snapshotStats?.earth || 10) * statRestoration),
      air: Math.floor((snapshotStats?.air || 10) * statRestoration),
      water: Math.floor((snapshotStats?.water || 10) * statRestoration),
      ether: Math.floor((snapshotStats?.ether || 10) * statRestoration),
      chaos: Math.floor((snapshotStats?.chaos || 10) * statRestoration),
      order: Math.floor((snapshotStats?.order || 10) * statRestoration),
      coin: Math.floor((snapshotStats?.coin || 10) * statRestoration),
    };

    // Perform the resurrection
    const resurrectedGaru = await sql`
      UPDATE garu
      SET
        phase = 'hatched',
        name = ${newName || originalGaru.name},
        level = ${restoredLevel},
        bond_level = ${restoredBond},
        rider_bond = ${restoredBond},
        stat_fire = ${restoredStats.fire},
        stat_earth = ${restoredStats.earth},
        stat_air = ${restoredStats.air},
        stat_water = ${restoredStats.water},
        stat_ether = ${restoredStats.ether},
        stat_chaos = ${restoredStats.chaos},
        stat_order = ${restoredStats.order},
        stat_coin = ${restoredStats.coin},
        resurrection_count = COALESCE(resurrection_count, 0) + 1,
        last_resurrected_at = NOW(),
        resurrected_via_garu_id = ${descendantGaruId},
        updated_at = NOW()
      WHERE id = ${deceasedGaruId}
      RETURNING *
    `;

    // Grant "Ancestor Bond" to the channeling descendant
    await sql`
      UPDATE garu
      SET
        has_ancestor_bond = true,
        ancestor_bond_garu_id = ${deceasedGaruId},
        bond_level = LEAST(100, COALESCE(bond_level, 50) + 10),
        rider_bond = LEAST(100, COALESCE(rider_bond, 50) + 10),
        updated_at = NOW()
      WHERE id = ${descendantGaruId}
    `;

    // Record the resurrection
    await sql`
      INSERT INTO garu_resurrections (
        original_garu_id,
        original_name,
        owner_wallet,
        channel_garu_id,
        channel_garu_name,
        memory_ids_used,
        restoration_quality,
        restored_level,
        restored_bond,
        tracks_used,
        writings_used
      ) VALUES (
        ${deceasedGaruId},
        ${originalGaru.name},
        ${walletAddress},
        ${descendantGaruId},
        ${channelGaru.name},
        ${[memoryId, ...(additionalMemoryIds || [])]},
        ${levelRestoration >= 1 ? 'full' : levelRestoration >= 0.75 ? 'substantial' : 'partial'},
        ${restoredLevel},
        ${restoredBond},
        ${trackCount},
        ${writingCount}
      )
    `;

    const qualityLabel = levelRestoration >= 1 ? 'Full' : levelRestoration >= 0.75 ? 'Substantial' : 'Partial';

    return new Response(JSON.stringify({
      success: true,
      message: `${originalGaru.name} has returned from beyond!`,
      ceremony: {
        title: 'Resurrection Complete',
        description: `Through the power of music, memory, and ${channelGaru.name}'s ancestral connection, ${newName || originalGaru.name} rises again.`,
      },
      resurrectedGaru: {
        id: resurrectedGaru[0].id,
        name: resurrectedGaru[0].name,
        level: restoredLevel,
        originalLevel: memory.snapshot_level,
        bond: restoredBond,
        element: resurrectedGaru[0].primary_element,
        stats: restoredStats,
      },
      restoration: {
        quality: qualityLabel,
        levelPercent: Math.round(levelRestoration * 100),
        statPercent: Math.round(statRestoration * 100),
        bondPercent: Math.round(bondRestoration * 100),
      },
      channelGaru: {
        id: channelGaru.id,
        name: channelGaru.name,
        bonusGranted: 'Ancestor Bond (+10% bond, special connection)',
      },
      memoriesUsed: {
        total: totalMemoriesUsed,
        tracks: trackCount,
        writings: writingCount,
      },
      hint: levelRestoration < 1
        ? 'Record more musical tracks during your Garu\'s life for stronger resurrections.'
        : 'Your musical memories provided a perfect restoration!',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Resurrection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
