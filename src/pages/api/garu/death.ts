import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Garu Death & Legacy API
 *
 * POST: Process a Garu's death, spawn legacy eggs
 *
 * When a Garu dies:
 * 1. Rider returns to Chaos Shard form
 * 2. Garu's energy spawns eggs across all territories they visited
 * 3. More experienced/traveled Garu = more eggs
 * 4. This creates abundance through legacy
 */

// Egg spawning formula constants
const BASE_EGGS = 1;
const EGGS_PER_LEVEL = 0.1;  // 1 extra egg per 10 levels
const EGGS_PER_TERRITORY = 1;
const EGGS_PER_RACE_WON = 2;
const EGGS_AT_BIRTH_TERRITORY = 3;
const EGGS_PER_GENERATION = 1;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      walletAddress,
      garuId,
      deathCause = 'adventure', // adventure, battle, sacrifice, natural
      deathLocation, // Optional specific location
    } = body;

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
      AND phase = 'hatched'
    `;

    if (garuResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Garu not found, not hatched, or not owned by you',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const garu = garuResult[0];

    // Get all territories this Garu visited
    const territories = await sql`
      SELECT * FROM garu_territory_visits
      WHERE garu_id = ${garuId}
      ORDER BY first_visited
    `;

    // Calculate egg spawning
    let totalEggs = BASE_EGGS;
    totalEggs += Math.floor(garu.level * EGGS_PER_LEVEL);
    totalEggs += garu.generation * EGGS_PER_GENERATION;

    // Eggs per territory visited
    const eggsPerTerritory: Record<string, number> = {};
    for (const t of territories) {
      let eggs = EGGS_PER_TERRITORY;
      if (t.visit_type === 'born') {
        eggs = EGGS_AT_BIRTH_TERRITORY;
      }
      eggs += t.races_won * EGGS_PER_RACE_WON;
      eggsPerTerritory[t.territory_id] = eggs;
      totalEggs += eggs;
    }

    // Calculate element distribution for eggs (based on Garu's stats)
    const totalStats = garu.stat_fire + garu.stat_earth + garu.stat_air +
                       garu.stat_water + garu.stat_ether + garu.stat_chaos +
                       garu.stat_order + garu.stat_coin;

    const elementDistribution: Record<string, number> = {
      fire: Math.round((garu.stat_fire / totalStats) * 100),
      earth: Math.round((garu.stat_earth / totalStats) * 100),
      air: Math.round((garu.stat_air / totalStats) * 100),
      water: Math.round((garu.stat_water / totalStats) * 100),
      ether: Math.round((garu.stat_ether / totalStats) * 100),
      chaos: Math.round((garu.stat_chaos / totalStats) * 100),
      order: Math.round((garu.stat_order / totalStats) * 100),
      coin: Math.round((garu.stat_coin / totalStats) * 100),
    };

    // Spawn eggs across territories
    const spawnedEggs: any[] = [];
    const spawnedTerritories: string[] = [];

    for (const [territory, eggCount] of Object.entries(eggsPerTerritory)) {
      for (let i = 0; i < eggCount; i++) {
        // Determine egg element based on parent distribution (weighted random)
        let primaryElement = garu.primary_element;
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const [element, weight] of Object.entries(elementDistribution)) {
          cumulative += weight;
          if (rand <= cumulative) {
            primaryElement = element;
            break;
          }
        }

        // Secondary element (50% chance, different from primary)
        let secondaryElement = null;
        if (Math.random() > 0.5) {
          const otherElements = Object.keys(elementDistribution).filter(e => e !== primaryElement);
          secondaryElement = otherElements[Math.floor(Math.random() * otherElements.length)];
        }

        // Calculate potency based on level and generation
        const potency = Math.floor(garu.level / 10) + garu.generation;

        const eggResult = await sql`
          INSERT INTO garu_eggs_wild (
            territory_id,
            parent_garu_id,
            parent_garu_name,
            parent_generation,
            primary_element,
            secondary_element,
            elements_potency,
            potency_level,
            spawned_at,
            expires_at
          ) VALUES (
            ${territory},
            ${garuId},
            ${garu.name},
            ${garu.generation},
            ${primaryElement},
            ${secondaryElement},
            ${JSON.stringify(elementDistribution)},
            ${potency},
            NOW(),
            NOW() + INTERVAL '30 days'
          )
          RETURNING id
        `;

        spawnedEggs.push({
          id: eggResult[0].id,
          territory,
          element: primaryElement,
          secondary: secondaryElement,
          potency,
        });
      }
      spawnedTerritories.push(territory);
    }

    // If not enough territories visited, spawn some in random wilderness areas
    const wildernessTerritories = ['D8OUT', 'D8UP', 'D8DWN', 'D8U45', 'D8D45'];
    const minEggs = BASE_EGGS + Math.floor(garu.level * EGGS_PER_LEVEL);

    while (spawnedEggs.length < minEggs) {
      const randomTerritory = wildernessTerritories[
        Math.floor(Math.random() * wildernessTerritories.length)
      ];

      const eggResult = await sql`
        INSERT INTO garu_eggs_wild (
          territory_id,
          parent_garu_id,
          parent_garu_name,
          parent_generation,
          primary_element,
          potency_level,
          spawned_at,
          expires_at
        ) VALUES (
          ${randomTerritory},
          ${garuId},
          ${garu.name},
          ${garu.generation},
          ${garu.primary_element},
          ${Math.floor(garu.level / 10)},
          NOW(),
          NOW() + INTERVAL '30 days'
        )
        RETURNING id
      `;

      spawnedEggs.push({
        id: eggResult[0].id,
        territory: randomTerritory,
        element: garu.primary_element,
      });

      if (!spawnedTerritories.includes(randomTerritory)) {
        spawnedTerritories.push(randomTerritory);
      }
    }

    // Record the death
    await sql`
      INSERT INTO garu_deaths (
        garu_id,
        garu_name,
        owner_wallet,
        death_location,
        death_cause,
        level_at_death,
        generation,
        eggs_spawned,
        egg_territories,
        eggs_spawned_ids
      ) VALUES (
        ${garuId},
        ${garu.name},
        ${walletAddress},
        ${deathLocation || territories[territories.length - 1]?.territory_id || 'unknown'},
        ${deathCause},
        ${garu.level},
        ${garu.generation},
        ${spawnedEggs.length},
        ${spawnedTerritories},
        ${spawnedEggs.map(e => e.id)}
      )
    `;

    // Update the Garu to dead status
    await sql`
      UPDATE garu
      SET
        phase = 'dead',
        died_at = NOW(),
        death_location = ${deathLocation || territories[territories.length - 1]?.territory_id || 'unknown'},
        updated_at = NOW()
      WHERE id = ${garuId}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: `${garu.name} has passed. Their legacy lives on.`,
      ceremony: {
        title: 'Garu Passing',
        description: `${garu.name}'s life energy disperses across the Quillverse, becoming ${spawnedEggs.length} new eggs scattered across ${spawnedTerritories.length} territories they touched in their journey.`,
      },
      legacy: {
        garuName: garu.name,
        level: garu.level,
        generation: garu.generation,
        totalEggsSpawned: spawnedEggs.length,
        territoriesWithEggs: spawnedTerritories,
        elementDistribution,
      },
      eggs: spawnedEggs.slice(0, 10).map(e => ({
        territory: e.territory,
        element: e.element,
        secondary: e.secondary,
      })),
      eggsHidden: spawnedEggs.length > 10 ? spawnedEggs.length - 10 : 0,
      riderStatus: {
        form: 'Chaos Shard',
        location: 'Random Wilderness',
        message: 'You return to Chaos Shard form, carrying memories of your time with ' + garu.name,
        canClaimNewEgg: true,
      },
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Garu death error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET: View wild eggs in a territory
export const GET: APIRoute = async ({ url }) => {
  try {
    const territory = url.searchParams.get('territory');
    const wallet = url.searchParams.get('wallet');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const sql = getDb();

    let eggs;
    if (territory) {
      // Get eggs in specific territory
      eggs = await sql`
        SELECT
          id,
          territory_id,
          parent_garu_name,
          parent_generation,
          primary_element,
          secondary_element,
          potency_level,
          spawned_at,
          is_primordial,
          CASE WHEN discovered_by = ${wallet || ''} THEN true ELSE false END as discovered_by_me
        FROM garu_eggs_wild
        WHERE territory_id = ${territory}
        AND claimed_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY potency_level DESC, spawned_at DESC
        LIMIT ${limit}
      `;
    } else {
      // Get all unclaimed eggs (for exploration)
      eggs = await sql`
        SELECT
          id,
          territory_id,
          parent_garu_name,
          parent_generation,
          primary_element,
          secondary_element,
          potency_level,
          spawned_at,
          is_primordial
        FROM garu_eggs_wild
        WHERE claimed_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY spawned_at DESC
        LIMIT ${limit}
      `;
    }

    // Group by territory for display
    const byTerritory: Record<string, any[]> = {};
    for (const egg of eggs) {
      if (!byTerritory[egg.territory_id]) {
        byTerritory[egg.territory_id] = [];
      }
      byTerritory[egg.territory_id].push({
        id: egg.id,
        element: egg.primary_element,
        secondary: egg.secondary_element,
        potency: egg.potency_level,
        parentName: egg.parent_garu_name,
        parentGeneration: egg.parent_generation,
        isPrimordial: egg.is_primordial,
        age: egg.spawned_at,
      });
    }

    // Count totals
    const totalCount = await sql`
      SELECT COUNT(*) as count FROM garu_eggs_wild
      WHERE claimed_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    return new Response(JSON.stringify({
      success: true,
      eggs: eggs.map(e => ({
        id: e.id,
        territory: e.territory_id,
        element: e.primary_element,
        secondary: e.secondary_element,
        potency: e.potency_level,
        parentName: e.parent_garu_name,
        generation: (e.parent_generation || 0) + 1,
        isPrimordial: e.is_primordial,
        age: e.spawned_at,
      })),
      byTerritory,
      totalAvailable: parseInt(totalCount[0].count),
      filter: territory || 'all',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
