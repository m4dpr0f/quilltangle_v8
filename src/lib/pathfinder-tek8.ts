/**
 * Pathfinder 1e + TEK8 Integration
 *
 * Maps Pathfinder concepts to TEK8 elements for Quillverse integration.
 */

import { PETALS, ELEMENTAL_ORDER } from './tek8-roads';

// ============== TEK8 ELEMENT MAPPINGS ==============

export const PF_SCHOOL_TO_TEK8: Record<string, string> = {
  'abjuration': 'D20',     // Water - protection, healing
  'conjuration': 'D6',     // Earth - summoning, creation
  'divination': 'D2',      // Coin - luck, prophecy
  'enchantment': 'D12',    // Ether - mind, charm
  'evocation': 'D4',       // Fire - energy, destruction
  'illusion': 'D10',       // Chaos - deception, change
  'necromancy': 'D6',      // Earth - life/death cycle
  'transmutation': 'D8',   // Air - change, movement
  'universal': 'D100',     // Order - all schools
};

export const PF_DOMAIN_TO_TEK8: Record<string, string> = {
  // Core Domains
  'Air': 'D8',
  'Animal': 'D6',
  'Artifice': 'D100',
  'Chaos': 'D10',
  'Charm': 'D12',
  'Community': 'D20',
  'Darkness': 'D12',
  'Death': 'D6',
  'Destruction': 'D4',
  'Earth': 'D6',
  'Evil': 'D10',
  'Fire': 'D4',
  'Glory': 'D12',
  'Good': 'D20',
  'Healing': 'D20',
  'Knowledge': 'D100',
  'Law': 'D100',
  'Liberation': 'D10',
  'Luck': 'D2',
  'Madness': 'D10',
  'Magic': 'D12',
  'Nobility': 'D100',
  'Plant': 'D6',
  'Protection': 'D20',
  'Repose': 'D6',
  'Rune': 'D100',
  'Strength': 'D8',
  'Sun': 'D4',
  'Travel': 'D8',
  'Trickery': 'D2',
  'Void': 'D12',
  'War': 'D4',
  'Water': 'D20',
  'Weather': 'D8',
};

export const PF_CLASS_TO_TEK8: Record<string, { primary: string; secondary: string }> = {
  'Barbarian': { primary: 'D4', secondary: 'D10' },   // Fire + Chaos
  'Bard': { primary: 'D12', secondary: 'D2' },        // Ether + Coin
  'Cleric': { primary: 'D20', secondary: 'D100' },    // Water + Order
  'Druid': { primary: 'D6', secondary: 'D20' },       // Earth + Water
  'Fighter': { primary: 'D4', secondary: 'D8' },      // Fire + Air
  'Monk': { primary: 'D8', secondary: 'D6' },         // Air + Earth
  'Paladin': { primary: 'D100', secondary: 'D4' },    // Order + Fire
  'Ranger': { primary: 'D6', secondary: 'D8' },       // Earth + Air
  'Rogue': { primary: 'D2', secondary: 'D10' },       // Coin + Chaos
  'Sorcerer': { primary: 'D12', secondary: 'D10' },   // Ether + Chaos
  'Wizard': { primary: 'D100', secondary: 'D12' },    // Order + Ether
  // Additional Classes
  'Alchemist': { primary: 'D10', secondary: 'D100' },
  'Cavalier': { primary: 'D100', secondary: 'D8' },
  'Gunslinger': { primary: 'D2', secondary: 'D4' },
  'Inquisitor': { primary: 'D100', secondary: 'D20' },
  'Magus': { primary: 'D4', secondary: 'D100' },
  'Oracle': { primary: 'D12', secondary: 'D20' },
  'Summoner': { primary: 'D6', secondary: 'D12' },
  'Witch': { primary: 'D12', secondary: 'D6' },
};

// ============== WELLNESS SYSTEM ==============

export interface WellnessState {
  physical: number;      // D8 Air - Strength
  emotional: number;     // D12 Ether - Creativity
  intellectual: number;  // D100 Order - Focus
  social: number;        // D10 Chaos - Willpower
  occupational: number;  // D4 Fire - Agility
  spiritual: number;     // D6 Earth - Endurance
  environmental: number; // D20 Water - Empathy
  financial: number;     // D2 Coin - Instinct
}

export const WELLNESS_TO_TEK8: Record<keyof WellnessState, string> = {
  physical: 'D8',
  emotional: 'D12',
  intellectual: 'D100',
  social: 'D10',
  occupational: 'D4',
  spiritual: 'D6',
  environmental: 'D20',
  financial: 'D2',
};

export const DEFAULT_WELLNESS: WellnessState = {
  physical: 100,
  emotional: 100,
  intellectual: 100,
  social: 100,
  occupational: 100,
  spiritual: 100,
  environmental: 100,
  financial: 100,
};

// ============== WOUND THRESHOLDS ==============

export type WoundThreshold = 'healthy' | 'grazed' | 'wounded' | 'critical' | 'staggered';

export function getWoundThreshold(woundsLost: number, maxWounds: number): WoundThreshold {
  if (woundsLost === 0) return 'healthy';
  const percentLost = woundsLost / maxWounds;
  if (percentLost >= 0.5) return 'staggered';
  if (percentLost >= 0.5) return 'critical';
  if (percentLost >= 0.25) return 'wounded';
  return 'grazed';
}

