/**
 * Database Migration: Garu Lifecycle System
 *
 * Run with: node scripts/add-garu-lifecycle-tables.mjs
 *
 * Creates the complete Garu digipet system:
 * - Garu creatures with 8-element stats
 * - Territory visit tracking (for death egg spawning)
 * - Wild eggs across territories
 * - Daily 8-dimension wellness care
 * - Fusion system for composite types
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL_8XM || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL_8XM or DATABASE_URL must be set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Starting Garu Lifecycle migration...\n');

  try {
    // 1. Core Garu table
    console.log('1. Creating garu table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu (
        id SERIAL PRIMARY KEY,
        owner_wallet TEXT NOT NULL,
        name VARCHAR(50) NOT NULL,
        primary_element VARCHAR(20) NOT NULL,
        secondary_element VARCHAR(20),
        composite_type VARCHAR(50),

        -- Stats (0-100 each)
        stat_fire INTEGER DEFAULT 10,
        stat_earth INTEGER DEFAULT 10,
        stat_air INTEGER DEFAULT 10,
        stat_water INTEGER DEFAULT 10,
        stat_ether INTEGER DEFAULT 10,
        stat_chaos INTEGER DEFAULT 10,
        stat_order INTEGER DEFAULT 10,
        stat_coin INTEGER DEFAULT 10,

        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        rider_bond INTEGER DEFAULT 50,

        -- Lifecycle phase: shard, egg, hatching, hatched, fused, dead
        phase VARCHAR(20) DEFAULT 'egg',
        hatched_at TIMESTAMP,
        died_at TIMESTAMP,
        death_location TEXT,

        -- Lineage
        parent_garu_ids INTEGER[],
        generation INTEGER DEFAULT 1,
        birth_territory TEXT,
        egg_id INTEGER,

        -- Wellness tracking
        care_streak INTEGER DEFAULT 0,
        total_care_days INTEGER DEFAULT 0,
        last_care_date DATE,

        -- Appearance
        image_url TEXT,
        custom_colors JSONB,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ garu table created');

    // 2. Territory visits (for death egg spawning)
    console.log('2. Creating garu_territory_visits table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_territory_visits (
        id SERIAL PRIMARY KEY,
        garu_id INTEGER REFERENCES garu(id) ON DELETE CASCADE,
        territory_id TEXT NOT NULL,
        visit_type VARCHAR(20) DEFAULT 'visited',
        first_visited TIMESTAMP DEFAULT NOW(),
        last_visited TIMESTAMP DEFAULT NOW(),
        visit_count INTEGER DEFAULT 1,
        races_won INTEGER DEFAULT 0,
        time_spent_minutes INTEGER DEFAULT 0,
        UNIQUE(garu_id, territory_id)
      )
    `;
    console.log('   ✓ garu_territory_visits table created');

    // 3. Wild eggs (spawned from death or primordial)
    console.log('3. Creating garu_eggs_wild table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_eggs_wild (
        id SERIAL PRIMARY KEY,
        territory_id TEXT NOT NULL,
        octix_coordinates TEXT,
        parent_garu_id INTEGER,
        parent_garu_name VARCHAR(50),
        parent_generation INTEGER DEFAULT 0,

        -- Egg characteristics (inherited from parent)
        primary_element VARCHAR(20) NOT NULL,
        secondary_element VARCHAR(20),
        elements_potency JSONB DEFAULT '{}',
        potency_level INTEGER DEFAULT 1,

        -- Discovery
        spawned_at TIMESTAMP DEFAULT NOW(),
        discovered_by TEXT,
        discovered_at TIMESTAMP,
        claimed_by TEXT,
        claimed_at TIMESTAMP,

        -- Expiration (eggs decay if unclaimed)
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
        is_primordial BOOLEAN DEFAULT false
      )
    `;
    console.log('   ✓ garu_eggs_wild table created');

    // 4. Daily wellness care logs
    console.log('4. Creating garu_care_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_care_logs (
        id SERIAL PRIMARY KEY,
        garu_id INTEGER REFERENCES garu(id) ON DELETE CASCADE,
        user_wallet TEXT NOT NULL,
        care_date DATE DEFAULT CURRENT_DATE,

        -- 8 wellness dimensions
        physical BOOLEAN DEFAULT false,
        emotional BOOLEAN DEFAULT false,
        intellectual BOOLEAN DEFAULT false,
        social BOOLEAN DEFAULT false,
        occupational BOOLEAN DEFAULT false,
        spiritual BOOLEAN DEFAULT false,
        environmental BOOLEAN DEFAULT false,
        financial BOOLEAN DEFAULT false,

        -- Detailed notes
        physical_notes TEXT,
        emotional_notes TEXT,
        intellectual_notes TEXT,
        social_notes TEXT,
        occupational_notes TEXT,
        spiritual_notes TEXT,
        environmental_notes TEXT,
        financial_notes TEXT,

        -- Instrument practice
        instrument_practiced BOOLEAN DEFAULT false,
        instrument_name VARCHAR(50),
        instrument_minutes INTEGER DEFAULT 0,

        -- Summary
        dimensions_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(garu_id, care_date)
      )
    `;
    console.log('   ✓ garu_care_logs table created');

    // 5. Garu fusion history
    console.log('5. Creating garu_fusions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_fusions (
        id SERIAL PRIMARY KEY,
        parent1_id INTEGER NOT NULL,
        parent1_name VARCHAR(50),
        parent2_id INTEGER NOT NULL,
        parent2_name VARCHAR(50),
        child_id INTEGER REFERENCES garu(id),
        child_name VARCHAR(50),
        resulting_composite VARCHAR(50),

        fusion_shrine_location TEXT,
        rider1_wallet TEXT NOT NULL,
        rider2_wallet TEXT NOT NULL,

        proposed_at TIMESTAMP,
        accepted_at TIMESTAMP,
        fused_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'complete'
      )
    `;
    console.log('   ✓ garu_fusions table created');

    // 6. Fusion proposals (pending fusions)
    console.log('6. Creating garu_fusion_proposals table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_fusion_proposals (
        id SERIAL PRIMARY KEY,
        proposer_wallet TEXT NOT NULL,
        proposer_garu_id INTEGER REFERENCES garu(id),
        target_wallet TEXT NOT NULL,
        target_garu_id INTEGER REFERENCES garu(id),
        shrine_location TEXT,
        proposed_name VARCHAR(50),
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        proposed_at TIMESTAMP DEFAULT NOW(),
        responded_at TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
      )
    `;
    console.log('   ✓ garu_fusion_proposals table created');

    // 7. Garu death records (for egg spawning history)
    console.log('7. Creating garu_deaths table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_deaths (
        id SERIAL PRIMARY KEY,
        garu_id INTEGER NOT NULL,
        garu_name VARCHAR(50),
        owner_wallet TEXT NOT NULL,
        death_location TEXT,
        death_cause VARCHAR(50),
        level_at_death INTEGER,
        generation INTEGER,

        -- Egg spawning results
        eggs_spawned INTEGER DEFAULT 0,
        egg_territories TEXT[],
        eggs_spawned_ids INTEGER[],

        died_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ garu_deaths table created');

    // 8. Composite type definitions
    console.log('8. Creating garu_composite_types table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_composite_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        required_elements TEXT[] NOT NULL,
        min_element_level INTEGER DEFAULT 20,
        rarity VARCHAR(20) DEFAULT 'uncommon',
        description TEXT,
        special_abilities JSONB,
        image_url TEXT
      )
    `;
    console.log('   ✓ garu_composite_types table created');

    // 9. Create indexes
    console.log('9. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_garu_owner ON garu(owner_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_garu_phase ON garu(phase)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_garu_level ON garu(level)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_visits_garu ON garu_territory_visits(garu_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_visits_territory ON garu_territory_visits(territory_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wild_eggs_territory ON garu_eggs_wild(territory_id) WHERE claimed_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wild_eggs_unclaimed ON garu_eggs_wild(claimed_at) WHERE claimed_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_care_logs_garu_date ON garu_care_logs(garu_id, care_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_care_logs_wallet ON garu_care_logs(user_wallet)`;
    console.log('   ✓ Indexes created');

    // 10. Seed composite types
    console.log('10. Seeding composite types...');
    const compositeTypes = [
      { name: 'magma', display: 'Magma Garu', elements: ['fire', 'earth'], rarity: 'uncommon', desc: 'Born of flame and stone' },
      { name: 'lightning', display: 'Lightning Garu', elements: ['fire', 'air'], rarity: 'uncommon', desc: 'Crackles with electric energy' },
      { name: 'storm', display: 'Storm Garu', elements: ['water', 'air'], rarity: 'uncommon', desc: 'Commands wind and rain' },
      { name: 'swamp', display: 'Swamp Garu', elements: ['water', 'earth'], rarity: 'uncommon', desc: 'Thrives in murky depths' },
      { name: 'steam', display: 'Steam Garu', elements: ['fire', 'water'], rarity: 'rare', desc: 'Opposites in harmony' },
      { name: 'dust', display: 'Dust Garu', elements: ['earth', 'air'], rarity: 'rare', desc: 'Ancient and ephemeral' },
      { name: 'void', display: 'Void Garu', elements: ['ether', 'chaos'], rarity: 'very_rare', desc: 'Exists between dimensions' },
      { name: 'balance', display: 'Balance Garu', elements: ['order', 'chaos'], rarity: 'very_rare', desc: 'Perfect equilibrium' },
      { name: 'prismatic', display: 'Prismatic Garu', elements: ['fire', 'water', 'earth'], rarity: 'epic', desc: 'Refracts reality itself' },
      { name: 'aurora', display: 'Aurora Garu', elements: ['air', 'water', 'ether'], rarity: 'epic', desc: 'Dances with northern lights' },
      { name: 'rainbow_bridge', display: 'Rainbow Bridge Garu', elements: ['fire', 'earth', 'air', 'water', 'ether', 'chaos', 'order', 'coin'], rarity: 'legendary', desc: 'Master of all elements' },
    ];

    for (const ct of compositeTypes) {
      await sql`
        INSERT INTO garu_composite_types (name, display_name, required_elements, rarity, description)
        VALUES (${ct.name}, ${ct.display}, ${ct.elements}, ${ct.rarity}, ${ct.desc})
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          required_elements = EXCLUDED.required_elements,
          rarity = EXCLUDED.rarity,
          description = EXCLUDED.description
      `;
    }
    console.log('   ✓ 11 composite types seeded');

    // 11. Seed some primordial eggs in each territory
    console.log('11. Seeding primordial eggs across territories...');
    const territories = [
      'D2OUT', 'D2UP', 'D2DWN', 'D2U45', 'D2D45',
      'D4OUT', 'D4UP', 'D4DWN', 'D4U45', 'D4D45',
      'D6OUT', 'D6UP', 'D6DWN', 'D6U45', 'D6D45',
      'D8OUT', 'D8UP', 'D8DWN', 'D8U45', 'D8D45',
      'D10OUT', 'D10UP', 'D10DWN', 'D10U45', 'D10D45',
      'D12OUT', 'D12UP', 'D12DWN', 'D12U45', 'D12D45',
      'D20OUT', 'D20UP', 'D20DWN', 'D20U45', 'D20D45',
      'D100OUT', 'D100UP', 'D100DWN', 'D100U45', 'D100D45',
    ];

    const elementMap = {
      'D2': 'coin', 'D4': 'fire', 'D6': 'earth', 'D8': 'air',
      'D10': 'chaos', 'D12': 'ether', 'D20': 'water', 'D100': 'order'
    };

    let eggsSeeded = 0;
    for (const territory of territories) {
      const dieType = territory.match(/D\d+/)?.[0] || 'D12';
      const element = elementMap[dieType] || 'ether';

      // 2 primordial eggs per territory
      for (let i = 0; i < 2; i++) {
        await sql`
          INSERT INTO garu_eggs_wild (
            territory_id,
            primary_element,
            is_primordial,
            potency_level,
            expires_at
          ) VALUES (
            ${territory},
            ${element},
            true,
            1,
            NOW() + INTERVAL '365 days'
          )
          ON CONFLICT DO NOTHING
        `;
        eggsSeeded++;
      }
    }
    console.log(`   ✓ ${eggsSeeded} primordial eggs seeded across ${territories.length} territories`);

    console.log('\n🎉 Garu Lifecycle migration completed successfully!');
    console.log('\nTables created:');
    console.log('  - garu: Core creature data with 8-element stats');
    console.log('  - garu_territory_visits: Tracks everywhere each Garu has been');
    console.log('  - garu_eggs_wild: Wild eggs across territories (80 primordial seeded)');
    console.log('  - garu_care_logs: Daily 8-dimension wellness care tracking');
    console.log('  - garu_fusions: Fusion history and composite creation');
    console.log('  - garu_fusion_proposals: Pending fusion requests');
    console.log('  - garu_deaths: Death records and egg spawning history');
    console.log('  - garu_composite_types: 11 composite types from common to legendary');
    console.log('\nNext steps:');
    console.log('  1. Build Garu care API (/api/garu/care)');
    console.log('  2. Build egg claiming API (/api/garu/claim-egg)');
    console.log('  3. Build hatching API (/api/garu/hatch)');
    console.log('  4. Build death/spawn API (/api/garu/death)');
    console.log('  5. Build fusion API (/api/garu/fusion/*)');
    console.log('  6. Build Garu Care UI component');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
