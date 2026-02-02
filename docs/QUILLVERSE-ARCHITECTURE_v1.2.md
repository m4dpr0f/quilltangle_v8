# Quillverse Architecture: Music & Octix Systems
**Version 1.2 | January 2025**

*Supplement to QUILLVERSE-ARCHITECTURE_v1.md - Focused on VibeShrine, Music Creation, and Octix Sound Tiles*

---

## Table of Contents

1. [Overview](#overview)
2. [VibeShrine Hub](#vibeshrine-hub)
3. [Citizen DJ Integration](#citizen-dj-integration)
4. [Jukebox Recording System](#jukebox-recording-system)
5. [CJSR Audio Engine](#cjsr-audio-engine)
6. [The Octix System](#the-octix-system)
7. [Challenger Mode](#challenger-mode)
8. [Minting & Rights](#minting--rights)
9. [Smart Contracts](#smart-contracts)
10. [Playback & Downloads](#playback--downloads)
11. [Database Schema](#database-schema)
12. [API Reference](#api-reference)

---

## Overview

The Quillverse music system creates a living soundscape where every tile in the world can emit unique sounds, determined by player achievements. This document covers the complete audio ecosystem from creation to playback to competitive sound battles.

```
                    QUILLVERSE AUDIO ECOSYSTEM
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │                      CONTENT CREATION                           │
    │                                                                 │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
    │  │ Citizen DJ  │  │   Jukebox   │  │    CJSR     │             │
    │  │  Samples    │  │  Recorder   │  │  Racing     │             │
    │  │             │  │             │  │             │             │
    │  │ LOC Archive │  │ QLX Economy │  │ Earn Octix  │             │
    │  │ 15+ Collections │ Recording │  │ via Typing  │             │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
    │         │                │                │                     │
    │         └────────────────┼────────────────┘                     │
    │                          │                                      │
    │                          ▼                                      │
    │              ┌───────────────────────┐                          │
    │              │      VIBE SHRINE      │                          │
    │              │    (Central Hub)      │                          │
    │              └───────────┬───────────┘                          │
    │                          │                                      │
    │         ┌────────────────┼────────────────┐                     │
    │         │                │                │                     │
    │         ▼                ▼                ▼                     │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
    │  │   OCTIX     │  │  PLAYBACK   │  │  DOWNLOAD   │             │
    │  │  Minting    │  │  Streaming  │  │  Export     │             │
    │  │             │  │             │  │             │             │
    │  │ NFT Sounds  │  │ 2-Track Max │  │ MP3/WAV     │             │
    │  │ on Tiles    │  │ Full Songs  │  │ Attribution │             │
    │  └─────────────┘  └─────────────┘  └─────────────┘             │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## VibeShrine Hub

The VibeShrine is the sacred center of all audio activity in the Quillverse - a place where players explore, create, and share music.

### Core Functions

```
                         VIBE SHRINE ARCHITECTURE
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                        VIBE SHRINE                              │
    │              "Sacred Sound Synthesis"                           │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │  TAB 1: EXPLORE ARCHIVES                                 │   │
    │  │  ─────────────────────────                               │   │
    │  │  • Browse 15+ Library of Congress collections            │   │
    │  │  • Preview samples via Citizen DJ                        │   │
    │  │  • Download source material for remixing                 │   │
    │  │  • Each collection links to: Explore | Remix | Use       │   │
    │  └─────────────────────────────────────────────────────────┘   │
    │                                                                 │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │  TAB 2: CREATE REMIXES                                   │   │
    │  │  ────────────────────────                                │   │
    │  │  • Upload finished remixes                               │   │
    │  │  • Title, description, tags                              │   │
    │  │  • Source track attribution                              │   │
    │  │  • Audio file upload (any format)                        │   │
    │  │  • Guest = anonymous, Logged in = attributed             │   │
    │  └─────────────────────────────────────────────────────────┘   │
    │                                                                 │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │  TAB 3: QUILLVERSE LIBRARY                               │   │
    │  │  ───────────────────────────                             │   │
    │  │  • Browse community remixes                              │   │
    │  │  • Play/pause controls                                   │   │
    │  │  • Download button                                       │   │
    │  │  • Likes, play counts, torrent availability              │   │
    │  │  • Search by title, description, tags                    │   │
    │  └─────────────────────────────────────────────────────────┘   │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Playback System

VibeShrine supports **two simultaneous audio tracks** for layered listening:

```
    TWO-TRACK PLAYBACK SYSTEM
    ═════════════════════════

    ┌─────────────────────────────────────────────────────────────┐
    │                      AUDIO MIXER                            │
    │                                                             │
    │   Track A: ════════════════════════════ [■ ■ ■ ■ ░ ░]     │
    │            "Edison Cylinder Remix #47"                      │
    │                                                             │
    │   Track B: ════════════════════════════ [■ ■ ░ ░ ░ ░]     │
    │            "Lomax Folk Reinterpretation"                    │
    │                                                             │
    │   ─────────────────────────────────────────────────────    │
    │   When a 3rd track plays, oldest track automatically stops  │
    │   Full-length playback (no 30-second limits)                │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

---

## Citizen DJ Integration

The Library of Congress Citizen DJ project provides public domain audio samples that form the foundation of Quillverse music creation.

### Available Collections

```
                    CITIZEN DJ COLLECTIONS
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │  COLLECTION                          │ REALM MAPPING            │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  FOLK & TRADITIONAL (QLX - Culture)                            │
    │  ────────────────────────────────────                          │
    │  • John and Ruby Lomax Collection    │ American folk songs      │
    │  • Alan Lomax Collection             │ Field recordings         │
    │  • Cowboy Songs and Frontier Ballads │ Western frontier         │
    │  • Robert Winslow Gordon Collection  │ Early folk music         │
    │  • Klezmer Music                     │ Jewish folk traditions   │
    │                                                                 │
    │  HISTORIC RECORDINGS (QLY - Business/Entertainment)            │
    │  ───────────────────────────────────────────────────           │
    │  • Edison Cylinder Recordings        │ Early commercial music   │
    │  • Variety Stage Sound Recordings    │ Vaudeville performances  │
    │  • Brooklyn Public Library 78rpm     │ Classic recordings       │
    │  • National Recording Registry       │ Significant recordings   │
    │                                                                 │
    │  SPOKEN WORD & EXPERIMENTAL (QLZ - Technology)                 │
    │  ──────────────────────────────────────────────                │
    │  • American English Dialect Records  │ Regional speech          │
    │  • Tony Schwartz Collection          │ Audio experiments        │
    │  • Federal Writers Project           │ Oral histories           │
    │  • Oral History Interviews           │ Historic interviews      │
    │                                                                 │
    │  OPEN ARCHIVES                                                  │
    │  ──────────────────                                            │
    │  • Free Music Archive (FMA)          │ Modern CC-licensed music │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Integration Flow

```
    CITIZEN DJ → QUILLVERSE WORKFLOW
    ═════════════════════════════════

    1. EXPLORE
       ┌─────────────────────────────────────────────────────────┐
       │  Player clicks "Explore" on collection                  │
       │  Opens citizen-dj.labs.loc.gov in new tab               │
       │  Browse and preview samples                             │
       └───────────────────────────┬─────────────────────────────┘
                                   │
                                   ▼
    2. REMIX
       ┌─────────────────────────────────────────────────────────┐
       │  Player clicks "Remix" to use LOC web editor            │
       │  OR downloads samples via "Use"                         │
       │  Creates remix in external DAW                          │
       └───────────────────────────┬─────────────────────────────┘
                                   │
                                   ▼
    3. UPLOAD
       ┌─────────────────────────────────────────────────────────┐
       │  Return to VibeShrine "Create Remixes" tab              │
       │  Fill in metadata, source attribution                   │
       │  Upload audio file                                      │
       │  Submit to Quillverse Library                           │
       └───────────────────────────┬─────────────────────────────┘
                                   │
                                   ▼
    4. SHARE
       ┌─────────────────────────────────────────────────────────┐
       │  Remix appears in Quillverse Library                    │
       │  Other players can play, like, download                 │
       │  Torrent hash available for P2P distribution            │
       │  Attribution flows back to source collections           │
       └─────────────────────────────────────────────────────────┘
```

---

## Jukebox Recording System

Each TEK8 faction has its own Jukebox where players can record and share music, powered by the QLX economy.

### Recording Economics

```
                    JUKEBOX QLX ECONOMY
    ════════════════════════════════════════════════════════════════════

    RECORDING COSTS
    ───────────────
    Cost = 1 QLX per second of recording

    Example:
    • 30-second recording = 30 QLX
    • 2-minute song = 120 QLX
    • 5-minute track = 300 QLX

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   USER QLX BALANCE                                              │
    │   ────────────────                                              │
    │                                                                 │
    │   Total Earned:        1,500 QLX                               │
    │   Spent on Recordings:   450 QLX                               │
    │   ─────────────────────────────                                │
    │   Available:           1,050 QLX                               │
    │                                                                 │
    │   Note: Spending is tracked separately                         │
    │   Total balance preserved, recordings deducted from available  │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Faction Jukeboxes

```
    FACTION JUKEBOX SYSTEM
    ═══════════════════════

    Each of the 8 TEK8 factions has its own Jukebox:

    ┌──────────┬──────────┬──────────┬──────────┐
    │    D2    │    D4    │    D6    │    D8    │
    │ CREATOR  │DESTROYER │ BUILDER  │ EXPLORER │
    │   ○      │    ▲     │   ■■■    │    ◇     │
    │ Ambient  │ Aggresive│ Grounded │ Ethereal │
    │ Drones   │ Beats    │ Rhythms  │ Melodies │
    ├──────────┼──────────┼──────────┼──────────┤
    │   D10    │   D12    │   D20    │   D100   │
    │ NURTURER │   SAGE   │TRICKSTER │  TITAN   │
    │   ~~~    │    ✧     │    ?     │   ███    │
    │ Flowing  │ Crystal- │ Glitch   │  Epic    │
    │ Harmonies│ line     │ Effects  │Orchestral│
    └──────────┴──────────┴──────────┴──────────┘

    Each jukebox tracks:
    • Total recordings
    • Total plays
    • Total duration (seconds)
    • Featured recording (highlighted)
```

### Recording Flow

```
    JUKEBOX RECORDING PROCESS
    ═════════════════════════

    ┌────────────────┐
    │  SELECT        │  Choose faction jukebox
    │  FACTION       │  (must match your affiliation)
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │  CHECK         │  System verifies:
    │  BALANCE       │  Available QLX >= expected duration
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │  RECORD        │  Browser MediaRecorder API
    │  AUDIO         │  Format: audio/webm
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │  PREVIEW       │  Listen before submitting
    │  & TITLE       │  Add title + description
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │  SUBMIT        │  QLX deducted from available
    │  RECORDING     │  Recording saved to faction jukebox
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │  LIVE IN       │  Others can now play your recording
    │  JUKEBOX       │  Play count tracked
    └────────────────┘
```

---

## CJSR Audio Engine

The Chicken Jockey Scribe Racer (CJSR) features a procedural audio engine that generates music based on race content.

### Text-to-Music Analysis

```
                    CJSR AUDIO ANALYSIS
    ════════════════════════════════════════════════════════════════════

    INPUT: Race text (campaign dialogue, story content)
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │  TEXT ANALYSIS                                                  │
    │                                                                 │
    │  Word Count ──────────────► Tempo calculation                   │
    │  Avg Word Length ─────────► BPM range: 80-140                   │
    │  Punctuation Density ─────► Pacing adjustments                  │
    │                                                                 │
    │  EMOTIONAL KEYWORDS                                             │
    │  ─────────────────                                              │
    │  battle, chaos ──────────► Natural Minor (dramatic)            │
    │  victory, triumph ───────► Major Scale (triumphant)            │
    │  magic, ancient ─────────► Mixolydian (mystical)               │
    │  default ────────────────► Pentatonic (adventure)              │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
           │
           ▼
    OUTPUT: MelodyTheme {
              scale: number[];      // Note intervals
              tempo: number;        // BPM
              baseFreq: 220;        // A3 reference
              character: string;    // Theme mood
            }
```

### Faction Audio Signatures

```
    FACTION AUDIO CHARACTERISTICS
    ═════════════════════════════

    ┌─────────┬────────────┬───────────┬──────────────────────────────┐
    │ FACTION │ BASE FREQ  │  TIMBRE   │        SCALE                 │
    ├─────────┼────────────┼───────────┼──────────────────────────────┤
    │   D2    │  164.81 Hz │   Sine    │ [0, 7]        (Power Fifth)  │
    │   D4    │  196.00 Hz │ Triangle  │ [0,3,7,10]    (Minor 7th)    │
    │   D6    │  174.61 Hz │ Sawtooth  │ [0,2,4,5,7,9] (Major)        │
    │   D8    │  220.00 Hz │  Square   │ [0,2,4,7,9,11](Major 7th)    │
    │  D10    │  246.94 Hz │   Sine    │ [0,1,4,6,8,10](Whole Tone)   │
    │  D12    │  293.66 Hz │ Triangle  │ [0,2,3,5,7,8,11](Harm Minor) │
    │  D20    │  329.63 Hz │ Sawtooth  │ [0,2,4,6,8,10](Whole Tone)   │
    │ D100    │  440.00 Hz │  Square   │ [0-11]       (Chromatic)     │
    └─────────┴────────────┴───────────┴──────────────────────────────┘

    Note: Base frequencies correspond to musical notes:
    E3 (D2), G3 (D4), F3 (D6), A3 (D8), B3 (D10), D4 (D12), E4 (D20), A4 (D100)
```

### Audio Events

```
    CJSR AUDIO EVENT TRIGGERS
    ═════════════════════════

    ┌───────────────────┬─────────────────────────────────────────────┐
    │      EVENT        │              AUDIO RESPONSE                 │
    ├───────────────────┼─────────────────────────────────────────────┤
    │                   │                                             │
    │  Race Start       │  3 countdown beeps (square wave)            │
    │                   │  + start signal (triangle, 2× freq)         │
    │                   │                                             │
    │  Race Background  │  Subtle drone loop                          │
    │                   │  Chord progression every 6 seconds          │
    │                   │  Based on text + faction theme              │
    │                   │                                             │
    │  Victory          │  Melody generated from text                 │
    │                   │  Length: max(5, min(10, wpm/10)) notes      │
    │                   │  Position affects volume + octave           │
    │                   │  Final chord (root, 3rd, 5th)               │
    │                   │                                             │
    │  Error/Mistype    │  Low sawtooth buzz (150Hz, 0.15s)          │
    │                   │                                             │
    │  Keystroke        │  Subtle click (800-1000Hz range)           │
    │                   │  Frequency varies by character             │
    │                   │  Volume scales with WPM                     │
    │                   │                                             │
    └───────────────────┴─────────────────────────────────────────────┘
```

---

## The Octix System

Octix are sound-emitting tiles in the Quillverse world. Every tile can have a signature sound, determined by player achievements.

### What is an Octix?

```
                         THE OCTIX CONCEPT
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   OCTIX = "Octave" + "Pixel"                                   │
    │                                                                 │
    │   A sound-emitting tile in the Quillverse MMO world            │
    │                                                                 │
    │   ┌─────┬─────┬─────┬─────┬─────┐                              │
    │   │  ♪  │  ♪  │  ♪  │  ♪  │  ♪  │                              │
    │   │ C4  │ E4  │ G4  │ B4  │ D5  │  ← Each tile plays a note   │
    │   ├─────┼─────┼─────┼─────┼─────┤                              │
    │   │  ♪  │  ♪  │  ♪  │  ♪  │  ♪  │                              │
    │   │ D4  │ F4  │ A4  │ C5  │ E5  │                              │
    │   └─────┴─────┴─────┴─────┴─────┘                              │
    │                                                                 │
    │   When players move through the world, they create music       │
    │   Each tile's sound is determined by who "owns" it             │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Creating Octix

```
    OCTIX CREATION FLOW
    ═══════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   ACTIVITY DETERMINES SOUND                                     │
    │   ─────────────────────────                                     │
    │                                                                 │
    │   When a player wins a challenge (e.g., typing race),          │
    │   the game mode and their performance determine:               │
    │                                                                 │
    │   1. INSTRUMENT                                                 │
    │      ──────────                                                 │
    │      Based on: Faction × Activity Type                         │
    │                                                                 │
    │      D4 faction + Combat race    → War Drums                   │
    │      D6 faction + Building race  → Hammered Dulcimer           │
    │      D8 faction + Explore race   → Pan Flute                   │
    │      D12 faction + Puzzle race   → Crystal Bells               │
    │                                                                 │
    │   2. NOTE                                                       │
    │      ────                                                       │
    │      Based on: WPM × Accuracy × Text Hash                      │
    │                                                                 │
    │      High WPM + High Accuracy    → Higher octave notes         │
    │      Text content hash           → Specific note selection     │
    │      Faction scale               → Constrains to harmonics     │
    │                                                                 │
    │   3. DURATION & VOLUME                                          │
    │      ────────────────────                                       │
    │      Based on: Final position & score margin                   │
    │                                                                 │
    │      1st place                   → Longer sustain, full volume │
    │      Close race                  → Shorter, moderate volume    │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Octix Properties

```
    OCTIX DATA STRUCTURE
    ════════════════════

    octix {
      id: uuid;

      // Location
      tile_x: integer;
      tile_y: integer;
      tile_z: integer;        // For 3D worlds

      // Sound Properties
      instrument: string;      // "flute", "drums", "bells", etc.
      note: string;           // "C4", "F#5", etc.
      duration_ms: integer;   // How long the note plays
      volume: float;          // 0.0 - 1.0

      // Ownership
      creator_wallet: string;
      creator_faction: string;
      created_at: timestamp;

      // Challenge Context
      source_activity: string; // "cjsr_race", "puzzle_solve", etc.
      source_score: integer;   // WPM, points, etc.
      challenge_hash: string;  // Which specific challenge created this

      // Challenger System
      challenger_mode: boolean;     // Is owner open to challenges?
      current_high_score: integer;  // Score to beat
      last_challenged: timestamp;
      defense_wins: integer;        // Times defended successfully
    }
```

---

## Challenger Mode

The Challenger system creates a risk/reward mechanic where players can attack others' Octix sounds but must also defend their own.

### Challenger Status

```
                    CHALLENGER MODE MECHANICS
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   DEFAULT STATE: PROTECTED                                      │
    │   ════════════════════════                                      │
    │                                                                 │
    │   • Your Octix sounds are LOCKED                               │
    │   • No one can challenge/change them                           │
    │   • BUT you also cannot challenge others                       │
    │                                                                 │
    │                      ┌─────────┐                                │
    │                      │ TOGGLE  │                                │
    │                      │CHALLENGER│                               │
    │                      │  MODE   │                                │
    │                      └────┬────┘                                │
    │                           │                                     │
    │                           ▼                                     │
    │                                                                 │
    │   CHALLENGER STATE: VULNERABLE                                  │
    │   ════════════════════════════                                  │
    │                                                                 │
    │   • You CAN challenge other Octix tiles                        │
    │   • BUT your Octix are now OPEN to attack                      │
    │   • Risk vs Reward tradeoff                                    │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Challenge Flow

```
    OCTIX CHALLENGE SEQUENCE
    ════════════════════════

    ┌─────────────────┐
    │  CHALLENGER     │  Player with CHALLENGER MODE enabled
    │  identifies     │  finds an Octix they want to claim
    │  target Octix   │
    └────────┬────────┘
             │
             │  Target owner must ALSO have
             │  CHALLENGER MODE enabled
             │
             ▼
    ┌─────────────────┐     ┌─────────────────┐
    │  SAME CHALLENGE │     │  CHALLENGE      │
    │  MODE REQUIRED  │────►│  REJECTED       │
    │                 │ NO  │                 │
    └────────┬────────┘     └─────────────────┘
             │ YES
             ▼
    ┌─────────────────┐
    │  CHALLENGER     │  Must play the EXACT same game mode
    │  plays the      │  that created the original Octix
    │  original       │
    │  challenge      │  Example: If Octix was created from
    └────────┬────────┘  "Three Magic Number" race, challenger
             │           must beat that score in that mode
             ▼
    ┌─────────────────┐
    │  SCORE          │
    │  COMPARISON     │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
    ┌─────────┐   ┌─────────┐
    │ HIGHER  │   │ LOWER   │
    │ SCORE   │   │ SCORE   │
    └────┬────┘   └────┬────┘
         │             │
         ▼             ▼
    ┌─────────────┐ ┌─────────────┐
    │ CHALLENGER  │ │ DEFENDER    │
    │ WINS        │ │ WINS        │
    │             │ │             │
    │ • Takes the │ │ • Keeps the │
    │   Octix     │ │   Octix     │
    │ • New sound │ │ • Defense   │
    │   based on  │ │   win count │
    │   their     │ │   increases │
    │   performance│ │             │
    └─────────────┘ └─────────────┘
```

### Strategic Implications

```
    CHALLENGER MODE STRATEGY
    ════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   WHY ENABLE CHALLENGER MODE?                                   │
    │   ────────────────────────────                                  │
    │                                                                 │
    │   ✓ Expand your sonic territory                                │
    │   ✓ Replace enemy faction sounds with your own                 │
    │   ✓ Build reputation as a skilled challenger                   │
    │   ✓ Earn special rewards for taking contested tiles            │
    │                                                                 │
    │   WHY STAY PROTECTED?                                           │
    │   ───────────────────                                           │
    │                                                                 │
    │   ✓ Preserve your hard-won Octix sounds                        │
    │   ✓ No risk of losing territory                                │
    │   ✓ Focus on creation rather than competition                  │
    │   ✓ Build permanent sonic landmarks                            │
    │                                                                 │
    │   HYBRID STRATEGY                                               │
    │   ───────────────                                               │
    │                                                                 │
    │   Toggle Challenger Mode strategically:                        │
    │   • Enable when you want to attack                             │
    │   • Disable to consolidate and protect gains                   │
    │   • Coordinate with faction members for campaigns              │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Visual: Octix World State

```
    OCTIX WORLD MAP (Example Area)
    ═══════════════════════════════

    ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
    │ 🔒  │ ⚔️  │ 🔒  │ ⚔️  │ 🔒  │ ⚔️  │ 🔒  │ 🔒  │
    │ C4  │ E4  │ G4  │ B4  │ D5  │ F5  │ A5  │ C6  │
    │ D6  │ D4  │ D6  │ D4  │ D6  │ D4  │ D6  │ D6  │
    ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
    │ ⚔️  │ 🔒  │ 💥  │ 🔒  │ ⚔️  │ 🔒  │ ⚔️  │ 🔒  │
    │ D4  │ F4  │ A4  │ C5  │ E5  │ G5  │ B5  │ D6  │
    │ D8  │ D12 │ !!! │ D12 │ D8  │ D12 │ D8  │ D12 │
    ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
    │ 🔒  │ ⚔️  │ 🔒  │ ⚔️  │ 🔒  │ ⚔️  │ 🔒  │ ⚔️  │
    │ E4  │ G4  │ B4  │ D5  │ F5  │ A5  │ C6  │ E6  │
    │ D20 │ D4  │ D20 │ D4  │ D20 │ D4  │ D20 │ D4  │
    └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

    LEGEND:
    ───────
    🔒 = Protected (Challenger Mode OFF)
    ⚔️ = Open (Challenger Mode ON)
    💥 = Currently being contested
    D# = Faction that owns tile
    Note = Sound this tile plays
```

---

## Minting & Rights

### Octix as NFTs

```
                    OCTIX MINTING SYSTEM
    ════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   OCTIX OWNERSHIP LEVELS                                        │
    │   ══════════════════════                                        │
    │                                                                 │
    │   LEVEL 1: GAME OWNERSHIP (Default)                            │
    │   ─────────────────────────────────                            │
    │   • Octix exists in game database                              │
    │   • Linked to player account                                   │
    │   • Challengeable/transferable in-game                         │
    │   • No blockchain involvement                                   │
    │   • Cost: FREE (just earn it through gameplay)                 │
    │                                                                 │
    │   LEVEL 2: MINTED NFT (Optional)                               │
    │   ──────────────────────────────                               │
    │   • Octix minted as Solana NFT                                 │
    │   • Permanent ownership on blockchain                          │
    │   • Tradeable on NFT marketplaces                              │
    │   • Sound data stored on Arweave/IPFS                          │
    │   • Cost: Minting fee + gas                                    │
    │                                                                 │
    │   LEVEL 3: SOVEREIGN OCTIX                                      │
    │   ────────────────────────                                      │
    │   • NFT + perpetual territory rights                           │
    │   • Cannot be challenged even in Challenger Mode               │
    │   • Generates royalties from plays                             │
    │   • Limited supply (rare achievements only)                    │
    │   • Cost: Special requirements + minting                       │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Rights & Royalties

```
    OCTIX RIGHTS FRAMEWORK
    ══════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   SOUND OWNERSHIP                                               │
    │   ───────────────                                               │
    │                                                                 │
    │   Original Sound Creation:                                      │
    │   • Player owns the specific sound configuration               │
    │   • Instrument + Note + Duration = unique signature            │
    │   • Can license to other players                               │
    │                                                                 │
    │   DERIVATIVE RIGHTS                                             │
    │   ─────────────────                                             │
    │                                                                 │
    │   If sound uses Citizen DJ samples:                            │
    │   • Must include LOC attribution                               │
    │   • Original is public domain                                  │
    │   • Remix/arrangement is player-owned                          │
    │                                                                 │
    │   ROYALTY FLOW                                                  │
    │   ────────────                                                  │
    │                                                                 │
    │   When Octix sound plays in world:                             │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │  Play Event                                              │  │
    │   │       │                                                  │  │
    │   │       ▼                                                  │  │
    │   │  ┌─────────────┐                                        │  │
    │   │  │ Micro-tip   │  Optional: Listener tips 0.001 QLX     │  │
    │   │  │ (optional)  │  per play to support creator           │  │
    │   │  └─────────────┘                                        │  │
    │   │       │                                                  │  │
    │   │       ▼                                                  │  │
    │   │  ┌─────────────┐                                        │  │
    │   │  │ Distribution│  70% Creator | 20% Faction | 10% DAO   │  │
    │   │  └─────────────┘                                        │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### Octix NFT Contract (Solana)

```
    OCTIX SMART CONTRACT ARCHITECTURE
    ══════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   PROGRAM: octix_nft                                           │
    │                                                                 │
    │   ACCOUNTS                                                      │
    │   ────────                                                      │
    │                                                                 │
    │   OctixMint {                                                   │
    │     mint: Pubkey,           // SPL Token mint                  │
    │     owner: Pubkey,          // Current owner                   │
    │     creator: Pubkey,        // Original creator                │
    │     metadata_uri: String,   // Arweave/IPFS link               │
    │     sound_hash: [u8; 32],   // Hash of sound parameters        │
    │     tile_coords: (i32, i32, i32),  // World position           │
    │     challenger_mode: bool,  // Open to challenges?             │
    │     royalty_bps: u16,       // Royalty basis points            │
    │     defense_wins: u32,      // Challenge defense count         │
    │   }                                                             │
    │                                                                 │
    │   INSTRUCTIONS                                                  │
    │   ────────────                                                  │
    │                                                                 │
    │   mint_octix(                                                   │
    │     tile_coords,                                                │
    │     sound_params,                                               │
    │     metadata_uri                                                │
    │   ) -> OctixMint                                               │
    │                                                                 │
    │   toggle_challenger_mode(                                       │
    │     octix_mint,                                                 │
    │     enabled: bool                                               │
    │   )                                                             │
    │                                                                 │
    │   initiate_challenge(                                           │
    │     target_octix,                                               │
    │     challenger_score,                                           │
    │     challenge_proof                                             │
    │   )                                                             │
    │                                                                 │
    │   resolve_challenge(                                            │
    │     challenge_id,                                               │
    │     winner: Pubkey,                                             │
    │     new_sound_params                                            │
    │   )                                                             │
    │                                                                 │
    │   transfer_octix(                                               │
    │     from,                                                       │
    │     to,                                                         │
    │     octix_mint                                                  │
    │   )                                                             │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Challenge Verification

```
    CHALLENGE PROOF SYSTEM
    ══════════════════════

    To prevent cheating, challenge scores are verified:

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   PROOF COMPONENTS                                              │
    │   ────────────────                                              │
    │                                                                 │
    │   1. Game Server Signature                                      │
    │      • Server signs score data                                 │
    │      • Includes timestamp, game mode, player ID                │
    │                                                                 │
    │   2. Input Replay Hash                                          │
    │      • Hash of all keystrokes/inputs                           │
    │      • Can be replayed to verify score                         │
    │                                                                 │
    │   3. Random Seed                                                │
    │      • Blockchain-derived randomness                           │
    │      • Prevents pre-computation                                │
    │                                                                 │
    │   VERIFICATION FLOW                                             │
    │   ─────────────────                                             │
    │                                                                 │
    │   Challenger submits:                                           │
    │   • Score claim                                                │
    │   • Server signature                                           │
    │   • Input replay hash                                          │
    │                                                                 │
    │   Smart contract verifies:                                      │
    │   • Signature is valid from trusted server                     │
    │   • Game mode matches original Octix                           │
    │   • Score > defender's recorded score                          │
    │                                                                 │
    │   If valid → Octix transfers to challenger                     │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Playback & Downloads

### Streaming System

```
    AUDIO STREAMING ARCHITECTURE
    ════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   IN-GAME OCTIX PLAYBACK                                        │
    │   ───────────────────────                                       │
    │                                                                 │
    │   Player Position ──► Nearby Octix Query ──► Sound Synthesis   │
    │                                                                 │
    │   • Real-time synthesis via Tone.js                            │
    │   • Octix within radius trigger sound                          │
    │   • Volume attenuates with distance                            │
    │   • Multiple Octix create harmony/cacophony                    │
    │                                                                 │
    │   JUKEBOX STREAMING                                             │
    │   ─────────────────                                             │
    │                                                                 │
    │   Recordings stored as base64 audio/webm                       │
    │   • On-demand streaming                                        │
    │   • Progressive loading                                        │
    │   • Play count tracked                                         │
    │                                                                 │
    │   VIBE SHRINE PLAYBACK                                          │
    │   ────────────────────                                          │
    │                                                                 │
    │   Full-length tracks (no 30-second limits)                     │
    │   • 2 simultaneous tracks maximum                              │
    │   • Oldest track auto-stops when 3rd plays                     │
    │   • CORS-enabled for external sources                          │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Download Options

```
    DOWNLOAD & EXPORT SYSTEM
    ════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   FORMAT OPTIONS                                                │
    │   ──────────────                                                │
    │                                                                 │
    │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
    │   │    WEBM     │  │    MP3      │  │    WAV      │            │
    │   │  (default)  │  │ (converted) │  │ (lossless)  │            │
    │   │             │  │             │  │             │            │
    │   │  Smallest   │  │ Compatible  │  │ Highest     │            │
    │   │  file size  │  │ everywhere  │  │ quality     │            │
    │   └─────────────┘  └─────────────┘  └─────────────┘            │
    │                                                                 │
    │   ATTRIBUTION REQUIREMENTS                                      │
    │   ────────────────────────                                      │
    │                                                                 │
    │   All downloads include:                                        │
    │   • Creator username/wallet                                    │
    │   • Source collection (if Citizen DJ)                          │
    │   • Quillverse attribution                                     │
    │   • License terms                                              │
    │                                                                 │
    │   TORRENT DISTRIBUTION                                          │
    │   ────────────────────                                          │
    │                                                                 │
    │   Popular tracks get torrent hashes:                           │
    │   • P2P distribution reduces server load                       │
    │   • Community seeding incentivized with QLX                    │
    │   • Verified hash ensures integrity                            │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Music System Tables

```sql
-- Jukebox Recordings (existing)
CREATE TABLE jukebox_recordings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  faction TEXT NOT NULL,              -- d2, d4, d6, d8, d10, d12, d20, d100
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration_seconds INTEGER NOT NULL,
  qlx_cost INTEGER NOT NULL,          -- QLX spent to create
  audio_data TEXT NOT NULL,           -- Base64 encoded audio
  audio_format TEXT DEFAULT 'audio/webm',
  play_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Faction Jukeboxes (existing)
CREATE TABLE faction_jukeboxes (
  id SERIAL PRIMARY KEY,
  faction TEXT NOT NULL UNIQUE,
  total_recordings INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  featured_recording_id INTEGER REFERENCES jukebox_recordings(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Jukebox Play History (existing)
CREATE TABLE jukebox_play_history (
  id SERIAL PRIMARY KEY,
  recording_id INTEGER REFERENCES jukebox_recordings(id) NOT NULL,
  user_id INTEGER REFERENCES users(id), -- Nullable for guests
  faction TEXT NOT NULL,
  play_duration INTEGER NOT NULL,
  played_at TIMESTAMP DEFAULT NOW()
);

-- NEW: Octix Tiles
CREATE TABLE octix_tiles (
  id SERIAL PRIMARY KEY,
  tile_x INTEGER NOT NULL,
  tile_y INTEGER NOT NULL,
  tile_z INTEGER DEFAULT 0,

  -- Sound properties
  instrument TEXT NOT NULL,           -- 'flute', 'drums', 'bells', etc.
  note TEXT NOT NULL,                 -- 'C4', 'F#5', etc.
  duration_ms INTEGER NOT NULL,
  volume DECIMAL(3,2) DEFAULT 0.8,

  -- Ownership
  creator_wallet TEXT NOT NULL,
  creator_faction TEXT NOT NULL,
  current_owner_wallet TEXT NOT NULL,

  -- Creation context
  source_activity TEXT NOT NULL,      -- 'cjsr_race', 'puzzle', etc.
  source_score INTEGER NOT NULL,
  source_challenge_hash TEXT NOT NULL,

  -- Challenger system
  challenger_mode BOOLEAN DEFAULT FALSE,
  current_high_score INTEGER NOT NULL,
  defense_wins INTEGER DEFAULT 0,
  last_challenged TIMESTAMP,

  -- NFT status
  is_minted BOOLEAN DEFAULT FALSE,
  nft_mint_address TEXT,
  metadata_uri TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tile_x, tile_y, tile_z)
);

-- NEW: Octix Challenges
CREATE TABLE octix_challenges (
  id SERIAL PRIMARY KEY,
  octix_id INTEGER REFERENCES octix_tiles(id) NOT NULL,

  challenger_wallet TEXT NOT NULL,
  defender_wallet TEXT NOT NULL,

  challenge_activity TEXT NOT NULL,   -- Must match original
  challenger_score INTEGER NOT NULL,
  defender_score INTEGER NOT NULL,    -- Original creation score

  status TEXT DEFAULT 'pending',      -- pending, completed, expired
  winner_wallet TEXT,

  -- Proof data
  server_signature TEXT NOT NULL,
  input_replay_hash TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- NEW: Vibe Shrine Remixes
CREATE TABLE vibe_shrine_remixes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),

  title TEXT NOT NULL,
  description TEXT,

  audio_url TEXT NOT NULL,
  audio_format TEXT NOT NULL,
  duration_seconds INTEGER,

  -- Attribution
  source_collections TEXT[],          -- Citizen DJ collection IDs
  source_tracks TEXT[],               -- Specific track references

  -- Metadata
  tags TEXT[],
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,

  -- Distribution
  download_url TEXT,
  torrent_hash TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- NEW: Octix Sound Presets
CREATE TABLE octix_instruments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  faction TEXT,                       -- NULL = universal

  -- Tone.js parameters
  oscillator_type TEXT NOT NULL,      -- 'sine', 'square', etc.
  envelope_attack DECIMAL(4,3),
  envelope_decay DECIMAL(4,3),
  envelope_sustain DECIMAL(4,3),
  envelope_release DECIMAL(4,3),

  -- Visual
  emoji TEXT,
  description TEXT
);
```

---

## API Reference

### Jukebox Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jukebox/:faction/recordings` | GET | List faction recordings |
| `/api/jukebox/recording/:id/audio` | GET | Get recording audio data |
| `/api/jukebox/record` | POST | Save new recording (auth required) |
| `/api/jukebox/play` | POST | Log playback event |

### Vibe Shrine Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/vibe-shrine/remixes` | GET | List community remixes |
| `/api/vibe-shrine/upload` | POST | Upload new remix |
| `/api/citizen-dj/track/:id` | GET | Proxy Citizen DJ track |

### Octix Endpoints (Planned)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/octix/nearby` | GET | Get Octix in radius |
| `/api/octix/:id` | GET | Get single Octix details |
| `/api/octix/create` | POST | Create Octix from achievement |
| `/api/octix/:id/challenge` | POST | Initiate challenge |
| `/api/octix/:id/toggle-challenger` | POST | Toggle challenger mode |
| `/api/octix/:id/mint` | POST | Mint as NFT |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MUSIC SYSTEM QUICK REFERENCE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  VIBE SHRINE                                                                │
│  ──────────                                                                 │
│  • Explore: Browse 15+ Library of Congress collections                     │
│  • Create: Upload remixes with attribution                                 │
│  • Library: Play/download community remixes                                │
│  • 2 tracks max simultaneous playback                                      │
│                                                                             │
│  JUKEBOX                                                                    │
│  ───────                                                                    │
│  • 8 faction jukeboxes (one per TEK8 guild)                               │
│  • Recording cost: 1 QLX per second                                        │
│  • Auth required to record, guests can play                                │
│                                                                             │
│  OCTIX                                                                      │
│  ─────                                                                      │
│  • Sound tiles created from achievements                                   │
│  • Activity type → Instrument                                              │
│  • Performance → Note + Duration                                           │
│  • CHALLENGER MODE: Risk/reward toggle                                     │
│    - OFF: Protected, can't attack others                                   │
│    - ON: Can attack, but vulnerable to attack                              │
│                                                                             │
│  CHALLENGE RULES                                                            │
│  ───────────────                                                            │
│  • Both parties must have CHALLENGER MODE ON                               │
│  • Must play EXACT same game mode as original                              │
│  • Higher score wins the Octix                                             │
│  • Winner's performance sets new sound signature                           │
│                                                                             │
│  MINTING                                                                    │
│  ───────                                                                    │
│  • Level 1: Game ownership (free)                                          │
│  • Level 2: NFT (costs mint fee)                                           │
│  • Level 3: Sovereign (rare, unchallengeable)                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.2*
*Supplement to: QUILLVERSE-ARCHITECTURE_v1.md*
*Last Updated: January 2025*
*For the Quillverse belongs to those who scribe and sing it.*
