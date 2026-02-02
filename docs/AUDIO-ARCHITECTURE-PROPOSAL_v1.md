# Unified Audio Architecture Proposal
**Version 1.0 | January 2025**

## Overview

This proposal outlines a comprehensive integration of audio/music production features across the Quillverse ecosystem, building on existing implementations in qtx while incorporating Citizen DJ, open-source DAW capabilities, and TEK8 faction theming.

## Current State (qtx)

### Existing Audio Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Audio Engine | `/client/src/lib/audio-engine.ts` | CJSR Dynamic Audio Engine with faction themes |
| VibeShrine | `/client/src/pages/vibe-shrine.tsx` | Central audio hub and recording interface |
| Jukebox | `/client/src/components/Jukebox.tsx` | Faction-based recording with QLX economy |
| Citizen DJ | `/client/src/pages/citizen-dj.tsx` | Library of Congress sample integration |
| Three Magic Number | `/client/src/pages/three-magic-number.tsx` | De La Soul lyrics typing race |
| Musical Translation | `/client/src/components/MusicalTranslationInterface.tsx` | 8-faction instrument/scale mapping |

### Technology Stack
- **Tone.js v15.1.22** - Web audio synthesis
- **React** - Component architecture
- **QLX Economy** - Recording costs and ownership

## Proposed Unified Architecture

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

## Component Integration

### 1. Citizen DJ Enhancement

**Current**: Basic Library of Congress sample browser
**Proposed**:

```typescript
interface CitizenDJIntegration {
  // Sample collections mapped to realms
  collections: {
    qlx: string[];  // Folk, world music, traditional
    qly: string[];  // Sports broadcasts, crowd sounds
    qlz: string[];  // Tech sounds, electronic archives
  };

  // Sacred instrument samples
  sacredInstruments: Map<InstrumentName, SamplePack>;

  // Attribution tracking for QLX economy
  sampleUsage: {
    sampleId: string;
    usedIn: string[];  // Track IDs
    credits: number;   // QLX earned by original source
  }[];
}
```

### 2. TEK8 Faction Audio System

Each of the 8 TEK8 guilds has a distinct audio identity:

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

### 3. Open DAW Features

Inspired by openDAW and GridSound, proposed web-based features:

```typescript
interface QuillverseDAW {
  // Multi-track arrangement
  tracks: Track[];

  // Pattern-based sequencer (GridSound style)
  patterns: {
    drums: DrumPattern[];
    melody: NotePattern[];
    effects: EffectPattern[];
  };

  // Faction-themed instruments
  instruments: Map<TEK8Guild, InstrumentPreset[]>;

  // Citizen DJ sample integration
  sampleBrowser: CitizenDJBrowser;

  // Export options
  export: {
    wav: boolean;
    mp3: boolean;
    stems: boolean;  // Individual track export
    nft: boolean;    // Mint as audio NFT
  };
}
```

### 4. Three Magic Number Expansion

**Current**: De La Soul lyrics typing race
**Proposed**: Expandable to multiple musical typing challenges:

```typescript
interface MagicNumberGame {
  // Multiple song/lyric sources
  songs: {
    id: string;
    title: string;
    artist: string;
    lyrics: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    realm: 'qlx' | 'qly' | 'qlz';
  }[];

  // Multiplayer racing
  multiplayer: {
    maxPlayers: 3;  // "Three" is magic
    syncMode: 'realtime' | 'async';
  };

  // Rewards tied to realm
  rewards: {
    qlx: number;  // Culture points
    accuracy: number;
    wpm: number;
  };
}
```

## Implementation Phases

### Phase 1: Audio Hub Consolidation
- Unify VibeShrine as central audio control
- Integrate all existing audio components
- Create consistent UI/UX across audio features

### Phase 2: Citizen DJ Deep Integration
- Map sample collections to realms/factions
- Build sacred instrument sample library
- Implement attribution and QLX credits

### Phase 3: Basic DAW Features
- Multi-track timeline
- Pattern sequencer
- Faction instrument presets
- Basic effects chain

### Phase 4: Collaborative Features
- Real-time multi-user sessions
- Nation anthem creation tools
- Collaborative composition for teams

### Phase 5: Economy Integration
- Recording costs in QLX
- Audio NFT minting
- Royalty distribution for samples

## File Structure Proposal

```
/src/audio/
├── engine/
│   ├── ToneEngine.ts        # Core Tone.js wrapper
│   ├── FactionThemes.ts     # TEK8 audio identities
│   └── SampleManager.ts     # Citizen DJ integration
├── components/
│   ├── VibeShrine/          # Hub component
│   ├── DAW/                 # DAW features
│   ├── Jukebox/             # Recording interface
│   └── MagicNumber/         # Typing game
├── hooks/
│   ├── useAudioEngine.ts
│   ├── useCitizenDJ.ts
│   └── useFactionTheme.ts
└── data/
    ├── sacred-instruments.json
    ├── faction-presets.json
    └── citizen-dj-collections.json
```

## Token Economics

| Action | QLX Cost | QLX Reward |
|--------|----------|------------|
| Record track (basic) | 10 QLX | - |
| Record track (premium) | 50 QLX | - |
| Use Citizen DJ sample | 5 QLX | 1 QLX to source* |
| Complete Magic Number | - | 5-50 QLX |
| Create nation anthem | 100 QLX | - |
| Sample usage royalty | - | 0.5 QLX per use |

*Source refers to original uploader/curator

## Technical Requirements

### Dependencies
- Tone.js ^15.1.22
- React ^18.x
- Web Audio API support
- IndexedDB for local storage
- WebSocket for real-time collaboration

### Browser Support
- Chrome 70+
- Firefox 75+
- Safari 14+
- Edge 79+

## Next Steps

1. Review and approve this architecture
2. Audit existing qtx audio code for reusability
3. Create component migration plan
4. Build unified VibeShrine hub
5. Incrementally add DAW features

---

*"Music is the universal language of the Quillverse"*
