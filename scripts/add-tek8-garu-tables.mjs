/**
 * Database Migration: Add TEK8 Profiles and Garu Eggs System
 *
 * Run with: node scripts/add-tek8-garu-tables.mjs
 *
 * This creates the foundation for:
 * - TEK8 guild profiles (8-element distribution)
 * - Garu Egg contemplation journeys (64 eggs)
 * - Wellness activity tracking
 * - Governance proposals with elemental weighting
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
  console.log('Starting TEK8 & Garu Eggs migration...\n');

  try {
    // 1. Create TEK8 profiles table
    console.log('1. Creating tek8_profiles table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tek8_profiles (
        id SERIAL PRIMARY KEY,
        user_wallet TEXT UNIQUE NOT NULL,
        primary_guild VARCHAR(10) NOT NULL,
        secondary_guild VARCHAR(10),
        sacred_instrument VARCHAR(100),
        element_distribution JSONB NOT NULL DEFAULT '{}',
        quiz_answers JSONB,
        quiz_completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ tek8_profiles table created');

    // 2. Create garu_eggs master table
    console.log('2. Creating garu_eggs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS garu_eggs (
        id SERIAL PRIMARY KEY,
        egg_number INTEGER UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        elements TEXT[] NOT NULL,
        die VARCHAR(10) NOT NULL,
        question TEXT NOT NULL,
        hatching_method TEXT NOT NULL,
        hatching_duration_days INTEGER DEFAULT 30,
        wellness_benefits JSONB,
        prerequisites INTEGER[],
        tier VARCHAR(20) DEFAULT 'foundational',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ garu_eggs table created');

    // 3. Create egg_progress table
    console.log('3. Creating egg_progress table...');
    await sql`
      CREATE TABLE IF NOT EXISTS egg_progress (
        id SERIAL PRIMARY KEY,
        user_wallet TEXT NOT NULL,
        egg_id INTEGER REFERENCES garu_eggs(id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT NOW(),
        phase VARCHAR(30) DEFAULT 'contemplation',
        journal_entries JSONB DEFAULT '[]',
        answer_text TEXT,
        completed_at TIMESTAMP,
        verified_by TEXT,
        verification_notes TEXT,
        UNIQUE(user_wallet, egg_id)
      )
    `;
    console.log('   ✓ egg_progress table created');

    // 4. Create wellness_activities table
    console.log('4. Creating wellness_activities table...');
    await sql`
      CREATE TABLE IF NOT EXISTS wellness_activities (
        id SERIAL PRIMARY KEY,
        user_wallet TEXT NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        element VARCHAR(20) NOT NULL,
        duration_minutes INTEGER,
        notes TEXT,
        egg_id INTEGER REFERENCES garu_eggs(id),
        logged_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✓ wellness_activities table created');

    // 5. Create governance_proposals table
    console.log('5. Creating governance_proposals table...');
    await sql`
      CREATE TABLE IF NOT EXISTS governance_proposals (
        id SERIAL PRIMARY KEY,
        nation_id INTEGER,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        domain VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        voting_ends_at TIMESTAMP NOT NULL,
        execution_data JSONB,
        result JSONB
      )
    `;
    console.log('   ✓ governance_proposals table created');

    // 6. Create governance_votes table
    console.log('6. Creating governance_votes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS governance_votes (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER REFERENCES governance_proposals(id) ON DELETE CASCADE,
        voter_wallet TEXT NOT NULL,
        vote VARCHAR(10) NOT NULL,
        voting_power INTEGER NOT NULL,
        voted_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(proposal_id, voter_wallet)
      )
    `;
    console.log('   ✓ governance_votes table created');

    // 7. Create indexes
    console.log('7. Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tek8_profiles_wallet
      ON tek8_profiles(user_wallet)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tek8_profiles_primary_guild
      ON tek8_profiles(primary_guild)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_egg_progress_wallet
      ON egg_progress(user_wallet)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_egg_progress_phase
      ON egg_progress(phase)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_wellness_wallet
      ON wellness_activities(user_wallet)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_wellness_element
      ON wellness_activities(element)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_governance_status
      ON governance_proposals(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_governance_domain
      ON governance_proposals(domain)
    `;
    console.log('   ✓ Indexes created');

    // 8. Seed the 8 foundational Garu Eggs
    console.log('8. Seeding foundational Garu Eggs (0-7)...');

    const foundationalEggs = [
      {
        number: 0,
        name: 'Echo Egg',
        elements: ['Ether'],
        die: 'D12',
        question: 'Who am I, beyond the echo of my own voice?',
        hatching_method: 'Musical self-reflection: Spend 30 minutes making sound, record yourself answering the question aloud, listen back and write what you discover.',
        wellness_benefits: { physical: 'voice health', emotional: 'self-expression', spiritual: 'authentic identity' }
      },
      {
        number: 1,
        name: 'Flare Egg',
        elements: ['Fire'],
        die: 'D4',
        question: 'What substance hides within the heart of every flame?',
        hatching_method: 'Trial by transformation: Identify something needing change, take action, document resistance and breakthrough.',
        wellness_benefits: { physical: 'metabolism', emotional: 'courage', occupational: 'initiative' }
      },
      {
        number: 2,
        name: 'Foundation Egg',
        elements: ['Earth'],
        die: 'D6',
        question: 'Where does the ground remember what the sky forgets?',
        hatching_method: 'Cartographic meditation: Map a meaningful place from memory, walk it physically, note what changed.',
        wellness_benefits: { physical: 'grounding', emotional: 'security', environmental: 'sense of place' }
      },
      {
        number: 3,
        name: 'Whisper Egg',
        elements: ['Air'],
        die: 'D8',
        question: 'Why does the wind carry secrets but never answers?',
        hatching_method: 'Dream incubation: Before sleep, ask the question. Journal dreams for 30 days.',
        wellness_benefits: { physical: 'breath work', intellectual: 'insight', social: 'listening' }
      },
      {
        number: 4,
        name: 'Paradox Egg',
        elements: ['Chaos'],
        die: 'D10',
        question: 'How does order emerge from perfect disorder?',
        hatching_method: 'Riddling through contradiction: Find and document 10 paradoxes in daily life.',
        wellness_benefits: { intellectual: 'flexibility', emotional: 'acceptance', spiritual: 'surrender' }
      },
      {
        number: 5,
        name: 'Tide Egg',
        elements: ['Water'],
        die: 'D20',
        question: 'When does memory become prophecy?',
        hatching_method: 'Chronological storytelling: Interview an elder about their youth, find patterns connecting to your future.',
        wellness_benefits: { emotional: 'processing', social: 'empathy', spiritual: 'intuition' }
      },
      {
        number: 6,
        name: 'Balance Egg',
        elements: ['Order'],
        die: 'D100',
        question: 'Which path serves the greatest good?',
        hatching_method: 'Systematic evaluation: Document a difficult decision using ethical frameworks, track outcomes.',
        wellness_benefits: { intellectual: 'clarity', social: 'fairness', occupational: 'decision-making' }
      },
      {
        number: 7,
        name: 'Exchange Egg',
        elements: ['Coin'],
        die: 'D2',
        question: 'What value serves whose benefit?',
        hatching_method: 'Value assessment: Track all exchanges (money, favors, attention) for 30 days, analyze patterns.',
        wellness_benefits: { financial: 'awareness', social: 'reciprocity', emotional: 'generosity' }
      }
    ];

    for (const egg of foundationalEggs) {
      await sql`
        INSERT INTO garu_eggs (
          egg_number, name, elements, die, question,
          hatching_method, wellness_benefits, tier, prerequisites
        ) VALUES (
          ${egg.number}, ${egg.name}, ${egg.elements}, ${egg.die}, ${egg.question},
          ${egg.hatching_method}, ${JSON.stringify(egg.wellness_benefits)}, 'foundational', '{}'
        )
        ON CONFLICT (egg_number) DO UPDATE SET
          name = EXCLUDED.name,
          question = EXCLUDED.question,
          hatching_method = EXCLUDED.hatching_method,
          wellness_benefits = EXCLUDED.wellness_benefits
      `;
    }
    console.log('   ✓ 8 foundational eggs seeded');

    console.log('\n🎉 TEK8 & Garu Eggs migration completed successfully!');
    console.log('\nTables created:');
    console.log('  - tek8_profiles: Player elemental distributions (360° total)');
    console.log('  - garu_eggs: 64 contemplation eggs (8 foundational seeded)');
    console.log('  - egg_progress: Player egg journey tracking');
    console.log('  - wellness_activities: Daily practice logging');
    console.log('  - governance_proposals: Nation proposals with elemental domains');
    console.log('  - governance_votes: TEK8-weighted voting');
    console.log('\nNext steps:');
    console.log('  1. Seed remaining 56 Garu Eggs (dual, triple, quad, quint-element)');
    console.log('  2. Build TEK8 quiz API (/api/tek8/quiz)');
    console.log('  3. Build Garu Egg journey API (/api/garu-eggs/*)');
    console.log('  4. Build wellness tracking API (/api/wellness/*)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