export const WOUND_THRESHOLD_EFFECTS: Record<WoundThreshold, { wellness: keyof WellnessState; penalty: number }> = {
  healthy: { wellness: 'physical', penalty: 0 },
  grazed: { wellness: 'physical', penalty: -10 },
  wounded: { wellness: 'emotional', penalty: -20 },
  critical: { wellness: 'spiritual', penalty: -30 },
  staggered: { wellness: 'social', penalty: -40 },
};

// ============== CARAVAN/TRAVEL ==============

export interface CaravanStats {
  offense: number;
  defense: number;
  mobility: number;
  morale: number;
  consumption: number;
}

export const DEFAULT_CARAVAN: CaravanStats = {
  offense: 0,
  defense: 0,
  mobility: 2,
  morale: 0,
  consumption: 2,
};

export interface CaravanRole {
  name: string;
  tek8Element: string;
  bonus: { stat: keyof CaravanStats; value: number };
  description: string;
}

export const CARAVAN_ROLES: CaravanRole[] = [
  { name: 'Wainwright', tek8Element: 'D6', bonus: { stat: 'mobility', value: 2 }, description: 'Maintains wagons and equipment' },
  { name: 'Guard', tek8Element: 'D8', bonus: { stat: 'defense', value: 2 }, description: 'Protects the caravan' },
  { name: 'Scout', tek8Element: 'D10', bonus: { stat: 'offense', value: 2 }, description: 'Finds safe routes and spots danger' },
  { name: 'Cook', tek8Element: 'D20', bonus: { stat: 'consumption', value: -2 }, description: 'Efficiently prepares food' },
  { name: 'Entertainer', tek8Element: 'D12', bonus: { stat: 'morale', value: 2 }, description: 'Keeps spirits high' },
  { name: 'Trader', tek8Element: 'D2', bonus: { stat: 'consumption', value: -1 }, description: 'Barters for supplies' },
  { name: 'Healer', tek8Element: 'D4', bonus: { stat: 'morale', value: 1 }, description: 'Tends to the sick and wounded' },
  { name: 'Navigator', tek8Element: 'D100', bonus: { stat: 'mobility', value: 1 }, description: 'Charts the course' },
];

// ============== SPELL ELEMENT CLASSIFICATION ==============

export function getSpellElement(school: string): string {
  const normalized = school.toLowerCase().split(' ')[0];
  return PF_SCHOOL_TO_TEK8[normalized] || 'D100';
}

export function getClassElements(className: string): { primary: string; secondary: string } {
  return PF_CLASS_TO_TEK8[className] || { primary: 'D100', secondary: 'D12' };
}

// ============== SAMPLE SPELLS BY ELEMENT ==============

// These are examples - full list would be generated from the SRD
export const SAMPLE_SPELLS_BY_ELEMENT: Record<string, string[]> = {
  'D2': ['Augury', 'Divination', 'True Strike', 'Guidance'],
  'D4': ['Fireball', 'Burning Hands', 'Flame Strike', 'Scorching Ray'],
  'D6': ['Summon Monster', 'Create Water', 'Stone Shape', 'Wall of Stone'],
  'D8': ['Fly', 'Haste', 'Alter Self', 'Polymorph'],
  'D10': ['Blur', 'Mirror Image', 'Phantasmal Killer', 'Confusion'],
  'D12': ['Charm Person', 'Dominate Person', 'Sleep', 'Dream'],
  'D20': ['Cure Wounds', 'Shield', 'Protection from Evil', 'Dispel Magic'],
  'D100': ['Wish', 'Limited Wish', 'Permanency', 'Contingency'],
};

// ============== ROAD TRAVEL MODIFIERS ==============

export const ROAD_POSITION_MODIFIERS: Record<string, { morale: number; consumption: number; description: string }> = {
  'OUT': { morale: 0, consumption: 0, description: 'Standard travel on outer roads' },
  'UP': { morale: 2, consumption: 1, description: 'Ascending paths require more morale' },
  'DWN': { morale: -1, consumption: -1, description: 'Descending paths are easier but darker' },
  'U45': { morale: 1, consumption: 1, description: 'Upper diagonal requires element synthesis' },
  'D45': { morale: 0, consumption: 0, description: 'Lower diagonal offers balanced travel' },
};

// ============== EXPORT TYPES ==============

export interface PathfinderTEK8Character {
  // Standard PF1e
  name: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  hp: number;
  vigor: number; // Wound threshold system
  wounds: number;
  ac: number;
  speed: number;

  // TEK8 Integration
  tek8Primary: string;
  tek8Secondary: string;
  currentRoad: string;
  wellness: WellnessState;

  // Narrative
  backstory: string;
  goals: string;
  notes: string;
}

export function createDefaultPFTEK8Character(): PathfinderTEK8Character {
  return {
    name: '',
    race: 'Human',
    class: 'Fighter',
    level: 1,
    alignment: 'N',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hp: 10,
    vigor: 10,
    wounds: 10,
    ac: 10,
    speed: 30,
    tek8Primary: 'D4',
    tek8Secondary: 'D8',
    currentRoad: 'D4OUT',
    wellness: { ...DEFAULT_WELLNESS },
    backstory: '',
    goals: '',
    notes: '',
  };
}
