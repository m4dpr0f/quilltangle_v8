// The 64 Sacred Garu Egg Questions of Quilltangle
// Source: RPG_ZINE_PUBLISHING_PACKAGE/64_GARU_EGGS_QUESTIONS.md

export interface GaruEggQuestion {
  eggNumber: number;
  name: string;
  question: string;
  elements: string[];
  symbol?: string;
}

export const GARU_EGG_QUESTIONS: GaruEggQuestion[] = [
  // 8 Foundational Questions (Eggs 0-7)
  { eggNumber: 0, name: 'Echo Egg', question: 'Who am I, beyond the echo of my own voice?', elements: ['Ether'], symbol: 'D12' },
  { eggNumber: 1, name: 'Flare Egg', question: 'What substance hides within the heart of every flame?', elements: ['Fire'], symbol: 'D4' },
  { eggNumber: 2, name: 'Root Egg', question: 'Where does the ground remember what the sky forgets?', elements: ['Earth'], symbol: 'D6' },
  { eggNumber: 3, name: 'Whisper Egg', question: 'Why does the wind carry secrets but never answers?', elements: ['Air'], symbol: 'D8' },
  { eggNumber: 4, name: 'Twist Egg', question: 'How does order emerge from perfect disorder?', elements: ['Chaos'], symbol: 'D10' },
  { eggNumber: 5, name: 'Tide Egg', question: 'When does memory become prophecy?', elements: ['Water'], symbol: 'D20' },
  { eggNumber: 6, name: 'Order Egg', question: 'Which path serves the greatest good?', elements: ['Order'], symbol: 'D100' },
  { eggNumber: 7, name: 'Coin Egg', question: 'What value serves whose benefit?', elements: ['Coin'], symbol: 'D2' },

  // 57 Elemental Phenomena Questions (Eggs 8-64)
  { eggNumber: 8, name: 'Magma Flow', question: 'How does molten earth remember its igneous origins?', elements: ['Fire', 'Earth'] },
  { eggNumber: 9, name: 'Heatwaves', question: 'What happens when thermal energy dances with emptiness?', elements: ['Fire', 'Air'] },
  { eggNumber: 10, name: 'Steam Burst', question: 'Where does fire\'s passion meet water\'s fluidity?', elements: ['Fire', 'Water'] },
  { eggNumber: 11, name: 'Ethereal Blaze', question: 'How does spiritual fire transcend physical combustion?', elements: ['Fire', 'Ether'] },
  { eggNumber: 12, name: 'Wildfire', question: 'What chaos emerges when fire becomes consciousness?', elements: ['Fire', 'Chaos'] },

  { eggNumber: 13, name: 'Dust Storm', question: 'Where does solid matter dissolve into windy thought?', elements: ['Earth', 'Air'] },
  { eggNumber: 14, name: 'Mudslide', question: 'When does earth\'s stability yield to water\'s persuasion?', elements: ['Earth', 'Water'] },
  { eggNumber: 15, name: 'Crystal Formation', question: 'How does order crystallize from earthen chaos?', elements: ['Earth', 'Ether'] },
  { eggNumber: 16, name: 'Quicksand', question: 'What illusions does earth create to trap the unwary?', elements: ['Earth', 'Chaos'] },

  { eggNumber: 17, name: 'Rainstorm', question: 'When does air\'s emptiness birth aqueous abundance?', elements: ['Air', 'Water'] },
  { eggNumber: 18, name: 'Celestial Wind', question: 'How does ethereal wisdom ride the winds of change?', elements: ['Air', 'Ether'] },
  { eggNumber: 19, name: 'Tempest', question: 'What fury awakens when air embraces chaos?', elements: ['Air', 'Chaos'] },

  { eggNumber: 20, name: 'Mystic Spring', question: 'Where does water\'s memory spring from spiritual depths?', elements: ['Water', 'Ether'] },
  { eggNumber: 21, name: 'Whirlpool', question: 'How does earth\'s gravity warp chaotic waters?', elements: ['Water', 'Chaos'] },

  { eggNumber: 22, name: 'Dimensional Rift', question: 'What happens when spiritual fire meets chaotic ether?', elements: ['Ether', 'Chaos'] },

  // Complex Elemental Harmonies
  { eggNumber: 23, name: 'Ashen Whirl', question: 'How does fire\'s destruction birth airy resurrection?', elements: ['Fire', 'Earth', 'Air'] },
  { eggNumber: 24, name: 'Geothermal Geyser', question: 'Where does earth\'s molten core erupt through watery channels?', elements: ['Fire', 'Earth', 'Water'] },
  { eggNumber: 25, name: 'Magma Portal', question: 'What gateways does fire open to spiritual realms?', elements: ['Fire', 'Earth', 'Ether'] },
  { eggNumber: 26, name: 'Eruptive Anomaly', question: 'How does volcanic force manifest chaotic creation?', elements: ['Fire', 'Earth', 'Chaos'] },
  { eggNumber: 27, name: 'Misty Mirage', question: 'When does fiery air condense into watery illusions?', elements: ['Fire', 'Air', 'Water'] },
  { eggNumber: 28, name: 'Solar Flare', question: 'How does stellar fire illuminate ethereal wisdom?', elements: ['Fire', 'Air', 'Ether'] },
  { eggNumber: 29, name: 'Combustive Cyclone', question: 'What destruction emerges when fire and air embrace chaos?', elements: ['Fire', 'Air', 'Chaos'] },
  { eggNumber: 30, name: 'Boiling Veil', question: 'Where does fiery water veil spiritual mysteries?', elements: ['Fire', 'Water', 'Ether'] },
  { eggNumber: 31, name: 'Scalding Maelstrom', question: 'How does fire\'s heat warp earth\'s aqueous embrace?', elements: ['Fire', 'Water', 'Chaos'] },
  { eggNumber: 32, name: 'Flickering Void', question: 'What emptiness does spiritual fire reveal?', elements: ['Fire', 'Ether', 'Chaos'] },

  // Earth-Air Elemental Fusion
  { eggNumber: 33, name: 'Soaring Cascades', question: 'When does earthen air cascade into watery revelation?', elements: ['Earth', 'Air', 'Water'] },
  { eggNumber: 34, name: 'Zephyric Castle', question: 'How does wind sculpt earthen forms into spiritual citadels?', elements: ['Earth', 'Air', 'Ether'] },
  { eggNumber: 35, name: 'Earthcrack Tornadoes', question: 'What chaotic fissures does air tear in earth\'s surface?', elements: ['Earth', 'Air', 'Chaos'] },
  { eggNumber: 36, name: 'Moonlit Pond', question: 'Where does lunar earth reflect spiritual waters?', elements: ['Earth', 'Water', 'Ether'] },
  { eggNumber: 37, name: 'Egoic Swamp', question: 'How does earth\'s self-importance drown in chaotic waters?', elements: ['Earth', 'Water', 'Chaos'] },
  { eggNumber: 38, name: 'Nether Portal', question: 'What underworld gateways does earthen spirit open?', elements: ['Earth', 'Ether', 'Chaos'] },
  { eggNumber: 39, name: 'Iridescent Cloud', question: 'When does airy water rainbow with spiritual light?', elements: ['Air', 'Water', 'Ether'] },
  { eggNumber: 40, name: 'Deluge Twister', question: 'How does aqueous air birth chaotic whirlwinds?', elements: ['Air', 'Water', 'Chaos'] },
  { eggNumber: 41, name: 'Cosmic Storm', question: 'What celestial fury unites air, spirit, and chaos?', elements: ['Air', 'Ether', 'Chaos'] },
  { eggNumber: 42, name: 'Eldritch Depths', question: 'Where do spiritual waters plunge into chaotic depths?', elements: ['Water', 'Ether', 'Chaos'] },

  // Grand Elemental Convergence
  { eggNumber: 43, name: 'Elemental Nexus', question: 'How do fire, earth, air, and water converge in perfect balance?', elements: ['Fire', 'Earth', 'Air', 'Water'] },
  { eggNumber: 44, name: 'Galactic Fortress', question: 'What spiritual citadels emerge from elemental convergence?', elements: ['Fire', 'Earth', 'Air', 'Ether'] },
  { eggNumber: 45, name: 'Cataclysmic Canyons', question: 'How does elemental chaos reshape planetary landscapes?', elements: ['Fire', 'Earth', 'Air', 'Chaos'] },
  { eggNumber: 46, name: 'Starlit Springs', question: 'Where does stellar fire birth spiritual waters?', elements: ['Fire', 'Earth', 'Water', 'Ether'] },
  { eggNumber: 47, name: 'Mystic Self Bakeries', question: 'How does fire forge earth\'s chaotic waters into wisdom?', elements: ['Fire', 'Earth', 'Water', 'Chaos'] },
  { eggNumber: 48, name: 'Astral Eruption', question: 'What cosmic explosions unite fire, earth, and spiritual chaos?', elements: ['Fire', 'Earth', 'Ether', 'Chaos'] },
  { eggNumber: 49, name: 'Divine Rainbows', question: 'When does fiery air birth aqueous spiritual illumination?', elements: ['Fire', 'Air', 'Water', 'Ether'] },
  { eggNumber: 50, name: 'Steampunk Utopia', question: 'How does fire\'s air power earth\'s chaotic waters?', elements: ['Fire', 'Air', 'Water', 'Chaos'] },
  { eggNumber: 51, name: 'Rebel Starfleet', question: 'What cosmic rebellions ignite when fire, air, and spirit embrace chaos?', elements: ['Fire', 'Air', 'Ether', 'Chaos'] },
  { eggNumber: 52, name: 'Sacred Tsunami', question: 'Where does fiery water crash against spiritual chaos?', elements: ['Fire', 'Water', 'Ether', 'Chaos'] },

  // Ultimate Elemental Synthesis
  { eggNumber: 53, name: 'Dreamland Emporium', question: 'When does earthen air birth spiritual aqueous dreams?', elements: ['Earth', 'Air', 'Water', 'Ether'] },
  { eggNumber: 54, name: 'Festival of the Strange', question: 'How does earth\'s air celebrate chaotic aqueous mysteries?', elements: ['Earth', 'Air', 'Water', 'Chaos'] },
  { eggNumber: 55, name: 'Deeprock Nexus', question: 'What spiritual chaos emerges from earth\'s airy depths?', elements: ['Earth', 'Air', 'Ether', 'Chaos'] },
  { eggNumber: 56, name: 'Magicwell Supermall', question: 'Where does earthen water birth spiritual chaotic wonders?', elements: ['Earth', 'Water', 'Ether', 'Chaos'] },
  { eggNumber: 57, name: 'Interdimensional Radio Station', question: 'How does airy water broadcast spiritual chaotic frequencies?', elements: ['Air', 'Water', 'Ether', 'Chaos'] },

  // Cosmic Elemental Mastery
  { eggNumber: 58, name: 'Galactic Heartbeat', question: 'What rhythm pulses through the convergence of all elements?', elements: ['Fire', 'Earth', 'Air', 'Water', 'Ether'] },
  { eggNumber: 59, name: 'Angelic Wrath', question: 'How does elemental convergence manifest righteous fury?', elements: ['Fire', 'Earth', 'Air', 'Water', 'Chaos'] },
  { eggNumber: 60, name: 'Spellbinders Jubilee', question: 'What magical celebrations unite elements in spiritual chaos?', elements: ['Fire', 'Earth', 'Air', 'Ether', 'Chaos'] },
  { eggNumber: 61, name: 'Vault of Living Forms', question: 'Where does fiery earth birth spiritual aqueous chaos?', elements: ['Fire', 'Earth', 'Water', 'Ether', 'Chaos'] },
  { eggNumber: 62, name: 'Akashic Library', question: 'How does fiery air birth spiritual aqueous chaos?', elements: ['Fire', 'Air', 'Water', 'Ether', 'Chaos'] },
  { eggNumber: 63, name: 'Palace of Frozen Time', question: 'When does earthen air birth spiritual aqueous chaos?', elements: ['Earth', 'Air', 'Water', 'Ether', 'Chaos'] },
  { eggNumber: 64, name: 'Rainbow Bridge to Graffiti Village', question: 'What ultimate path connects all elemental chaos to creative liberation?', elements: ['Fire', 'Earth', 'Air', 'Water', 'Ether', 'Chaos'] }
];

export function getQuestionByEggNumber(eggNumber: number): GaruEggQuestion | undefined {
  return GARU_EGG_QUESTIONS.find(q => q.eggNumber === eggNumber);
}

export function getFoundationalQuestions(): GaruEggQuestion[] {
  return GARU_EGG_QUESTIONS.filter(q => q.eggNumber <= 7);
}

export function getQuestionsByElement(element: string): GaruEggQuestion[] {
  return GARU_EGG_QUESTIONS.filter(q => q.elements.includes(element));
}
