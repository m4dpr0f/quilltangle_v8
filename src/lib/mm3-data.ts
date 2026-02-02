/**
 * Mutants & Masterminds 3rd Edition Data Library
 *
 * Based on the core rulebook and foundry-mm3 system.
 * Comprehensive data for character creation.
 */

// ============== TYPES ==============

export type AbilityName = 'STR' | 'STA' | 'AGI' | 'DEX' | 'FGT' | 'INT' | 'AWE' | 'PRE';

export interface Ability {
  name: string;
  shortName: AbilityName;
  description: string;
  linkedDefenses: string[];
  linkedSkills: string[];
}

export interface Skill {
  name: string;
  ability: AbilityName;
  trainedOnly: boolean;
  specializations?: string[];
  description: string;
}

export interface Defense {
  name: string;
  ability: AbilityName;
  description: string;
}

export interface Advantage {
  name: string;
  type: 'combat' | 'fortune' | 'general' | 'skill';
  ranked: boolean;
  maxRank?: number;
  cost: number;
  description: string;
  prerequisite?: string;
}

export interface Power {
  name: string;
  type: 'attack' | 'defense' | 'movement' | 'control' | 'general' | 'sensory';
  action: 'standard' | 'move' | 'free' | 'reaction' | 'none';
  range: 'personal' | 'close' | 'ranged' | 'perception' | 'rank';
  duration: 'instant' | 'concentration' | 'sustained' | 'continuous' | 'permanent';
  baseCost: number;
  description: string;
  resistedBy?: string;
}

export interface PowerModifier {
  name: string;
  type: 'extra' | 'flaw';
  costPerRank: number; // positive for extras, negative for flaws
  flat?: boolean;
  description: string;
}

export interface Archetype {
  name: string;
  description: string;
  primaryAbilities: AbilityName[];
  suggestedPowers: string[];
  suggestedAdvantages: string[];
  tek8Element: string;
}

export interface MM3Character {
  name: string;
  identity: string;
  powerLevel: number;
  powerPoints: number;
  abilities: Record<AbilityName, number>;
  skills: Record<string, number>;
  defenses: Record<string, number>;
  advantages: Array<{ name: string; ranks?: number }>;
  powers: Array<{
    name: string;
    effect: string;
    ranks: number;
    extras?: string[];
    flaws?: string[];
    descriptors?: string[];
  }>;
  complications: Array<{ type: string; description: string }>;
  heroPoints: number;
}

// ============== ABILITIES (8) ==============

export const ABILITIES: Ability[] = [
  {
    name: 'Strength',
    shortName: 'STR',
    description: 'Physical power for lifting, carrying, and melee damage.',
    linkedDefenses: [],
    linkedSkills: ['Athletics'],
  },
  {
    name: 'Stamina',
    shortName: 'STA',
    description: 'Health, endurance, and resistance to physical harm.',
    linkedDefenses: ['Fortitude', 'Toughness'],
    linkedSkills: [],
  },
  {
    name: 'Agility',
    shortName: 'AGI',
    description: 'Balance, coordination, and overall physical nimbleness.',
    linkedDefenses: ['Dodge'],
    linkedSkills: ['Acrobatics', 'Stealth'],
  },
  {
    name: 'Dexterity',
    shortName: 'DEX',
    description: 'Hand-eye coordination and fine motor skills.',
    linkedDefenses: [],
    linkedSkills: ['Ranged Combat', 'Sleight of Hand', 'Vehicles'],
  },
  {
    name: 'Fighting',
    shortName: 'FGT',
    description: 'Training and skill in close combat.',
    linkedDefenses: ['Parry'],
    linkedSkills: ['Close Combat'],
  },
  {
    name: 'Intellect',
    shortName: 'INT',
    description: 'Reasoning, learning, and problem-solving ability.',
    linkedDefenses: [],
    linkedSkills: ['Expertise', 'Investigation', 'Technology', 'Treatment'],
  },
  {
    name: 'Awareness',
    shortName: 'AWE',
    description: 'Common sense, intuition, and perceptiveness.',
    linkedDefenses: ['Will'],
    linkedSkills: ['Insight', 'Perception'],
  },
  {
    name: 'Presence',
    shortName: 'PRE',
    description: 'Force of personality and ability to influence others.',
    linkedDefenses: [],
    linkedSkills: ['Deception', 'Intimidation', 'Persuasion'],
  },
];

export const ABILITY_NAMES: Record<AbilityName, string> = {
  STR: 'Strength',
  STA: 'Stamina',
  AGI: 'Agility',
  DEX: 'Dexterity',
  FGT: 'Fighting',
  INT: 'Intellect',
  AWE: 'Awareness',
  PRE: 'Presence',
};

// ============== SKILLS ==============

