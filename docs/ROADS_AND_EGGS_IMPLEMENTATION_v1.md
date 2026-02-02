# Roads & Eggs Implementation Guide
## How the Lore Translates to Platform Features

---

## Overview: The Complete Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAYER JOURNEY                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DISCOVER       2. CONTEMPLATE      3. CREATE             │
│  ───────────       ──────────────      ────────              │
│  Choose Guild  →   Answer Garu Egg  →  Launch Nation Token   │
│  (TEK8 Quiz)       (30-day journey)    (8xM Launchpad)       │
│                                                              │
│       ↓                                                      │
│                                                              │
│  6. REGENERATE  ←  5. PARTICIPATE  ←  4. CLAIM               │
│  ────────────      ─────────────      ─────                  │
│  Real-world        Nation building,   Stake tokens,          │
│  wellness impact   governance         claim Rainbow Road     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions Needed

### Table: `garu_eggs`
```sql
CREATE TABLE garu_eggs (
  id SERIAL PRIMARY KEY,
  egg_number INTEGER UNIQUE NOT NULL, -- 0-64
  name VARCHAR(100) NOT NULL,
  elements TEXT[] NOT NULL, -- Array of element names
  question TEXT NOT NULL,
  hatching_method TEXT NOT NULL,
  hatching_duration_days INTEGER DEFAULT 30,
  wellness_benefits JSONB,
  prerequisites INTEGER[], -- egg_numbers that must be completed first
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `egg_progress`
```sql
CREATE TABLE egg_progress (
  id SERIAL PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  egg_id INTEGER REFERENCES garu_eggs(id),
  started_at TIMESTAMP DEFAULT NOW(),
  phase VARCHAR(20) DEFAULT 'contemplation', -- contemplation, practice, integration, complete
  journal_entries JSONB DEFAULT '[]',
  answer_text TEXT,
  completed_at TIMESTAMP,
  verified_by TEXT, -- wallet of verifying elder
  UNIQUE(user_wallet, egg_id)
);
```

### Table: `tek8_profiles`
```sql
CREATE TABLE tek8_profiles (
  id SERIAL PRIMARY KEY,
  user_wallet TEXT UNIQUE NOT NULL,
  primary_guild VARCHAR(10) NOT NULL, -- D2, D4, D6, D8, D10, D12, D20, D100
  secondary_guild VARCHAR(10),
  sacred_instrument VARCHAR(50),
  element_distribution JSONB, -- {fire: 45, earth: 60, air: 45, ...} (totals 360)
  quiz_answers JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `rainbow_roads` (enhancement)
```sql
ALTER TABLE rainbow_roads ADD COLUMN IF NOT EXISTS
  associated_egg INTEGER REFERENCES garu_eggs(id);

ALTER TABLE rainbow_roads ADD COLUMN IF NOT EXISTS
  founder_egg_completed BOOLEAN DEFAULT false;

ALTER TABLE rainbow_roads ADD COLUMN IF NOT EXISTS
  nation_lore TEXT;

ALTER TABLE rainbow_roads ADD COLUMN IF NOT EXISTS
  nation_flag_url TEXT;

ALTER TABLE rainbow_roads ADD COLUMN IF NOT EXISTS
  founding_document TEXT;
```

### Table: `wellness_activities`
```sql
CREATE TABLE wellness_activities (
  id SERIAL PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- meditation, instrument_practice, journaling, etc.
  element VARCHAR(20) NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  logged_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints Needed

### GET `/api/garu-eggs`
Returns all 64 eggs with progress for authenticated user.

```typescript
// Response
{
  success: true,
  eggs: [
    {
      id: 0,
      number: 0,
      name: "Echo Egg",
      element: "Ether",
      die: "D12",
      question: "Who am I, beyond the echo of my own voice?",
      hatchingMethod: "Musical self-reflection",
      wellnessBenefits: ["authentic self-expression", "reduced social anxiety"],
      userProgress: {
        phase: "practice",
        startedAt: "2024-01-15",
        journalEntries: 12,
        daysRemaining: 18
      }
    },
    // ... eggs 1-64
  ]
}
```

### POST `/api/garu-eggs/start`
Begin contemplating an egg.

```typescript
// Request
{
  eggNumber: 0,
  walletAddress: "E3Lz..."
}

// Response
{
  success: true,
  message: "Egg contemplation begun. Your 30-day journey starts now.",
  egg: { ... },
  nextSteps: [
    "Read the question daily",
    "Begin journaling your thoughts",
    "Practice your sacred instrument"
  ]
}
```

### POST `/api/garu-eggs/journal`
Add a journal entry for an egg.

```typescript
// Request
{
  eggNumber: 0,
  walletAddress: "E3Lz...",
  entry: "Today I noticed that when I sing, I feel more like myself than...",
  activityType: "reflection" // reflection, dream, observation, practice
}

// Response
{
  success: true,
  totalEntries: 13,
  phase: "practice",
  encouragement: "You're halfway through your contemplation. Keep going!"
}
```

### POST `/api/garu-eggs/complete`
Submit final answer for verification.

```typescript
// Request
{
  eggNumber: 0,
  walletAddress: "E3Lz...",
  answer: "After 30 days of contemplation, I understand that beyond my voice..."
}

// Response
{
  success: true,
  status: "pending_verification",
  message: "Your answer has been submitted for elder verification.",
  estimatedReviewTime: "3-5 days"
}
```

### GET `/api/tek8/quiz`
Returns the TEK8 guild assessment quiz.

```typescript
// Response
{
  success: true,
  questions: [
    {
      id: 1,
      question: "When facing a problem, your first instinct is to:",
      options: [
        { value: "D4", text: "Take immediate action to change it" },
        { value: "D6", text: "Wait patiently for clarity" },
        { value: "D8", text: "Research and gather information" },
        { value: "D20", text: "Feel your way through the emotions" }
      ]
    },
    // ... more questions
  ]
}
```

### POST `/api/tek8/quiz/submit`
Submit quiz and get guild assignment.

```typescript
// Request
{
  walletAddress: "E3Lz...",
  answers: { "1": "D4", "2": "D12", ... }
}

// Response
{
  success: true,
  primaryGuild: "D12",
  secondaryGuild: "D8",
  elementDistribution: {
    ether: 90,
    air: 60,
    fire: 45,
    water: 45,
    earth: 40,
    chaos: 35,
    order: 30,
    coin: 15
  },
  recommendations: {
    garuEgg: 0, // Echo Egg
    sacredInstruments: ["Didgeridoo", "Harp", "Contrabass"],
    roads: ["D12OUT", "D12UP", "D12U45"]
  }
}
```

### GET `/api/roads/available`
Get unclaimed roads matching user's profile.

### POST `/api/roads/claim`
Claim a road (requires completed Garu Egg).

---

## Frontend Components Needed

### 1. TEK8 Quiz Component
`/src/islands/TEK8Quiz.tsx`

Features:
- 20 questions determining elemental distribution
- Visual 360° wheel showing results
- Guild assignment with explanation
- Sacred instrument recommendations
- Suggested roads and Garu Eggs

### 2. Garu Egg Journey Component
`/src/islands/GaruEggJourney.tsx`

Features:
- Egg selection based on profile
- Daily contemplation prompt
- Journal entry interface
- Progress tracker (30 days)
- Hatching ritual guide
- Answer submission form

### 3. Wellness Dashboard Component
`/src/islands/WellnessDashboard.tsx`

Features:
- Daily practice logging
- 8-dimension wellness wheel
- Streak tracking
- Community accountability
- Regenerative impact meter

### 4. Nation Lore Builder Component
`/src/islands/NationLoreBuilder.tsx`

Features:
- Founding document editor
- Flag/symbol uploader
- Origin story template
- Values declaration
- Governance structure picker

### 5. Road Claim Flow Component
`/src/islands/RoadClaimFlow.tsx`

Features:
- Road browser with filters
- Egg completion verification
- Reciprocity stake calculator
- Nation naming ceremony
- Claim transaction builder

---

## Page Routes Needed

| Route | Purpose |
|-------|---------|
| `/journey` | Main player journey dashboard |
| `/journey/quiz` | TEK8 assessment |
| `/journey/egg/[number]` | Individual egg contemplation |
| `/journey/wellness` | Wellness tracking |
| `/roads` | Rainbow Roads explorer (exists, enhance) |
| `/roads/claim` | Road claiming flow |
| `/nation/[roadId]/lore` | Nation lore viewer/editor |
| `/learn` | Educational content hub |
| `/learn/blockchain` | Blockchain basics for families |
| `/learn/quillverse` | Quillverse lore encyclopedia |

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. [ ] Create `garu_eggs` table and seed with 64 eggs
2. [ ] Create `tek8_profiles` table
3. [ ] Build TEK8 Quiz API and component
4. [ ] Basic `/journey` page

### Phase 2: Egg System (Week 3-4)
1. [ ] Create `egg_progress` table
2. [ ] Build Garu Egg Journey component
3. [ ] Journal entry API
4. [ ] Progress tracking and notifications

### Phase 3: Road Integration (Week 5-6)
1. [ ] Enhance rainbow_roads table
2. [ ] Connect eggs to road claiming
3. [ ] Nation Lore Builder component
4. [ ] Road claim flow with egg verification

### Phase 4: Wellness (Week 7-8)
1. [ ] Create `wellness_activities` table
2. [ ] Wellness Dashboard component
3. [ ] Daily practice reminders
4. [ ] Community accountability features

### Phase 5: Education (Week 9-10)
1. [ ] `/learn` hub pages
2. [ ] Interactive blockchain lessons
3. [ ] Family mode features
4. [ ] Parental controls

---

## Data Seeding: The 64 Eggs

```typescript
const GARU_EGGS = [
  // Foundational Eggs (0-7)
  {
    number: 0,
    name: "Echo Egg",
    elements: ["Ether"],
    die: "D12",
    question: "Who am I, beyond the echo of my own voice?",
    hatching_method: "Musical self-reflection: Spend 30 minutes making sound, record yourself answering the question aloud, listen back and write what you discover.",
    wellness_benefits: { physical: "voice health", emotional: "self-expression", spiritual: "authentic identity" }
  },
  {
    number: 1,
    name: "Flare Egg",
    elements: ["Fire"],
    die: "D4",
    question: "What substance hides within the heart of every flame?",
    hatching_method: "Trial by transformation: Identify something needing change, take action, document resistance and breakthrough.",
    wellness_benefits: { physical: "metabolism", emotional: "courage", occupational: "initiative" }
  },
  // ... continue for all 64
];
```

---

## Token Integration

### How Eggs Connect to Tokens

1. **Completing an Egg** → Unlocks ability to claim roads of that element
2. **Claiming a Road** → Requires 1% reciprocity stake of your GCN token
3. **Nation Activity** → Generates "Life Force" on the Metaphysics Index
4. **Wellness Logging** → Increases nation's "Vitality Index"

### No Financial Incentives

The system explicitly avoids:
- ❌ Token rewards for completing eggs
- ❌ Staking yields or interest
- ❌ Price appreciation mechanics
- ❌ Scarcity-driven FOMO

Instead, value flows through:
- ✅ Creative contribution recognition
- ✅ Community standing
- ✅ Governance participation rights
- ✅ Wellness metric improvement

---

## Example User Flow

### New Player: "Alex"

**Day 1**:
- Visits 8xm.fun
- Takes TEK8 Quiz
- Results: Primary D20 (Water), Secondary D8 (Air)
- Recommended: Tide Egg (#5), Saxophone, Road D20OUT

**Days 2-31**:
- Begins Tide Egg contemplation
- Journals daily about "When does memory become prophecy?"
- Interviews grandmother (hatching method)
- Practices saxophone 15 min/day
- Logs wellness activities

**Day 32**:
- Submits Tide Egg answer
- Answer verified by nation elder
- Egg marked complete
- Unlocks D20 road claiming

**Day 35**:
- Decides to found nation on D20OUT
- Stakes 1% of personal token (or joins existing nation)
- Names nation "The Tidal Collective"
- Writes founding document
- Creates flag with wave motif

**Days 36+**:
- Builds nation community
- Welcomes citizens
- Hosts weekly gatherings
- Contributes to governance
- Mentors new players
- Begins Dual-Element Egg (Rainstorm: Air + Water)

---

## Success Metrics (Non-Financial)

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Eggs Hatched | Player growth journeys completed | 1000/month |
| Journal Entries | Contemplative engagement | 10/user/month |
| Wellness Minutes | Active practice time | 30/user/week |
| Nations Founded | Community formation | 5/month |
| Elder Verifications | Mentorship activity | 50/month |
| Cross-Nation Visits | Community connection | 100/week |

---

*"The road is the question. The egg is the journey. The nation is the answer you build together."*
