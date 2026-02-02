/**
 * Migration: Add Gifts Table and Missing Columns
 *
 * Run with: node scripts/migrate-add-gifts.mjs
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
  console.log('🔄 Running Migration: Add Gifts and Missing Columns\n');
  console.log('='.repeat(50));

  try {
    // 1. Create gifts table
    console.log('\n1. Creating gifts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gifts (
        id SERIAL PRIMARY KEY,
        from_wallet TEXT NOT NULL,
        to_treasury TEXT NOT NULL,
        amount BIGINT NOT NULL,
        token_mint TEXT NOT NULL,
        token_symbol TEXT,
        nation_id INTEGER REFERENCES nations(id),
        gcn_entry_id INTEGER REFERENCES gcn_entries(id),
        tx_signature TEXT,
        status TEXT DEFAULT 'pending',
        gift_tier TEXT,
        purpose TEXT,
        message TEXT,
        is_anonymous BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP
      )
    `;
    console.log('   ✓ gifts table created');

    // 2. Add updated_at to token_launches if missing
    console.log('\n2. Adding updated_at to token_launches...');
    await sql`
      ALTER TABLE token_launches
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `;
    console.log('   ✓ updated_at column added');

    // 3. Add royalty_config jsonb column
    console.log('\n3. Adding royalty_config to token_launches...');
    await sql`
      ALTER TABLE token_launches
      ADD COLUMN IF NOT EXISTS royalty_config JSONB
    `;
    console.log('   ✓ royalty_config column added');

    // 4. Create gift_tiers reference table
    console.log('\n4. Creating gift_tiers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gift_tiers (
        id SERIAL PRIMARY KEY,
        tier_name TEXT NOT NULL UNIQUE,
        min_amount BIGINT NOT NULL,
        benefits JSONB,
        emoji TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ gift_tiers table created');

    // 5. Seed gift tiers
    console.log('\n5. Seeding gift tiers...');
    const existingTiers = await sql`SELECT COUNT(*) as count FROM gift_tiers`;

    if (existingTiers[0].count === 0) {
      await sql`
        INSERT INTO gift_tiers (tier_name, min_amount, emoji, benefits) VALUES
        ('Seedling', 1000000, '🌱', '{"hall_of_givers": true}'::jsonb),
        ('Sapling', 10000000, '🌿', '{"hall_of_givers": true, "priority_access": true}'::jsonb),
        ('Grove', 100000000, '🌳', '{"hall_of_givers": true, "priority_access": true, "reduced_fees": 0.5}'::jsonb),
        ('Forest', 1000000000, '🌲', '{"hall_of_givers": true, "priority_access": true, "reduced_fees": 0.25, "exclusive_events": true}'::jsonb),
        ('World Tree', 10000000000, '🌍', '{"hall_of_givers": true, "priority_access": true, "reduced_fees": 0, "exclusive_events": true, "governance": true}'::jsonb)
      `;
      console.log('   ✓ Gift tiers seeded');
    } else {
      console.log('   ✓ Gift tiers already exist');
    }

    // 6. Create gift leaderboard view
    console.log('\n6. Creating gift_leaderboard view...');
    await sql`
      CREATE OR REPLACE VIEW gift_leaderboard AS
      SELECT
        from_wallet,
        SUM(amount) as total_gifted,
        COUNT(*) as gift_count,
        MAX(created_at) as last_gift_at,
        (SELECT tier_name FROM gift_tiers
         WHERE min_amount <= SUM(g.amount)
         ORDER BY min_amount DESC LIMIT 1) as current_tier
      FROM gifts g
      WHERE status = 'confirmed'
      GROUP BY from_wallet
      ORDER BY total_gifted DESC
    `;
    console.log('   ✓ gift_leaderboard view created');

    // 7. Add indexes
    console.log('\n7. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_gifts_from_wallet ON gifts(from_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gifts_to_treasury ON gifts(to_treasury)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gifts_token_mint ON gifts(token_mint)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gifts_confirmed ON gifts(confirmed_at) WHERE status = 'confirmed'`;
    console.log('   ✓ Indexes created');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration completed successfully!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
