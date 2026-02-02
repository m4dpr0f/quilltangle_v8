# Quillverse System Integration Guide

**Version:** 1.0
**Date:** January 31, 2026

---

## Overview

This guide documents how the Quillverse integrates three TTRPG systems with the TEK8 framework, using resources from `/core`:

| System | Source | Integration |
|--------|--------|-------------|
| **Dice Godz / CrySword** | Native TEK8 | Primary system |
| **Pathfinder 1e** | SRD Markdown + Modules | Fantasy adaptation |
| **Mutants & Masterminds 3e** | Core Rules PDF | Superhero adaptation |

---

## Resource Inventory

### Pathfinder 1E Resources

| Resource | Path | Usage |
|----------|------|-------|
| **SRD Markdown** | `core/Pathfinder-1E-SRD-Markdown-main/` | Spell database, bestiary |
| **Character Sheet** | `core/UnofficialPathfinderCharacterSheet-main/` | Field structure reference |
| **Caravan Rules** | `core/pf1e-caravans-master/` | Road travel mechanics |
| **Hex Grids** | `core/pf1e-hex-grids-master/` | Territory exploration |
| **Wound Thresholds** | `core/pf1e-wound-thresholds-master/` | Wellness-based damage |
| **Combat HUD** | `core/enhancedcombathud-pf1-master/` | VTT combat interface |

### M&M 3E Resources

| Resource | Path | Usage |
|----------|------|-------|
| **Core Rules PDF** | `core/Mutants and masterminds Core Rules 3E.pdf` | Power building reference |

### CrySword Saga Resources

| Resource | Path | Usage |
|----------|------|-------|
| **TTRPG Design** | `core/CRYSWORD_SAGA_TTRPG_DESIGN.md` | Word-weaving mechanics |
| **Complete Zine** | `core/CRYSWORD_SAGA_COMPLETE_ZINE_v2.0.md` | Full ruleset |

---

## TEK8 Element Mappings

### Dice Godz (Native)

| TEK8 Die | Element | Crystal School | Word Count | Ability |
|----------|---------|----------------|------------|---------|
| D2 | Coin | Luck Riders | 2 | Instinct |
| D4 | Fire | Forge Masters | 4 | Agility |
| D6 | Earth | Ground Builders | 6 | Endurance |
| D8 | Air | Sky Dancers | 8 | Strength |
| D10 | Chaos | Wild Shapers | 10 | Willpower |
| D12 | Ether | Dream Weavers | 12 | Creativity |
| D20 | Water | Flow Keepers | 20 | Empathy |
| D100 | Order | Archive Seekers | 100 | Focus |

### Pathfinder 1e Mapping

| TEK8 Element | PF1e Domain | PF1e School | Suggested Classes |
|--------------|-------------|-------------|-------------------|
| Coin (D2) | Luck, Trade | Divination | Rogue, Bard |
| Fire (D4) | Fire, War | Evocation | Fighter, Magus |
| Earth (D6) | Earth, Plant | Conjuration | Druid, Ranger |
| Air (D8) | Air, Travel | Transmutation | Monk, Wizard |
| Chaos (D10) | Chaos, Trickery | Illusion | Sorcerer, Bard |
| Ether (D12) | Magic, Void | Enchantment | Wizard, Witch |
| Water (D20) | Water, Healing | Abjuration | Cleric, Oracle |
| Order (D100) | Law, Knowledge | Universal | Wizard, Investigator |

### M&M 3e Mapping

| TEK8 Element | M&M Power Source | Suggested Archetypes |
|--------------|------------------|---------------------|
| Coin (D2) | Luck Powers | Gadgeteer, Crime Fighter |
| Fire (D4) | Energy (Fire) | Energy Controller |
| Earth (D6) | Earth/Nature | Powerhouse |
| Air (D8) | Movement/Flight | Speedster, Martial Artist |
| Chaos (D10) | Metamorphic | Shapeshifter, Mimic |
| Ether (D12) | Mystic/Cosmic | Mystic, Paragon |
| Water (D20) | Emotion/Psych | Psychic |
| Order (D100) | Technology | Battlesuit, Construct |

