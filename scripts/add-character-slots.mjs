// Database migration: Character Slots & Cryptofae System
// 777 slots across 7 guilds for the TimeKnot Radio network

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL_8XM);

async function migrate() {
  console.log('Creating character_slots and cryptofae tables...\n');

  // The 7 guilds with their dice and slot counts
  // d12: 144 Audiomancers (musicians)
  // d8: 64 Aeromancers (gatherers/travelers)
  // d4: 216 Pyromancers (crafters/chefs/merchants)
  // d20: 100 Aquamancers (memory well guardians)
  // d6: 60 Geomancers (gardeners)
  // d10: 100 Champions (TTRPG livestreamers / cryptofae)
  // d100: 43 Architects (game item guardians)
  // Total: 727 guild slots + ~50 rainbow roads = 777

  await sql`
    CREATE TABLE IF NOT EXISTS guilds (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      dice_type TEXT NOT NULL,
      element TEXT NOT NULL,
      max_slots INTEGER NOT NULL,
      description TEXT,
      color TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cryptofae (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slot_number INTEGER UNIQUE,

      -- Solana assets
      nft_mint TEXT,
      token_mint TEXT,

      -- pump.fun integration
      pump_fun_mint TEXT,
      pump_fun_stream_key TEXT,

      -- Character details
      element TEXT,
      tek8_scores JSONB DEFAULT '{}',
      description TEXT,
      image_uri TEXT,

      -- Ownership
      owner_wallet TEXT,

      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS character_slots (
      id SERIAL PRIMARY KEY,
      slot_number INTEGER UNIQUE NOT NULL,
      guild_id INTEGER REFERENCES guilds(id),

      -- Solana NFT (character card)
      solana_nft_mint TEXT,

      -- pump.fun Token (for broadcasting)
      pump_fun_mint TEXT,
      pump_fun_stream_key TEXT,

      -- Character details
      character_name TEXT,
      character_system TEXT,  -- 'dice_godz', 'pathfinder_1e', 'mnm_3e'
      character_data JSONB DEFAULT '{}',

      -- Link to cryptofae guardian (for Champions)
      cryptofae_id INTEGER REFERENCES cryptofae(id),

      -- Player info
      player_wallet TEXT,
      player_discord TEXT,

      -- Broadcasting status
      is_active BOOLEAN DEFAULT FALSE,
      last_broadcast_at TIMESTAMPTZ,
      total_broadcast_minutes INTEGER DEFAULT 0,

      -- Rainbow road affiliation
      primary_road_id TEXT,

      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS broadcast_sessions (
      id SERIAL PRIMARY KEY,
      slot_id INTEGER REFERENCES character_slots(id),

      -- Session details
      session_title TEXT,
      campaign_name TEXT,
      game_system TEXT,

      -- Timing
      started_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      duration_minutes INTEGER,

      -- pump.fun integration
      pump_fun_stream_url TEXT,

      -- Participants (other slots in this session)
      participant_slots INTEGER[],

      -- Stats
      peak_viewers INTEGER DEFAULT 0,
      total_views INTEGER DEFAULT 0,

      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  console.log('Tables created. Seeding guilds...\n');

  // Seed the 7 guilds
  const guilds = [
    { name: 'Audiomancers', dice: 'd12', element: 'Ether', slots: 144, color: '#9333ea', desc: 'Musicians and sound artists of TimeKnot Radio' },
    { name: 'Aeromancers', dice: 'd8', element: 'Air', slots: 64, color: '#06b6d4', desc: 'Gatherers and travelers of the Quillverse' },
    { name: 'Pyromancers', dice: 'd4', element: 'Fire', slots: 216, color: '#ef4444', desc: 'Craftspeople, chefs, and merchants' },
    { name: 'Aquamancers', dice: 'd20', element: 'Water', slots: 100, color: '#3b82f6', desc: 'Memory Well guardians and historians' },
    { name: 'Geomancers', dice: 'd6', element: 'Earth', slots: 60, color: '#22c55e', desc: 'Gardeners and land cultivators' },
    { name: 'Champions', dice: 'd10', element: 'Chaos', slots: 100, color: '#f97316', desc: 'TTRPG livestreamers with cryptofae guardians' },
    { name: 'Architects', dice: 'd100', element: 'Order', slots: 43, color: '#6b7280', desc: 'Game item guardians from the Sacred Vibes Menu' },
  ];

  for (const guild of guilds) {
    await sql`
      INSERT INTO guilds (name, dice_type, element, max_slots, description, color)
      VALUES (${guild.name}, ${guild.dice}, ${guild.element}, ${guild.slots}, ${guild.desc}, ${guild.color})
      ON CONFLICT (name) DO UPDATE SET
        dice_type = EXCLUDED.dice_type,
        element = EXCLUDED.element,
        max_slots = EXCLUDED.max_slots,
        description = EXCLUDED.description,
        color = EXCLUDED.color
    `;
    console.log(`  ✓ ${guild.name} (${guild.dice}, ${guild.slots} slots)`);
  }

  // Seed the first 2 cryptofae (Luminara and Jai Chief Pixie)
  console.log('\nSeeding initial cryptofae...\n');

  await sql`
    INSERT INTO cryptofae (name, slot_number, element, description)
    VALUES
      ('Luminara', 1, 'Ether', 'The first cryptofae of light, guardian of creative vision'),
      ('Jai Chief Pixie', 2, 'Chaos', 'Leader of the Pixie Town 777, champion of adaptation')
    ON CONFLICT (slot_number) DO NOTHING
  `;

  console.log('  ✓ Luminara (slot 1)');
  console.log('  ✓ Jai Chief Pixie (slot 2)');

  // Create indexes
  console.log('\nCreating indexes...\n');

  await sql`CREATE INDEX IF NOT EXISTS idx_character_slots_guild ON character_slots(guild_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_character_slots_wallet ON character_slots(player_wallet)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_character_slots_road ON character_slots(primary_road_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cryptofae_owner ON cryptofae(owner_wallet)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_broadcast_sessions_slot ON broadcast_sessions(slot_id)`;

  console.log('  ✓ All indexes created');

  // Summary
  const guildCount = await sql`SELECT COUNT(*) as count FROM guilds`;
  const cryptofaeCount = await sql`SELECT COUNT(*) as count FROM cryptofae`;

  console.log('\n========================================');
  console.log('Migration complete!');
  console.log(`  Guilds: ${guildCount[0].count}`);
  console.log(`  Cryptofae: ${cryptofaeCount[0].count}`);
  console.log('  Total slots available: 727 + 50 roads = 777');
  console.log('========================================\n');
}

migrate().catch(console.error);