export const SKILLS: Skill[] = [
  { name: 'Acrobatics', ability: 'AGI', trainedOnly: false, description: 'Balance, tumbling, and aerial maneuvers.' },
  { name: 'Athletics', ability: 'STR', trainedOnly: false, description: 'Climbing, jumping, running, and swimming.' },
  { name: 'Close Combat', ability: 'FGT', trainedOnly: false, specializations: ['Unarmed', 'Swords', 'Improvised Weapons'], description: 'Melee attack skill.' },
  { name: 'Deception', ability: 'PRE', trainedOnly: false, description: 'Lying, bluffing, and disguise.' },
  { name: 'Expertise', ability: 'INT', trainedOnly: true, specializations: ['Science', 'Magic', 'History', 'Streetwise', 'Business', 'Current Events', 'Pop Culture', 'Law', 'Theology'], description: 'Specialized knowledge in a field.' },
  { name: 'Insight', ability: 'AWE', trainedOnly: false, description: 'Reading people and situations.' },
  { name: 'Intimidation', ability: 'PRE', trainedOnly: false, description: 'Frightening or coercing others.' },
  { name: 'Investigation', ability: 'INT', trainedOnly: true, description: 'Searching, analyzing clues, and gathering information.' },
  { name: 'Perception', ability: 'AWE', trainedOnly: false, description: 'Noticing things using senses.' },
  { name: 'Persuasion', ability: 'PRE', trainedOnly: false, description: 'Diplomacy and changing opinions.' },
  { name: 'Ranged Combat', ability: 'DEX', trainedOnly: false, specializations: ['Guns', 'Throwing', 'Energy Projection'], description: 'Ranged attack skill.' },
  { name: 'Sleight of Hand', ability: 'DEX', trainedOnly: true, description: 'Pickpocketing, palming, and sleight of hand.' },
  { name: 'Stealth', ability: 'AGI', trainedOnly: false, description: 'Moving silently and hiding.' },
  { name: 'Technology', ability: 'INT', trainedOnly: true, description: 'Building, repairing, and operating technology.' },
  { name: 'Treatment', ability: 'INT', trainedOnly: true, description: 'First aid and medical treatment.' },
  { name: 'Vehicles', ability: 'DEX', trainedOnly: false, description: 'Driving, piloting, and operating vehicles.' },
];

// ============== DEFENSES ==============

export const DEFENSES: Defense[] = [
  { name: 'Dodge', ability: 'AGI', description: 'Avoiding ranged attacks and area effects.' },
  { name: 'Parry', ability: 'FGT', description: 'Blocking and evading close attacks.' },
  { name: 'Fortitude', ability: 'STA', description: 'Resisting physical afflictions and effects.' },
  { name: 'Toughness', ability: 'STA', description: 'Resisting damage.' },
  { name: 'Will', ability: 'AWE', description: 'Resisting mental and spiritual effects.' },
];

// ============== ADVANTAGES ==============

