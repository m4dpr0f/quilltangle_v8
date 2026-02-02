// TEK8 Guild definitions with Garu Egg questions

export interface TEK8Guild {
  id: string;
  dice: string;
  element: string;
  name: string;
  description: string;
  color: string;
  garuEggQuestion: string;
  garuEssence: string;
  hatchingMethod: string;
}

export const TEK8_GUILDS: TEK8Guild[] = [
  {
    id: 'D12',
    dice: 'D12',
    element: 'Ether',
    name: 'Sonic Assemblers',
    description: 'Masters of resonance and spiritual vibration. They weave reality through sound and echo.',
    color: '#9333ea', // purple
    garuEggQuestion: 'Who am I, beyond the echo of my own voice?',
    garuEssence: 'Reflective & radiant',
    hatchingMethod: 'Musical self-reflection'
  },
  {
    id: 'D8',
    dice: 'D8',
    element: 'Air',
    name: 'Translators & Teachers',
    description: 'Carriers of secrets and knowledge. They move through dreams and whispers.',
    color: '#06b6d4', // cyan
    garuEggQuestion: 'Why does the wind carry secrets but never answers?',
    garuEssence: 'Curious & light',
    hatchingMethod: 'Dream incubation'
  },
  {
    id: 'D4',
    dice: 'D4',
    element: 'Fire',
    name: 'Smiths & Tinkerers',
    description: 'Transformers and forgers. They kindle passion and reshape matter through flame.',
    color: '#ef4444', // red
    garuEggQuestion: 'What substance hides within the heart of every flame?',
    garuEssence: 'Swift & impulsive',
    hatchingMethod: 'Trial by transformation'
  },
  {
    id: 'D20',
    dice: 'D20',
    element: 'Water',
    name: 'Storykeepers & Healers',
    description: 'Guardians of memory and prophecy. They flow through time and emotion.',
    color: '#3b82f6', // blue
    garuEggQuestion: 'When does memory become prophecy?',
    garuEssence: 'Rhythmic & empathic',
    hatchingMethod: 'Chronological storytelling'
  },
  {
    id: 'D6',
    dice: 'D6',
    element: 'Earth',
    name: 'Grounders & Growers',
    description: 'Anchors of stability and growth. They remember what others forget.',
    color: '#22c55e', // green
    garuEggQuestion: 'Where does the ground remember what the sky forgets?',
    garuEssence: 'Loyal & grounded',
    hatchingMethod: 'Cartographic meditation'
  },
  {
    id: 'D10',
    dice: 'D10',
    element: 'Chaos',
    name: 'Tricksters & Remixers',
    description: 'Agents of change and adaptation. They find order in perfect disorder.',
    color: '#f97316', // orange
    garuEggQuestion: 'How does order emerge from perfect disorder?',
    garuEssence: 'Wild & adaptive',
    hatchingMethod: 'Riddling through contradiction'
  },
  {
    id: 'D100',
    dice: 'D100',
    element: 'Order',
    name: 'Archivists & Codemakers',
    description: 'Keepers of structure and ethics. They navigate the paths of greatest good.',
    color: '#6366f1', // indigo
    garuEggQuestion: 'Which path serves the greatest good?',
    garuEssence: 'Wise & structured',
    hatchingMethod: 'Systematic evaluation'
  },
  {
    id: 'D2',
    dice: 'D2',
    element: 'Coin',
    name: 'Weavers & Distributors',
    description: 'Balancers of value and equity. They discern whose benefit matters most.',
    color: '#eab308', // yellow
    garuEggQuestion: 'What value serves whose benefit?',
    garuEssence: 'Generous & discerning',
    hatchingMethod: 'Value assessment'
  }
];

export function getGuildById(id: string): TEK8Guild | undefined {
  return TEK8_GUILDS.find(g => g.id === id);
}

export function getGuildByElement(element: string): TEK8Guild | undefined {
  return TEK8_GUILDS.find(g => g.element.toLowerCase() === element.toLowerCase());
}
