# Quillverse Architecture & Systems Guide
**Version 1.0 | January 2025**

## Table of Contents

1. [Overview](#overview)
2. [The Trinity Token System](#the-trinity-token-system)
3. [Realms, Essences & Pillars](#realms-essences--pillars)
4. [Rainbow Roads Grid System](#rainbow-roads-grid-system)
5. [Token-to-Coordinate Mapping](#token-to-coordinate-mapping)
6. [TEK8 Guild System](#tek8-guild-system)
7. [Territory Control System](#territory-control-system)
8. [Creation & Expansion Flow](#creation--expansion-flow)
9. [Combat & Contest Mechanics](#combat--contest-mechanics)
10. [Diplomacy & Alliances](#diplomacy--alliances)
11. [Audio Architecture](#audio-architecture)
12. [3D World Integration](#3d-world-integration)
13. [Partnership Structure](#partnership-structure)
14. [Database Schema](#database-schema)
15. [API Reference](#api-reference)

---

## Overview

The Quillverse is a decentralized creator economy where participants establish **Galactic Cluster Nations (GCNs)** by engaging three interconnected realms through token-based activities, territorial expansion, and collaborative world-building.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE QUILLVERSE ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐            │
│    │     QLX      │      │     QLY      │      │     QLZ      │            │
│    │   🌱 SEED    │      │   🥚 EGG     │      │  ☄️ METEORITE │            │
│    │    Plant     │      │    Animal    │      │    Mineral   │            │
│    │   Culture    │      │   Business   │      │   Character  │            │
│    │   & Music    │      │   & Sports   │      │ & Technology │            │
│    └──────┬───────┘      └──────┬───────┘      └──────┬───────┘            │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 │                                           │
│                    ┌────────────┴────────────┐                              │
│                    │    RAINBOW ROADS        │                              │
│                    │    40 Territories       │                              │
│                    │    8 Dice × 5 Dirs      │                              │
│                    └────────────┬────────────┘                              │
│                                 │                                           │
│           ┌─────────────────────┼─────────────────────┐                     │
│           │                     │                     │                     │
│    ┌──────┴───────┐      ┌──────┴───────┐      ┌──────┴───────┐            │
│    │   8xM.fun    │      │ quillverse   │      │   quilu.xyz  │            │
│    │  Launchpad   │      │    .org      │      │  Token Guide │            │
│    │  Territory   │      │  Play2Earn   │      │   Learning   │            │
│    └──────────────┘      └──────────────┘      └──────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Trinity Token System

Three distinct tokens represent three interconnected realms, each with unique properties and purposes.

### Token Overview

```
                    THE TRINITY TOKENS
    ════════════════════════════════════════════════════════

         QLX                 QLY                 QLZ
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │     🌱       │   │     🥚       │   │     ☄️       │
    │    SEED      │   │    EGG       │   │  METEORITE   │
    │              │   │              │   │              │
    │  Realm:      │   │  Realm:      │   │  Realm:      │
    │  PLANT       │   │  ANIMAL      │   │  MINERAL     │
    │              │   │              │   │              │
    │  Pillar:     │   │  Pillar:     │   │  Pillar:     │
    │  Culture &   │   │  Business &  │   │  Character & │
    │  Music       │   │  Sports      │   │  Technology  │
    │              │   │              │   │              │
    │  Axis: X     │   │  Axis: Y     │   │  Axis: Z     │
    │  (Horizontal)│   │  (Vertical)  │   │  (Diagonal)  │
    └──────────────┘   └──────────────┘   └──────────────┘

         QUILUX            QUILY              QUILZ
      quillverse.org    LotusXchange        Coming Soon
       Play to Earn      Trade Now         Create to Earn
```

### Token Properties

| Property | QLX | QLY | QLZ |
|----------|-----|-----|-----|
| **Symbol** | 🌱 SEED | 🥚 EGG | ☄️ METEORITE |
| **Realm** | Plant | Animal | Mineral |
| **Essence** | Growth | Life | Transformation |
| **Pillar** | Culture & Music | Business & Sports | Character & Technology |
| **Axis** | X (Horizontal) | Y (Vertical) | Z (Depth/Diagonal) |
| **Roads** | OUT | UP, DWN | U45, D45 |
| **Primary Activity** | Play to Earn | Trade & Compete | Create to Earn |
| **Platform** | quillverse.org | LotusXchange | TBD |

### Token Interactions

```
                    TOKEN INTERACTION FLOW
    ════════════════════════════════════════════════════════

                         ┌─────────┐
                         │  BURN   │
                         │ (Power) │
                         └────┬────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌────────┐      ┌────────┐      ┌────────┐
         │  QLX   │◄────►│  QLY   │◄────►│  QLZ   │
         └───┬────┘      └───┬────┘      └───┬────┘
             │               │               │
             ▼               ▼               ▼
         ┌────────┐      ┌────────┐      ┌────────┐
         │ STAKE  │      │ TRADE  │      │ CREATE │
         │Territory│     │Markets │      │ NFTs   │
         └────────┘      └────────┘      └────────┘
```

---

## Realms, Essences & Pillars

### Terminology Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        QUILLVERSE ONTOLOGY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REALM (What it IS)         The fundamental nature                          │
│  ├── Plant                  Living, growing, rooted                         │
│  ├── Animal                 Moving, breathing, hunting                      │
│  └── Mineral                Solid, transforming, eternal                    │
│                                                                             │
│  ESSENCE (What it CARRIES)  The core symbolic element                       │
│  ├── Seed (QLX)             Potential, beginnings, culture                  │
│  ├── Egg (QLY)              Life force, nurturing, competition             │
│  └── Meteorite (QLZ)        Cosmic fire, innovation, change                │
│                                                                             │
│  PILLAR (What you DO)       The activities and engagements                  │
│  ├── Culture & Music        Sacred instruments, artistic expression        │
│  ├── Business & Sports      Crowdfunding, competition, ventures            │
│  └── Character & Technology Innovation, creation, moral development        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Application Requirements

To found a Galactic Cluster Nation, applicants must engage ALL THREE realms:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GCN APPLICATION REQUIREMENTS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  QLX ENGAGEMENT: Culture & Music                                     │   │
│  │                                                                      │   │
│  │  Choose your SACRED INSTRUMENT                                       │   │
│  │  • The voice of your nation                                          │   │
│  │  • Mapped to one of 5 elements (Fire, Water, Earth, Air, Void)      │   │
│  │  • Can propose new instruments with cultural origin                  │   │
│  │  • Option: "Voice is my instrument"                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  QLY ENGAGEMENT: Business & Sports                                   │   │
│  │                                                                      │   │
│  │  Link your CROWDFUNDING CAMPAIGN                                     │   │
│  │  • Platforms: Kickstarter, GoFundMe, Indiegogo, Patreon, etc.       │   │
│  │  • Shows commitment to real-world building                           │   │
│  │  • Select Arcade Staff Pillars (optional)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  QLZ ENGAGEMENT: Character & Technology                              │   │
│  │                                                                      │   │
│  │  Describe your TECHNOLOGY INNOVATION                                 │   │
│  │  • Types: Software, Hardware, Process, Concept                       │   │
│  │  • The magical technology your nation brings to the Quillverse      │   │
│  │  • Future-focused contribution                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Rainbow Roads Grid System

The Quillverse territory is organized as an 8×5 grid representing 40 unique roads, each claimable by a single nation.

### The Map

```
                       QUILLVERSE TERRITORY MAP
    ════════════════════════════════════════════════════════════════════

              D2      D4      D6      D8      D10     D12     D20     D100
            ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┐
       OUT  │ D2OUT │ D4OUT │ D6OUT │ D8OUT │D10OUT │D12OUT │D20OUT │D100OUT│ QLX
            │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤
       UP   │ D2UP  │ D4UP  │ D6UP  │ D8UP  │ D10UP │ D12UP │ D20UP │D100UP │ QLY
            │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤
       DWN  │ D2DWN │ D4DWN │ D6DWN │ D8DWN │D10DWN │D12DWN │D20DWN │D100DWN│ QLY
            │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤
       U45  │ D2U45 │ D4U45 │ D6U45 │ D8U45 │D10U45 │D12U45 │D20U45 │D100U45│ QLZ
            │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │
            ├───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┤
       D45  │ D2D45 │ D4D45 │ D6D45 │ D8D45 │D10D45 │D12D45 │D20D45 │D100D45│ QLZ
            │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │   ~   │
            └───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘

    LEGEND:
    ────────
    ~   = Unclaimed territory
    [X] = Claimed by nation X
    !   = Contested (under attack)
    #   = Fortified (high defense)

    DICE COLUMNS (X-Axis):
    ───────────────────────
    D2   = Creator guild      D10  = Nurturer guild
    D4   = Destroyer guild    D12  = Sage guild
    D6   = Builder guild      D20  = Trickster guild
    D8   = Explorer guild     D100 = Titan guild

    DIRECTION ROWS (Token Association):
    ────────────────────────────────────
    OUT  = Horizontal expansion → QLX (Plant/Culture)
    UP   = Upward expansion    → QLY (Animal/Business)
    DWN  = Downward expansion  → QLY (Animal/Sports)
    U45  = Diagonal up 45°     → QLZ (Mineral/Character)
    D45  = Diagonal down 45°   → QLZ (Mineral/Technology)
```

### Road Identification

Each road has a unique ID combining dice type and direction:

```
         ROAD ID FORMAT
    ════════════════════════

    D[dice][direction]

    Examples:
    • D6OUT   = Builder guild, horizontal
    • D12UP   = Sage guild, upward
    • D20D45  = Trickster guild, diagonal down

    Valid Dice:   2, 4, 6, 8, 10, 12, 20, 100
    Valid Dirs:   OUT, UP, DWN, U45, D45

    Total Roads:  8 dice × 5 directions = 40 roads
```

---

## Token-to-Coordinate Mapping

Token transactions directly influence territorial expansion in 3D space.

### Axis Mapping

```
                    3D COORDINATE SYSTEM
    ════════════════════════════════════════════════════════

                           Y (QLY)
                           │
                           │    UP roads expand +Y
                           │    DWN roads expand -Y
                           │
                           │         ╱ Z (QLZ)
                           │       ╱
                           │     ╱   U45 roads expand +Z
                           │   ╱     D45 roads expand -Z
                           │ ╱
           ────────────────┼────────────────── X (QLX)
                         ╱ │
                       ╱   │        OUT roads expand ±X
                     ╱     │
                   ╱       │
                           │

    TOKEN TRANSACTIONS → ROAD EXPANSION
    ────────────────────────────────────

    QLX Transaction → Extends all OUT roads (horizontal)
    QLY Transaction → Extends all UP/DWN roads (vertical)
    QLZ Transaction → Extends all U45/D45 roads (diagonal)
```

### Expansion Mechanics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXPANSION FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER ACTION          TOKEN EFFECT         TERRITORY RESULT                │
│   ───────────          ────────────         ────────────────                │
│                                                                             │
│   Play at              QLX earned/          OUT roads gain                  │
│   quillverse.org  ──►  burned          ──►  length (+X axis)               │
│                                                                             │
│   Trade on             QLY volume           UP/DWN roads gain               │
│   LotusXchange    ──►  recorded        ──►  length (+/-Y axis)             │
│                                                                             │
│   Create content/      QLZ earned/          U45/D45 roads gain              │
│   NFTs            ──►  burned          ──►  length (+/-Z axis)             │
│                                                                             │
│   Stake tokens         Defense power        Territory fortified             │
│   to territory    ──►  increased       ──►  (harder to contest)            │
│                                                                             │
│   Burn tokens          Attack power         Contest initiated               │
│   for attack      ──►  generated       ──►  (dice battle begins)           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual: Token Flow to World Expansion

```
                    ACTIVITY → TOKEN → EXPANSION
    ════════════════════════════════════════════════════════════════════

    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │   CULTURE   │          │             │          │   OUT ROADS │
    │   & MUSIC   │────QLX──►│             │────X────►│  EXTEND     │
    │  Activities │          │             │          │  ──────►    │
    └─────────────┘          │             │          └─────────────┘
                             │   RAINBOW   │
    ┌─────────────┐          │    ROADS    │          ┌─────────────┐
    │  BUSINESS   │          │    GRID     │          │  UP/DWN     │
    │  & SPORTS   │────QLY──►│             │────Y────►│  ROADS      │
    │  Activities │          │   (8 × 5)   │          │    │        │
    └─────────────┘          │             │          │    ▼        │
                             │             │          └─────────────┘
    ┌─────────────┐          │             │          ┌─────────────┐
    │  CHARACTER  │          │             │          │  U45/D45    │
    │  & TECH     │────QLZ──►│             │────Z────►│  ROADS      │
    │  Activities │          │             │          │    ╱        │
    └─────────────┘          └─────────────┘          └─────────────┘
```

---

## TEK8 Guild System

Eight guilds based on dice types, each with unique elemental affinities and characteristics.

### Guild Overview

```
                         TEK8 GUILDS
    ════════════════════════════════════════════════════════════════════

    ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
    │   D2    │   D4    │   D6    │   D8    │   D10   │   D12   │   D20   │  D100   │
    │ CREATOR │DESTROYER│ BUILDER │EXPLORER │NURTURER │  SAGE   │TRICKSTER│  TITAN  │
    ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
    │         │    ▲    │   ■■■   │    ◇    │   ~~~   │    ✧    │    ?    │   ███   │
    │    ○    │   ╱ ╲   │   ■■■   │   ◇ ◇   │   ~~~   │   ✧✧✧   │   ???   │  █████  │
    │         │  ╱   ╲  │   ■■■   │    ◇    │   ~~~   │    ✧    │    ?    │   ███   │
    ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
    │  VOID   │  FIRE   │  EARTH  │   AIR   │  WATER  │  LIGHT  │ SHADOW  │ AETHER  │
    │         │         │         │         │         │         │         │         │
    │ Ambient │Aggresive│ Grounded│Ethereal │ Flowing │Crystal- │ Glitch  │  Epic   │
    │ Drones  │ Beats   │ Rhythms │Melodies │Harmonies│  line   │  FX     │Orchestral│
    └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Guild Details

| Guild | Dice | Element | Archetype | Garu Egg Question |
|-------|------|---------|-----------|-------------------|
| **Creator** | D2 | Void | The Visionary | "What world do you wish to create?" |
| **Destroyer** | D4 | Fire | The Revolutionary | "What must be destroyed to make way for the new?" |
| **Builder** | D6 | Earth | The Architect | "What foundation will you lay?" |
| **Explorer** | D8 | Air | The Wanderer | "What horizons call to you?" |
| **Nurturer** | D10 | Water | The Healer | "Who will you protect and guide?" |
| **Sage** | D12 | Light | The Scholar | "What wisdom do you seek to share?" |
| **Trickster** | D20 | Shadow | The Wild Card | "What rules will you bend or break?" |
| **Titan** | D100 | Aether | The Legend | "What legacy will echo through eternity?" |

### Elemental Wheel

```
                    ELEMENTAL ADVANTAGES
    ════════════════════════════════════════════════════════

                           LIGHT
                            ✧
                           ╱│╲
                         ╱  │  ╲
                       ╱    │    ╲
                VOID ○──────┼──────◇ AIR
                       ╲    │    ╱
                         ╲  │  ╱
                           ╲│╱
              FIRE ▲────────┼────────~~~ WATER
                           ╱│╲
                         ╱  │  ╲
                       ╱    │    ╲
               EARTH ■──────┼──────? SHADOW
                            │
                           ███
                          AETHER

    ADVANTAGE CYCLE:
    ─────────────────
    Fire    → Earth  → Water  → Air   → Fire
    (D4)      (D6)     (D10)    (D8)    (D4)

    SPECIAL RELATIONSHIPS:
    ──────────────────────
    Light (D12) ←→ Shadow (D20)  [Opposed]
    Void (D2)   ←→ Aether (D100) [Transcendent]
```

---

## Territory Control System

### Core Game Loop

```
                         TERRITORY GAME LOOP
    ════════════════════════════════════════════════════════════════════

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │   LAUNCH    │     │    CLAIM    │     │   DEVELOP   │     │   EXPAND    │
    │   TOKEN     │────►│  TERRITORY  │────►│   NATION    │────►│  /CONTEST   │
    └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
          │                   │                   │                   │
          ▼                   ▼                   ▼                   ▼
      Create GCN         Stake tokens        Trade/burn          Attack or
      + reciprocity      to claim road       to grow power       claim adjacent
          │                   │                   │                   │
          │                   │                   │                   │
          └───────────────────┴───────────────────┴───────────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │   REPEAT    │
                              │   EXPAND    │
                              │   PROSPER   │
                              └─────────────┘
```

### Token Mechanics

| Action | Effect | Strategic Use |
|--------|--------|---------------|
| **STAKE** | Lock tokens → increases territory defense | Protect claimed territories |
| **BURN** | Destroy tokens → attack power OR free Cryptofae | Initiate contests or rituals |
| **TRADE** | Swap via LotusXchange → builds life force score | Increase nation influence |
| **SEND** | Transfer to allies → diplomacy/alliance building | Form coalitions |

### Territory States

```
    TERRITORY STATE MACHINE
    ════════════════════════

    ┌───────────┐
    │ UNCLAIMED │◄──────────────────────────────────────┐
    │     ~     │                                       │
    └─────┬─────┘                                       │
          │ claim (stake tokens)                        │
          ▼                                             │
    ┌───────────┐                                       │
    │  CLAIMED  │◄──────────────────────┐               │
    │    [X]    │                       │               │
    └─────┬─────┘                       │               │
          │ attack initiated            │               │
          ▼                             │               │
    ┌───────────┐      defender wins    │   abandoned   │
    │ CONTESTED │───────────────────────┘       or      │
    │     !     │                               │       │
    └─────┬─────┘                               │       │
          │ attacker wins                       │       │
          ▼                                     │       │
    ┌───────────┐                               │       │
    │ CAPTURED  │───────────────────────────────┘       │
    │   [NEW]   │       (becomes claimed)               │
    └─────┬─────┘                                       │
          │ fortify (stake more)                        │
          ▼                                             │
    ┌───────────┐                                       │
    │ FORTIFIED │                                       │
    │     #     │───────────────────────────────────────┘
    └───────────┘       (abandoned = returns to unclaimed)
```

---

## Creation & Expansion Flow

### Full Journey: From Nothing to Nation

```
                    THE FOUNDER'S JOURNEY
    ════════════════════════════════════════════════════════════════════

    PHASE 1: CONCEPTION
    ────────────────────

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   Person with a Vision                                          │
    │         │                                                       │
    │         ▼                                                       │
    │   ┌─────────────┐                                               │
    │   │ Visit 8xM   │   Learn about Quillverse                      │
    │   │   .fun      │   Study TEK8 guilds                           │
    │   └──────┬──────┘   Choose your path                            │
    │          │                                                      │
    └──────────┼──────────────────────────────────────────────────────┘
               │
               ▼
    PHASE 2: PREPARATION
    ─────────────────────

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
    │   │    QLX      │   │    QLY      │   │    QLZ      │          │
    │   │ Engagement  │   │ Engagement  │   │ Engagement  │          │
    │   ├─────────────┤   ├─────────────┤   ├─────────────┤          │
    │   │ Choose      │   │ Create or   │   │ Describe    │          │
    │   │ Sacred      │   │ Link        │   │ Technology  │          │
    │   │ Instrument  │   │ Crowdfund   │   │ Innovation  │          │
    │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
    │          │                 │                 │                  │
    │          └─────────────────┼─────────────────┘                  │
    │                            │                                    │
    │                            ▼                                    │
    │                   All 3 Realms Engaged                          │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
               │
               ▼
    PHASE 3: LAUNCH
    ─────────────────

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   ┌───────────────────────────────────────────────┐            │
    │   │              8xM LAUNCHPAD                     │            │
    │   ├───────────────────────────────────────────────┤            │
    │   │                                               │            │
    │   │  1. Configure Token                           │            │
    │   │     • Name, Symbol, Supply                    │            │
    │   │     • Token-2022 with Transfer Fees           │            │
    │   │                                               │            │
    │   │  2. Select TEK8 Guild                         │            │
    │   │     • Affects pool strategy                   │            │
    │   │     • Determines element                      │            │
    │   │                                               │            │
    │   │  3. Launch with Meteora DLMM                  │            │
    │   │     • Instant liquidity                       │            │
    │   │     • Auto-deposit to Commons Treasury        │            │
    │   │                                               │            │
    │   └───────────────────────────────────────────────┘            │
    │                            │                                    │
    │                            ▼                                    │
    │                    TOKEN LIVE ON SOLANA                         │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
               │
               ▼
    PHASE 4: ESTABLISHMENT
    ───────────────────────

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │                 GCN APPLICATION                          │  │
    │   ├─────────────────────────────────────────────────────────┤  │
    │   │                                                         │  │
    │   │  Submit full character profile:                         │  │
    │   │  • Nation name & soul description                       │  │
    │   │  • TEK8 guild selection                                 │  │
    │   │  • Garu Egg question response                          │  │
    │   │  • All three realm engagements                          │  │
    │   │  • Link token mint address                              │  │
    │   │  • Select Rainbow Road (territory)                      │  │
    │   │                                                         │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                            │                                    │
    │                            ▼                                    │
    │                    APPLICATION REVIEW                           │
    │                    (Admin approval)                             │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
               │
               ▼
    PHASE 5: EXPANSION
    ────────────────────

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │        ┌─────────────────────────────────────────────┐         │
    │        │           GALACTIC CLUSTER NATION            │         │
    │        │                ESTABLISHED                   │         │
    │        └─────────────────────────────────────────────┘         │
    │                            │                                    │
    │           ┌────────────────┼────────────────┐                   │
    │           ▼                ▼                ▼                   │
    │    ┌───────────┐    ┌───────────┐    ┌───────────┐             │
    │    │   STAKE   │    │   TRADE   │    │  CONTEST  │             │
    │    │  Defend   │    │  Grow     │    │  Expand   │             │
    │    │  territory│    │  influence│    │  borders  │             │
    │    └───────────┘    └───────────┘    └───────────┘             │
    │           │                │                │                   │
    │           └────────────────┼────────────────┘                   │
    │                            ▼                                    │
    │                   NATION GROWS & PROSPERS                       │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Combat & Contest Mechanics

### Attack Power Formula

```
    COMBAT CALCULATION
    ════════════════════════════════════════════════════════

    ATTACK POWER = (Burned Tokens × 0.001) + (Dice Roll × Element Modifier)

    ELEMENT MODIFIERS:
    ──────────────────
    • Matching element:     1.50×  (same element as territory)
    • Advantaged element:   1.25×  (Fire > Earth > Water > Air > Fire)
    • Neutral:              1.00×  (no relationship)
    • Disadvantaged:        0.75×  (reverse of advantage)

    EXAMPLE:
    ────────
    Attacker burns 10,000 tokens
    Attacker is Fire (D4) guild
    Defender is Earth (D6) guild
    Attacker rolls D4 = 3

    Attack = (10,000 × 0.001) + (3 × 1.25)
           = 10 + 3.75
           = 13.75 attack power
```

### Contest Flow

```
                      TERRITORY CONTEST
    ════════════════════════════════════════════════════════════════════

    HOUR 0                         HOUR 24                    RESOLUTION
       │                              │                            │
       ▼                              ▼                            ▼
    ┌──────────────┐             ┌──────────────┐          ┌──────────────┐
    │   ATTACKER   │             │   DEFENDER   │          │    WINNER    │
    │   INITIATES  │────────────►│   RESPONDS   │─────────►│   DECLARED   │
    └──────────────┘             └──────────────┘          └──────────────┘
          │                            │                          │
          ▼                            ▼                          ▼
    • Burns tokens              • Burns tokens              • Higher total
    • Rolls guild dice          • Rolls guild dice            wins
    • Attack power              • Defense power             • Territory
      calculated                  calculated                  transferred
                                                              or retained


    DETAILED FLOW:
    ──────────────

    1. ATTACKER burns tokens + rolls dice ──► attack power calculated
                            │
                            ▼
    2. DEFENDER has 24 hours to respond
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
    [Defender responds]               [Defender ignores]
    Burns tokens + rolls              Attack auto-succeeds
          │                                   │
          ▼                                   ▼
    3. COMPARE TOTALS ◄───────────────────────┘
          │
          ├──► Attack > Defense: Attacker wins, takes territory
          │
          └──► Defense >= Attack: Defender wins, keeps territory
```

---

## Diplomacy & Alliances

### Alliance Types

```
                       ALLIANCE FRAMEWORK
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │  TRADE ALLIANCE                                                 │
    │  ────────────────                                               │
    │  • Reduced transaction fees between nations                     │
    │  • Shared market information                                    │
    │  • Priority access to each other's tokens                       │
    │  • Duration: Indefinite until cancelled                         │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │  DEFENSE PACT                                                   │
    │  ─────────────                                                  │
    │  • Mutual defense commitment                                    │
    │  • Allied nations can stake to each other's territories        │
    │  • Automatic notification of attacks                            │
    │  • Combined defense power bonus                                 │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │  FEDERATION                                                     │
    │  ──────────────                                                 │
    │  • Deep integration of nations                                  │
    │  • Shared treasury pool                                         │
    │  • Coordinated expansion strategy                               │
    │  • Combined voting on federation decisions                      │
    │  • Requires multi-sig governance                                │
    └─────────────────────────────────────────────────────────────────┘
```

### Alliance Formation

```
    ALLIANCE FLOW
    ═════════════

    Nation A                                      Nation B
        │                                            │
        │  1. Propose alliance                       │
        ├───────────────────────────────────────────►│
        │     { type, terms, duration }              │
        │                                            │
        │  2. Review & negotiate                     │
        │◄───────────────────────────────────────────┤
        │     { counter_terms } (optional)           │
        │                                            │
        │  3. Accept/Reject                          │
        │───────────────────────────────────────────►│
        │                                            │
        │         ┌─────────────────────┐            │
        │         │  ALLIANCE ACTIVE    │            │
        │◄────────┤  Benefits begin     ├───────────►│
        │         │  Recorded on-chain  │            │
        │         └─────────────────────┘            │
        │                                            │
```

---

## Audio Architecture

### Unified Audio System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUILLVERSE AUDIO SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   QLX LAYER     │  │   QLY LAYER     │  │   QLZ LAYER     │             │
│  │  Culture/Music  │  │ Business/Sports │  │ Character/Tech  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Sacred        │  │ • Competitive   │  │ • Innovation    │             │
│  │   Instruments   │  │   Soundtracks   │  │   Synthesis     │             │
│  │ • Cultural      │  │ • Event Audio   │  │ • AI-Assisted   │             │
│  │   Preservation  │  │ • Team Anthems  │  │   Composition   │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│  ┌─────────────────────────────┴─────────────────────────────┐             │
│  │                    VIBE SHRINE HUB                         │             │
│  │                                                            │             │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │             │
│  │  │  Citizen DJ  │  │   Jukebox    │  │   Faction    │     │             │
│  │  │  Samples     │  │   Recorder   │  │   Mixer      │     │             │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │             │
│  │                                                            │             │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │             │
│  │  │  TEK8 Audio  │  │  Three Magic │  │  Open DAW    │     │             │
│  │  │  Themes      │  │  Number Race │  │  Features    │     │             │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    TONE.JS ENGINE                            │           │
│  │  Synthesis • Sequencing • Effects • Sampling • Transport    │           │
│  └─────────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TEK8 Audio Signatures

| Guild | Dice | Element | Audio Signature | Instruments |
|-------|------|---------|-----------------|-------------|
| Creator | D2 | Void | Ambient drones | Singing bowls, synthesizers |
| Destroyer | D4 | Fire | Aggressive beats | Drums, distorted bass |
| Builder | D6 | Earth | Grounded rhythms | Acoustic bass, hand drums |
| Explorer | D8 | Air | Ethereal melodies | Flutes, wind instruments |
| Nurturer | D10 | Water | Flowing harmonies | Strings, harp, rain sounds |
| Sage | D12 | Light | Crystalline tones | Bells, glass, high synths |
| Trickster | D20 | Shadow | Unpredictable glitches | Prepared piano, effects |
| Titan | D100 | Aether | Epic orchestral | Full orchestra, choirs |

---

## 3D World Integration

### Architecture Layers

```
                    REVERSE ENGINEERING STACK
    ════════════════════════════════════════════════════════════════════

    LAYER 5: 3D WORLD
    ┌─────────────────────────────────────────────────────────────────┐
    │  React Three Fiber + Rapier Physics                             │
    │  • Voxel-based terrain (32³ shards)                            │
    │  • Character movement and physics                               │
    │  • Visual representation of territories                         │
    └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    LAYER 4: MUD (Text Interface)
    ┌─────────────────────────────────────────────────────────────────┐
    │  Mudlet Integration / Discord Bot                               │
    │  • Text-based exploration                                       │
    │  • Command parsing                                              │
    │  • Narrative descriptions                                       │
    └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    LAYER 3: 2D MAP (Territory Grid)
    ┌─────────────────────────────────────────────────────────────────┐
    │  8×5 Rainbow Roads Grid                                         │
    │  • Territory ownership                                          │
    │  • Contest status                                               │
    │  • Visual map interface                                         │
    └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    LAYER 2: DATABASE (State)
    ┌─────────────────────────────────────────────────────────────────┐
    │  Neon PostgreSQL                                                │
    │  • Nations, territories, stakes                                 │
    │  • Contests, alliances                                          │
    │  • Application data                                             │
    └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    LAYER 1: BLOCKCHAIN (Source of Truth)
    ┌─────────────────────────────────────────────────────────────────┐
    │  Solana + Token-2022                                            │
    │  • Token minting and transfers                                  │
    │  • Transfer fees (enforced royalties)                          │
    │  • On-chain governance                                          │
    └─────────────────────────────────────────────────────────────────┘
```

### Biomes-Inspired Shard System

```
                    3D WORLD STRUCTURE
    ════════════════════════════════════════════════════════════════════

    ┌──────────────────────────────────────────────────────────────────┐
    │                         WORLD                                    │
    │  ┌────────────────────────────────────────────────────────────┐ │
    │  │                    SHARD GRID                               │ │
    │  │                                                             │ │
    │  │    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                        │ │
    │  │    │32³  │ │32³  │ │32³  │ │32³  │  ← Each shard          │ │
    │  │    │voxel│ │voxel│ │voxel│ │voxel│    contains 32,768     │ │
    │  │    └─────┘ └─────┘ └─────┘ └─────┘    voxels               │ │
    │  │    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                        │ │
    │  │    │     │ │ ██  │ │     │ │     │  ← Nation territory    │ │
    │  │    │     │ │ ██  │ │     │ │     │    visualized in 3D    │ │
    │  │    └─────┘ └─────┘ └─────┘ └─────┘                        │ │
    │  │                                                             │ │
    │  └────────────────────────────────────────────────────────────┘ │
    │                                                                  │
    │  TOKEN TRANSACTIONS → SHARD EXPANSION                           │
    │  ───────────────────────────────────────                        │
    │  QLX txns → X-axis shards grow                                  │
    │  QLY txns → Y-axis shards grow                                  │
    │  QLZ txns → Z-axis shards grow                                  │
    │                                                                  │
    └──────────────────────────────────────────────────────────────────┘
```

---

## Partnership Structure

### Rainbow Roads to Redemption

```
                    PARTNERSHIP ORGANIZATION
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │            RAINBOW ROADS TO REDEMPTION                          │
    │                                                                 │
    │  "Education + Culture + Technology + Community"                 │
    └─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │   EDUCATION   │    │    CULTURE    │    │  TECHNOLOGY   │
    │               │    │               │    │               │
    │ The Paladin   │    │    XimUra     │    │   TimeKnot    │
    │  Initiative   │    │    Tribal     │    │    Games      │
    │               │    │  Ministries   │    │               │
    │ • Liberation  │    │               │    │  • TEK8       │
    │   education   │    │ • Indigenous  │    │    System     │
    │ • Free tools  │    │   knowledge   │    │  • Dice Godz  │
    │ • Job         │    │ • Cultural    │    │  • Rainbow    │
    │   placement   │    │   iteration   │    │    Roads      │
    └───────────────┘    └───────────────┘    └───────────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │     7ABCs.com         │
                    │     AgileXPS          │
                    │                       │
                    │  • TEK8 co-creators   │
                    │  • Agile education    │
                    │  • Learning systems   │
                    └───────────────────────┘


    ATTRIBUTION CLARITY:
    ─────────────────────

    TEK8 System
    ├── Created by: AgileXPS + 7ABCs.com
    └── Implemented/Iterated by: XimUra Tribal Ministries
                                  (Indigenous knowledge partner)

    Road to Redemption
    └── Program by: The Paladin Initiative
                    (Free education, tools, jobs)
```

---

## Database Schema

### Core Tables

```sql
-- NATIONS (extends GCN entries)
CREATE TABLE nations (
  id SERIAL PRIMARY KEY,
  gcn_entry_id INTEGER REFERENCES gcn_entries(id) UNIQUE,
  mint_address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '?',
  founder_wallet TEXT NOT NULL,
  total_territory_count INTEGER DEFAULT 1,
  total_staked BIGINT DEFAULT 0,
  defense_rating INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TERRITORIES (40 Rainbow Roads)
CREATE TABLE territories (
  id SERIAL PRIMARY KEY,
  road_id TEXT NOT NULL UNIQUE,      -- 'D12OUT', 'D6UP', etc.
  dice_type TEXT NOT NULL,           -- 'D2', 'D4', etc.
  direction TEXT NOT NULL,           -- 'OUT', 'UP', 'DWN', 'U45', 'D45'
  realm TEXT NOT NULL,               -- 'QLX', 'QLY', 'QLZ'
  grid_x INTEGER NOT NULL,           -- 0-7 (dice column)
  grid_y INTEGER NOT NULL,           -- 0-4 (direction row)
  nation_id INTEGER REFERENCES nations(id),
  status TEXT DEFAULT 'unclaimed',   -- unclaimed/claimed/contested/fortified
  defense_level INTEGER DEFAULT 0,
  total_staked BIGINT DEFAULT 0,
  claimed_at TIMESTAMP
);

-- TERRITORY STAKES
CREATE TABLE territory_stakes (
  id SERIAL PRIMARY KEY,
  territory_id INTEGER REFERENCES territories(id),
  nation_id INTEGER REFERENCES nations(id),
  staker_wallet TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  amount BIGINT NOT NULL,
  stake_type TEXT DEFAULT 'defense', -- 'defense', 'attack'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONTESTS (attacks)
CREATE TABLE territory_contests (
  id SERIAL PRIMARY KEY,
  territory_id INTEGER REFERENCES territories(id),
  attacker_nation_id INTEGER REFERENCES nations(id),
  defender_nation_id INTEGER REFERENCES nations(id),
  tokens_burned_attack BIGINT DEFAULT 0,
  tokens_burned_defense BIGINT DEFAULT 0,
  attack_dice_roll JSONB,            -- {dice: 'D4', roll: 3, modifier: 1.25}
  defense_dice_roll JSONB,
  status TEXT DEFAULT 'pending',      -- pending/active/resolved
  winner_nation_id INTEGER,
  defense_deadline TIMESTAMP,         -- 24h from attack
  resolved_at TIMESTAMP
);

-- ALLIANCES
CREATE TABLE alliances (
  id SERIAL PRIMARY KEY,
  proposer_nation_id INTEGER REFERENCES nations(id),
  target_nation_id INTEGER REFERENCES nations(id),
  alliance_type TEXT NOT NULL,       -- 'trade', 'defense', 'federation'
  terms JSONB,
  status TEXT DEFAULT 'proposed',    -- proposed/active/rejected/dissolved
  accepted_at TIMESTAMP
);

-- TOKEN BURNS
CREATE TABLE token_burns (
  id SERIAL PRIMARY KEY,
  nation_id INTEGER REFERENCES nations(id),
  wallet_address TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  amount BIGINT NOT NULL,
  burn_type TEXT NOT NULL,           -- 'attack', 'defense', 'ritual'
  burn_tx_signature TEXT,
  power_generated DECIMAL(20,4),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Reference

### Territory Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/territory/map` | GET | Full 8×5 grid state |
| `/api/territory/:roadId` | GET | Single territory details |
| `/api/territory/claim` | POST | Claim unclaimed territory |
| `/api/territory/stake` | POST | Stake tokens to territory |
| `/api/territory/attack` | POST | Initiate contest |
| `/api/territory/defend` | POST | Respond to attack |
| `/api/territory/contests` | GET | List active contests |

### Nation Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/nation/create` | POST | Create nation from approved GCN |
| `/api/nation/:id` | GET | Nation details & stats |
| `/api/nation/leaderboard` | GET | Territory rankings |

### Diplomacy Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/diplomacy/propose` | POST | Propose alliance |
| `/api/diplomacy/respond` | POST | Accept/reject alliance |
| `/api/diplomacy/alliances` | GET | List all alliances |

### Application Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/applications/submit` | POST | Submit GCN application |
| `/api/applications/status` | GET | Check application status |
| `/api/admin/applications` | GET | List all (admin) |
| `/api/admin/applications/:id` | PATCH | Review application |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUILLVERSE QUICK REFERENCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TOKENS           REALMS          PILLARS              ROADS                │
│  ──────           ──────          ───────              ─────                │
│  QLX (Seed)       Plant           Culture & Music      OUT (X-axis)         │
│  QLY (Egg)        Animal          Business & Sports    UP/DWN (Y-axis)      │
│  QLZ (Meteorite)  Mineral         Character & Tech     U45/D45 (Z-axis)     │
│                                                                             │
│  TEK8 GUILDS                                                                │
│  ──────────────────────────────────────────────────────                     │
│  D2=Creator/Void    D4=Destroyer/Fire   D6=Builder/Earth   D8=Explorer/Air │
│  D10=Nurturer/Water D12=Sage/Light      D20=Trickster/Shadow D100=Titan/Aether │
│                                                                             │
│  COMBAT                                                                     │
│  ──────                                                                     │
│  Attack = (Burned × 0.001) + (Dice × Element Modifier)                     │
│  Modifiers: Match=1.5× | Advantage=1.25× | Neutral=1.0× | Disadvantage=0.75×│
│                                                                             │
│  TERRITORY STATES                                                           │
│  ────────────────                                                           │
│  ~ = Unclaimed | [X] = Claimed | ! = Contested | # = Fortified             │
│                                                                             │
│  KEY URLS                                                                   │
│  ────────                                                                   │
│  8xM.fun (Launchpad) | quillverse.org (Play) | quilu.xyz (Guide)           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*
*Last Updated: January 2025*
*For the Quillverse belongs to those who scribe and sing it.*