export const ADVANTAGES: Advantage[] = [
  // Combat Advantages
  { name: 'Accurate Attack', type: 'combat', ranked: false, cost: 1, description: 'Trade effect for attack bonus (+2 attack, -2 effect).' },
  { name: 'All-out Attack', type: 'combat', ranked: false, cost: 1, description: 'Trade defense for attack (+2 attack, -2 active defenses).' },
  { name: 'Chokehold', type: 'combat', ranked: false, cost: 1, description: 'Suffocate a grabbed opponent.' },
  { name: 'Close Attack', type: 'combat', ranked: true, cost: 1, description: '+1 close attack bonus per rank.' },
  { name: 'Defensive Attack', type: 'combat', ranked: false, cost: 1, description: 'Trade attack for defense (+2 defenses, -2 attack).' },
  { name: 'Defensive Roll', type: 'combat', ranked: true, maxRank: 5, cost: 1, description: '+1 Toughness per rank (active).' },
  { name: 'Evasion', type: 'combat', ranked: true, maxRank: 2, cost: 1, description: '+2/+5 to Dodge resistance checks vs area.' },
  { name: 'Fast Grab', type: 'combat', ranked: false, cost: 1, description: 'Make a free grab check after hitting with unarmed.' },
  { name: 'Favored Foe', type: 'combat', ranked: false, cost: 1, description: '+2 circumstance bonus on Deception, Insight, Intimidation, and Perception vs chosen foe type.' },
  { name: 'Grabbing Finesse', type: 'combat', ranked: false, cost: 1, description: 'Use Dex for grab checks instead of Str.' },
  { name: 'Improved Aim', type: 'combat', ranked: false, cost: 1, description: 'Double bonus from aiming.' },
  { name: 'Improved Critical', type: 'combat', ranked: true, maxRank: 4, cost: 1, description: '+1 critical threat range per rank for an attack.' },
  { name: 'Improved Defense', type: 'combat', ranked: false, cost: 1, description: '+2 active defense when you take the defend action.' },
  { name: 'Improved Disarm', type: 'combat', ranked: false, cost: 1, description: 'No penalty to disarm, +2 to resist disarm.' },
  { name: 'Improved Grab', type: 'combat', ranked: false, cost: 1, description: 'Make grab checks with one arm.' },
  { name: 'Improved Hold', type: 'combat', ranked: false, cost: 1, description: '-5 penalty to escape your grabs.' },
  { name: 'Improved Initiative', type: 'combat', ranked: true, cost: 1, description: '+4 initiative per rank.' },
  { name: 'Improved Smash', type: 'combat', ranked: false, cost: 1, description: 'No penalty to break objects held or worn by others.' },
  { name: 'Improved Trip', type: 'combat', ranked: false, cost: 1, description: 'No penalty to trip, +2 to resist trip.' },
  { name: 'Improvised Weapon', type: 'combat', ranked: true, maxRank: 3, cost: 1, description: 'Reduce penalty for improvised weapons by 1 per rank.' },
  { name: 'Move-by Action', type: 'combat', ranked: false, cost: 1, description: 'Move both before and after your standard action.' },
  { name: 'Power Attack', type: 'combat', ranked: false, cost: 1, description: 'Trade attack for effect (+2 effect, -2 attack).' },
  { name: 'Precise Attack', type: 'combat', ranked: true, maxRank: 4, cost: 1, description: 'Ignore cover/concealment penalty (choose 1 per rank).' },
  { name: 'Prone Fighting', type: 'combat', ranked: false, cost: 1, description: 'No penalties for fighting while prone.' },
  { name: 'Quick Draw', type: 'combat', ranked: false, cost: 1, description: 'Draw weapon as a free action.' },
  { name: 'Ranged Attack', type: 'combat', ranked: true, cost: 1, description: '+1 ranged attack bonus per rank.' },
  { name: 'Redirect', type: 'combat', ranked: false, cost: 1, description: 'Redirect a missed attack at another target.' },
  { name: 'Set-up', type: 'combat', ranked: true, cost: 1, description: 'Transfer an interaction skill benefit to an ally.' },
  { name: 'Takedown', type: 'combat', ranked: true, maxRank: 2, cost: 1, description: 'Free attack when you incapacitate a minion.' },
  { name: 'Throwing Mastery', type: 'combat', ranked: true, cost: 1, description: 'Throw objects with damage = rank.' },
  { name: 'Uncanny Dodge', type: 'combat', ranked: false, cost: 1, description: 'Not vulnerable when surprised or caught off-guard.' },
  { name: 'Weapon Bind', type: 'combat', ranked: false, cost: 1, description: 'Free disarm attempt when you successfully defend.' },
  { name: 'Weapon Break', type: 'combat', ranked: false, cost: 1, description: 'Free smash attempt when you successfully defend.' },

  // Fortune Advantages
  { name: 'Beginner\'s Luck', type: 'fortune', ranked: false, cost: 1, description: 'Spend a hero point to gain 5 temporary ranks in a skill.' },
  { name: 'Inspire', type: 'fortune', ranked: true, maxRank: 5, cost: 1, description: 'Spend a hero point to grant allies +1 per rank bonus.' },
  { name: 'Leadership', type: 'fortune', ranked: false, cost: 1, description: 'Spend a hero point to remove a condition from an ally.' },
  { name: 'Luck', type: 'fortune', ranked: true, maxRank: 5, cost: 1, description: 'Gain hero points to re-roll dice.' },
  { name: 'Seize Initiative', type: 'fortune', ranked: false, cost: 1, description: 'Spend a hero point to go first in initiative.' },
  { name: 'Ultimate Effort', type: 'fortune', ranked: false, cost: 1, description: 'Spend a hero point for automatic 20 on a specific check.' },

  // General Advantages
  { name: 'Benefit', type: 'general', ranked: true, maxRank: 5, cost: 1, description: 'Social benefit (wealth, status, diplomatic immunity, etc.).' },
  { name: 'Diehard', type: 'general', ranked: false, cost: 1, description: 'Automatically stabilize when dying.' },
  { name: 'Eidetic Memory', type: 'general', ranked: false, cost: 1, description: 'Total recall of everything you\'ve experienced.' },
  { name: 'Equipment', type: 'general', ranked: true, cost: 1, description: '5 equipment points per rank.' },
  { name: 'Extraordinary Effort', type: 'general', ranked: false, cost: 1, description: 'Gain two benefits when using extra effort.' },
  { name: 'Fearless', type: 'general', ranked: false, cost: 1, description: 'Immune to fear effects.' },
  { name: 'Great Endurance', type: 'general', ranked: false, cost: 1, description: '+5 on checks involving extended physical activity.' },
  { name: 'Instant Up', type: 'general', ranked: false, cost: 1, description: 'Stand from prone as a free action.' },
  { name: 'Interpose', type: 'general', ranked: false, cost: 1, description: 'Take an attack meant for an adjacent ally.' },
  { name: 'Minion', type: 'general', ranked: true, cost: 1, description: '15 PP minion per rank.' },
  { name: 'Second Chance', type: 'general', ranked: true, cost: 1, description: 'Re-roll failed checks of a specific type.' },
  { name: 'Sidekick', type: 'general', ranked: true, cost: 1, description: '5 PP sidekick per rank.' },
  { name: 'Trance', type: 'general', ranked: false, cost: 1, description: 'Enter a death-like trance.' },

  // Skill Advantages
  { name: 'Agile Feint', type: 'skill', ranked: false, cost: 1, description: 'Use Acrobatics for feinting.' },
  { name: 'Animal Empathy', type: 'skill', ranked: false, cost: 1, description: 'Use social skills on animals.' },
  { name: 'Artificer', type: 'skill', ranked: false, cost: 1, description: 'Create temporary devices with Technology.' },
  { name: 'Assessment', type: 'skill', ranked: false, cost: 1, description: 'Use Insight to learn target\'s combat capabilities.' },
  { name: 'Attractive', type: 'skill', ranked: true, maxRank: 2, cost: 1, description: '+2/+5 to interaction skills based on looks.' },
  { name: 'Connected', type: 'skill', ranked: false, cost: 1, description: 'Call in favors with a Persuasion check.' },
  { name: 'Contacts', type: 'skill', ranked: false, cost: 1, description: 'Make Investigation checks in any locale in one minute.' },
  { name: 'Daze', type: 'skill', ranked: false, cost: 1, description: 'Deception or Intimidation check to daze a target.' },
  { name: 'Fascinate', type: 'skill', ranked: false, cost: 1, description: 'Use an interaction skill to entrance targets.' },
  { name: 'Favored Environment', type: 'skill', ranked: false, cost: 1, description: '+2 circumstance bonus in a chosen environment.' },
  { name: 'Hide in Plain Sight', type: 'skill', ranked: false, cost: 1, description: 'Hide while observed without a diversion.' },
  { name: 'Improvised Tools', type: 'skill', ranked: false, cost: 1, description: 'No penalty for lacking tools.' },
  { name: 'Inventor', type: 'skill', ranked: false, cost: 1, description: 'Create inventions with Technology.' },
  { name: 'Jack-of-all-trades', type: 'skill', ranked: false, cost: 1, description: 'Use any skill untrained.' },
  { name: 'Languages', type: 'skill', ranked: true, cost: 1, description: 'Know additional languages.' },
  { name: 'Ritualist', type: 'skill', ranked: false, cost: 1, description: 'Create magic rituals with Expertise: Magic.' },
  { name: 'Skill Mastery', type: 'skill', ranked: false, cost: 1, description: 'Take 10 on a specific skill even when stressed.' },
  { name: 'Startle', type: 'skill', ranked: false, cost: 1, description: 'Use Intimidation to feint.' },
  { name: 'Taunt', type: 'skill', ranked: false, cost: 1, description: 'Use Deception to demoralize.' },
  { name: 'Teamwork', type: 'skill', ranked: false, cost: 1, description: '+5 bonus from team checks.' },
  { name: 'Tracking', type: 'skill', ranked: false, cost: 1, description: 'Track using Perception at -1/interval (-5 normal speed).' },
  { name: 'Well-informed', type: 'skill', ranked: false, cost: 1, description: 'Immediate Investigation or Persuasion check for info.' },
];