---

## Wound Thresholds → Wellness Integration

The PF1e Wound Threshold system maps beautifully to TEK8's 8 wellness dimensions:

### Standard PF1e Wound Thresholds

```
Vigor (temporary HP) → depletes first
Wounds (true HP) → reveals thresholds:
  - Grazed: Any wound damage
  - Wounded: 25% wounds lost
  - Critical: 50% wounds lost
  - Staggered: 50%+ wounds (movement penalty)
```

### TEK8 Wellness Adaptation

Each threshold triggers a different wellness dimension:

| Threshold | Wellness Affected | Effect |
|-----------|-------------------|--------|
| Healthy | All balanced | Normal function |
| Grazed | Physical | -1 STR/DEX checks |
| Wounded | Emotional | -2 Will saves |
| Critical | Spiritual | Cannot use healing |
| Staggered | Social | Cannot Aid Another |

### Cross-System Wellness

Characters can track 8 wellness bars (one per TEK8 element):

```
Physical (D8 Air)     [████████░░] 80%
Emotional (D12 Ether) [██████████] 100%
Intellectual (D100)   [███████░░░] 70%
Social (D10 Chaos)    [█████░░░░░] 50%
Occupational (D4)     [████████░░] 80%
Spiritual (D6 Earth)  [██████████] 100%
Environmental (D20)   [███████░░░] 70%
Financial (D2 Coin)   [██████░░░░] 60%
```

---

## Caravan System → 40 Roads Travel

The PF1e Caravan rules provide mechanics for traveling between the 40 Roads.

### Caravan Stats (from Jade Regent)

- **Offense/Defense**: Combat capability
- **Mobility**: Movement speed between roads
- **Morale**: Community spirit
- **Consumption**: Resource drain per road

### TEK8 Road Travel

| Position | Road Type | Travel Modifier |
|----------|-----------|-----------------|
| OUT | Outer Ring | Base difficulty |
| UP | Ascending | +2 Morale required |
| DWN | Descending | -2 Consumption |
| U45 | Upper Diagonal | Requires 2 element attunement |
| D45 | Lower Diagonal | Synthesis challenges |

### Caravan Roles (TEK8 Aligned)

| Role | TEK8 Element | Caravan Bonus |
|------|--------------|---------------|
| Wainwright | D6 Earth | +2 Mobility |
| Guard | D8 Air | +2 Defense |
| Scout | D10 Chaos | +2 Initiative |
| Cook | D20 Water | -2 Consumption |
| Entertainer | D12 Ether | +2 Morale |
| Trader | D2 Coin | +Gold per road |
| Healer | D4 Fire | Wound recovery |
| Archivist | D100 Order | Road knowledge |

---

## Hex Grid → Territory Exploration

The Hex Grid system enables visual exploration of the 40 Roads.

### Hex Types by Element

| Element | Terrain | Hex Color | Features |
|---------|---------|-----------|----------|
| Coin | Market/Urban | Gold | Trade posts |
| Fire | Volcanic/Desert | Red | Forges, trials |
| Earth | Forest/Mountain | Green | Gardens, caves |
| Air | Sky/Floating | Cyan | Towers, bridges |
| Chaos | Shifting/Wild | Orange | Random encounters |
| Ether | Dream/Astral | Purple | Portals, visions |
| Water | Ocean/River | Blue | Ships, healing |
| Order | City/Library | White | Archives, law |

### Road Position Hex Patterns

```
         [U45]
    [UP]       [OUT]
         [●]
    [DWN]      [D45]
```

Each road has a central hex (●) with 5 positions arranged around it.

---

## Spell Database Integration

The Pathfinder SRD Markdown provides ~2000 spells organized alphabetically.

### Spell Format (from SRD)

