import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Legacy API
 *
 * View death records, legacy lineages, and historical data.
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const garuId = url.searchParams.get('garuId');
    const action = url.searchParams.get('action') || 'deaths';

    const sql = getDb();

    // Get global death records
    if (action === 'deaths') {
      let deaths;

      if (wallet) {
        // Deaths for specific wallet
        deaths = await sql`
          SELECT * FROM garu_deaths
          WHERE owner_wallet = ${wallet}
          ORDER BY died_at DESC
          LIMIT 50
        `;
      } else {
        // Recent deaths globally
        deaths = await sql`
          SELECT * FROM garu_deaths
          ORDER BY died_at DESC
          LIMIT 50
        `;
      }

      return new Response(JSON.stringify({
        success: true,
        deaths: deaths.map(d => ({
          id: d.id,
          garuName: d.garu_name,
          level: d.level_at_death,
          generation: d.generation,
          cause: d.death_cause,
          location: d.death_location,
          eggsSpawned: d.eggs_spawned,
          territories: d.egg_territories,
          diedAt: d.died_at,
          owner: wallet ? undefined : d.owner_wallet.slice(0, 8) + '...',
        })),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Get lineage for a specific Garu
    if (action === 'lineage' && garuId) {
      const garu = await sql`
        SELECT * FROM garu WHERE id = ${garuId}
      `;

      if (garu.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Garu not found',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      const lineage: any[] = [];
      let currentGaru = garu[0];

      // Trace ancestry (if egg has parent, or if fused from parents)
      while (currentGaru) {
        lineage.push({
          id: currentGaru.id,
          name: currentGaru.name,
          generation: currentGaru.generation,
          primaryElement: currentGaru.primary_element,
          secondaryElement: currentGaru.secondary_element,
          compositeType: currentGaru.composite_type,
          phase: currentGaru.phase,
          level: currentGaru.level,
        });

        // Check for parent egg
        if (currentGaru.from_egg_id) {
          const parentEgg = await sql`
            SELECT parent_garu_id, parent_garu_name FROM garu_eggs_wild
            WHERE id = ${currentGaru.from_egg_id}
          `;
          if (parentEgg.length > 0 && parentEgg[0].parent_garu_id) {
            const parent = await sql`
              SELECT * FROM garu WHERE id = ${parentEgg[0].parent_garu_id}
            `;
            if (parent.length > 0) {
              currentGaru = parent[0];
              continue;
            }
          }
        }

        // Check for fusion parents
        if (currentGaru.parent1_id) {
          const parent = await sql`
            SELECT * FROM garu WHERE id = ${currentGaru.parent1_id}
          `;
          if (parent.length > 0) {
            currentGaru = parent[0];
            continue;
          }
        }

        break;
      }

      // Get descendants (eggs spawned on death, or fusion children)
      const descendants = await sql`
        SELECT g.id, g.name, g.generation, g.primary_element, g.phase
        FROM garu g
        WHERE g.parent1_id = ${garuId} OR g.parent2_id = ${garuId}
        ORDER BY g.created_at DESC
        LIMIT 20
      `;

      // Get eggs spawned on death
      const deathRecord = await sql`
        SELECT * FROM garu_deaths WHERE garu_id = ${garuId}
      `;

      let deathEggs: any[] = [];
      if (deathRecord.length > 0) {
        const eggIds = deathRecord[0].eggs_spawned_ids || [];
        if (eggIds.length > 0) {
          const eggs = await sql`
            SELECT * FROM garu_eggs_wild
            WHERE id = ANY(${eggIds})
          `;
          deathEggs = eggs.map(e => ({
            id: e.id,
            territory: e.territory_id,
            element: e.primary_element,
            claimed: e.claimed_at !== null,
          }));
        }
      }

      return new Response(JSON.stringify({
        success: true,
        garu: {
          id: garu[0].id,
          name: garu[0].name,
          generation: garu[0].generation,
          phase: garu[0].phase,
        },
        lineage: lineage.reverse(), // Oldest first
        descendants: descendants.map(d => ({
          id: d.id,
          name: d.name,
          generation: d.generation,
          element: d.primary_element,
          phase: d.phase,
        })),
        deathEggs,
        death: deathRecord.length > 0 ? {
          cause: deathRecord[0].death_cause,
          location: deathRecord[0].death_location,
          level: deathRecord[0].level_at_death,
          eggsSpawned: deathRecord[0].eggs_spawned,
          diedAt: deathRecord[0].died_at,
        } : null,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Get statistics
    if (action === 'stats') {
      const totalDeaths = await sql`SELECT COUNT(*) as count FROM garu_deaths`;
      const totalEggsSpawned = await sql`
        SELECT COALESCE(SUM(eggs_spawned), 0) as total FROM garu_deaths
      `;
      const highestLevel = await sql`
        SELECT MAX(level_at_death) as max_level FROM garu_deaths
      `;
      const mostEggs = await sql`
        SELECT garu_name, eggs_spawned FROM garu_deaths
        ORDER BY eggs_spawned DESC LIMIT 1
      `;
      const byCause = await sql`
        SELECT death_cause, COUNT(*) as count
        FROM garu_deaths
        GROUP BY death_cause
        ORDER BY count DESC
      `;

      // Composite types achieved
      const composites = await sql`
        SELECT composite_type_achieved, COUNT(*) as count
        FROM garu_fusions
        WHERE composite_type_achieved IS NOT NULL
        GROUP BY composite_type_achieved
        ORDER BY count DESC
      `;

      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalDeaths: parseInt(totalDeaths[0].count),
          totalEggsSpawned: parseInt(totalEggsSpawned[0].total),
          highestLevelDeath: highestLevel[0].max_level || 0,
          mostProlificLegacy: mostEggs.length > 0 ? {
            name: mostEggs[0].garu_name,
            eggs: mostEggs[0].eggs_spawned,
          } : null,
          deathCauses: byCause.map(b => ({
            cause: b.death_cause,
            count: parseInt(b.count),
          })),
          compositesCreated: composites.map(c => ({
            type: c.composite_type_achieved,
            count: parseInt(c.count),
          })),
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Hall of Fame - Most prolific legacies
    if (action === 'hall_of_fame') {
      const mostEggs = await sql`
        SELECT garu_name, garu_id, owner_wallet, level_at_death, generation, eggs_spawned, died_at
        FROM garu_deaths
        ORDER BY eggs_spawned DESC
        LIMIT 20
      `;

      const highestLevel = await sql`
        SELECT garu_name, garu_id, owner_wallet, level_at_death, generation, eggs_spawned, died_at
        FROM garu_deaths
        ORDER BY level_at_death DESC
        LIMIT 20
      `;

      const oldestGeneration = await sql`
        SELECT name, id, owner_wallet, level, generation, primary_element
        FROM garu
        WHERE phase = 'hatched'
        ORDER BY generation DESC, level DESC
        LIMIT 20
      `;

      return new Response(JSON.stringify({
        success: true,
        hallOfFame: {
          mostProlific: mostEggs.map(g => ({
            name: g.garu_name,
            id: g.garu_id,
            level: g.level_at_death,
            generation: g.generation,
            eggs: g.eggs_spawned,
            diedAt: g.died_at,
          })),
          highestLevel: highestLevel.map(g => ({
            name: g.garu_name,
            id: g.garu_id,
            level: g.level_at_death,
            generation: g.generation,
            eggs: g.eggs_spawned,
            diedAt: g.died_at,
          })),
          ancientLineages: oldestGeneration.map(g => ({
            name: g.name,
            id: g.id,
            level: g.level,
            generation: g.generation,
            element: g.primary_element,
            status: 'alive',
          })),
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