// ============== POWERS ==============

export const POWERS: Power[] = [
  // Attack Powers
  { name: 'Affliction', type: 'attack', action: 'standard', range: 'close', duration: 'instant', baseCost: 1, description: 'Impose conditions on targets (dazed/stunned/incapacitated).', resistedBy: 'Fortitude/Will' },
  { name: 'Damage', type: 'attack', action: 'standard', range: 'close', duration: 'instant', baseCost: 1, description: 'Inflict damage on targets.', resistedBy: 'Toughness' },
  { name: 'Weaken', type: 'attack', action: 'standard', range: 'close', duration: 'instant', baseCost: 1, description: 'Reduce a target\'s trait.', resistedBy: 'Fortitude/Will' },
  { name: 'Nullify', type: 'attack', action: 'standard', range: 'ranged', duration: 'instant', baseCost: 1, description: 'Cancel powers or effects.', resistedBy: 'Will' },

  // Defense Powers
  { name: 'Immunity', type: 'defense', action: 'none', range: 'personal', duration: 'permanent', baseCost: 1, description: 'Immune to certain effects.' },
  { name: 'Protection', type: 'defense', action: 'none', range: 'personal', duration: 'permanent', baseCost: 1, description: 'Increase Toughness.' },
  { name: 'Regeneration', type: 'defense', action: 'none', range: 'personal', duration: 'permanent', baseCost: 1, description: 'Recover from damage over time.' },
  { name: 'Deflect', type: 'defense', action: 'standard', range: 'ranged', duration: 'instant', baseCost: 1, description: 'Deflect attacks against others.' },

  // Movement Powers
  { name: 'Flight', type: 'movement', action: 'free', range: 'personal', duration: 'sustained', baseCost: 2, description: 'Fly through the air.' },
  { name: 'Leaping', type: 'movement', action: 'free', range: 'personal', duration: 'instant', baseCost: 1, description: 'Jump great distances.' },
  { name: 'Movement', type: 'movement', action: 'free', range: 'personal', duration: 'sustained', baseCost: 2, description: 'Special movement (wall-crawling, water walking, etc.).' },
  { name: 'Speed', type: 'movement', action: 'free', range: 'personal', duration: 'sustained', baseCost: 1, description: 'Move faster on the ground.' },
  { name: 'Swimming', type: 'movement', action: 'free', range: 'personal', duration: 'sustained', baseCost: 1, description: 'Swim at high speeds.' },
  { name: 'Teleport', type: 'movement', action: 'move', range: 'personal', duration: 'instant', baseCost: 2, description: 'Instantly move between locations.' },

  // Control Powers
  { name: 'Create', type: 'control', action: 'standard', range: 'ranged', duration: 'sustained', baseCost: 2, description: 'Create solid objects from nothing.' },
  { name: 'Environment', type: 'control', action: 'standard', range: 'ranged', duration: 'sustained', baseCost: 1, description: 'Control environmental conditions.' },
  { name: 'Illusion', type: 'control', action: 'standard', range: 'perception', duration: 'sustained', baseCost: 1, description: 'Create false sensory impressions.', resistedBy: 'Will' },
  { name: 'Mind Control', type: 'control', action: 'standard', range: 'perception', duration: 'instant', baseCost: 2, description: 'Control a target\'s actions.', resistedBy: 'Will' },
  { name: 'Move Object', type: 'control', action: 'standard', range: 'ranged', duration: 'sustained', baseCost: 2, description: 'Move objects with your mind (telekinesis).' },
  { name: 'Summon', type: 'control', action: 'standard', range: 'close', duration: 'sustained', baseCost: 2, description: 'Call forth a creature or minion.' },
  { name: 'Transform', type: 'control', action: 'standard', range: 'close', duration: 'sustained', baseCost: 2, description: 'Change objects or beings.', resistedBy: 'Fortitude' },

  // General Powers
  { name: 'Communication', type: 'general', action: 'free', range: 'rank', duration: 'sustained', baseCost: 4, description: 'Communicate over distance (radio, telepathy, etc.).' },
  { name: 'Comprehend', type: 'general', action: 'none', range: 'personal', duration: 'permanent', baseCost: 2, description: 'Understand languages, machines, animals, etc.' },
  { name: 'Concealment', type: 'general', action: 'free', range: 'personal', duration: 'sustained', baseCost: 2, description: 'Hide from one or more senses.' },
  { name: 'Enhanced Trait', type: 'general', action: 'free', range: 'personal', duration: 'sustained', baseCost: 1, description: 'Temporarily enhance abilities, skills, or advantages.' },
  { name: 'Feature', type: 'general', action: 'none', range: 'personal', duration: 'permanent', baseCost: 1, description: 'Minor useful ability.' },
  { name: 'Growth', type: 'general', action: 'free', range: 'personal', duration: 'sustained', baseCost: 2, description: 'Increase size.' },
  { name: 'Healing', type: 'general', action: 'standard', range: 'close', duration: 'instant', baseCost: 2, description: 'Heal damage conditions.' },
  { name: 'Insubstantial', type: 'general', action: 'free', range: 'personal', duration: 'sustained', baseCost: 5, description: 'Become intangible or gaseous.' },
  { name: 'Luck Control', type: 'general', action: 'reaction', range: 'perception', duration: 'instant', baseCost: 3, description: 'Control fortune and probability.' },
  { name: 'Morph', type: 'general', action: 'free', range: 'personal', duration: 'sustained', baseCost: 5, description: 'Change appearance.' },
  { name: 'Quickness', type: 'general', action: 'free', range: 'personal', duration: 'sustained', baseCost: 1, description: 'Perform routine tasks faster.' },
  { name: 'Shrinking', type: 'general', action: 'free', range: 'personal', duration: 'sustained', baseCost: 2, description: 'Decrease size.' },
  { name: 'Variable', type: 'general', action: 'standard', range: 'personal', duration: 'sustained', baseCost: 7, description: 'Reconfigure powers on the fly.' },

  // Sensory Powers
  { name: 'Senses', type: 'sensory', action: 'none', range: 'personal', duration: 'permanent', baseCost: 1, description: 'Enhanced or unusual senses.' },
  { name: 'Remote Sensing', type: 'sensory', action: 'standard', range: 'rank', duration: 'sustained', baseCost: 1, description: 'Perceive from a distance.' },
];

