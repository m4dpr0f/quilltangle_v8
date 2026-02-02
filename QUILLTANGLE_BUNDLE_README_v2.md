# Quilltangle v8 - Lean MVP Bundle

**Date:** January 31, 2026
**Version:** 8.1 (Lean MVP Edition)
**Codename:** Net of Play

---

## Overview

This bundle contains the TEK8 Lotus Core platform focused on:
- **40 Roads exploration** - Developmental territories for personal growth
- **GCN Token creation** - For characters, universes, and brands (NOT speculation)
- **TTRPG support** - CrySword Saga character sheets in PDF/HTML
- **Garu digipet system** - Tamagotchi-style companion lifecycle

**What this is NOT:** A crypto speculation platform or a Minecraft integration.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
node scripts/setup-database.mjs

# Start development server
npm run dev
```

---

## Core Philosophy

> "What if our democracy was a living story? What if our politics were a multiplayer game?"

TEK8 is a **Net of Play** (SAGAPA) - a social learning system that weaves ancient wisdom with modern engagement. Tokens represent **creative engagement**, not financial instruments.

---

## The 40 Roads

The TEK8 Lotus has **8 petals × 5 positions = 40 roads**.

### 8 Petals (Elemental Dice)

| Die | Element | Ability | Wellness | IB Area | Crystal School |
|-----|---------|---------|----------|---------|----------------|
| D12 | Ether | Creativity | Emotional | Arts | Dream Weavers |
| D8 | Air | Strength | Physical | Natural Sciences | Sky Dancers |
| D4 | Fire | Agility | Occupational | Ethics | Forge Masters |
| D20 | Water | Empathy | Environmental | History | Flow Keepers |
| D6 | Earth | Endurance | Spiritual | Indigenous Knowledge | Ground Builders |
| D10 | Chaos | Willpower | Social | Human Sciences | Wild Shapers |
| D100 | Order | Focus | Intellectual | Religious Knowledge | Archive Seekers |
| D2 | Coin | Instinct | Financial | Mathematics | Luck Riders |

### 5 Positions per Petal

1. **OUT** - Outer ring, beginner exploration
2. **UP** - Ascending path, growth
3. **DWN** - Descending path, depth
4. **U45** - Upper diagonal, synthesis
5. **D45** - Lower diagonal, integration

---

## Key Features

### 1. Roads Explorer (`/roads`)
- Visual lotus navigation
- 40 territory descriptions
- Grid, lotus, and list views
- Progress tracking

### 2. GCN Token Creation (`/create`)
Token types for creative engagement:
- **Character Tokens** - TTRPG characters and avatars
- **Universe Tokens** - Story worlds and campaign settings
- **Brand Tokens** - Creative projects and communities

### 3. Character Sheets (`/sheets`)
CrySword Saga TTRPG tools:
- 8 elemental stats (mapped to petals)
- Crystal Sword school selection
- Codex progression tracking
- Export to printable HTML
- JSON import/export

### 4. Garu Digipet System (`/garu`)
Complete lifecycle management:
- 8-dimension wellness care
- Egg → Hatching → Journey → Legacy
- Resurrection through music and memories
- Fusion system for composite types

---

## Directory Structure

```
quilltangle_v8/
├── docs/                    # Documentation
│   ├── TEK8_LEAN_MVP_VISION_v1.md
│   ├── GARU_LIFECYCLE_SYSTEM_v1.md
│   ├── GARU_RESURRECTION_GUIDE_v1.md
│   └── ...
├── core/                    # Core design documents
│   ├── CRYSWORD_SAGA_TTRPG_DESIGN.md
│   └── ...
├── scripts/                 # Database migrations
│   ├── setup-database.mjs
│   └── ...
├── src/
│   ├── islands/            # React components
│   │   ├── RoadsExplorer.tsx      # 40 Roads visual explorer
│   │   ├── CharacterSheetGenerator.tsx  # TTRPG sheets
│   │   ├── GaruCare.tsx           # Digipet care
│   │   └── ...
│   ├── pages/              # Astro pages
│   │   ├── roads_v2.astro         # Roads explorer page
│   │   ├── sheets.astro           # Character sheets page
│   │   ├── garu.astro             # Garu hub
│   │   └── ...
│   └── lib/                # Shared utilities
│       ├── tek8-roads.ts          # 40 roads data structure
│       └── ...
└── public/                 # Static assets
```

---

## CrySword Saga TTRPG System

### Word-Weaving Mechanics

Actions require word-count declarations matching your die:

| School | Die | Words | Style |
|--------|-----|-------|-------|
| Luck Riders | D2 | 2 | Quick decisions |
| Forge Masters | D4 | 4 | Direct action |
| Ground Builders | D6 | 6 | Solid foundation |
| Sky Dancers | D8 | 8 | Flowing movement |
| Wild Shapers | D10 | 10 | Chaotic change |
| Dream Weavers | D12 | 12 | Creative vision |
| Flow Keepers | D20 | 20 | Emotional depth |
| Archive Seekers | D100 | 100 | Deep analysis |

### Codex Progression

Write words to gain cross-school access:

| Rank | Words |
|------|-------|
| Novice | 0 |
| Initiate | 500 |
| Adept | 1,500 |
| Insider | 3,000 |
| Master | 5,000 |

---

## Garu Lifecycle

```
Chaos Shard → Claim Egg → 25+ Days Care → Hatch → Journey → Death → Legacy Eggs → Resurrection
```

### 8 Wellness Dimensions
Physical, Emotional, Intellectual, Social, Occupational, Spiritual, Environmental, Financial

### Resurrection System
- Create musical tracks and journal entries during life
- These become "save points" for resurrection
- A descendant Garu can channel the resurrection
- More memories = better restoration quality

---

## Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL_8XM=postgresql://...

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TREASURY_WALLET_PUBLIC_KEY=...

# File Storage (Pinata/IPFS)
PINATA_JWT=...
PINATA_GATEWAY=gateway.pinata.cloud

# Admin
ADMIN_WALLET=E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj
```

---

## Guiding Principles

1. **Play to Learn** - No pay-to-win mechanics
2. **Engagement over Speculation** - Tokens represent creativity, not investment
3. **Print-Friendly** - TTRPG tools work offline
4. **Inclusive** - Accessible across devices and abilities
5. **Regenerative** - Build community, not extraction

---

## What We're Building

| Feature | Purpose |
|---------|---------|
| 40 Roads | Developmental playground for exploration |
| GCN Tokens | Creative engagement tools (not financial) |
| TTRPG Support | PDF/HTML character sheets and campaign tools |
| Garu System | Companion lifecycle with resurrection mechanics |

**What we're NOT building:** A crypto trading platform or Minecraft integrations.

---

*"Let us play to govern. Let us govern to heal."*
— m4dpr0f

