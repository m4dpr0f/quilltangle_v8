/**
 * Database Migration: Garu Resurrection System
 *
 * Run with: node scripts/add-garu-resurrection-tables.mjs
 *
 * Creates tables for the resurrection mechanic:
 * - garu_memories: Musical tracks and writings as "save points"
 * - garu_resurrections: History of resurrections
 * - Additional columns on garu table for resurrection tracking
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
  console.log('Starting Garu Resurrection System migration...\n');

  try {
    // 1. Create garu_memories table
    console.log('1. Creating garu_memories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_memories (
        id SERIAL PRIMARY KEY,
        garu_id INTEGER NOT NULL,
        owner_wallet TEXT NOT NULL,

        -- Memory type: track (musical), writing (journal), milestone (auto)
        memory_type VARCHAR(20) NOT NULL,

        -- Content
        title VARCHAR(200),
        description TEXT,
        content TEXT,
        audio_url TEXT,
        image_url TEXT,

        -- For milestone memories
        milestone_event VARCHAR(50),

        -- Snapshot of Garu state when memory was created
        snapshot_level INTEGER,
        snapshot_stats JSONB,
        snapshot_bond INTEGER,
        snapshot_experience INTEGER,
        snapshot_phase VARCHAR(20),
        snapshot_generation INTEGER,

        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        is_used_in_resurrection BOOLEAN DEFAULT false,

        CONSTRAINT valid_memory_type CHECK (memory_type IN ('track', 'writing', 'milestone'))
      )
    `;
    console.log('   ✓ garu_memories table created');

    // 2. Create garu_resurrections table
    console.log('2. Creating garu_resurrections table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_resurrections (
        id SERIAL PRIMARY KEY,

        -- The resurrected Garu
        original_garu_id INTEGER NOT NULL,
        original_name VARCHAR(50),
        owner_wallet TEXT NOT NULL,

        -- The descendant that channeled the resurrection
        channel_garu_id INTEGER,
        channel_garu_name VARCHAR(50),

        -- Memories used
        memory_ids_used INTEGER[],
        tracks_used INTEGER DEFAULT 0,
        writings_used INTEGER DEFAULT 0,

        -- Restoration results
        restoration_quality VARCHAR(20),
        restored_level INTEGER,
        restored_bond INTEGER,

        -- Timestamps
        resurrected_at TIMESTAMP DEFAULT NOW(),

        CONSTRAINT valid_restoration_quality CHECK (restoration_quality IN ('partial', 'substantial', 'full'))
      )
    `;
    console.log('   ✓ garu_resurrections table created');

    // 3. Add resurrection columns to garu table
    console.log('3. Adding resurrection columns to garu table...');
    await sql`
      ALTER TABLE garu
      ADD COLUMN IF NOT EXISTS memory_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_memory_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS resurrection_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_resurrected_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS resurrected_via_garu_id INTEGER,
      ADD COLUMN IF NOT EXISTS has_ancestor_bond BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS ancestor_bond_garu_id INTEGER
    `;
    console.log('   ✓ Resurrection columns added to garu table');

    // 4. Create indexes
    console.log('4. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_memories_garu ON garu_memories(garu_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_memories_owner ON garu_memories(owner_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_memories_type ON garu_memories(memory_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resurrections_garu ON garu_resurrections(original_garu_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resurrections_owner ON garu_resurrections(owner_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_garu_ancestor_bond ON garu(ancestor_bond_garu_id) WHERE has_ancestor_bond = true`;
    console.log('   ✓ Indexes created');

    // 5. Add foreign key for garu_memories if garu table exists
    console.log('5. Adding foreign key relationships...');
    try {
      await sql`
        ALTER TABLE garu_memories
        ADD CONSTRAINT fk_memories_garu
        FOREIGN KEY (garu_id) REFERENCES garu(id) ON DELETE CASCADE
      `;
      console.log('   ✓ Foreign key added');
    } catch (e) {
      console.log('   ⚠ Foreign key may already exist');
    }

    console.log('\n🎉 Garu Resurrection System migration completed!\n');
    console.log('Tables created:');
    console.log('  - garu_memories: Store musical tracks and writings as save points');
    console.log('  - garu_resurrections: Track resurrection history');
    console.log('');
    console.log('Resurrection Mechanics:');
    console.log('  1. Players record musical tracks and journal entries during Garu\'s life');
    console.log('  2. These memories capture snapshots of the Garu\'s state');
    console.log('  3. If a Garu dies, players can resurrect them using:');
    console.log('     - At least 1 memory (track, writing, or milestone)');
    console.log('     - A descendant Garu (born from their legacy eggs)');
    console.log('  4. More tracks = better restoration (3+ tracks = full level restore)');
    console.log('  5. Writings help restore the bond strength');
    console.log('  6. The channeling descendant gains "Ancestor Bond" bonus');
    console.log('');
    console.log('This prevents rage-quitting by ensuring players can always');
    console.log('recover cherished Garu with effort and preparation.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
