/**
 * TEK8 Lotus Core - 40 Roads Configuration
 *
 * 8 Petals × 5 Positions = 40 Roads
 * Each road is a developmental territory for exploration
 */

export interface Petal {
  die: string;
  element: string;
  sense: string;
  ability: string;
  wellness: string;
  capital: string;
  aok: string; // IB Area of Knowledge
  virtue: string;
  color: string;
  gradient: string;
  description: string;
  crystalSchool: string;
  wordCount: number;
}

export interface Road {
  id: string;
  petal: string;
  position: string;
  name: string;
  description: string;
  challenges: string[];
}

export const PETALS: Record<string, Petal> = {
  D12: {
    die: 'D12',
    element: 'Ether',
    sense: 'Sound',
    ability: 'Creativity',
    wellness: 'Emotional',
    capital: 'Cultural',
    aok: 'Arts',
    virtue: 'Radiance',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    description: 'The realm of creativity, inspiration, and artistic vision. Those who walk the Ether roads seek to express the inexpressible.',
    crystalSchool: 'Dream Weavers',
    wordCount: 12,
  },
  D8: {
    die: 'D8',
    element: 'Air',
    sense: 'Touch',
    ability: 'Strength',
    wellness: 'Physical',
    capital: 'Natural',
    aok: 'Natural Sciences',
    virtue: 'Momentum',
    color: 'cyan',
    gradient: 'from-cyan-400 to-blue-500',
    description: 'The realm of communication, education, and physical vitality. Air road travelers bridge worlds through language and movement.',
    crystalSchool: 'Sky Dancers',
    wordCount: 8,
  },
  D4: {
    die: 'D4',
    element: 'Fire',
    sense: 'Sight',
    ability: 'Agility',
    wellness: 'Occupational',
    capital: 'Material',
    aok: 'Ethics',
    virtue: 'Grace',
    color: 'red',
    gradient: 'from-red-500 to-orange-500',
    description: 'The realm of passion, transformation, and skilled craft. Fire road travelers forge new realities through dedicated action.',
    crystalSchool: 'Forge Masters',
    wordCount: 4,
  },
  D20: {
    die: 'D20',
    element: 'Water',
    sense: 'Taste',
    ability: 'Empathy',
    wellness: 'Environmental',
    capital: 'Experiential',
    aok: 'History',
    virtue: 'Flow',
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    description: 'The realm of memory, healing, and adaptive wisdom. Water road travelers hold stories and guide others through emotional depths.',
    crystalSchool: 'Flow Keepers',
    wordCount: 20,
  },
  D6: {
    die: 'D6',
    element: 'Earth',
    sense: 'Smell',
    ability: 'Endurance',
    wellness: 'Spiritual',
    capital: 'Spiritual',
    aok: 'Indigenous Knowledge',
    virtue: 'Fortitude',
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    description: 'The realm of foundation, cultivation, and sacred connection. Earth road travelers build lasting structures that honor tradition.',
    crystalSchool: 'Ground Builders',
    wordCount: 6,
  },
  D10: {
    die: 'D10',
    element: 'Chaos',
    sense: 'Mind',
    ability: 'Willpower',
    wellness: 'Social',
    capital: 'Social',
    aok: 'Human Sciences',
    virtue: 'Wildness',
    color: 'orange',
    gradient: 'from-orange-500 to-red-600',
    description: 'The realm of innovation, disruption, and social change. Chaos road travelers embrace uncertainty to discover new possibilities.',
    crystalSchool: 'Wild Shapers',
    wordCount: 10,
  },
  D100: {
    die: 'D100',
    element: 'Order',
    sense: 'Intelligence',
    ability: 'Focus',
    wellness: 'Intellectual',
    capital: 'Intellectual',
    aok: 'Religious Knowledge',
    virtue: 'Precision',
    color: 'gray',
    gradient: 'from-gray-300 to-white',
    description: 'The realm of knowledge, systems, and cosmic pattern. Order road travelers seek synthesis across all domains of understanding.',
    crystalSchool: 'Archive Seekers',
    wordCount: 100,
  },
  D2: {
    die: 'D2',
    element: 'Coin',
    sense: 'Wealth',
    ability: 'Instinct',
    wellness: 'Financial',
    capital: 'Financial',
    aok: 'Mathematics',
    virtue: 'Luck',
    color: 'yellow',
    gradient: 'from-yellow-400 to-amber-500',
    description: 'The realm of value, exchange, and quick decisions. Coin road travelers navigate the flow of resources with intuitive wisdom.',
    crystalSchool: 'Luck Riders',
    wordCount: 2,
  },
};

