/**
 * Database Migration: Garu Tables Update v2
 *
 * Run with: node scripts/update-garu-tables-v2.mjs
 *
 * Adds missing columns for the fusion and legacy systems:
 * - fused_into_id on garu table
 * - from_egg_id on garu table
 * - bond_level alias for rider_bond
 * - xp alias for experience
 * - Fusion proposal updates
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
  console.log('Starting Garu Tables v2 migration...\n');

  try {
    // 1. Add missing columns to garu table
    console.log('1. Adding fusion tracking columns to garu table...');
    await sql`
      ALTER TABLE garu
      ADD COLUMN IF NOT EXISTS fused_into_id INTEGER REFERENCES garu(id),
      ADD COLUMN IF NOT EXISTS from_egg_id INTEGER,
      ADD COLUMN IF NOT EXISTS parent1_id INTEGER,
      ADD COLUMN IF NOT EXISTS parent2_id INTEGER,
      ADD COLUMN IF NOT EXISTS bond_level INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0
    `;
    console.log('   ✓ Added fused_into_id, from_egg_id, parent1_id, parent2_id, bond_level, xp columns');

    // 2. Copy data from old columns if needed
    console.log('2. Syncing bond_level with rider_bond...');
    await sql`
      UPDATE garu
      SET bond_level = rider_bond
      WHERE bond_level IS NULL OR bond_level = 50
    `;
    console.log('   ✓ Synced bond levels');

    console.log('3. Syncing xp with experience...');
    await sql`
      UPDATE garu
      SET xp = experience
      WHERE xp IS NULL OR xp = 0
    `;
    console.log('   ✓ Synced XP');

    // 3. Update fusion_proposals table
    console.log('4. Updating garu_fusion_proposals table...');
    await sql`
      ALTER TABLE garu_fusion_proposals
      ADD COLUMN IF NOT EXISTS garu1_id INTEGER,
      ADD COLUMN IF NOT EXISTS garu2_id INTEGER,
      ADD COLUMN IF NOT EXISTS proposed_composite_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS result_garu_id INTEGER
    `;
    console.log('   ✓ Added new columns to fusion_proposals');

    // Copy data from old columns
    await sql`
      UPDATE garu_fusion_proposals
      SET garu1_id = proposer_garu_id,
          garu2_id = target_garu_id
      WHERE garu1_id IS NULL
    `;
    console.log('   ✓ Synced garu IDs in proposals');

    // 4. Update garu_fusions table
    console.log('5. Updating garu_fusions table...');
    await sql`
      ALTER TABLE garu_fusions
      ADD COLUMN IF NOT EXISTS result_garu_id INTEGER,
      ADD COLUMN IF NOT EXISTS owner1_wallet TEXT,
      ADD COLUMN IF NOT EXISTS owner2_wallet TEXT,
      ADD COLUMN IF NOT EXISTS composite_type_achieved VARCHAR(50)
    `;
    console.log('   ✓ Added new columns to fusions table');

    // Copy data
    await sql`
      UPDATE garu_fusions
      SET result_garu_id = child_id,
          owner1_wallet = rider1_wallet,
          owner2_wallet = rider2_wallet,
          composite_type_achieved = resulting_composite
      WHERE result_garu_id IS NULL
    `;
    console.log('   ✓ Synced fusion data');

    // 5. Update garu_composite_types table for API compatibility
    console.log('6. Updating garu_composite_types for API compatibility...');
    await sql`
      ALTER TABLE garu_composite_types
      ADD COLUMN IF NOT EXISTS stat_bonuses JSONB DEFAULT '{}'
    `;
    console.log('   ✓ Added stat_bonuses column');

    // 6. Create indexes for new columns
    console.log('7. Creating indexes for new columns...');
    await sql`CREATE INDEX IF NOT EXISTS idx_garu_fused_into ON garu(fused_into_id) WHERE fused_into_id IS NOT NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_garu_from_egg ON garu(from_egg_id) WHERE from_egg_id IS NOT NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_garu_parents ON garu(parent1_id, parent2_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_fusion_proposals_status ON garu_fusion_proposals(status)`;
    console.log('   ✓ Indexes created');

    console.log('\n🎉 Garu Tables v2 migration completed successfully!');
    console.log('\nNew columns added:');
    console.log('  - garu.fused_into_id: Track which Garu this was fused into');
    console.log('  - garu.from_egg_id: Track which wild egg spawned this Garu');
    console.log('  - garu.parent1_id/parent2_id: Track fusion parents');
    console.log('  - garu.bond_level/xp: Aliases for API compatibility');
    console.log('  - fusion_proposals: New tracking columns');
    console.log('  - garu_fusions: Additional result tracking');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('This is likely because the base tables do not exist yet.');
    console.error('Run the base migration first: node scripts/add-garu-lifecycle-tables.mjs');
    process.exit(1);
  }

  process.exit(0);
}

migrate();
