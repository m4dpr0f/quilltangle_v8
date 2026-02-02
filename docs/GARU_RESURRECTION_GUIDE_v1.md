# Garu Resurrection System Guide

**Version:** 1.0
**Date:** January 31, 2026

---

## Overview

The Resurrection System ensures players never permanently lose a cherished Garu. Through the power of music, written memories, and ancestral bonds, fallen Garu can return.

---

## The Core Concept

> "In the Quillverse, music and writing become more than expression—they become lifelines."

During your Garu's life, you create **memories**:
- **Musical Tracks** - Songs, melodies, sounds that capture moments
- **Journal Entries** - Written reflections on your journey
- **Milestones** - Auto-recorded achievements

These memories capture **snapshots** of your Garu's state (level, stats, bond) at the moment of creation.

If your Garu falls, these memories become the keys to resurrection.

---

## Creating Memories

### Musical Tracks 🎵

**How to create:**
1. Go to `/garu/memories`
2. Select "Musical Track"
3. Enter a title and description
4. Provide an audio URL (IPFS, SoundCloud, etc.)
5. Submit

**What gets saved:**
- Current level
- All 8 elemental stats
- Bond percentage
- Phase and generation

**Why they matter:**
- 1 track = 75% level restoration
- 3+ tracks = 100% level restoration
- Most powerful resurrection component

### Journal Entries 📜

**How to create:**
1. Go to `/garu/memories`
2. Select "Journal Entry"
3. Enter a title
4. Write your thoughts (no limit)
5. Submit

**What gets saved:**
- Same snapshot as tracks

**Why they matter:**
- 1 writing = 75% bond restoration
- 2+ writings = 100% bond restoration
- Preserve the emotional connection

### Milestones 🏆

**Auto-recorded events:**
- First hatching
- First race won
- Level 10, 25, 50 achievements
- First fusion
- Composite type achieved
- Territory mastery

These happen automatically and provide additional resurrection anchors.

---

## Resurrection Requirements

To resurrect a fallen Garu, you need:

### 1. Memories (Minimum 1)
At least one memory (track, writing, or milestone) must exist for the Garu.

### 2. A Descendant
A living Garu that was born from the fallen one's legacy eggs. This creates the ancestral link needed to channel the resurrection.

### 3. No Active Cooldown
7 days must pass between resurrections of the same Garu.

---

## Restoration Quality

The more memories you have, the better the restoration:

| Quality | Requirements | Level | Stats | Bond |
|---------|--------------|-------|-------|------|
| **Partial** | 1 memory | 50% | 50% | 50% |
| **Substantial** | 1+ track OR 2+ writings | 75% | 70% | 75% |
| **Full** | 3+ tracks + 1 writing | 100% | 90% | 100% |

The restored Garu returns at the level captured in your best memory (highest snapshot level).

---

## The Resurrection Ritual

### Step 1: Visit the Shrine
Navigate to `/garu/resurrect`

### Step 2: Select Your Fallen Garu
Choose from the list of deceased Garu. Green highlight = ready for resurrection.

### Step 3: Choose a Channeling Descendant
Select a living Garu that was born from the fallen one's eggs. They will gain "Ancestor Bond" as a reward.

### Step 4: Select Memories
- Choose a **primary memory** (determines restoration level)
- Optionally add more memories for bonus restoration

### Step 5: Optional Rename
You can give your Garu a new name, or keep the original.

### Step 6: Perform the Ritual
Click "Resurrect" and witness the return!

---

## Ancestor Bond

The descendant Garu who channels the resurrection receives:

- **+10% permanent bond** with their rider
- **Special connection** to their ancestor
- This bond persists across generations

This creates meaningful generational connections in the Quillverse.

---

## Strategy Tips

### During Your Garu's Life:

1. **Create tracks regularly** - After each major achievement, record a song
2. **Journal weekly** - Document your adventures
3. **Diversify timestamps** - Create memories at different levels for flexibility
4. **Claim legacy eggs** - Ensure you have descendants for potential resurrection

### After Death:

1. **Don't panic** - If you have memories, resurrection is possible
2. **Check descendants** - Find eggs from their legacy and hatch one
3. **Gather 3+ tracks** for full level restoration
4. **Wait out cooldowns** if you've recently resurrected

---

## Example Scenario

**Luna** the Ether Garu reaches Level 35 with a 92% bond.

During her life, her rider created:
- 4 musical tracks (at levels 5, 15, 25, 35)
- 2 journal entries
- Auto-milestones for hatching and level achievements

Luna falls in the D10 Chaos Roads, spawning 12 legacy eggs across 8 territories.

**Resurrection:**
1. Rider claims one of Luna's eggs → hatches **Nova**
2. After Nova matures, rider visits the Resurrection Shrine
3. Selects Luna, chooses Nova as channel, picks the Level 35 track
4. Adds all other tracks and one writing
5. Luna returns at Level 35 with 83% stats and 92% bond
6. Nova gains Ancestor Bond (+10% bond, connected to Luna)

Both Garu now journey together!

---

## Technical Details

### Database Tables

```sql
-- garu_memories: Store snapshots
id, garu_id, memory_type, title, content, audio_url,
snapshot_level, snapshot_stats, snapshot_bond, created_at

-- garu_resurrections: Track history
id, original_garu_id, channel_garu_id, memory_ids_used,
restoration_quality, restored_level, resurrected_at
```

### API Endpoints

```
GET  /api/garu/memory?wallet=X&garuId=Y  - List memories
POST /api/garu/memory                     - Create memory
GET  /api/garu/resurrect?wallet=X         - Check resurrectables
GET  /api/garu/resurrect?wallet=X&garuId=Y - Get requirements
POST /api/garu/resurrect                  - Perform resurrection
```

---

## Philosophy

The resurrection system exists because:

1. **Emotional investment matters** - Players form real bonds with their Garu
2. **Loss shouldn't mean quitting** - Rage-quit prevention
3. **Effort should be rewarded** - Those who create memories are prepared
4. **Music has power** - The act of creating becomes meaningful
5. **Generations connect** - Descendants become more than replacements

---

## Summary

| If You Want... | You Need... |
|----------------|-------------|
| To protect your Garu | Create memories during their life |
| Full restoration | 3+ tracks + 1 writing |
| To resurrect | 1+ memory + 1 descendant |
| Ancestor Bond bonus | Use a descendant as channel |

---

*"Every song you sing, every word you write, becomes a thread connecting you across life and death. In the Quillverse, love never truly ends."*