// ============== POWER MODIFIERS ==============

export const POWER_EXTRAS: PowerModifier[] = [
  { name: 'Accurate', type: 'extra', costPerRank: 1, description: '+2 attack bonus per rank.' },
  { name: 'Affects Insubstantial', type: 'extra', costPerRank: 1, description: 'Affects intangible targets.' },
  { name: 'Affects Objects', type: 'extra', costPerRank: 0, flat: true, description: 'Effect also works on objects.' },
  { name: 'Affects Others', type: 'extra', costPerRank: 0, flat: true, description: 'Personal power can affect others.' },
  { name: 'Alternate Resistance', type: 'extra', costPerRank: 0, flat: true, description: 'Change which defense resists the effect.' },
  { name: 'Area', type: 'extra', costPerRank: 1, description: 'Affects an area (burst, cone, cloud, etc.).' },
  { name: 'Attack', type: 'extra', costPerRank: 0, flat: true, description: 'Use power as an attack.' },
  { name: 'Contagious', type: 'extra', costPerRank: 1, description: 'Effect spreads on contact.' },
  { name: 'Dimensional', type: 'extra', costPerRank: 1, description: 'Effect works across dimensions.' },
  { name: 'Extended Range', type: 'extra', costPerRank: 1, description: 'Double range per rank.' },
  { name: 'Homing', type: 'extra', costPerRank: 1, description: 'Attack homes in on target.' },
  { name: 'Impervious', type: 'extra', costPerRank: 1, description: 'Ignore effects with rank less than half your rank.' },
  { name: 'Increased Action', type: 'extra', costPerRank: 0, flat: true, description: 'Faster activation.' },
  { name: 'Increased Duration', type: 'extra', costPerRank: 1, description: 'Instant to Concentration to Sustained to Continuous.' },
  { name: 'Increased Range', type: 'extra', costPerRank: 1, description: 'Close to Ranged or Ranged to Perception.' },
  { name: 'Indirect', type: 'extra', costPerRank: 1, description: 'Attack from unexpected directions.' },
  { name: 'Innate', type: 'extra', costPerRank: 0, flat: true, description: 'Power cannot be nullified.' },
  { name: 'Linked', type: 'extra', costPerRank: 0, flat: true, description: 'Effects always occur together.' },
  { name: 'Multiattack', type: 'extra', costPerRank: 1, description: 'Attack multiple targets or the same target multiple times.' },
  { name: 'Penetrating', type: 'extra', costPerRank: 1, description: 'Overcome Impervious.' },
  { name: 'Precise', type: 'extra', costPerRank: 0, flat: true, description: 'Fine control over the effect.' },
  { name: 'Reach', type: 'extra', costPerRank: 1, description: '+5 feet close range per rank.' },
  { name: 'Reversible', type: 'extra', costPerRank: 0, flat: true, description: 'Can undo the effect at will.' },
  { name: 'Ricochet', type: 'extra', costPerRank: 1, description: 'Attack around corners.' },
  { name: 'Secondary Effect', type: 'extra', costPerRank: 1, description: 'Effect occurs again on following round.' },
  { name: 'Selective', type: 'extra', costPerRank: 1, description: 'Choose who is affected in an area.' },
  { name: 'Split', type: 'extra', costPerRank: 1, description: 'Divide effect between targets.' },
  { name: 'Subtle', type: 'extra', costPerRank: 1, description: 'Harder to detect.' },
  { name: 'Triggered', type: 'extra', costPerRank: 0, flat: true, description: 'Set off by a circumstance.' },
  { name: 'Variable Descriptor', type: 'extra', costPerRank: 0, flat: true, description: 'Change descriptors.' },
];

