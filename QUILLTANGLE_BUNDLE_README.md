# Quilltangle v8 - Complete Platform Bundle

**Date:** January 31, 2026
**Version:** 8.0
**Codename:** Resurrection Edition

---

## Overview

This bundle contains the complete 8xM/Quillverse platform including:
- Full Astro.js web application
- Garu digipet lifecycle system (tamagotchi-style)
- TEK8 8-element dice system
- Token launchpad and verification system
- Rainbow Roads territory system
- Comprehensive documentation

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations (in order)
node scripts/setup-database.mjs
node scripts/add-tek8-garu-tables.mjs
node scripts/add-garu-lifecycle-tables.mjs
node scripts/update-garu-tables-v2.mjs
node scripts/add-garu-resurrection-tables.mjs
node scripts/add-verification-columns.mjs

# Start development server
npm run dev
```

---

## Garu Digipet System

The heart of Quilltangle v8 - a complete tamagotchi-style pet system.

### Lifecycle
```
Chaos Shard → Claim Egg → 25+ Days Care → Hatch → Journey → Death → Legacy Eggs → Resurrection
```

### Features
- **8 Wellness Dimensions**: Physical, Emotional, Intellectual, Social, Occupational, Spiritual, Environmental, Financial
- **Territory Tracking**: Garu visit territories, which determines where eggs spawn on death
- **Fusion System**: Combine Garu to create composite elemental types (Magma, Storm, Rainbow Bridge)
- **Resurrection System**: Music and writings act as save points to bring back fallen Garu

### APIs (`/api/garu/`)
| Endpoint | Purpose |
|----------|---------|
| `index.ts` | Get player's Garu, claim wild eggs |
| `care.ts` | Daily 8-dimension wellness care |
| `hatch.ts` | Check readiness & execute hatching |
| `death.ts` | Process death, spawn legacy eggs |
| `fusion.ts` | Propose, accept, execute fusions |
| `legacy.ts` | Death records, Hall of Fame |
| `memory.ts` | Create musical tracks & journal entries |
| `resurrect.ts` | Resurrection ritual |

### Pages (`/garu/`)
- `/garu` - Main care hub
- `/garu/eggs` - Find wild eggs
- `/garu/memories` - Create save points
- `/garu/resurrect` - Resurrection shrine
- `/garu/fusion` - Fusion chamber
- `/garu/legacy` - Hall of Fame

---

## TEK8 System

8 dice representing 8 elements:

| Die | Element | Domain |
|-----|---------|--------|
| D2 | Coin | Financial decisions |
| D4 | Fire | Passion, creativity |
| D6 | Earth | Stability, practicality |
| D8 | Air | Communication, ideas |
| D10 | Chaos | Change, randomness |
| D12 | Ether | Spirituality, intuition |
| D20 | Water | Emotion, adaptability |
| D100 | Order | Structure, systems |

### APIs (`/api/tek8/`)
- `quiz.ts` - 16-question elemental distribution quiz

---

## Token System

### Launchpad (`/api/launchpad/`)
- Create and launch tokens
- Verification system (pending → verified/flagged)
- Admin review panel

### Trinity Tokens
- **QLX** (Quilux) - Governance token
- **QLY** (Quilei) - Utility/rewards token
- **QLZ** (Quiloz) - Staking/treasury token

---

## Database Migrations

Run in order:

1. **setup-database.mjs** - Base tables (tokens, users, etc.)
2. **add-tek8-garu-tables.mjs** - TEK8 profiles, contemplation eggs
3. **add-garu-lifecycle-tables.mjs** - Core Garu system (8 tables, 80 primordial eggs)
4. **update-garu-tables-v2.mjs** - Fusion system columns
5. **add-garu-resurrection-tables.mjs** - Memory and resurrection tables
6. **add-verification-columns.mjs** - Token verification system

---

## Directory Structure

```
quilltangle_v8/
├── docs/                    # Comprehensive documentation
│   ├── GARU_LIFECYCLE_SYSTEM_v1.md
│   ├── QUILLVERSE-ARCHITECTURE_v1.2.md
│   ├── QUILLVERSE_PLAYER_GUIDE_v1.md
│   ├── TEK8_GOVERNANCE_ECONOMY_v1.md
│   └── ... (13 documentation files)
├── scripts/                 # Database migrations
│   ├── setup-database.mjs
│   ├── add-garu-lifecycle-tables.mjs
│   ├── add-garu-resurrection-tables.mjs
│   └── ... (9 migration scripts)
├── src/
│   ├── islands/            # React components (client-side)
│   │   ├── GaruCare.tsx
│   │   ├── GaruFusion.tsx
│   │   ├── GaruLegacy.tsx
│   │   ├── GaruMemories.tsx
│   │   ├── GaruResurrection.tsx
│   │   ├── WildEggExplorer.tsx
│   │   ├── Launchpad.tsx
│   │   └── ...
│   ├── pages/              # Astro pages and API routes
│   │   ├── api/
│   │   │   ├── garu/       # Garu system APIs
│   │   │   ├── tek8/       # TEK8 APIs
│   │   │   ├── launchpad/  # Token launchpad APIs
│   │   │   └── ...
│   │   ├── garu/           # Garu pages
│   │   └── ...
│   ├── layouts/            # Astro layouts
│   ├── lib/                # Shared utilities
│   └── styles/             # Global styles
├── public/                 # Static assets
├── 8XM_PLATFORM_VISION_v1.md
├── GAME_DESIGN_DOCUMENT_v1.md
├── RAINBOW_ROADS_ANALYSIS_v1.md
└── README.md
```

---

## Environment Variables

Required in `.env`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL_8XM=postgresql://...

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TREASURY_WALLET_PUBLIC_KEY=...
TREASURY_WALLET_SECRET_KEY=...

# File Storage (Pinata/IPFS)
PINATA_JWT=...
PINATA_GATEWAY=gateway.pinata.cloud

# Admin
ADMIN_WALLET=E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj
```

