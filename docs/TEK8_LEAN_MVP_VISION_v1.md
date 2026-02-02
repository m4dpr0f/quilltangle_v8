# TEK8 Lotus Core: Lean MVP Vision

**Version:** 1.0
**Date:** January 31, 2026
**Focus:** Exploration, Sharing, TTRPG Campaign Support

---

## Core Philosophy

TEK8 is a **Net of Play** - a social learning system that weaves ancient wisdom with modern engagement. It is NOT a crypto speculation platform. Tokens represent **creative engagement**, not financial instruments.

> "What if our democracy was a living story? What if our politics were a multiplayer game?"

---

## The 40 Roads

The TEK8 Lotus has **8 petals × 5 positions = 40 roads**. Each road is a developmental territory for exploration, learning, and creative expression.

### 8 Petals (Elemental Dice)

| Die | Element | Sense | Ability | Wellness | Capital | IB AoK |
|-----|---------|-------|---------|----------|---------|--------|
| D12 | Ether | Sound | Creativity | Emotional | Cultural | Arts |
| D8 | Air | Touch | Strength | Physical | Natural | Natural Sciences |
| D4 | Fire | Sight | Agility | Occupational | Material | Ethics |
| D20 | Water | Taste | Empathy | Environmental | Experiential | History |
| D6 | Earth | Smell | Endurance | Spiritual | Spiritual | Indigenous Knowledge |
| D10 | Chaos | Mind | Willpower | Social | Social | Human Sciences |
| D100 | Order | Intelligence | Focus | Intellectual | Intellectual | Religious Knowledge |
| D2 | Coin | Wealth | Instinct | Financial | Financial | Mathematics |

### 5 Positions per Petal

Each petal has 5 positions creating a spiral path:

1. **OUT** - Outer ring, beginner exploration
2. **UP** - Ascending path, growth
3. **DOWN** - Descending path, depth
4. **U45** - Upper diagonal, synthesis
5. **D45** - Lower diagonal, integration

**Total: 40 Roads** (D2OUT, D2UP, D2DWN, D2U45, D2D45, D4OUT, ... D100D45)

---

## MVP Features

### 1. Roads Explorer
- Visual lotus navigation
- Territory descriptions tied to element/ability/wellness
- Progress tracking across all 40 roads
- No financial barriers - play to learn, not pay to win

### 2. GCN Token Creation
When a creator makes a GCN (Global Creative Network) token:
- **Purpose**: Promote engagement with their character/universe/brand
- **NOT speculation**: Tokens represent creative contribution, not investment
- **Territory Assignment**: Each token aligns with a road based on its element
- **Engagement Tools**: Quests, stories, challenges tied to the token's universe

**Token Types:**
- **Character Tokens**: Represent a TTRPG character or avatar
- **Universe Tokens**: Represent a story world or campaign setting
- **Brand Tokens**: Represent a creative project or community

### 3. TTRPG Campaign Support

All complex RPG mechanics live in **PDF and HTML** formats:

**Character Sheets:**
- TEK8-aligned stat blocks (8 abilities from 8 petals)
- Printable PDFs for table play
- Interactive HTML for digital sessions
- Export/import between formats

**Campaign Tools:**
- Session logs tied to road exploration
- NPC generators using TEK8 alignment
- Quest templates per petal
- World-building worksheets

**The CrySword Saga System:**
- Word-count mechanics (D2 = 2 words, D100 = 100 words)
- Crystal Sword schools as character classes
- Codex progression for cross-petal learning
- Refugee Council democracy for group decisions

### 4. Sharing Between Roads

Players can:
- **Share tokens** between territories (gifts, not trades)
- **Collaborate** on cross-petal projects
- **Build together** in shared story spaces
- **Recognize** contributions through karma/XP (not coin speculation)

---

## What This MVP Does NOT Include

- Heavy crypto trading mechanics
- Speculation-focused token economics
- Pay-to-win barriers
- Complex on-chain transactions for basic play
- Minecraft integrations

---

## Technical Architecture

### Web Platform (Astro.js)

```
/roads           - 40 Roads visual explorer
/create          - GCN token creation (character/universe/brand)
/campaign        - TTRPG campaign management
/sheets          - Character sheet generator (PDF/HTML)
/share           - Token sharing between players
/profile         - Player progress across roads
```

### Database Schema