export const POWER_FLAWS: PowerModifier[] = [
  { name: 'Activation', type: 'flaw', costPerRank: -1, description: 'Requires time to activate.' },
  { name: 'Check Required', type: 'flaw', costPerRank: -1, description: 'Must succeed at a check to use.' },
  { name: 'Concentration', type: 'flaw', costPerRank: -1, description: 'Concentration instead of Sustained.' },
  { name: 'Diminished Range', type: 'flaw', costPerRank: -1, description: 'Reduce range.' },
  { name: 'Distracting', type: 'flaw', costPerRank: -1, description: 'Vulnerable while using.' },
  { name: 'Fades', type: 'flaw', costPerRank: -1, description: 'Loses 1 rank per use.' },
  { name: 'Feedback', type: 'flaw', costPerRank: -1, description: 'Suffer damage when power is overcome.' },
  { name: 'Grab-Based', type: 'flaw', costPerRank: -1, description: 'Requires a grab to use.' },
  { name: 'Inaccurate', type: 'flaw', costPerRank: -1, description: '-2 attack bonus per rank.' },
  { name: 'Limited', type: 'flaw', costPerRank: -1, description: 'Only works in certain circumstances.' },
  { name: 'Noticeable', type: 'flaw', costPerRank: 0, flat: true, description: 'Always obvious.' },
  { name: 'Permanent', type: 'flaw', costPerRank: 0, flat: true, description: 'Cannot be turned off.' },
  { name: 'Quirk', type: 'flaw', costPerRank: -1, description: 'Minor limitation.' },
  { name: 'Reduced Range', type: 'flaw', costPerRank: -1, description: 'Close to Touch or Ranged to Close.' },
  { name: 'Removable', type: 'flaw', costPerRank: -1, description: 'Can be taken away (device).' },
  { name: 'Resistible', type: 'flaw', costPerRank: -1, description: 'Adds another saving throw.' },
  { name: 'Sense-Dependent', type: 'flaw', costPerRank: -1, description: 'Requires target to perceive you.' },
  { name: 'Side Effect', type: 'flaw', costPerRank: -1, description: 'Negative effect on failure.' },
  { name: 'Tiring', type: 'flaw', costPerRank: -1, description: 'Fatigued after use.' },
  { name: 'Uncontrolled', type: 'flaw', costPerRank: -1, description: 'GM controls activation.' },
  { name: 'Unreliable', type: 'flaw', costPerRank: -1, description: 'Only works 50% or limited uses.' },
];

// ============== ARCHETYPES ==============

