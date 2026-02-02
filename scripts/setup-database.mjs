/**
 * 8xM Platform Database Setup
 *
 * Run with: node scripts/setup-database.mjs
 *
 * Creates all required tables for the 8xM platform including:
 * - Token launches and verification
 * - GCN entries and nations
 * - Territory control
 * - Swaps and reciprocity pools
 * - Metaphysics index
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

async function setup() {
  console.log('🚀 8xM Platform Database Setup\n');
  console.log('='.repeat(50));

  try {
    // ═══════════════════════════════════════════════════════════════
    // CORE TABLES
    // ═══════════════════════════════════════════════════════════════

    // 1. Token Launches (main launchpad table)
    console.log('\n1. Creating token_launches table...');
    await sql`
      CREATE TABLE IF NOT EXISTS token_launches (
        id SERIAL PRIMARY KEY,
        creator_wallet TEXT NOT NULL,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        total_supply BIGINT NOT NULL,
        decimals INTEGER DEFAULT 6,
        liquidity_tokens BIGINT,
        creator_tokens BIGINT,
        treasury_tokens BIGINT,
        initial_sol_liquidity REAL,
        platform_fee_lamports BIGINT,
        bin_step INTEGER,
        tek8_guild TEXT,
        road_id TEXT,
        nation_name TEXT,
        phase TEXT DEFAULT 'preparation',
        token_mint TEXT,
        pool_address TEXT,
        metadata_uri TEXT,
        creator_royalty_percent REAL DEFAULT 0,
        distribute_to_holders BOOLEAN DEFAULT false,
        creator_share_of_royalties REAL DEFAULT 50,
        -- Verification fields
        verification_status TEXT DEFAULT 'pending',
        verification_notes TEXT,
        verified_at TIMESTAMP,
        verified_by TEXT,
        is_featured BOOLEAN DEFAULT false,
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        live_at TIMESTAMP,
        graduated_at TIMESTAMP
      )
    `;
    console.log('   ✓ token_launches created');

    // 2. Tokens table (for all registered tokens including core tokens)
    console.log('\n2. Creating tokens table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        mint_address TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER DEFAULT 6 NOT NULL,
        total_supply BIGINT NOT NULL,
        creator_wallet TEXT NOT NULL,
        realm TEXT NOT NULL,
        description TEXT,
        image_uri TEXT,
        metadata_uri TEXT,
        is_core_token BOOLEAN DEFAULT FALSE NOT NULL,
        is_gcn_entry BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ tokens created');

    // 3. GCN Entries (Rainbow Roads applications)
    console.log('\n3. Creating gcn_entries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gcn_entries (
        id SERIAL PRIMARY KEY,
        token_id INTEGER REFERENCES tokens(id),
        mint_address TEXT UNIQUE,
        road_id TEXT NOT NULL,
        dice_type TEXT NOT NULL,
        direction TEXT NOT NULL,
        nation_name TEXT NOT NULL,
        soul_description TEXT NOT NULL,
        creator_wallet TEXT NOT NULL,
        status TEXT DEFAULT 'submitted' NOT NULL,
        stewardship_level TEXT DEFAULT 'stranger' NOT NULL,
        judge_scores TEXT,
        final_ranking INTEGER,
        is_canon BOOLEAN DEFAULT FALSE NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        approved_at TIMESTAMP,
        canon_at TIMESTAMP
      )
    `;
    console.log('   ✓ gcn_entries created');

    // 4. Nations
    console.log('\n4. Creating nations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS nations (
        id SERIAL PRIMARY KEY,
        gcn_entry_id INTEGER REFERENCES gcn_entries(id),
        mint_address TEXT,
        name TEXT NOT NULL,
        emoji TEXT,
        flag_uri TEXT,
        founder_wallet TEXT NOT NULL,
        total_territory_count INTEGER DEFAULT 0,
        total_staked TEXT DEFAULT '0',
        defense_bonus INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ nations created');

    // 5. Territories (40 Rainbow Roads)
    console.log('\n5. Creating territories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS territories (
        id SERIAL PRIMARY KEY,
        road_id TEXT NOT NULL UNIQUE,
        dice_type TEXT NOT NULL,
        direction TEXT NOT NULL,
        realm TEXT NOT NULL,
        grid_x INTEGER NOT NULL,
        grid_y INTEGER NOT NULL,
        status TEXT DEFAULT 'unclaimed',
        defense_level INTEGER DEFAULT 0,
        total_staked TEXT DEFAULT '0',
        claimed_at TIMESTAMP,
        last_contested_at TIMESTAMP,
        nation_id INTEGER REFERENCES nations(id)
      )
    `;
    console.log('   ✓ territories created');

    // 6. Territory Stakes
    console.log('\n6. Creating territory_stakes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS territory_stakes (
        id SERIAL PRIMARY KEY,
        territory_id INTEGER REFERENCES territories(id),
        staker_wallet TEXT NOT NULL,
        nation_id INTEGER REFERENCES nations(id),
        amount TEXT NOT NULL,
        locked_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ territory_stakes created');

    // 7. Territory Contests
    console.log('\n7. Creating territory_contests table...');
    await sql`
      CREATE TABLE IF NOT EXISTS territory_contests (
        id SERIAL PRIMARY KEY,
        territory_id INTEGER REFERENCES territories(id),
        attacker_nation_id INTEGER REFERENCES nations(id),
        defender_nation_id INTEGER REFERENCES nations(id),
        tokens_burned_attack TEXT DEFAULT '0',
        tokens_burned_defense TEXT DEFAULT '0',
        attack_dice_roll JSONB,
        defense_dice_roll JSONB,
        attack_power INTEGER,
        defense_power INTEGER,
        status TEXT DEFAULT 'pending',
        winner_nation_id INTEGER REFERENCES nations(id),
        defense_deadline TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ territory_contests created');

    // 8. Territory Events
    console.log('\n8. Creating territory_events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS territory_events (
        id SERIAL PRIMARY KEY,
        territory_id INTEGER REFERENCES territories(id),
        event_type TEXT NOT NULL,
        actor_nation_id INTEGER REFERENCES nations(id),
        actor_wallet TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ territory_events created');

    // 9. Alliances
    console.log('\n9. Creating alliances table...');
    await sql`
      CREATE TABLE IF NOT EXISTS alliances (
        id SERIAL PRIMARY KEY,
        proposer_nation_id INTEGER REFERENCES nations(id),
        target_nation_id INTEGER REFERENCES nations(id),
        alliance_type TEXT NOT NULL,
        terms JSONB,
        status TEXT DEFAULT 'proposed',
        proposed_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        expires_at TIMESTAMP
      )
    `;
    console.log('   ✓ alliances created');

    // 10. Reciprocity Pool
    console.log('\n10. Creating reciprocity_pool table...');
    await sql`
      CREATE TABLE IF NOT EXISTS reciprocity_pool (
        id SERIAL PRIMARY KEY,
        token_id INTEGER REFERENCES tokens(id),
        mint_address TEXT NOT NULL,
        deposited_amount BIGINT DEFAULT 0 NOT NULL,
        available_amount BIGINT DEFAULT 0 NOT NULL,
        total_swaps_in BIGINT DEFAULT 0 NOT NULL,
        total_swaps_out BIGINT DEFAULT 0 NOT NULL,
        initial_deposit_tx TEXT,
        depositor_wallet TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ reciprocity_pool created');

    // 11. Swaps
    console.log('\n11. Creating swaps table...');
    await sql`
      CREATE TABLE IF NOT EXISTS swaps (
        id SERIAL PRIMARY KEY,
        from_token_id INTEGER REFERENCES tokens(id),
        to_token_id INTEGER REFERENCES tokens(id),
        from_mint TEXT NOT NULL,
        to_mint TEXT NOT NULL,
        amount BIGINT NOT NULL,
        user_wallet TEXT NOT NULL,
        tx_signature TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        direction TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        confirmed_at TIMESTAMP
      )
    `;
    console.log('   ✓ swaps created');

    // 12. Metaphysics Index
    console.log('\n12. Creating metaphysics_index table...');
    await sql`
      CREATE TABLE IF NOT EXISTS metaphysics_index (
        id SERIAL PRIMARY KEY,
        token_id INTEGER REFERENCES tokens(id) UNIQUE,
        mint_address TEXT UNIQUE,
        total_qlx_inflow BIGINT DEFAULT 0 NOT NULL,
        total_qlx_outflow BIGINT DEFAULT 0 NOT NULL,
        net_qlx_flow BIGINT DEFAULT 0 NOT NULL,
        life_force_score REAL DEFAULT 0 NOT NULL,
        vitality_index REAL DEFAULT 0 NOT NULL,
        permanence_score REAL DEFAULT 0 NOT NULL,
        swap_count_24h INTEGER DEFAULT 0 NOT NULL,
        swap_count_7d INTEGER DEFAULT 0 NOT NULL,
        swap_count_total INTEGER DEFAULT 0 NOT NULL,
        unique_swappers INTEGER DEFAULT 0 NOT NULL,
        last_swap_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ metaphysics_index created');

    // 13. GCN Applications (detailed applications)
    console.log('\n13. Creating gcn_applications table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gcn_applications (
        id SERIAL PRIMARY KEY,
        creator_wallet TEXT NOT NULL,
        nation_name TEXT NOT NULL,
        token_symbol TEXT NOT NULL,
        email TEXT,
        soul_description TEXT,
        pillar_music TEXT,
        pillar_business TEXT,
        pillar_technology TEXT,
        road_id TEXT,
        instrument_id TEXT,
        status TEXT DEFAULT 'submitted',
        reviewer_notes TEXT,
        video_interview_completed BOOLEAN DEFAULT false,
        video_interview_url TEXT,
        video_interview_scheduled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ gcn_applications created');

    // 14. Notifications
    console.log('\n14. Creating notifications table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_wallet TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ notifications created');

    // 15. Disclaimer Acceptances
    console.log('\n15. Creating disclaimer_acceptances table...');
    await sql`
      CREATE TABLE IF NOT EXISTS disclaimer_acceptances (
        id SERIAL PRIMARY KEY,
        user_wallet TEXT NOT NULL,
        token_launch_id INTEGER,
        accepted_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_wallet, token_launch_id)
      )
    `;
    console.log('   ✓ disclaimer_acceptances created');

    // ═══════════════════════════════════════════════════════════════
    // INDEXES
    // ═══════════════════════════════════════════════════════════════

    console.log('\n16. Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS idx_token_launches_creator ON token_launches(creator_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_token_launches_phase ON token_launches(phase)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_token_launches_verification ON token_launches(verification_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_token_launches_featured ON token_launches(is_featured) WHERE is_featured = true`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tokens_mint ON tokens(mint_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_territories_road ON territories(road_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nations_founder ON nations(founder_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(user_wallet)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_wallet, is_read) WHERE is_read = false`;

    console.log('   ✓ All indexes created');

    // ═══════════════════════════════════════════════════════════════
    // SEED DATA
    // ═══════════════════════════════════════════════════════════════

    console.log('\n17. Checking for territory seed data...');
    const existingTerritories = await sql`SELECT COUNT(*) as count FROM territories`;

    if (existingTerritories[0].count === 0) {
      console.log('   Seeding 40 Rainbow Roads territories...');

      const DICE_TYPES = ['D2', 'D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];
      const DIRECTIONS = ['OUT', 'UP', 'DWN', 'U45', 'D45'];
      const REALMS = { OUT: 'QLX', UP: 'QLY', DWN: 'QLY', U45: 'QLZ', D45: 'QLZ' };

      for (let y = 0; y < DIRECTIONS.length; y++) {
        for (let x = 0; x < DICE_TYPES.length; x++) {
          const direction = DIRECTIONS[y];
          const dice = DICE_TYPES[x];
          const roadId = `${dice}${direction}`;
          const realm = REALMS[direction];

          await sql`
            INSERT INTO territories (road_id, dice_type, direction, realm, grid_x, grid_y, status)
            VALUES (${roadId}, ${dice}, ${direction}, ${realm}, ${x}, ${y}, 'unclaimed')
            ON CONFLICT (road_id) DO NOTHING
          `;
        }
      }
      console.log('   ✓ 40 territories seeded');
    } else {
      console.log('   ✓ Territories already exist, skipping seed');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Database setup completed successfully!');
    console.log('='.repeat(50));

    console.log('\nTables created:');
    console.log('  - token_launches (with verification)');
    console.log('  - tokens');
    console.log('  - gcn_entries');
    console.log('  - nations');
    console.log('  - territories (40 Rainbow Roads)');
    console.log('  - territory_stakes');
    console.log('  - territory_contests');
    console.log('  - territory_events');
    console.log('  - alliances');
    console.log('  - reciprocity_pool');
    console.log('  - swaps');
    console.log('  - metaphysics_index');
    console.log('  - gcn_applications');
    console.log('  - notifications');
    console.log('  - disclaimer_acceptances');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

setup();