---

## Key Design Principles

### Abundance Through Legacy
When a Garu dies, their energy spawns eggs across every territory they visited. More experienced Garu = more eggs = abundance for all players.

### Music as Save Points
Players create musical tracks during their Garu's life. These become resurrection anchors - combining music with a descendant Garu can bring back fallen companions.

### 8-Dimensional Wellness
Care for your Garu across 8 wellness dimensions. This maps directly to player self-care, making the game a wellness practice.

### Player Agency Over Speculation
The Quilux economy generates value through play, not speculation. Financial tokens exist but player agency always comes first.

---

## Composite Garu Types

| Type | Elements | Rarity |
|------|----------|--------|
| Magma | Fire + Earth | Uncommon |
| Lightning | Fire + Air | Uncommon |
| Storm | Water + Air | Uncommon |
| Ice | Water + Air | Uncommon |
| Void | Chaos + Ether | Rare |
| Crystal | Earth + Order | Rare |
| Phoenix | Fire + Ether + Chaos | Epic |
| Leviathan | Water + Earth + Chaos | Epic |
| Celestial | Air + Ether + Order | Epic |
| Prism | Fire + Water + Air + Earth | Legendary |
| Rainbow Bridge | All 8 Elements | Mythic |

---

## Resurrection Requirements

| Quality | Requirement | Restoration |
|---------|-------------|-------------|
| Partial | 1 memory | 50% level/stats |
| Substantial | 1+ track OR 2+ writings | 75% level, 70% stats |
| Full | 3+ tracks + 1 writing | 100% level, 90% stats |

Plus: A living descendant Garu (from legacy eggs)

---

## Support & Community

- **Issues**: https://github.com/anthropics/claude-code/issues
- **Documentation**: See `/docs` folder
- **Admin Wallet**: E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj

---

## License

Quillverse / 8xM Platform - Educational and Entertainment Use

---

*Mahalo for being part of the Quillverse!*