export const ARCHETYPES: Archetype[] = [
  {
    name: 'Battlesuit',
    description: 'Technology-based hero in powered armor with various built-in weapons and defenses.',
    primaryAbilities: ['INT', 'DEX'],
    suggestedPowers: ['Protection', 'Flight', 'Damage', 'Enhanced Trait', 'Senses'],
    suggestedAdvantages: ['Equipment', 'Inventor', 'Ranged Attack'],
    tek8Element: 'D10 Chaos',
  },
  {
    name: 'Blaster',
    description: 'Ranged combat specialist with energy projection powers.',
    primaryAbilities: ['DEX', 'AGI'],
    suggestedPowers: ['Damage', 'Flight', 'Force Field'],
    suggestedAdvantages: ['Accurate Attack', 'Precise Attack', 'Ranged Attack'],
    tek8Element: 'D4 Fire',
  },
  {
    name: 'Brick',
    description: 'Super-strong powerhouse with incredible durability.',
    primaryAbilities: ['STR', 'STA'],
    suggestedPowers: ['Protection', 'Immunity', 'Leaping', 'Growth'],
    suggestedAdvantages: ['All-out Attack', 'Power Attack', 'Takedown'],
    tek8Element: 'D6 Earth',
  },
  {
    name: 'Controller',
    description: 'Mental or elemental powers that manipulate the battlefield.',
    primaryAbilities: ['INT', 'AWE'],
    suggestedPowers: ['Move Object', 'Affliction', 'Create', 'Environment'],
    suggestedAdvantages: ['Assessment', 'Precise Attack', 'Improved Initiative'],
    tek8Element: 'D100 Order',
  },
  {
    name: 'Gadgeteer',
    description: 'Technology genius who creates and uses advanced devices.',
    primaryAbilities: ['INT', 'DEX'],
    suggestedPowers: ['Variable', 'Enhanced Trait', 'Feature'],
    suggestedAdvantages: ['Inventor', 'Equipment', 'Eidetic Memory', 'Jack-of-all-trades'],
    tek8Element: 'D10 Chaos',
  },
  {
    name: 'Martial Artist',
    description: 'Master of unarmed combat with peak human abilities.',
    primaryAbilities: ['FGT', 'AGI'],
    suggestedPowers: ['Enhanced Trait', 'Speed', 'Leaping'],
    suggestedAdvantages: ['Close Attack', 'Defensive Roll', 'Evasion', 'Improved Initiative', 'Uncanny Dodge'],
    tek8Element: 'D8 Air',
  },
  {
    name: 'Mentalist',
    description: 'Psychic powers of telepathy and mind control.',
    primaryAbilities: ['AWE', 'PRE'],
    suggestedPowers: ['Mind Control', 'Illusion', 'Affliction', 'Communication', 'Senses'],
    suggestedAdvantages: ['Assessment', 'Fascinate', 'Daze'],
    tek8Element: 'D12 Ether',
  },
  {
    name: 'Mystic',
    description: 'Wielder of magical powers and arcane knowledge.',
    primaryAbilities: ['AWE', 'INT'],
    suggestedPowers: ['Variable', 'Senses', 'Movement', 'Healing'],
    suggestedAdvantages: ['Ritualist', 'Skill Mastery', 'Languages'],
    tek8Element: 'D12 Ether',
  },
  {
    name: 'Paragon',
    description: 'All-around powerful hero with a variety of superhuman abilities.',
    primaryAbilities: ['STR', 'STA', 'PRE'],
    suggestedPowers: ['Flight', 'Protection', 'Damage', 'Immunity', 'Senses'],
    suggestedAdvantages: ['Inspire', 'Leadership', 'Interpose'],
    tek8Element: 'D20 Water',
  },
  {
    name: 'Shapeshifter',
    description: 'Can transform into various forms.',
    primaryAbilities: ['STA', 'AGI'],
    suggestedPowers: ['Morph', 'Variable', 'Growth', 'Shrinking'],
    suggestedAdvantages: ['Animal Empathy', 'Skill Mastery'],
    tek8Element: 'D6 Earth',
  },
  {
    name: 'Speedster',
    description: 'Super-fast hero who moves at incredible velocities.',
    primaryAbilities: ['AGI', 'DEX'],
    suggestedPowers: ['Speed', 'Quickness', 'Movement', 'Enhanced Trait'],
    suggestedAdvantages: ['Improved Initiative', 'Move-by Action', 'Evasion', 'Uncanny Dodge'],
    tek8Element: 'D8 Air',
  },
  {
    name: 'Weapon Master',
    description: 'Expert with a signature weapon.',
    primaryAbilities: ['FGT', 'DEX'],
    suggestedPowers: ['Damage', 'Enhanced Trait'],
    suggestedAdvantages: ['Close Attack', 'Equipment', 'Improved Critical', 'Precise Attack', 'Quick Draw'],
    tek8Element: 'D4 Fire',
  },
];

// ============== COMPLICATIONS ==============

export const COMPLICATION_TYPES = [
  'Motivation',
  'Identity',
  'Power Loss',
  'Weakness',
  'Reputation',
  'Enemy',
  'Relationship',
  'Quirk',
  'Secret',
  'Disability',
  'Prejudice',
  'Phobia',
  'Obsession',
  'Responsibility',
  'Temper',
  'Honor',
  'Rivalry',
  'Debt',
] as const;

export const MOTIVATION_TYPES = [
  'Justice',
  'Responsibility',
  'Thrills',
  'Recognition',
  'Greed',
  'Patriotism',
  'Redemption',
  'Revenge',
  'Acceptance',
  'Doing Good',
] as const;

// ============== POWER LEVEL LIMITS ==============

export function getPowerLevelLimits(powerLevel: number) {
  return {
    attackBonus: powerLevel * 2, // Attack + Effect cannot exceed PL x 2
    effectRank: powerLevel * 2,
    dodgeParry: powerLevel * 2, // Dodge/Parry + Toughness cannot exceed PL x 2
    toughness: powerLevel * 2,
    fortitudeWill: powerLevel * 2, // Fort/Will + Dodge/Parry cannot exceed PL x 2
    skillBonus: powerLevel + 10, // Skill bonus cap
    abilityRank: powerLevel, // Abilities without powers
  };
}

// ============== COST CALCULATIONS ==============

