/**
 * Pathfinder 1e Complete Data Reference
 *
 * Based on the Pathfinder Autosheet v6.2.1 structure
 * Contains all core data for character creation
 */

// ============== ABILITY SCORES ==============

export const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
export type Ability = typeof ABILITIES[number];

export const ABILITY_NAMES: Record<Ability, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export const ABILITY_DESCRIPTIONS: Record<Ability, string> = {
  STR: 'Physical power. Affects melee attacks, damage, carrying capacity, and STR-based skills.',
  DEX: 'Agility and reflexes. Affects ranged attacks, AC, Reflex saves, and DEX-based skills.',
  CON: 'Health and stamina. Affects hit points and Fortitude saves.',
  INT: 'Learning and reasoning. Affects skill points and INT-based skills.',
  WIS: 'Willpower and perception. Affects Will saves and WIS-based skills.',
  CHA: 'Force of personality. Affects social skills and some class abilities.',
};

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ============== RACES ==============

export interface Race {
  name: string;
  abilityMods: Partial<Record<Ability, number>>;
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  languages: string[];
  racialTraits: string[];
  description: string;
  tek8Element?: string;
}

export const RACES: Race[] = [
  {
    name: 'Human',
    abilityMods: {}, // +2 to any one ability
    size: 'Medium',
    speed: 30,
    languages: ['Common'],
    racialTraits: ['+2 to One Ability Score', 'Bonus Feat', 'Skilled (+1 skill rank/level)'],
    description: 'Versatile and ambitious, humans are the most common race in most campaign settings.',
    tek8Element: 'D100', // Order - adaptable, organized
  },
  {
    name: 'Elf',
    abilityMods: { DEX: 2, INT: 2, CON: -2 },
    size: 'Medium',
    speed: 30,
    languages: ['Common', 'Elven'],
    racialTraits: ['Elven Immunities', 'Keen Senses (+2 Perception)', 'Low-Light Vision'],
    description: 'Tall, long-lived, and graceful. Known for their magic and archery.',
    tek8Element: 'D12', // Ether - mystical, ancient
  },
  {
    name: 'Dwarf',
    abilityMods: { CON: 2, WIS: 2, CHA: -2 },
    size: 'Medium',
    speed: 20,
    languages: ['Common', 'Dwarven'],
    racialTraits: ['Darkvision 60ft', 'Defensive Training', 'Greed', 'Hardy', 'Stability'],
    description: 'Stout and sturdy, dwarves are master craftsmen who live in mountain strongholds.',
    tek8Element: 'D6', // Earth - stone, endurance
  },
  {
    name: 'Halfling',
    abilityMods: { DEX: 2, CHA: 2, STR: -2 },
    size: 'Small',
    speed: 20,
    languages: ['Common', 'Halfling'],
    racialTraits: ['Fearless', 'Halfling Luck (+1 all saves)', 'Keen Senses', 'Sure-Footed'],
    description: 'Small but brave, halflings are known for their luck and cheerful nature.',
    tek8Element: 'D2', // Coin - luck, fortune
  },
  {
    name: 'Gnome',
    abilityMods: { CON: 2, CHA: 2, STR: -2 },
    size: 'Small',
    speed: 20,
    languages: ['Common', 'Gnome', 'Sylvan'],
    racialTraits: ['Defensive Training', 'Gnome Magic', 'Illusion Resistance', 'Low-Light Vision'],
    description: 'Curious and whimsical, gnomes have a deep connection to fey magic.',
    tek8Element: 'D10', // Chaos - whimsy, unpredictability
  },
  {
    name: 'Half-Elf',
    abilityMods: {}, // +2 to any one ability
    size: 'Medium',
    speed: 30,
    languages: ['Common', 'Elven'],
    racialTraits: ['Adaptability', 'Elf Blood', 'Keen Senses', 'Low-Light Vision', 'Multitalented'],
    description: 'Combining human adaptability with elven grace.',
    tek8Element: 'D8', // Air - balanced, adaptable
  },
  {
    name: 'Half-Orc',
    abilityMods: {}, // +2 to any one ability
    size: 'Medium',
    speed: 30,
    languages: ['Common', 'Orc'],
    racialTraits: ['Darkvision 60ft', 'Intimidating', 'Orc Blood', 'Orc Ferocity', 'Weapon Familiarity'],
    description: 'Strong and fierce, half-orcs blend human cunning with orcish strength.',
    tek8Element: 'D4', // Fire - fierce, passionate
  },
  {
    name: 'Aasimar',
    abilityMods: { WIS: 2, CHA: 2 },
    size: 'Medium',
    speed: 30,
    languages: ['Common', 'Celestial'],
    racialTraits: ['Celestial Resistance', 'Darkvision 60ft', 'Skilled', 'Spell-Like Ability'],
    description: 'Descended from celestial beings, aasimars radiate an otherworldly presence.',
    tek8Element: 'D20', // Water - healing, purity
  },
  {
    name: 'Tiefling',
    abilityMods: { DEX: 2, INT: 2, CHA: -2 },
    size: 'Medium',
    speed: 30,
    languages: ['Common', 'Abyssal', 'Infernal'],
    racialTraits: ['Darkvision 60ft', 'Fiendish Resistance', 'Skilled', 'Spell-Like Ability'],
    description: 'Bearing the blood of fiends, tieflings face prejudice but possess unique gifts.',
    tek8Element: 'D10', // Chaos - unpredictable heritage
  },
  {
    name: 'Catfolk',
    abilityMods: { DEX: 2, CHA: 2, WIS: -2 },
    size: 'Medium',
    speed: 30,
    languages: ['Common', 'Catfolk'],
    racialTraits: ['Cat\'s Luck', 'Low-Light Vision', 'Natural Hunter', 'Sprinter'],
    description: 'Curious and agile, catfolk are quick-witted explorers.',
    tek8Element: 'D8', // Air - agility, freedom
  },
  {
    name: 'Tengu',
    abilityMods: { DEX: 2, WIS: 2, CON: -2 },
    size: 'Medium',
    speed: 30,
    languages: ['Common', 'Tengu'],
    racialTraits: ['Gifted Linguist', 'Low-Light Vision', 'Natural Weapon', 'Sneaky', 'Swordtrained'],
    description: 'Crow-like humanoids known for their sword skills and linguistic aptitude.',
    tek8Element: 'D2', // Coin - tricksters, cunning
  },
  {
    name: 'Ratfolk',
    abilityMods: { DEX: 2, INT: 2, STR: -2 },
    size: 'Small',
    speed: 20,
    languages: ['Common'],
    racialTraits: ['Darkvision 60ft', 'Rodent Empathy', 'Swarming', 'Tinker'],
    description: 'Clever and industrious, ratfolk excel at tinkering and trading.',
    tek8Element: 'D6', // Earth - tunnelers, builders
  },
];