export const POSITIONS = {
  OUT: { name: 'Outer Ring', description: 'Beginning exploration, first contact with the element' },
  UP: { name: 'Ascending Path', description: 'Growth and expansion, reaching upward' },
  DWN: { name: 'Descending Path', description: 'Depth and introspection, going inward' },
  U45: { name: 'Upper Diagonal', description: 'Synthesis with neighboring elements above' },
  D45: { name: 'Lower Diagonal', description: 'Integration with neighboring elements below' },
};

// Generate all 40 roads
export function generateRoads(): Road[] {
  const roads: Road[] = [];
  const petalKeys = Object.keys(PETALS);

  for (const petalKey of petalKeys) {
    const petal = PETALS[petalKey];
    for (const [posKey, pos] of Object.entries(POSITIONS)) {
      const roadId = `${petalKey}${posKey}`;
      roads.push({
        id: roadId,
        petal: petalKey,
        position: posKey,
        name: `${petal.element} ${pos.name}`,
        description: `${pos.description}. In the ${petal.element} realm, this path emphasizes ${petal.ability.toLowerCase()} through ${petal.wellness.toLowerCase()} wellness.`,
        challenges: generateChallenges(petal, posKey),
      });
    }
  }

  return roads;
}

function generateChallenges(petal: Petal, position: string): string[] {
  const base = [
    `Express your understanding of ${petal.element} in exactly ${petal.wordCount} words`,
    `Identify a ${petal.wellness.toLowerCase()} wellness practice that resonates with you`,
    `Connect ${petal.aok} to your personal journey`,
  ];

  switch (position) {
    case 'OUT':
      return [...base, `Introduce yourself to the ${petal.element} community`];
    case 'UP':
      return [...base, `Share a growth moment related to ${petal.ability.toLowerCase()}`];
    case 'DWN':
      return [...base, `Reflect on a challenge you overcame using ${petal.virtue.toLowerCase()}`];
    case 'U45':
      return [...base, `Bridge ${petal.element} with its upper neighbor element`];
    case 'D45':
      return [...base, `Integrate ${petal.element} with its lower neighbor element`];
    default:
      return base;
  }
}

export const ALL_ROADS = generateRoads();

// Get roads by petal
export function getRoadsByPetal(petalKey: string): Road[] {
  return ALL_ROADS.filter(road => road.petal === petalKey);
}

// Get road by ID
export function getRoadById(roadId: string): Road | undefined {
  return ALL_ROADS.find(road => road.id === roadId);
}

// Get petal from road ID
export function getPetalFromRoadId(roadId: string): string {
  // Extract die type (D2, D4, D6, D8, D10, D12, D20, D100)
  const match = roadId.match(/^(D\d+)/);
  return match ? match[1] : 'D12';
}

// Elemental order (Vedic sequence)
export const ELEMENTAL_ORDER = ['D12', 'D8', 'D4', 'D20', 'D6', 'D10', 'D100', 'D2'];

// Get next petal in sequence
export function getNextPetal(currentPetal: string): string {
  const index = ELEMENTAL_ORDER.indexOf(currentPetal);
  return ELEMENTAL_ORDER[(index + 1) % ELEMENTAL_ORDER.length];
}

// Get previous petal in sequence
export function getPreviousPetal(currentPetal: string): string {
  const index = ELEMENTAL_ORDER.indexOf(currentPetal);
  return ELEMENTAL_ORDER[(index - 1 + ELEMENTAL_ORDER.length) % ELEMENTAL_ORDER.length];
}
