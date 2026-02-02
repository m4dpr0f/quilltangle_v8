// Sacred Instruments for Rainbow Roads GCN Application
// Starting with 25 defined instruments + Voice
// Community can propose new instruments to expand the list

export interface SacredInstrument {
  id: string;
  name: string;
  element: string;
  petal: string;
  culturalOrigin?: string;
  description?: string;
  isVoice?: boolean;
}

export const SACRED_INSTRUMENTS: SacredInstrument[] = [
  // Voice option (always available)
  {
    id: 'voice',
    name: 'Voice',
    element: 'All',
    petal: 'Universal',
    culturalOrigin: 'Global',
    description: 'The original instrument - your voice carries all elements',
    isVoice: true
  },

  // D12 Ether - Sonic Assemblers
  {
    id: 'didgeridoo',
    name: 'Didgeridoo',
    element: 'Ether',
    petal: 'D12',
    culturalOrigin: 'Aboriginal Australian',
    description: 'Ancient wind instrument creating continuous drone resonance'
  },
  {
    id: 'harp',
    name: 'Harp',
    element: 'Ether',
    petal: 'D12',
    culturalOrigin: 'Celtic/Global',
    description: 'Stringed instrument of celestial harmonics'
  },
  {
    id: 'contrabass',
    name: 'Contrabass',
    element: 'Ether',
    petal: 'D12',
    culturalOrigin: 'European Classical',
    description: 'Deep resonant strings that ground ethereal vibrations'
  },

  // D8 Air - Translators & Teachers
  {
    id: 'flute',
    name: 'Flute',
    element: 'Air',
    petal: 'D8',
    culturalOrigin: 'Global',
    description: 'Breath becomes melody through this wind instrument'
  },
  {
    id: 'clarinet',
    name: 'Clarinet',
    element: 'Air',
    petal: 'D8',
    culturalOrigin: 'European',
    description: 'Single-reed woodwind of expressive range'
  },
  {
    id: 'french-horn',
    name: 'French Horn',
    element: 'Air',
    petal: 'D8',
    culturalOrigin: 'European',
    description: 'Brass instrument of noble, soaring tones'
  },
  {
    id: 'bansuri',
    name: 'Bansuri',
    element: 'Air',
    petal: 'D8',
    culturalOrigin: 'Indian',
    description: 'Bamboo flute sacred to Krishna and meditative traditions'
  },

  // D4 Fire - Smiths & Tinkerers
  {
    id: 'trumpet',
    name: 'Trumpet',
    element: 'Fire',
    petal: 'D4',
    culturalOrigin: 'Global',
    description: 'Brass herald of proclamation and transformation'
  },
  {
    id: 'trombone',
    name: 'Trombone',
    element: 'Fire',
    petal: 'D4',
    culturalOrigin: 'European/Jazz',
    description: 'Slide brass of powerful, mutable expression'
  },
  {
    id: 'mridangam',
    name: 'Mridangam',
    element: 'Fire',
    petal: 'D4',
    culturalOrigin: 'South Indian',
    description: 'Double-headed drum of Carnatic rhythm'
  },

  // D20 Water - Storykeepers & Healers
  {
    id: 'saxophone',
    name: 'Saxophone',
    element: 'Water',
    petal: 'D20',
    culturalOrigin: 'Belgian/Jazz',
    description: 'Single-reed brass of emotive fluidity'
  },
  {
    id: 'harmonium',
    name: 'Harmonium',
    element: 'Water',
    petal: 'D20',
    culturalOrigin: 'Indian/Devotional',
    description: 'Bellows organ of continuous devotional flow'
  },
  {
    id: 'erhu',
    name: 'Erhu',
    element: 'Water',
    petal: 'D20',
    culturalOrigin: 'Chinese',
    description: 'Two-stringed fiddle of expressive sorrow and joy'
  },

  // D6 Earth - Grounders & Growers
  {
    id: 'bass',
    name: 'Bass (Electric)',
    element: 'Earth',
    petal: 'D6',
    culturalOrigin: 'American',
    description: 'Foundation of groove and rhythmic stability'
  },
  {
    id: 'xylophone',
    name: 'Xylophone',
    element: 'Earth',
    petal: 'D6',
    culturalOrigin: 'African/Global',
    description: 'Wooden bars of crystalline earth tones'
  },
  {
    id: 'organ',
    name: 'Organ',
    element: 'Earth',
    petal: 'D6',
    culturalOrigin: 'European/Sacred',
    description: 'Pipe instrument of cathedral grandeur'
  },
  {
    id: 'udu-drum',
    name: 'Udu Drum',
    element: 'Earth',
    petal: 'D6',
    culturalOrigin: 'Nigerian Igbo',
    description: 'Clay pot drum with resonant bass frequencies'
  },

  // D10 Chaos - Tricksters & Remixers
  {
    id: 'guitar-electric',
    name: 'Guitar (Electric)',
    element: 'Chaos',
    petal: 'D10',
    culturalOrigin: 'American',
    description: 'Amplified strings of rebellious transformation'
  },
  {
    id: 'tuba',
    name: 'Tuba',
    element: 'Chaos',
    petal: 'D10',
    culturalOrigin: 'European/Brass Band',
    description: 'Lowest brass of rumbling chaos'
  },
  {
    id: 'turntables',
    name: 'Turntables',
    element: 'Chaos',
    petal: 'D10',
    culturalOrigin: 'Hip-Hop/DJ Culture',
    description: 'Vinyl manipulation as sonic remixing'
  },

  // D100 Order - Archivists & Codemakers
  {
    id: 'kalimba',
    name: 'Kalimba / Mbira',
    element: 'Order',
    petal: 'D100',
    culturalOrigin: 'Congolese / African',
    description: 'Thumb piano with metal tines producing clear, music-box-like meditative tones'
  },
  {
    id: 'piano',
    name: 'Piano',
    element: 'Order',
    petal: 'D100',
    culturalOrigin: 'European',
    description: 'Keyboard of precise harmonic architecture'
  },
  {
    id: 'guitar-nylon',
    name: 'Guitar (Nylon/Classical)',
    element: 'Order',
    petal: 'D100',
    culturalOrigin: 'Spanish/Classical',
    description: 'Fingerstyle guitar of structured beauty'
  },
  {
    id: 'guzheng',
    name: 'Guzheng',
    element: 'Order',
    petal: 'D100',
    culturalOrigin: 'Chinese',
    description: 'Plucked zither of ancient ordered harmony'
  },

  // D2 Coin - Weavers & Distributors
  {
    id: 'violin',
    name: 'Violin',
    element: 'Coin',
    petal: 'D2',
    culturalOrigin: 'European/Global',
    description: 'Bowed strings of precious, weaving melodies'
  },
  {
    id: 'cello',
    name: 'Cello',
    element: 'Coin',
    petal: 'D2',
    culturalOrigin: 'European',
    description: 'Mid-range strings balancing light and depth'
  },
  {
    id: 'bassoon',
    name: 'Bassoon',
    element: 'Coin',
    petal: 'D2',
    culturalOrigin: 'European',
    description: 'Double-reed woodwind of dignified value'
  },
  {
    id: 'sax-a-boom',
    name: 'Sax-A-Boom',
    element: 'Coin',
    petal: 'D2',
    culturalOrigin: 'Toy/Pop Culture',
    description: 'Playful electronic novelty spreading joy'
  }
];

export function getInstrumentsByElement(element: string): SacredInstrument[] {
  if (element === 'All') return SACRED_INSTRUMENTS;
  return SACRED_INSTRUMENTS.filter(i => i.element === element || i.element === 'All');
}

export function getInstrumentById(id: string): SacredInstrument | undefined {
  return SACRED_INSTRUMENTS.find(i => i.id === id);
}

export function getInstrumentsByPetal(petal: string): SacredInstrument[] {
  return SACRED_INSTRUMENTS.filter(i => i.petal === petal || i.petal === 'Universal');
}