// ============== CLASSES ==============

export interface ClassData {
  name: string;
  hitDie: number;
  bab: 'full' | 'medium' | 'low';
  goodSaves: ('Fort' | 'Ref' | 'Will')[];
  skillsPerLevel: number;
  classSkills: string[];
  description: string;
  keyAbility: Ability;
  role: string;
  tek8Primary: string;
  tek8Secondary: string;
}

export const CLASSES: ClassData[] = [
  {
    name: 'Barbarian',
    hitDie: 12,
    bab: 'full',
    goodSaves: ['Fort'],
    skillsPerLevel: 4,
    classSkills: ['Acrobatics', 'Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Knowledge (Nature)', 'Perception', 'Ride', 'Survival', 'Swim'],
    description: 'A fierce warrior who can enter a battle rage.',
    keyAbility: 'STR',
    role: 'Melee damage dealer, tank',
    tek8Primary: 'D4',
    tek8Secondary: 'D10',
  },
  {
    name: 'Bard',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Ref', 'Will'],
    skillsPerLevel: 6,
    classSkills: ['Acrobatics', 'Appraise', 'Bluff', 'Climb', 'Craft', 'Diplomacy', 'Disguise', 'Escape Artist', 'Intimidate', 'Knowledge (all)', 'Linguistics', 'Perception', 'Perform', 'Profession', 'Sense Motive', 'Sleight of Hand', 'Spellcraft', 'Stealth', 'Use Magic Device'],
    description: 'A performer who uses music to cast spells and inspire allies.',
    keyAbility: 'CHA',
    role: 'Support, face, versatile caster',
    tek8Primary: 'D12',
    tek8Secondary: 'D2',
  },
  {
    name: 'Cleric',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Fort', 'Will'],
    skillsPerLevel: 2,
    classSkills: ['Appraise', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (Arcana)', 'Knowledge (History)', 'Knowledge (Nobility)', 'Knowledge (Planes)', 'Knowledge (Religion)', 'Linguistics', 'Profession', 'Sense Motive', 'Spellcraft'],
    description: 'A divine spellcaster devoted to a deity.',
    keyAbility: 'WIS',
    role: 'Healer, divine caster, support',
    tek8Primary: 'D20',
    tek8Secondary: 'D100',
  },
  {
    name: 'Druid',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Fort', 'Will'],
    skillsPerLevel: 4,
    classSkills: ['Climb', 'Craft', 'Fly', 'Handle Animal', 'Heal', 'Knowledge (Geography)', 'Knowledge (Nature)', 'Perception', 'Profession', 'Ride', 'Spellcraft', 'Survival', 'Swim'],
    description: 'A divine spellcaster connected to nature.',
    keyAbility: 'WIS',
    role: 'Divine caster, shapeshifter, pet class',
    tek8Primary: 'D6',
    tek8Secondary: 'D20',
  },
  {
    name: 'Fighter',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort'],
    skillsPerLevel: 2,
    classSkills: ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Knowledge (Dungeoneering)', 'Knowledge (Engineering)', 'Profession', 'Ride', 'Survival', 'Swim'],
    description: 'A master of martial combat and weaponry.',
    keyAbility: 'STR',
    role: 'Melee damage dealer, tank',
    tek8Primary: 'D4',
    tek8Secondary: 'D8',
  },
  {
    name: 'Monk',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Fort', 'Ref', 'Will'],
    skillsPerLevel: 4,
    classSkills: ['Acrobatics', 'Climb', 'Craft', 'Escape Artist', 'Intimidate', 'Knowledge (History)', 'Knowledge (Religion)', 'Perception', 'Perform', 'Profession', 'Ride', 'Sense Motive', 'Stealth', 'Swim'],
    description: 'A martial artist who harnesses inner ki.',
    keyAbility: 'WIS',
    role: 'Mobile melee combatant',
    tek8Primary: 'D8',
    tek8Secondary: 'D6',
  },
  {
    name: 'Paladin',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort', 'Will'],
    skillsPerLevel: 2,
    classSkills: ['Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (Nobility)', 'Knowledge (Religion)', 'Profession', 'Ride', 'Sense Motive', 'Spellcraft'],
    description: 'A holy warrior sworn to fight evil.',
    keyAbility: 'CHA',
    role: 'Tank, healer, melee damage',
    tek8Primary: 'D100',
    tek8Secondary: 'D4',
  },
  {
    name: 'Ranger',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort', 'Ref'],
    skillsPerLevel: 6,
    classSkills: ['Climb', 'Craft', 'Handle Animal', 'Heal', 'Intimidate', 'Knowledge (Dungeoneering)', 'Knowledge (Geography)', 'Knowledge (Nature)', 'Perception', 'Profession', 'Ride', 'Spellcraft', 'Stealth', 'Survival', 'Swim'],
    description: 'A skilled hunter and tracker.',
    keyAbility: 'DEX',
    role: 'Ranged/melee damage, scout, pet class',
    tek8Primary: 'D6',
    tek8Secondary: 'D8',
  },
  {
    name: 'Rogue',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Ref'],
    skillsPerLevel: 8,
    classSkills: ['Acrobatics', 'Appraise', 'Bluff', 'Climb', 'Craft', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Intimidate', 'Knowledge (Dungeoneering)', 'Knowledge (Local)', 'Linguistics', 'Perception', 'Perform', 'Profession', 'Sense Motive', 'Sleight of Hand', 'Stealth', 'Swim', 'Use Magic Device'],
    description: 'A sneaky expert in traps and sneak attacks.',
    keyAbility: 'DEX',
    role: 'Skill monkey, sneak attacker, scout',
    tek8Primary: 'D2',
    tek8Secondary: 'D10',
  },
  {
    name: 'Sorcerer',
    hitDie: 6,
    bab: 'low',
    goodSaves: ['Will'],
    skillsPerLevel: 2,
    classSkills: ['Appraise', 'Bluff', 'Craft', 'Fly', 'Intimidate', 'Knowledge (Arcana)', 'Profession', 'Spellcraft', 'Use Magic Device'],
    description: 'An arcane caster with innate magical power.',
    keyAbility: 'CHA',
    role: 'Arcane blaster, versatile caster',
    tek8Primary: 'D12',
    tek8Secondary: 'D10',
  },
  {
    name: 'Wizard',
    hitDie: 6,
    bab: 'low',
    goodSaves: ['Will'],
    skillsPerLevel: 2,
    classSkills: ['Appraise', 'Craft', 'Fly', 'Knowledge (all)', 'Linguistics', 'Profession', 'Spellcraft'],
    description: 'A scholarly arcane caster who studies magic.',
    keyAbility: 'INT',
    role: 'Arcane utility caster, controller',
    tek8Primary: 'D100',
    tek8Secondary: 'D12',
  },
  // Advanced/Additional Classes
  {
    name: 'Alchemist',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Fort', 'Ref'],
    skillsPerLevel: 4,
    classSkills: ['Appraise', 'Craft', 'Disable Device', 'Fly', 'Heal', 'Knowledge (Arcana)', 'Knowledge (Nature)', 'Perception', 'Profession', 'Sleight of Hand', 'Spellcraft', 'Survival', 'Use Magic Device'],
    description: 'A mad scientist who creates bombs and mutagens.',
    keyAbility: 'INT',
    role: 'Bomber, buffer, versatile',
    tek8Primary: 'D10',
    tek8Secondary: 'D100',
  },
  {
    name: 'Cavalier',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort'],
    skillsPerLevel: 4,
    classSkills: ['Bluff', 'Climb', 'Craft', 'Diplomacy', 'Handle Animal', 'Intimidate', 'Profession', 'Ride', 'Sense Motive', 'Swim'],
    description: 'A mounted knight sworn to an order.',
    keyAbility: 'CHA',
    role: 'Mounted combatant, team buffer',
    tek8Primary: 'D100',
    tek8Secondary: 'D8',
  },
  {
    name: 'Gunslinger',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort', 'Ref'],
    skillsPerLevel: 4,
    classSkills: ['Acrobatics', 'Bluff', 'Climb', 'Craft', 'Handle Animal', 'Heal', 'Intimidate', 'Knowledge (Engineering)', 'Knowledge (Local)', 'Perception', 'Profession', 'Ride', 'Sleight of Hand', 'Survival', 'Swim'],
    description: 'A gunfighter with deadly aim and grit.',
    keyAbility: 'DEX',
    role: 'Ranged damage dealer',
    tek8Primary: 'D2',
    tek8Secondary: 'D4',
  },
  {
    name: 'Inquisitor',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Fort', 'Will'],
    skillsPerLevel: 6,
    classSkills: ['Bluff', 'Climb', 'Craft', 'Diplomacy', 'Disguise', 'Heal', 'Intimidate', 'Knowledge (Arcana)', 'Knowledge (Dungeoneering)', 'Knowledge (Nature)', 'Knowledge (Planes)', 'Knowledge (Religion)', 'Perception', 'Profession', 'Ride', 'Sense Motive', 'Spellcraft', 'Stealth', 'Survival', 'Swim'],
    description: 'A divine agent who hunts enemies of the faith.',
    keyAbility: 'WIS',
    role: 'Divine striker, investigator',
    tek8Primary: 'D100',
    tek8Secondary: 'D20',
  },
  {
    name: 'Magus',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Fort', 'Will'],
    skillsPerLevel: 2,
    classSkills: ['Climb', 'Craft', 'Fly', 'Intimidate', 'Knowledge (Arcana)', 'Knowledge (Dungeoneering)', 'Knowledge (Planes)', 'Profession', 'Ride', 'Spellcraft', 'Swim', 'Use Magic Device'],
    description: 'A warrior who blends arcane magic with swordplay.',
    keyAbility: 'INT',
    role: 'Gish (melee caster hybrid)',
    tek8Primary: 'D4',
    tek8Secondary: 'D100',
  },
  {
    name: 'Oracle',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Will'],
    skillsPerLevel: 4,
    classSkills: ['Craft', 'Diplomacy', 'Heal', 'Knowledge (History)', 'Knowledge (Planes)', 'Knowledge (Religion)', 'Profession', 'Sense Motive', 'Spellcraft'],
    description: 'A spontaneous divine caster blessed with a mystery.',
    keyAbility: 'CHA',
    role: 'Divine caster, versatile',
    tek8Primary: 'D12',
    tek8Secondary: 'D20',
  },
  {
    name: 'Summoner',
    hitDie: 8,
    bab: 'medium',
    goodSaves: ['Will'],
    skillsPerLevel: 2,
    classSkills: ['Craft', 'Fly', 'Handle Animal', 'Knowledge (all)', 'Linguistics', 'Profession', 'Ride', 'Spellcraft', 'Use Magic Device'],
    description: 'A caster bonded with a powerful eidolon.',
    keyAbility: 'CHA',
    role: 'Pet class, summoner',
    tek8Primary: 'D6',
    tek8Secondary: 'D12',
  },
  {
    name: 'Witch',
    hitDie: 6,
    bab: 'low',
    goodSaves: ['Will'],
    skillsPerLevel: 2,
    classSkills: ['Craft', 'Fly', 'Heal', 'Intimidate', 'Knowledge (Arcana)', 'Knowledge (History)', 'Knowledge (Nature)', 'Knowledge (Planes)', 'Profession', 'Spellcraft', 'Use Magic Device'],
    description: 'An arcane caster who gains power from a patron.',
    keyAbility: 'INT',
    role: 'Hexer, debuffer, caster',
    tek8Primary: 'D12',
    tek8Secondary: 'D6',
  },
  {
    name: 'Bloodrager',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort'],
    skillsPerLevel: 4,
    classSkills: ['Acrobatics', 'Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Knowledge (Arcana)', 'Perception', 'Ride', 'Spellcraft', 'Survival', 'Swim'],
    description: 'A barbarian with sorcerous bloodline powers.',
    keyAbility: 'STR',
    role: 'Melee damage, magical brute',
    tek8Primary: 'D4',
    tek8Secondary: 'D12',
  },
  {
    name: 'Swashbuckler',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort', 'Ref'],
    skillsPerLevel: 4,
    classSkills: ['Acrobatics', 'Bluff', 'Climb', 'Craft', 'Diplomacy', 'Escape Artist', 'Intimidate', 'Knowledge (Local)', 'Knowledge (Nobility)', 'Perception', 'Perform', 'Profession', 'Ride', 'Sense Motive', 'Sleight of Hand', 'Swim'],
    description: 'A dashing duelist who fights with panache.',
    keyAbility: 'DEX',
    role: 'Melee damage, mobile striker',
    tek8Primary: 'D8',
    tek8Secondary: 'D2',
  },
  {
    name: 'Slayer',
    hitDie: 10,
    bab: 'full',
    goodSaves: ['Fort', 'Ref'],
    skillsPerLevel: 6,
    classSkills: ['Acrobatics', 'Bluff', 'Climb', 'Craft', 'Disguise', 'Heal', 'Intimidate', 'Knowledge (Dungeoneering)', 'Knowledge (Geography)', 'Knowledge (Local)', 'Perception', 'Profession', 'Ride', 'Sense Motive', 'Stealth', 'Survival', 'Swim'],
    description: 'A deadly hunter who marks targets for death.',
    keyAbility: 'DEX',
    role: 'Striker, scout',
    tek8Primary: 'D4',
    tek8Secondary: 'D10',
  },
];

// ============== SKILLS ==============

export interface Skill {
  name: string;
  ability: Ability;
  trainedOnly: boolean;
  armorCheckPenalty: boolean;
  description: string;
}

export const SKILLS: Skill[] = [
  { name: 'Acrobatics', ability: 'DEX', trainedOnly: false, armorCheckPenalty: true, description: 'Balance, tumble, and jump.' },
  { name: 'Appraise', ability: 'INT', trainedOnly: false, armorCheckPenalty: false, description: 'Evaluate the value of items.' },
  { name: 'Bluff', ability: 'CHA', trainedOnly: false, armorCheckPenalty: false, description: 'Deceive others with lies.' },
  { name: 'Climb', ability: 'STR', trainedOnly: false, armorCheckPenalty: true, description: 'Scale walls and cliffs.' },
  { name: 'Craft', ability: 'INT', trainedOnly: false, armorCheckPenalty: false, description: 'Create items and objects.' },
  { name: 'Diplomacy', ability: 'CHA', trainedOnly: false, armorCheckPenalty: false, description: 'Persuade others through negotiation.' },
  { name: 'Disable Device', ability: 'DEX', trainedOnly: true, armorCheckPenalty: true, description: 'Disarm traps and open locks.' },
  { name: 'Disguise', ability: 'CHA', trainedOnly: false, armorCheckPenalty: false, description: 'Change your appearance.' },
  { name: 'Escape Artist', ability: 'DEX', trainedOnly: false, armorCheckPenalty: true, description: 'Escape bonds and grapples.' },
  { name: 'Fly', ability: 'DEX', trainedOnly: false, armorCheckPenalty: true, description: 'Maneuver while flying.' },
  { name: 'Handle Animal', ability: 'CHA', trainedOnly: true, armorCheckPenalty: false, description: 'Train and command animals.' },
  { name: 'Heal', ability: 'WIS', trainedOnly: false, armorCheckPenalty: false, description: 'Provide first aid and long-term care.' },
  { name: 'Intimidate', ability: 'CHA', trainedOnly: false, armorCheckPenalty: false, description: 'Frighten others into compliance.' },
  { name: 'Knowledge (Arcana)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Magic, arcane symbols, constructs, dragons.' },
  { name: 'Knowledge (Dungeoneering)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Aberrations, caverns, oozes.' },
  { name: 'Knowledge (Engineering)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Buildings, aqueducts, fortifications.' },
  { name: 'Knowledge (Geography)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Lands, terrain, climate, people.' },
  { name: 'Knowledge (History)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Wars, colonies, migrations, founding of cities.' },
  { name: 'Knowledge (Local)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Legends, personalities, inhabitants, laws, humanoids.' },
  { name: 'Knowledge (Nature)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Animals, fey, monstrous humanoids, plants, seasons.' },
  { name: 'Knowledge (Nobility)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Lineages, heraldry, personalities, royalty.' },
  { name: 'Knowledge (Planes)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Inner and Outer Planes, outsiders.' },
  { name: 'Knowledge (Religion)', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Gods, mythic history, ecclesiastic tradition, undead.' },
  { name: 'Linguistics', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Learn languages, detect forgeries.' },
  { name: 'Perception', ability: 'WIS', trainedOnly: false, armorCheckPenalty: false, description: 'Notice details, spot hidden creatures.' },
  { name: 'Perform', ability: 'CHA', trainedOnly: false, armorCheckPenalty: false, description: 'Entertain an audience.' },
  { name: 'Profession', ability: 'WIS', trainedOnly: true, armorCheckPenalty: false, description: 'Practice a profession for income.' },
  { name: 'Ride', ability: 'DEX', trainedOnly: false, armorCheckPenalty: true, description: 'Control a mount.' },
  { name: 'Sense Motive', ability: 'WIS', trainedOnly: false, armorCheckPenalty: false, description: 'Detect lies and read intentions.' },
  { name: 'Sleight of Hand', ability: 'DEX', trainedOnly: true, armorCheckPenalty: true, description: 'Pick pockets, hide small objects.' },
  { name: 'Spellcraft', ability: 'INT', trainedOnly: true, armorCheckPenalty: false, description: 'Identify spells, craft magic items.' },
  { name: 'Stealth', ability: 'DEX', trainedOnly: false, armorCheckPenalty: true, description: 'Move silently and hide.' },
  { name: 'Survival', ability: 'WIS', trainedOnly: false, armorCheckPenalty: false, description: 'Track, forage, avoid hazards.' },
  { name: 'Swim', ability: 'STR', trainedOnly: false, armorCheckPenalty: true, description: 'Move through water.' },
  { name: 'Use Magic Device', ability: 'CHA', trainedOnly: true, armorCheckPenalty: false, description: 'Activate magic items.' },
];

// ============== ALIGNMENTS ==============

export interface Alignment {
  code: string;
  name: string;
  description: string;
  restrictions?: string[];
}

export const ALIGNMENTS: Alignment[] = [
  { code: 'LG', name: 'Lawful Good', description: 'Crusader - Combines honor with compassion.' },
  { code: 'NG', name: 'Neutral Good', description: 'Benefactor - Does good without bias for or against order.' },
  { code: 'CG', name: 'Chaotic Good', description: 'Rebel - Combines good heart with free spirit.' },
  { code: 'LN', name: 'Lawful Neutral', description: 'Judge - Follows rules and tradition above all.' },
  { code: 'TN', name: 'True Neutral', description: 'Undecided - Acts without prejudice or compulsion.' },
  { code: 'CN', name: 'Chaotic Neutral', description: 'Free Spirit - Follows whims, values freedom.' },
  { code: 'LE', name: 'Lawful Evil', description: 'Dominator - Methodically takes what is wanted within limits.' },
  { code: 'NE', name: 'Neutral Evil', description: 'Malefactor - Does whatever can be gotten away with.' },
  { code: 'CE', name: 'Chaotic Evil', description: 'Destroyer - Acts with arbitrary violence.' },
];

// ============== POINT BUY COSTS ==============

export const POINT_BUY_COSTS: Record<number, number> = {
  7: -4,
  8: -2,
  9: -1,
  10: 0,
  11: 1,
  12: 2,
  13: 3,
  14: 5,
  15: 7,
  16: 10,
  17: 13,
  18: 17,
};

export const POINT_BUY_BUDGETS = {
  low: 10,
  standard: 15,
  high: 20,
  epic: 25,
};

// ============== DICE ROLLING ==============

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function roll4d6DropLowest(): { rolls: number[]; dropped: number; total: number } {
  const rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
  const sorted = [...rolls].sort((a, b) => a - b);
  const dropped = sorted[0];
  const total = sorted.slice(1).reduce((a, b) => a + b, 0);
  return { rolls, dropped, total };
}

export function generateAbilityScores(): { scores: number[]; details: Array<{ rolls: number[]; dropped: number; total: number }> } {
  const details = [];
  const scores = [];
  for (let i = 0; i < 6; i++) {
    const result = roll4d6DropLowest();
    details.push(result);
    scores.push(result.total);
  }
  return { scores, details };
}

// ============== CHARACTER CREATION HELPERS ==============

export interface CharacterAbilities {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export function applyRacialMods(abilities: CharacterAbilities, race: Race, bonusAbility?: Ability): CharacterAbilities {
  const result = { ...abilities };

  // Apply fixed racial modifiers
  for (const [ability, mod] of Object.entries(race.abilityMods)) {
    result[ability as Ability] += mod as number;
  }

  // Apply floating bonus (Human, Half-Elf, Half-Orc)
  if (bonusAbility && Object.keys(race.abilityMods).length === 0) {
    result[bonusAbility] += 2;
  }

  return result;
}

export function calculateHP(classData: ClassData, level: number, conMod: number, favoredClassHP: number = 0): number {
  // First level: max hit die
  // Subsequent levels: average (rounded up)
  const firstLevel = classData.hitDie + conMod;
  const avgHitDie = Math.ceil(classData.hitDie / 2) + 1;
  const subsequentLevels = (level - 1) * (avgHitDie + conMod);
  return Math.max(1, firstLevel + subsequentLevels + favoredClassHP);
}

export function calculateSkillsPerLevel(classData: ClassData, intMod: number): number {
  return Math.max(1, classData.skillsPerLevel + intMod);
}

export function getBABByLevel(bab: 'full' | 'medium' | 'low', level: number): number {
  switch (bab) {
    case 'full': return level;
    case 'medium': return Math.floor(level * 0.75);
    case 'low': return Math.floor(level / 2);
  }
}

export function getSaveByLevel(isGood: boolean, level: number): number {
  if (isGood) {
    return 2 + Math.floor(level / 2);
  }
  return Math.floor(level / 3);
}

// ============== TRAITS ==============

export interface Trait {
  name: string;
  type: 'combat' | 'faith' | 'magic' | 'social' | 'regional' | 'race' | 'campaign';
  benefit: string;
}

export const SAMPLE_TRAITS: Trait[] = [
  // Combat Traits
  { name: 'Reactionary', type: 'combat', benefit: '+2 Initiative' },
  { name: 'Armor Expert', type: 'combat', benefit: 'Reduce armor check penalty by 1' },
  { name: 'Defender of the Society', type: 'combat', benefit: '+1 AC when wearing medium or heavy armor' },
  { name: 'Deft Dodger', type: 'combat', benefit: '+1 Reflex saves' },
  { name: 'Resilient', type: 'combat', benefit: '+1 Fortitude saves' },

  // Faith Traits
  { name: 'Birthmark', type: 'faith', benefit: '+2 vs charm and compulsion' },
  { name: 'Indomitable Faith', type: 'faith', benefit: '+1 Will saves' },
  { name: 'Sacred Touch', type: 'faith', benefit: 'Stabilize dying creatures as standard action' },

  // Magic Traits
  { name: 'Magical Lineage', type: 'magic', benefit: 'One spell costs -1 metamagic level' },
  { name: 'Focused Mind', type: 'magic', benefit: '+2 Concentration checks' },
  { name: 'Hedge Magician', type: 'magic', benefit: '5% discount on magic item creation' },

  // Social Traits
  { name: 'Charming', type: 'social', benefit: '+1 Bluff/Diplomacy; one becomes class skill' },
  { name: 'Fast-Talker', type: 'social', benefit: '+1 Bluff, Bluff is class skill' },
  { name: 'Suspicious', type: 'social', benefit: '+1 Sense Motive, Sense Motive is class skill' },
];

export const SAMPLE_DRAWBACKS = [
  { name: 'Pride', penalty: '-2 Diplomacy and Sense Motive vs flattery' },
  { name: 'Paranoid', penalty: '-2 Aid Another; others get -2 when aiding you' },
  { name: 'Meticulous', penalty: 'Take twice as long on skill checks if you fail' },
  { name: 'Anxious', penalty: '-2 on saves vs fear; -1 on Initiative' },
];

// ============== EQUIPMENT ==============

export interface Weapon {
  name: string;
  category: 'simple' | 'martial' | 'exotic';
  type: 'melee' | 'ranged';
  damage: string;
  critical: string;
  range?: number;
  damageType: ('B' | 'P' | 'S')[];
  weight: number;
  cost: number;
  special?: string[];
}

export const COMMON_WEAPONS: Weapon[] = [
  // Simple Melee
  { name: 'Dagger', category: 'simple', type: 'melee', damage: '1d4', critical: '19-20/x2', range: 10, damageType: ['P', 'S'], weight: 1, cost: 2 },
  { name: 'Club', category: 'simple', type: 'melee', damage: '1d6', critical: 'x2', damageType: ['B'], weight: 3, cost: 0 },
  { name: 'Quarterstaff', category: 'simple', type: 'melee', damage: '1d6/1d6', critical: 'x2', damageType: ['B'], weight: 4, cost: 0, special: ['double', 'monk'] },
  { name: 'Mace, Light', category: 'simple', type: 'melee', damage: '1d6', critical: 'x2', damageType: ['B'], weight: 4, cost: 5 },
  { name: 'Morningstar', category: 'simple', type: 'melee', damage: '1d8', critical: 'x2', damageType: ['B', 'P'], weight: 6, cost: 8 },

  // Martial Melee
  { name: 'Longsword', category: 'martial', type: 'melee', damage: '1d8', critical: '19-20/x2', damageType: ['S'], weight: 4, cost: 15 },
  { name: 'Greatsword', category: 'martial', type: 'melee', damage: '2d6', critical: '19-20/x2', damageType: ['S'], weight: 8, cost: 50 },
  { name: 'Battleaxe', category: 'martial', type: 'melee', damage: '1d8', critical: 'x3', damageType: ['S'], weight: 6, cost: 10 },
  { name: 'Greataxe', category: 'martial', type: 'melee', damage: '1d12', critical: 'x3', damageType: ['S'], weight: 12, cost: 20 },
  { name: 'Warhammer', category: 'martial', type: 'melee', damage: '1d8', critical: 'x3', damageType: ['B'], weight: 5, cost: 12 },
  { name: 'Rapier', category: 'martial', type: 'melee', damage: '1d6', critical: '18-20/x2', damageType: ['P'], weight: 2, cost: 20 },
  { name: 'Scimitar', category: 'martial', type: 'melee', damage: '1d6', critical: '18-20/x2', damageType: ['S'], weight: 4, cost: 15 },
  { name: 'Falchion', category: 'martial', type: 'melee', damage: '2d4', critical: '18-20/x2', damageType: ['S'], weight: 8, cost: 75 },

  // Simple Ranged
  { name: 'Crossbow, Light', category: 'simple', type: 'ranged', damage: '1d8', critical: '19-20/x2', range: 80, damageType: ['P'], weight: 4, cost: 35 },
  { name: 'Crossbow, Heavy', category: 'simple', type: 'ranged', damage: '1d10', critical: '19-20/x2', range: 120, damageType: ['P'], weight: 8, cost: 50 },
  { name: 'Javelin', category: 'simple', type: 'ranged', damage: '1d6', critical: 'x2', range: 30, damageType: ['P'], weight: 2, cost: 1 },

  // Martial Ranged
  { name: 'Longbow', category: 'martial', type: 'ranged', damage: '1d8', critical: 'x3', range: 100, damageType: ['P'], weight: 3, cost: 75 },
  { name: 'Shortbow', category: 'martial', type: 'ranged', damage: '1d6', critical: 'x3', range: 60, damageType: ['P'], weight: 2, cost: 30 },
  { name: 'Longbow, Composite', category: 'martial', type: 'ranged', damage: '1d8', critical: 'x3', range: 110, damageType: ['P'], weight: 3, cost: 100 },
];

export interface Armor {
  name: string;
  category: 'light' | 'medium' | 'heavy' | 'shield';
  acBonus: number;
  maxDex: number | null;
  armorCheckPenalty: number;
  arcaneSpellFailure: number;
  speed30: number;
  weight: number;
  cost: number;
}

export const COMMON_ARMOR: Armor[] = [
  // Light
  { name: 'Padded', category: 'light', acBonus: 1, maxDex: 8, armorCheckPenalty: 0, arcaneSpellFailure: 5, speed30: 30, weight: 10, cost: 5 },
  { name: 'Leather', category: 'light', acBonus: 2, maxDex: 6, armorCheckPenalty: 0, arcaneSpellFailure: 10, speed30: 30, weight: 15, cost: 10 },
  { name: 'Studded Leather', category: 'light', acBonus: 3, maxDex: 5, armorCheckPenalty: -1, arcaneSpellFailure: 15, speed30: 30, weight: 20, cost: 25 },
  { name: 'Chain Shirt', category: 'light', acBonus: 4, maxDex: 4, armorCheckPenalty: -2, arcaneSpellFailure: 20, speed30: 30, weight: 25, cost: 100 },

  // Medium
  { name: 'Hide', category: 'medium', acBonus: 4, maxDex: 4, armorCheckPenalty: -3, arcaneSpellFailure: 20, speed30: 20, weight: 25, cost: 15 },
  { name: 'Scale Mail', category: 'medium', acBonus: 5, maxDex: 3, armorCheckPenalty: -4, arcaneSpellFailure: 25, speed30: 20, weight: 30, cost: 50 },
  { name: 'Chainmail', category: 'medium', acBonus: 6, maxDex: 2, armorCheckPenalty: -5, arcaneSpellFailure: 30, speed30: 20, weight: 40, cost: 150 },
  { name: 'Breastplate', category: 'medium', acBonus: 6, maxDex: 3, armorCheckPenalty: -4, arcaneSpellFailure: 25, speed30: 20, weight: 30, cost: 200 },

  // Heavy
  { name: 'Splint Mail', category: 'heavy', acBonus: 7, maxDex: 0, armorCheckPenalty: -7, arcaneSpellFailure: 40, speed30: 20, weight: 45, cost: 200 },
  { name: 'Banded Mail', category: 'heavy', acBonus: 7, maxDex: 1, armorCheckPenalty: -6, arcaneSpellFailure: 35, speed30: 20, weight: 35, cost: 250 },
  { name: 'Half-Plate', category: 'heavy', acBonus: 8, maxDex: 0, armorCheckPenalty: -7, arcaneSpellFailure: 40, speed30: 20, weight: 50, cost: 600 },
  { name: 'Full Plate', category: 'heavy', acBonus: 9, maxDex: 1, armorCheckPenalty: -6, arcaneSpellFailure: 35, speed30: 20, weight: 50, cost: 1500 },

  // Shields
  { name: 'Buckler', category: 'shield', acBonus: 1, maxDex: null, armorCheckPenalty: -1, arcaneSpellFailure: 5, speed30: 30, weight: 5, cost: 5 },
  { name: 'Shield, Light Wooden', category: 'shield', acBonus: 1, maxDex: null, armorCheckPenalty: -1, arcaneSpellFailure: 5, speed30: 30, weight: 5, cost: 3 },
  { name: 'Shield, Heavy Steel', category: 'shield', acBonus: 2, maxDex: null, armorCheckPenalty: -2, arcaneSpellFailure: 15, speed30: 30, weight: 15, cost: 20 },
];

// ============== DEITIES ==============

export interface Deity {
  name: string;
  alignment: string;
  domains: string[];
  favoredWeapon: string;
  description: string;
}

export const CORE_DEITIES: Deity[] = [
  { name: 'Abadar', alignment: 'LN', domains: ['Earth', 'Law', 'Nobility', 'Protection', 'Travel'], favoredWeapon: 'Crossbow', description: 'God of cities, wealth, merchants, and law' },
  { name: 'Asmodeus', alignment: 'LE', domains: ['Evil', 'Fire', 'Law', 'Magic', 'Trickery'], favoredWeapon: 'Mace', description: 'God of tyranny, slavery, and contracts' },
  { name: 'Calistria', alignment: 'CN', domains: ['Chaos', 'Charm', 'Knowledge', 'Luck', 'Trickery'], favoredWeapon: 'Whip', description: 'Goddess of trickery, lust, and revenge' },
  { name: 'Cayden Cailean', alignment: 'CG', domains: ['Chaos', 'Charm', 'Good', 'Strength', 'Travel'], favoredWeapon: 'Rapier', description: 'God of freedom, ale, wine, and bravery' },
  { name: 'Desna', alignment: 'CG', domains: ['Chaos', 'Good', 'Liberation', 'Luck', 'Travel'], favoredWeapon: 'Starknife', description: 'Goddess of dreams, stars, travelers, and luck' },
  { name: 'Erastil', alignment: 'LG', domains: ['Animal', 'Community', 'Good', 'Law', 'Plant'], favoredWeapon: 'Longbow', description: 'God of family, farming, hunting, and trade' },
  { name: 'Gorum', alignment: 'CN', domains: ['Chaos', 'Destruction', 'Glory', 'Strength', 'War'], favoredWeapon: 'Greatsword', description: 'God of strength, battle, and weapons' },
  { name: 'Gozreh', alignment: 'TN', domains: ['Air', 'Animal', 'Plant', 'Water', 'Weather'], favoredWeapon: 'Trident', description: 'God of nature, weather, and the sea' },
  { name: 'Iomedae', alignment: 'LG', domains: ['Glory', 'Good', 'Law', 'Sun', 'War'], favoredWeapon: 'Longsword', description: 'Goddess of valor, rulership, justice, and honor' },
  { name: 'Irori', alignment: 'LN', domains: ['Healing', 'Knowledge', 'Law', 'Rune', 'Strength'], favoredWeapon: 'Unarmed Strike', description: 'God of history, knowledge, and self-perfection' },
  { name: 'Lamashtu', alignment: 'CE', domains: ['Chaos', 'Evil', 'Madness', 'Strength', 'Trickery'], favoredWeapon: 'Falchion', description: 'Goddess of madness, monsters, and nightmares' },
  { name: 'Nethys', alignment: 'TN', domains: ['Destruction', 'Knowledge', 'Magic', 'Protection', 'Rune'], favoredWeapon: 'Quarterstaff', description: 'God of magic' },
  { name: 'Norgorber', alignment: 'NE', domains: ['Charm', 'Death', 'Evil', 'Knowledge', 'Trickery'], favoredWeapon: 'Short Sword', description: 'God of greed, secrets, poison, and murder' },
  { name: 'Pharasma', alignment: 'TN', domains: ['Death', 'Healing', 'Knowledge', 'Repose', 'Water'], favoredWeapon: 'Dagger', description: 'Goddess of fate, death, prophecy, and birth' },
  { name: 'Rovagug', alignment: 'CE', domains: ['Chaos', 'Destruction', 'Evil', 'War', 'Weather'], favoredWeapon: 'Greataxe', description: 'God of wrath, disaster, and destruction' },
  { name: 'Sarenrae', alignment: 'NG', domains: ['Fire', 'Glory', 'Good', 'Healing', 'Sun'], favoredWeapon: 'Scimitar', description: 'Goddess of the sun, redemption, honesty, and healing' },
  { name: 'Shelyn', alignment: 'NG', domains: ['Air', 'Charm', 'Good', 'Luck', 'Protection'], favoredWeapon: 'Glaive', description: 'Goddess of beauty, art, love, and music' },
  { name: 'Torag', alignment: 'LG', domains: ['Artifice', 'Earth', 'Good', 'Law', 'Protection'], favoredWeapon: 'Warhammer', description: 'God of the forge, protection, and strategy' },
  { name: 'Urgathoa', alignment: 'NE', domains: ['Death', 'Evil', 'Magic', 'Strength', 'War'], favoredWeapon: 'Scythe', description: 'Goddess of gluttony, disease, and undeath' },
  { name: 'Zon-Kuthon', alignment: 'LE', domains: ['Darkness', 'Death', 'Destruction', 'Evil', 'Law'], favoredWeapon: 'Spiked Chain', description: 'God of envy, pain, darkness, and loss' },
];

// ============== PERSONALITY QUESTIONS (from Autosheet BB94:BB123) ==============

export const PERSONALITY_QUESTIONS = [
  { id: 'background', question: 'What is your character\'s background and history?', hint: 'Where did they grow up? What shaped them?' },
  { id: 'skills_origin', question: 'Where/From whom did you learn your skills?', hint: 'A mentor, school, self-taught, divine gift?' },
  { id: 'life_goals', question: 'What are your personal life goals? What challenges do you hope to overcome?', hint: 'Fame, fortune, revenge, redemption, knowledge?' },
  { id: 'moral_code', question: 'What is your moral code or guiding principles?', hint: 'What lines won\'t you cross? What do you stand for?' },
  { id: 'flaw', question: 'What character flaw(s) is/are most likely to cause problems?', hint: 'Pride, greed, anger, fear, addiction?' },
  { id: 'fear', question: 'What do you secretly fear, even in times of easygoing peace?', hint: 'Death, failure, abandonment, the dark?' },
];

// ============== COMPREHENSIVE CHARACTER INTERFACE ==============

export interface PF1Character {
  // Basic Info (B2:R2)
  name: string;
  player: string;
  alignment: string;
  race: string;
  deity: string;

  // Demographics (H5:V5)
  age: number;
  gender: string;
  height: string;
  weight: string;
  hair: string;
  eyes: string;
  homeland: string;
  xp: number;

  // Class Info (AE2:AE4, AQ2:AQ5) - supports multiclass
  classes: Array<{
    name: string;
    level: number;
    isFavored: boolean;
    archetypes?: string[];
  }>;

  // Favored Class Bonuses (Z3:Z5)
  favoredClassBonuses: {
    hp: number;
    skills: number;
    other: string;
  };

  // Ability Scores (I9:K14)
  abilities: CharacterAbilities;
  tempAbilityAdjustments: Partial<CharacterAbilities>;

  // Saves Misc (K17:K19)
  saveMiscBonuses: {
    fort: number;
    ref: number;
    will: number;
  };

  // AC Misc (AA17:AA20)
  acMiscBonuses: {
    armor: number;
    shield: number;
    natural: number;
    deflection: number;
    dodge: number;
    misc: number;
  };

  // Notes (B22:AB23)
  saveNotes: string;
  acNotes: string;

  // Offense (B26:N31, Y26:AB31)
  attacks: Array<{
    name: string;
    attackBonus: number;
    damage: string;
    enhancement: number;
    critical: string;
    range: string;
    type: string;
    notes: string;
  }>;

  // Attack Notes (B33:S34)
  attackNotes: string;

  // Skills (AL9:AL32, AO9:AO32)
  skillRanks: Record<string, number>;
  skillMiscBonuses: Record<string, number>;

  // Background Skills (AL35:AL45, AO35:AO45)
  backgroundSkillRanks: Record<string, number>;
  backgroundSkillMiscBonuses: Record<string, number>;

  // Armor (B42:N43)
  armor: {
    name: string;
    acBonus: number;
    maxDex: number;
    checkPenalty: number;
    enhancement: number;
    material: string;
  } | null;

  shield: {
    name: string;
    acBonus: number;
    checkPenalty: number;
    enhancement: number;
  } | null;

  // Magical Protective Items (T45:AB46)
  magicItems: {
    cloakOfResistance: number;
    ringOfProtection: number;
    amuletOfNaturalArmor: number;
    other: Array<{ name: string; bonus: number; type: string }>;
  };

  // Resources (AS33:AU46)
  resources: Array<{
    name: string;
    current: number;
    max: number;
  }>;

  // Magic Item Slots (BG33:BG46)
  itemSlots: {
    head: string;
    headband: string;
    eyes: string;
    shoulders: string;
    neck: string;
    chest: string;
    body: string;
    armor: string;
    belt: string;
    wrists: string;
    hands: string;
    ring1: string;
    ring2: string;
    feet: string;
  };

  // Traits and Drawbacks (C71:L74)
  traits: string[];
  drawback: string;

  // Class Features and Feats (N71:AJ90)
  classFeatures: string[];
  feats: string[];

  // Racial Features (A77:L90)
  racialFeatures: string[];

  // Background and Personality (BB94:BB123)
  personality: Record<string, string>;

  // Character Art (AS1)
  artUrl: string;

  // TEK8 Integration
  tek8Element: string;
  tek8Road: string;
}

export function createEmptyCharacter(): PF1Character {
  return {
    name: '',
    player: '',
    alignment: 'TN',
    race: 'Human',
    deity: '',
    age: 25,
    gender: '',
    height: '',
    weight: '',
    hair: '',
    eyes: '',
    homeland: '',
    xp: 0,
    classes: [{ name: 'Fighter', level: 1, isFavored: true }],
    favoredClassBonuses: { hp: 0, skills: 0, other: '' },
    abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    tempAbilityAdjustments: {},
    saveMiscBonuses: { fort: 0, ref: 0, will: 0 },
    acMiscBonuses: { armor: 0, shield: 0, natural: 0, deflection: 0, dodge: 0, misc: 0 },
    saveNotes: '',
    acNotes: '',
    attacks: [],
    attackNotes: '',
    skillRanks: {},
    skillMiscBonuses: {},
    backgroundSkillRanks: {},
    backgroundSkillMiscBonuses: {},
    armor: null,
    shield: null,
    magicItems: { cloakOfResistance: 0, ringOfProtection: 0, amuletOfNaturalArmor: 0, other: [] },
    resources: [],
    itemSlots: {
      head: '', headband: '', eyes: '', shoulders: '', neck: '', chest: '',
      body: '', armor: '', belt: '', wrists: '', hands: '', ring1: '', ring2: '', feet: '',
    },
    traits: [],
    drawback: '',
    classFeatures: [],
    feats: [],
    racialFeatures: [],
    personality: {},
    artUrl: '',
    tek8Element: 'D4',
    tek8Road: 'D4OUT',
  };
}

// ============== CALCULATED VALUES ==============

export function calculateTotalLevel(character: PF1Character): number {
  return character.classes.reduce((sum, c) => sum + c.level, 0);
}

export function calculateTotalHP(character: PF1Character): number {
  const conMod = getAbilityModifier(character.abilities.CON);
  const totalLevel = calculateTotalLevel(character);
  let hp = 0;

  for (const cls of character.classes) {
    const classData = CLASSES.find(c => c.name === cls.name);
    if (classData) {
      // First level of first class: max hit die
      if (character.classes.indexOf(cls) === 0) {
        hp += classData.hitDie + conMod;
        hp += (cls.level - 1) * (Math.ceil(classData.hitDie / 2) + 1 + conMod);
      } else {
        hp += cls.level * (Math.ceil(classData.hitDie / 2) + 1 + conMod);
      }
    }
  }

  hp += character.favoredClassBonuses.hp;
  return Math.max(totalLevel, hp);
}

export function calculateAC(character: PF1Character): number {
  const dexMod = getAbilityModifier(character.abilities.DEX);
  let maxDex = dexMod;

  if (character.armor && character.armor.maxDex < dexMod) {
    maxDex = character.armor.maxDex;
  }

  let ac = 10 + maxDex;
  ac += character.armor?.acBonus || 0;
  ac += character.armor?.enhancement || 0;
  ac += character.shield?.acBonus || 0;
  ac += character.shield?.enhancement || 0;
  ac += character.acMiscBonuses.natural;
  ac += character.acMiscBonuses.deflection;
  ac += character.acMiscBonuses.dodge;
  ac += character.acMiscBonuses.misc;
  ac += character.magicItems.ringOfProtection;
  ac += character.magicItems.amuletOfNaturalArmor;

  return ac;
}

export function calculateCMB(character: PF1Character): number {
  const strMod = getAbilityModifier(character.abilities.STR);
  let bab = 0;

  for (const cls of character.classes) {
    const classData = CLASSES.find(c => c.name === cls.name);
    if (classData) {
      bab += getBABByLevel(classData.bab, cls.level);
    }
  }

  // Size modifier (Medium = 0)
  const race = RACES.find(r => r.name === character.race);
  const sizeMod = race?.size === 'Small' ? -1 : race?.size === 'Large' ? 1 : 0;

  return bab + strMod + sizeMod;
}

export function calculateCMD(character: PF1Character): number {
  const strMod = getAbilityModifier(character.abilities.STR);
  const dexMod = getAbilityModifier(character.abilities.DEX);
  let bab = 0;

  for (const cls of character.classes) {
    const classData = CLASSES.find(c => c.name === cls.name);
    if (classData) {
      bab += getBABByLevel(classData.bab, cls.level);
    }
  }

  const race = RACES.find(r => r.name === character.race);
  const sizeMod = race?.size === 'Small' ? -1 : race?.size === 'Large' ? 1 : 0;

  return 10 + bab + strMod + dexMod + sizeMod;
}