```yaml
---
aliases: [Acid Arrow]
created: 2023-04-27
updated: 2023-04-28
---

## Acid Arrow
**source**:: PRPG Core Rulebook pg. 239
**school**:: conjuration (creation) (acid)
**level**:: arcanist 2, bloodrager 2, magus 2, sorcerer 2, wizard 2
```

### TEK8 Element Tagging

Spells can be tagged by TEK8 element for themed spell lists:

| PF1e School | Primary TEK8 | Secondary TEK8 |
|-------------|--------------|----------------|
| Abjuration | Water (D20) | Order (D100) |
| Conjuration | Earth (D6) | Chaos (D10) |
| Divination | Coin (D2) | Ether (D12) |
| Enchantment | Ether (D12) | Water (D20) |
| Evocation | Fire (D4) | Air (D8) |
| Illusion | Chaos (D10) | Ether (D12) |
| Necromancy | Earth (D6) | Ether (D12) |
| Transmutation | Air (D8) | Chaos (D10) |

---

## Character Sheet Field Reference

From the Unofficial Pathfinder Character Sheet:

### Core Fields

```javascript
// Personal Info
nameOfPC, align, player, characterLevel, deity, home, race, size, gender, weight, height

// Ability Scores (6)
strScore, strMod, strTempAdjust, strTempMod
dexScore, dexMod, dexTempAdjust, dexTempMod
conScore, conMod, conTempAdjust, conTempMod
intScore, intMod, intTempAdjust, intTempMod
wisScore, wisMod, wisTempAdjust, wisTempMod
chaScore, chaMod, chaTempAdjust, chaTempMod

// Combat
hp, ac, initiative, bab, cmb, cmd, speed

// Saves
fortSave, refSave, willSave
```

### TEK8 Extended Fields

```javascript
// TEK8 Element Alignment
tek8Element, tek8Road, tek8Position

// Wellness Dimensions (8)
wellnessPhysical, wellnessEmotional, wellnessIntellectual
wellnessSocial, wellnessOccupational, wellnessSpiritual
wellnessEnvironmental, wellnessFinancial

// Codex Progress (8 schools)
codexD2, codexD4, codexD6, codexD8
codexD10, codexD12, codexD20, codexD100

// Crystal School
crystalSchool, wordCount
```

---

## Implementation Roadmap

### Phase 1: Enhanced Character Sheets
- [x] Basic multi-system generator
- [ ] Import Pathfinder SRD spell lists
- [ ] Add wellness tracking
- [ ] Codex progression calculator

### Phase 2: Caravan/Travel System
- [ ] Caravan sheet component
- [ ] Road travel calculator
- [ ] Resource management

### Phase 3: Hex Exploration
- [ ] Visual hex map of 40 Roads
- [ ] Territory exploration mechanics
- [ ] Random encounter tables by element

### Phase 4: VTT Integration
- [ ] Foundry VTT module compatibility
- [ ] Export to Foundry format
- [ ] Import from Foundry

---

## Quick Reference: Cross-System Play

### Running a Pathfinder 1e game in the Quillverse

1. **Character Creation**: Use standard PF1e rules
2. **Element Assignment**: Choose TEK8 element based on class/domain
3. **Road Starting Point**: Begin at a road matching your element
4. **Wellness Tracking**: Enable wound thresholds with wellness overlay
5. **Travel**: Use caravan rules between roads

### Running a M&M 3e game in the Quillverse

1. **Character Creation**: Use standard M&M rules
2. **Power Source**: Map to TEK8 element
3. **Complications**: Include Quillverse-specific complications
4. **Adventure Location**: Set stories in specific roads

### Running a Dice Godz game

1. **Character Creation**: Choose Crystal School
2. **Word-Weaving**: Use word count mechanics
3. **Codex Progression**: Track cross-school learning
4. **Refugee Council**: Democratic decision-making

---

*"Whether you roll d20s, count power points, or weave words into reality, all paths lead through the 40 Roads."*
