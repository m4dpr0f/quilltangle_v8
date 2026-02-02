/**
 * Database Migration: Add Token Verification Columns
 *
 * Run with: node scripts/add-verification-columns.mjs
 *
 * This adds verification/vetting support to the token_launches table
 * for pump.fun-style token curation.
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
  console.log('Starting verification columns migration...\n');

  try {
    // 1. Add verification_status column
    console.log('1. Adding verification_status column...');
    await sql`
      ALTER TABLE token_launches
      ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    `;
    console.log('   ✓ verification_status added (pending | under_review | verified | flagged | rejected)');

    // 2. Add verification_notes column
    console.log('2. Adding verification_notes column...');
    await sql`
      ALTER TABLE token_launches
      ADD COLUMN IF NOT EXISTS verification_notes TEXT
    `;
    console.log('   ✓ verification_notes added');

    // 3. Add verified_at timestamp
    console.log('3. Adding verified_at column...');
    await sql`
      ALTER TABLE token_launches
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP
    `;
    console.log('   ✓ verified_at added');

    // 4. Add verified_by (admin wallet)
    console.log('4. Adding verified_by column...');
    await sql`
      ALTER TABLE token_launches
      ADD COLUMN IF NOT EXISTS verified_by TEXT
    `;
    console.log('   ✓ verified_by added');

    // 5. Add is_featured flag
    console.log('5. Adding is_featured column...');
    await sql`
      ALTER TABLE token_launches
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false
    `;
    console.log('   ✓ is_featured added');

    // 6. Create disclaimer_acceptances table
    console.log('6. Creating disclaimer_acceptances table...');
    await sql`
      CREATE TABLE IF NOT EXISTS disclaimer_acceptances (
        id SERIAL PRIMARY KEY,
        user_wallet TEXT NOT NULL,
        token_launch_id INTEGER NOT NULL,
        accepted_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_wallet, token_launch_id)
      )
    `;
    console.log('   ✓ disclaimer_acceptances table created');

    // 7. Create index for faster lookups
    console.log('7. Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_token_launches_verification_status
      ON token_launches(verification_status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_token_launches_is_featured
      ON token_launches(is_featured) WHERE is_featured = true
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_disclaimer_acceptances_wallet
      ON disclaimer_acceptances(user_wallet)
    `;
    console.log('   ✓ Indexes created');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nVerification statuses available:');
    console.log('  - pending: New tokens awaiting review');
    console.log('  - under_review: Being reviewed by admin');
    console.log('  - verified: Approved and visible to all');
    console.log('  - flagged: Marked for concern');
    console.log('  - rejected: Not approved for listing');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