export function calculateAbilityCost(abilities: Record<AbilityName, number>): number {
  // Abilities cost 2 PP per rank
  // Absent abilities (-) give back 10 PP
  let cost = 0;
  for (const ab of Object.keys(abilities) as AbilityName[]) {
    const rank = abilities[ab];
    if (rank === -999) {
      // Absent ability
      cost -= 10;
    } else {
      cost += rank * 2;
    }
  }
  return cost;
}

export function calculateDefenseCost(defenses: Record<string, number>, abilities: Record<AbilityName, number>): number {
  // Defenses cost 1 PP per rank above the linked ability
  let cost = 0;
  const defenseLinkage: Record<string, AbilityName> = {
    Dodge: 'AGI',
    Parry: 'FGT',
    Fortitude: 'STA',
    Toughness: 'STA',
    Will: 'AWE',
  };

  for (const def of Object.keys(defenses)) {
    const linkedAbility = defenseLinkage[def];
    if (linkedAbility) {
      const baseFromAbility = abilities[linkedAbility] ?? 0;
      const extraRanks = Math.max(0, defenses[def] - baseFromAbility);
      cost += extraRanks;
    }
  }
  return cost;
}

export function calculateSkillsCost(skills: Record<string, number>): number {
  // Skills cost 1 PP per 2 ranks (0.5 PP per rank)
  const totalRanks = Object.values(skills).reduce((sum, r) => sum + r, 0);
  return Math.ceil(totalRanks / 2);
}

export function calculateAdvantagesCost(advantages: Array<{ name: string; ranks?: number }>): number {
  // Most advantages cost 1 PP, some are ranked
  let cost = 0;
  for (const adv of advantages) {
    cost += adv.ranks ?? 1;
  }
  return cost;
}

export function calculatePowerCost(power: {
  effect: string;
  ranks: number;
  extras?: string[];
  flaws?: string[];
}): number {
  const baseEffect = POWERS.find(p => p.name === power.effect);
  if (!baseEffect) return 0;

  let costPerRank = baseEffect.baseCost;

  // Apply extras
  for (const extraName of power.extras || []) {
    const extra = POWER_EXTRAS.find(e => e.name === extraName);
    if (extra && !extra.flat) {
      costPerRank += extra.costPerRank;
    }
  }

  // Apply flaws
  for (const flawName of power.flaws || []) {
    const flaw = POWER_FLAWS.find(f => f.name === flawName);
    if (flaw && !flaw.flat) {
      costPerRank += flaw.costPerRank;
    }
  }

  // Minimum cost per rank is 1 (or 0.5 for some effects)
  costPerRank = Math.max(1, costPerRank);

  let totalCost = costPerRank * power.ranks;

  // Add flat modifiers
  for (const extraName of power.extras || []) {
    const extra = POWER_EXTRAS.find(e => e.name === extraName);
    if (extra?.flat) {
      totalCost += 1;
    }
  }

  for (const flawName of power.flaws || []) {
    const flaw = POWER_FLAWS.find(f => f.name === flawName);
    if (flaw?.flat) {
      totalCost -= 1;
    }
  }

  return Math.max(1, totalCost);
}

// ============== RANDOM GENERATION ==============

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function generateRandomName(): string {
  const heroicNames = [
    'Aegis', 'Apex', 'Blaze', 'Bolt', 'Cascade', 'Cipher', 'Dynamo', 'Echo',
    'Flux', 'Fury', 'Ghost', 'Guardian', 'Havok', 'Hex', 'Ion', 'Jade',
    'Kinetic', 'Lancer', 'Mantis', 'Maverick', 'Nova', 'Onyx', 'Paragon',
    'Phoenix', 'Quantum', 'Raven', 'Sentinel', 'Shadow', 'Tempest', 'Titan',
    'Ultra', 'Vector', 'Vortex', 'Warden', 'Zenith', 'Zephyr',
  ];
  const adjectives = [
    'Amazing', 'Atomic', 'Blazing', 'Cosmic', 'Dark', 'Electric', 'Emerald',
    'Golden', 'Incredible', 'Mystic', 'Scarlet', 'Silver', 'Spectral',
    'Steel', 'Storm', 'Thunder', 'Ultra', 'Violet', 'White', 'Wild',
  ];

  const useAdjective = Math.random() > 0.5;
  if (useAdjective) {
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${heroicNames[Math.floor(Math.random() * heroicNames.length)]}`;
  }
  return heroicNames[Math.floor(Math.random() * heroicNames.length)];
}

export function generateRandomIdentity(): string {
  const firstNames = [
    'Alex', 'Blake', 'Casey', 'Dana', 'Ellis', 'Finn', 'Gray', 'Harper',
    'Jordan', 'Kelly', 'Logan', 'Morgan', 'Parker', 'Quinn', 'Riley',
    'Sage', 'Taylor', 'Val', 'Winter', 'Zion',
  ];
  const lastNames = [
    'Anderson', 'Brooks', 'Chen', 'Davis', 'Evans', 'Foster', 'Garcia',
    'Hayes', 'Jackson', 'Kim', 'Lee', 'Martinez', 'Nguyen', 'O\'Brien',
    'Parker', 'Quinn', 'Rivera', 'Smith', 'Thompson', 'Williams',
  ];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}