```sql
-- Player profiles with TEK8 alignment
tek8_profiles (
  user_wallet,
  primary_petal,
  secondary_petal,
  element_distribution JSONB,
  roads_explored TEXT[],
  xp_per_petal JSONB
)

-- Creative tokens (not financial)
gcn_tokens (
  id,
  creator_wallet,
  name,
  token_type (character | universe | brand),
  aligned_road TEXT,
  description,
  engagement_quests JSONB,
  image_url
)

-- Campaign/TTRPG support
campaigns (
  id,
  gm_wallet,
  name,
  aligned_roads TEXT[],
  session_logs JSONB,
  characters INTEGER[]
)

-- Character sheets
character_sheets (
  id,
  owner_wallet,
  campaign_id,
  name,
  crystal_sword_school TEXT,
  stats JSONB, -- 8 petal abilities
  codex_progress JSONB,
  sheet_data JSONB
)
```

### PDF/HTML Generation

- **jsPDF** or **react-pdf** for character sheet PDFs
- **HTML templates** with print-friendly CSS
- **Export formats**: PDF, HTML, JSON (for import/export)

---

## User Journeys

### Journey 1: New Explorer
1. Take TEK8 quiz to discover primary petal
2. Explore your home road (e.g., D12OUT for Ether)
3. Meet other explorers in your territory
4. Discover tokens/characters from that road
5. Begin cross-road exploration

### Journey 2: Character Creator
1. Create a GCN token for your character
2. Assign it to a road based on element
3. Build engagement quests for others
4. Generate PDF/HTML character sheet
5. Share with campaign group

### Journey 3: Campaign Runner
1. Create a campaign tied to specific roads
2. Generate NPCs using TEK8 alignment
3. Track sessions and player progress
4. Export session summaries
5. Manage character roster

### Journey 4: TTRPG Player
1. Create character using CrySword system
2. Choose Crystal Sword school
3. Download character sheet (PDF or HTML)
4. Play sessions, log progress
5. Advance through Codex mastery

---

## Token Engagement (Not Speculation)

When someone creates a GCN token:

**For Characters:**
- Background story quest
- Ability challenge (word-count resonance)
- Cross-road adventure hooks
- NPC interaction prompts

**For Universes:**
- Lore exploration quests
- World-building challenges
- Map/territory development
- Faction diplomacy scenarios

**For Brands:**
- Community challenges
- Creative prompts
- Collaboration opportunities
- Recognition milestones

---

## The CrySword Saga Integration

The TTRPG system from the core documents becomes the **campaign engine**:

### Crystal Sword Schools (8 Classes)
Each school maps to a petal:
- D12 Ether → Dream Weavers
- D8 Air → Sky Dancers
- D4 Fire → Forge Masters
- D20 Water → Flow Keepers
- D6 Earth → Ground Builders
- D10 Chaos → Wild Shapers
- D100 Order → Archive Seekers
- D2 Coin → Luck Riders

### Word-Weaving Mechanics
- Actions require word counts matching your die
- D4 Fire = 4-word declarations
- D100 Order = 100-word analyses
- Cross-school collaboration for complex challenges

### Codex Progression
- 500 words → Initiate access to another school
- 1500 words → Adept access
- 3000 words → Insider access
- 5000 words → Master access

---

## Implementation Priority

### Phase 1: Core Navigation
- [ ] 40 Roads visual explorer
- [ ] TEK8 quiz for petal discovery
- [ ] Basic player profiles
- [ ] Road descriptions and lore

### Phase 2: Character Tools
- [ ] Character sheet generator
- [ ] PDF export
- [ ] HTML export
- [ ] CrySword class selection

### Phase 3: Campaign Support
- [ ] Campaign creation
- [ ] Session logging
- [ ] NPC generator
- [ ] Quest templates

### Phase 4: Token Engagement
- [ ] GCN token creation (simplified)
- [ ] Token-to-road alignment
- [ ] Engagement quest builder
- [ ] Sharing between players

---

## Guiding Principles

1. **Play to Learn** - No pay-to-win mechanics
2. **Engagement over Speculation** - Tokens represent creativity, not investment
3. **Print-Friendly** - TTRPG tools work offline
4. **Inclusive** - Accessible across devices and abilities
5. **Regenerative** - Build community, not extraction

---

## Summary

The TEK8 Lean MVP focuses on:

| Feature | Purpose |
|---------|---------|
| 40 Roads | Developmental playground for exploration |
| GCN Tokens | Creative engagement tools (not financial) |
| TTRPG Support | PDF/HTML character sheets and campaign tools |
| Sharing | Gift economy between players |

**What we're building:** A Net of Play where tokens promote engagement with characters, universes, and brands - not speculation.

**What we're NOT building:** A crypto trading platform.

---

*"Let us play to govern. Let us govern to heal."*
— m4dpr0f
