import { useState } from 'react';
import { PETALS, ELEMENTAL_ORDER } from '../lib/tek8-roads';

// ============== SYSTEM TYPES ==============

type GameSystem = 'dice-godz' | 'pathfinder-1e' | 'mnm-3e';

interface SystemInfo {
  name: string;
  fullName: string;
  description: string;
  sheetLink: string;
}

const SYSTEMS: Record<GameSystem, SystemInfo> = {
  'dice-godz': {
    name: 'Dice Godz',
    fullName: 'Dice Godz / CrySword Saga (TEK8)',
    description: '8 elemental stats with word-weaving mechanics',
    sheetLink: 'https://docs.google.com/spreadsheets/d/YOUR_DICEGODZ_SHEET',
  },
  'pathfinder-1e': {
    name: 'Pathfinder 1e',
    fullName: 'Pathfinder First Edition',
    description: 'Classic d20 fantasy with 6 ability scores',
    sheetLink: 'https://docs.google.com/spreadsheets/d/1uKXKrwlragJ5LzcEk7_S9ipdNfeN1V94a777I1AsC9Q/edit',
  },
  'mnm-3e': {
    name: 'M&M 3e',
    fullName: 'Mutants & Masterminds 3rd Edition',
    description: 'Superhero RPG with Power Levels and Power Points',
    sheetLink: 'https://docs.google.com/spreadsheets/d/1akyYute0dwFtBcNeA94io38t2NxLlj0QYPEPL66Fcic/edit',
  },
};

// ============== PATHFINDER 1E ==============

interface PathfinderCharacter {
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
  ac: number;
  speed: number;
  backstory: string;
  notes: string;
  // TEK8 alignment
  tek8Element: string;
}

const PF_RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc'];
const PF_CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'];
const PF_ALIGNMENTS = ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'];

// ============== M&M 3E ==============

interface MnMCharacter {
  name: string;
  heroIdentity: string;
  powerLevel: number;
  powerPoints: number;
  abilities: {
    str: number;
    sta: number;
    agl: number;
    dex: number;
    ftg: number;
    int: number;
    awe: number;
    pre: number;
  };
  defenses: {
    dodge: number;
    parry: number;
    fortitude: number;
    toughness: number;
    will: number;
  };
  complications: string[];
  powers: string;
  backstory: string;
  notes: string;
  // TEK8 alignment
  tek8Element: string;
}

const MNM_ARCHETYPES = [
  'Battlesuit', 'Construct', 'Crime Fighter', 'Energy Controller', 'Gadgeteer',
  'Martial Artist', 'Mimic', 'Mystic', 'Paragon', 'Powerhouse', 'Psychic',
  'Shapeshifter', 'Speedster', 'Warrior', 'Weapon Master'
];

// ============== DICE GODZ ==============

interface DiceGodzCharacter {
  name: string;
  crystalSchool: string;
  primaryElement: string;
  secondaryElement: string;
  stats: {
    ether: number;
    air: number;
    fire: number;
    water: number;
    earth: number;
    chaos: number;
    order: number;
    coin: number;
  };
  codexProgress: Record<string, number>;
  backstory: string;
  goals: string;
  notes: string;
}

const SCHOOL_MAP: Record<string, string> = {
  D12: 'Dream Weavers',
  D8: 'Sky Dancers',
  D4: 'Forge Masters',
  D20: 'Flow Keepers',
  D6: 'Ground Builders',
  D10: 'Wild Shapers',
  D100: 'Archive Seekers',
  D2: 'Luck Riders',
};

// ============== MAIN COMPONENT ==============

export default function MultiSystemCharacterSheet() {
  const [selectedSystem, setSelectedSystem] = useState<GameSystem | null>(null);

  if (!selectedSystem) {
    return <SystemSelector onSelect={setSelectedSystem} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{SYSTEMS[selectedSystem].fullName}</h2>
          <p className="text-sm text-gray-400">{SYSTEMS[selectedSystem].description}</p>
        </div>
        <button
          onClick={() => setSelectedSystem(null)}
          className="btn bg-gray-700 hover:bg-gray-600 text-sm"
        >
          ← Change System
        </button>
      </div>

      {selectedSystem === 'dice-godz' && <DiceGodzSheet />}
      {selectedSystem === 'pathfinder-1e' && <PathfinderSheet />}
      {selectedSystem === 'mnm-3e' && <MnMSheet />}

      {/* External Sheet Link */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 text-center">
        <p className="text-sm text-gray-400 mb-2">For the full automated character sheet, use:</p>
        <a
          href={SYSTEMS[selectedSystem].sheetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 underline"
        >
          Open Google Sheets Character Generator →
        </a>
      </div>
    </div>
  );
}

// ============== SYSTEM SELECTOR ==============

function SystemSelector({ onSelect }: { onSelect: (system: GameSystem) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your System</h2>
        <p className="text-gray-400">Select the game system for your character sheet</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Dice Godz */}
        <button
          onClick={() => onSelect('dice-godz')}
          className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/50 hover:border-purple-400 transition text-left"
        >
          <div className="text-3xl mb-3">🎲</div>
          <h3 className="font-bold text-lg text-purple-400">Dice Godz</h3>
          <p className="text-sm text-gray-400 mt-1">CrySword Saga / TEK8</p>
          <ul className="text-xs text-gray-500 mt-3 space-y-1">
            <li>• 8 elemental stats</li>
            <li>• Word-weaving mechanics</li>
            <li>• Codex progression</li>
            <li>• Crystal Sword schools</li>
          </ul>
        </button>

        {/* Pathfinder 1e */}
        <button
          onClick={() => onSelect('pathfinder-1e')}
          className="bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-xl p-6 border border-red-500/50 hover:border-red-400 transition text-left"
        >
          <div className="text-3xl mb-3">⚔️</div>
          <h3 className="font-bold text-lg text-red-400">Pathfinder 1e</h3>
          <p className="text-sm text-gray-400 mt-1">Classic Fantasy d20</p>
          <ul className="text-xs text-gray-500 mt-3 space-y-1">
            <li>• 6 ability scores</li>
            <li>• Races & Classes</li>
            <li>• Skills & Feats</li>
            <li>• d20 combat system</li>
          </ul>
        </button>

        {/* M&M 3e */}
        <button
          onClick={() => onSelect('mnm-3e')}
          className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-6 border border-blue-500/50 hover:border-blue-400 transition text-left"
        >
          <div className="text-3xl mb-3">💥</div>
          <h3 className="font-bold text-lg text-blue-400">M&M 3e</h3>
          <p className="text-sm text-gray-400 mt-1">Mutants & Masterminds</p>
          <ul className="text-xs text-gray-500 mt-3 space-y-1">
            <li>• 8 abilities</li>
            <li>• Power Levels & Points</li>
            <li>• Superhero powers</li>
            <li>• Complications</li>
          </ul>
        </button>
      </div>

      {/* TEK8 Integration Note */}
      <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30 text-center">
        <p className="text-sm text-gray-400">
          All systems integrate with TEK8's 40 Roads. Your character can be aligned to any elemental territory.
        </p>
      </div>
    </div>
  );
}

// ============== DICE GODZ SHEET ==============

function DiceGodzSheet() {
  const [char, setChar] = useState<DiceGodzCharacter>({
    name: '',
    crystalSchool: 'D12',
    primaryElement: 'D12',
    secondaryElement: 'D8',
    stats: { ether: 8, air: 8, fire: 8, water: 8, earth: 8, chaos: 8, order: 8, coin: 8 },
    codexProgress: Object.fromEntries(ELEMENTAL_ORDER.map(k => [k, 0])),
    backstory: '',
    goals: '',
    notes: '',
  });

  const updateStat = (stat: keyof typeof char.stats, value: number) => {
    setChar(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Math.max(1, Math.min(20, value)) },
    }));
  };

  const exportHTML = () => {
    const html = generateDiceGodzHTML(char);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char.name || 'character'}_dicegodz.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold mb-4">Character Info</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Character Name"
              value={char.name}
              onChange={e => setChar(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
            />
            <select
              value={char.crystalSchool}
              onChange={e => setChar(prev => ({ ...prev, crystalSchool: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
            >
              {ELEMENTAL_ORDER.map(key => (
                <option key={key} value={key}>{SCHOOL_MAP[key]} ({PETALS[key].element})</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={char.primaryElement}
                onChange={e => setChar(prev => ({ ...prev, primaryElement: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {ELEMENTAL_ORDER.map(key => (
                  <option key={key} value={key}>Primary: {PETALS[key].element}</option>
                ))}
              </select>
              <select
                value={char.secondaryElement}
                onChange={e => setChar(prev => ({ ...prev, secondaryElement: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {ELEMENTAL_ORDER.map(key => (
                  <option key={key} value={key}>Secondary: {PETALS[key].element}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold mb-4">8 Elemental Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(char.stats).map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                <span className="text-xs text-gray-400 capitalize flex-1">{stat}</span>
                <input
                  type="number"
                  value={value}
                  onChange={e => updateStat(stat as keyof typeof char.stats, parseInt(e.target.value) || 0)}
                  className="w-14 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-sm"
                  min="1"
                  max="20"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Word Count Reminder */}
      <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/30 text-center">
        <p className="text-sm">
          <strong className="text-purple-400">{SCHOOL_MAP[char.crystalSchool]}</strong> use{' '}
          <strong className="text-amber-400">{PETALS[char.crystalSchool].wordCount}-word</strong> declarations
        </p>
      </div>

      {/* Backstory */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Backstory & Notes</h3>
        <textarea
          placeholder="Write your character's backstory..."
          value={char.backstory}
          onChange={e => setChar(prev => ({ ...prev, backstory: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-32 resize-none"
        />
      </div>

      {/* Export */}
      <div className="flex gap-4 justify-center">
        <button onClick={exportHTML} className="btn bg-purple-600 hover:bg-purple-500">
          Open Printable HTML
        </button>
        <button onClick={exportJSON} className="btn bg-gray-700 hover:bg-gray-600">
          Export JSON
        </button>
      </div>
    </div>
  );
}

// ============== PATHFINDER SHEET ==============

function PathfinderSheet() {
  const [char, setChar] = useState<PathfinderCharacter>({
    name: '',
    race: 'Human',
    class: 'Fighter',
    level: 1,
    alignment: 'N',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hp: 10,
    ac: 10,
    speed: 30,
    backstory: '',
    notes: '',
    tek8Element: 'D6',
  });

  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (score: number) => {
    const mod = getMod(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const updateAbility = (ability: keyof typeof char.abilities, value: number) => {
    setChar(prev => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: Math.max(1, Math.min(30, value)) },
    }));
  };

  const exportHTML = () => {
    const html = generatePathfinderHTML(char);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char.name || 'character'}_pathfinder.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 md:col-span-2">
          <h3 className="font-bold mb-4">Character Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Character Name"
              value={char.name}
              onChange={e => setChar(prev => ({ ...prev, name: e.target.value }))}
              className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
            />
            <select
              value={char.race}
              onChange={e => setChar(prev => ({ ...prev, race: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              {PF_RACES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={char.class}
              onChange={e => setChar(prev => ({ ...prev, class: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              {PF_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Level:</span>
              <input
                type="number"
                value={char.level}
                onChange={e => setChar(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                min="1"
                max="20"
              />
            </div>
            <select
              value={char.alignment}
              onChange={e => setChar(prev => ({ ...prev, alignment: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              {PF_ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold mb-4">Combat</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">HP</span>
              <input
                type="number"
                value={char.hp}
                onChange={e => setChar(prev => ({ ...prev, hp: parseInt(e.target.value) || 0 }))}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">AC</span>
              <input
                type="number"
                value={char.ac}
                onChange={e => setChar(prev => ({ ...prev, ac: parseInt(e.target.value) || 0 }))}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Speed</span>
              <input
                type="number"
                value={char.speed}
                onChange={e => setChar(prev => ({ ...prev, speed: parseInt(e.target.value) || 0 }))}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Ability Scores</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(ability => (
            <div key={ability} className="text-center bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase mb-1">{ability}</p>
              <input
                type="number"
                value={char.abilities[ability]}
                onChange={e => updateAbility(ability, parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-lg font-bold mb-1"
              />
              <p className="text-sm text-purple-400">{formatMod(char.abilities[ability])}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 justify-center text-sm">
          <button
            onClick={() => {
              // Standard array: 15, 14, 13, 12, 10, 8
              setChar(prev => ({ ...prev, abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 } }));
            }}
            className="text-gray-400 hover:text-white"
          >
            Standard Array
          </button>
          <button
            onClick={() => {
              // Roll 4d6 drop lowest
              const roll = () => {
                const dice = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1);
                dice.sort((a,b) => b - a);
                return dice[0] + dice[1] + dice[2];
              };
              setChar(prev => ({
                ...prev,
                abilities: { str: roll(), dex: roll(), con: roll(), int: roll(), wis: roll(), cha: roll() }
              }));
            }}
            className="text-purple-400 hover:text-purple-300"
          >
            Roll 4d6 Drop Lowest
          </button>
        </div>
      </div>

      {/* TEK8 Alignment */}
      <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Quillverse Element Alignment:</span>
          <select
            value={char.tek8Element}
            onChange={e => setChar(prev => ({ ...prev, tek8Element: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            {ELEMENTAL_ORDER.map(key => (
              <option key={key} value={key}>{PETALS[key].element} ({key})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Backstory */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Backstory</h3>
        <textarea
          placeholder="Write your character's backstory..."
          value={char.backstory}
          onChange={e => setChar(prev => ({ ...prev, backstory: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-32 resize-none"
        />
      </div>

      {/* Export */}
      <div className="flex gap-4 justify-center">
        <button onClick={exportHTML} className="btn bg-red-600 hover:bg-red-500">
          Open Printable HTML
        </button>
        <button onClick={exportJSON} className="btn bg-gray-700 hover:bg-gray-600">
          Export JSON
        </button>
      </div>
    </div>
  );
}

// ============== M&M 3E SHEET ==============

function MnMSheet() {
  const [char, setChar] = useState<MnMCharacter>({
    name: '',
    heroIdentity: '',
    powerLevel: 10,
    powerPoints: 150,
    abilities: { str: 0, sta: 0, agl: 0, dex: 0, ftg: 0, int: 0, awe: 0, pre: 0 },
    defenses: { dodge: 0, parry: 0, fortitude: 0, toughness: 0, will: 0 },
    complications: [],
    powers: '',
    backstory: '',
    notes: '',
    tek8Element: 'D10',
  });

  const [newComplication, setNewComplication] = useState('');

  const updateAbility = (ability: keyof typeof char.abilities, value: number) => {
    setChar(prev => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: Math.max(-5, Math.min(20, value)) },
    }));
  };

  const updateDefense = (defense: keyof typeof char.defenses, value: number) => {
    setChar(prev => ({
      ...prev,
      defenses: { ...prev.defenses, [defense]: Math.max(0, Math.min(20, value)) },
    }));
  };

  const addComplication = () => {
    if (newComplication.trim()) {
      setChar(prev => ({ ...prev, complications: [...prev.complications, newComplication.trim()] }));
      setNewComplication('');
    }
  };

  const removeComplication = (index: number) => {
    setChar(prev => ({ ...prev, complications: prev.complications.filter((_, i) => i !== index) }));
  };

  const exportHTML = () => {
    const html = generateMnMHTML(char);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char.name || 'character'}_mnm.json`;
    a.click();
  };

  const ppSpent = Object.values(char.abilities).reduce((sum, v) => sum + (v * 2), 0);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold mb-4">Hero Identity</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Hero Name"
              value={char.name}
              onChange={e => setChar(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
            />
            <input
              type="text"
              placeholder="Secret Identity (optional)"
              value={char.heroIdentity}
              onChange={e => setChar(prev => ({ ...prev, heroIdentity: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold mb-4">Power Level</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Power Level</p>
              <input
                type="number"
                value={char.powerLevel}
                onChange={e => setChar(prev => ({ ...prev, powerLevel: parseInt(e.target.value) || 1 }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-2xl font-bold"
                min="1"
                max="20"
              />
            </div>
            <div className="text-center bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Power Points</p>
              <input
                type="number"
                value={char.powerPoints}
                onChange={e => setChar(prev => ({ ...prev, powerPoints: parseInt(e.target.value) || 0 }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-1">Spent on abilities: {ppSpent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Abilities */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Abilities (2 PP per rank)</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {Object.entries(char.abilities).map(([ability, value]) => {
            const labels: Record<string, string> = {
              str: 'Strength', sta: 'Stamina', agl: 'Agility', dex: 'Dexterity',
              ftg: 'Fighting', int: 'Intellect', awe: 'Awareness', pre: 'Presence',
            };
            return (
              <div key={ability} className="text-center bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase mb-1">{ability}</p>
                <input
                  type="number"
                  value={value}
                  onChange={e => updateAbility(ability as keyof typeof char.abilities, parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-center text-lg font-bold"
                />
                <p className="text-[10px] text-gray-500 mt-1 truncate">{labels[ability]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Defenses */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Defenses</h3>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(char.defenses).map(([defense, value]) => (
            <div key={defense} className="text-center bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 capitalize mb-1">{defense}</p>
              <input
                type="number"
                value={value}
                onChange={e => updateDefense(defense as keyof typeof char.defenses, parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-lg font-bold"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Complications */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Complications</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Add complication (e.g., 'Motivation: Justice')"
            value={newComplication}
            onChange={e => setNewComplication(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
            onKeyDown={e => e.key === 'Enter' && addComplication()}
          />
          <button onClick={addComplication} className="btn bg-blue-600 hover:bg-blue-500">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {char.complications.map((c, i) => (
            <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {c}
              <button onClick={() => removeComplication(i)} className="text-gray-500 hover:text-red-400">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Powers */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Powers</h3>
        <textarea
          placeholder="Describe your powers and their effects..."
          value={char.powers}
          onChange={e => setChar(prev => ({ ...prev, powers: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-32 resize-none"
        />
      </div>

      {/* TEK8 Alignment */}
      <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Quillverse Element Alignment:</span>
          <select
            value={char.tek8Element}
            onChange={e => setChar(prev => ({ ...prev, tek8Element: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            {ELEMENTAL_ORDER.map(key => (
              <option key={key} value={key}>{PETALS[key].element} ({key})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Backstory */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold mb-4">Origin Story</h3>
        <textarea
          placeholder="Write your hero's origin story..."
          value={char.backstory}
          onChange={e => setChar(prev => ({ ...prev, backstory: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-32 resize-none"
        />
      </div>

      {/* Export */}
      <div className="flex gap-4 justify-center">
        <button onClick={exportHTML} className="btn bg-blue-600 hover:bg-blue-500">
          Open Printable HTML
        </button>
        <button onClick={exportJSON} className="btn bg-gray-700 hover:bg-gray-600">
          Export JSON
        </button>
      </div>
    </div>
  );
}

// ============== HTML GENERATORS ==============

function generateDiceGodzHTML(char: DiceGodzCharacter): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${char.name || 'Character'} - Dice Godz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
    @media print { body { background: white; padding: 0; } .no-print { display: none; } }
    .sheet { background: white; border: 2px solid #7c3aed; padding: 24px; border-radius: 8px; }
    .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 16px; }
    .header h1 { font-size: 28px; color: #7c3aed; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
    .stat-box { border: 1px solid #ccc; padding: 8px; text-align: center; border-radius: 4px; }
    .stat-box .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .stat-box .value { font-size: 20px; font-weight: bold; }
    .word-box { background: #f3e8ff; padding: 12px; border-radius: 4px; text-align: center; margin: 16px 0; }
    .section { margin: 16px 0; }
    .section h3 { font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
    .notes { min-height: 60px; border: 1px solid #ddd; padding: 8px; font-size: 12px; white-space: pre-wrap; }
    .print-btn { display: block; margin: 20px auto; padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print Sheet</button>
  <div class="sheet">
    <div class="header">
      <h1>${char.name || 'Unnamed'}</h1>
      <p>${SCHOOL_MAP[char.crystalSchool]} • ${PETALS[char.primaryElement].element} / ${PETALS[char.secondaryElement].element}</p>
    </div>
    <div class="stats-grid">
      ${Object.entries(char.stats).map(([stat, value]) => `
        <div class="stat-box">
          <div class="label">${stat}</div>
          <div class="value">${value}</div>
        </div>
      `).join('')}
    </div>
    <div class="word-box">
      <strong>Word Resonance:</strong> ${PETALS[char.crystalSchool].wordCount} words per action
    </div>
    <div class="section">
      <h3>Backstory</h3>
      <div class="notes">${char.backstory || '(Write backstory here)'}</div>
    </div>
  </div>
</body>
</html>`;
}

function generatePathfinderHTML(char: PathfinderCharacter): string {
  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${char.name || 'Character'} - Pathfinder 1e</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
    @media print { body { background: white; padding: 0; } .no-print { display: none; } }
    .sheet { background: white; border: 2px solid #dc2626; padding: 24px; border-radius: 8px; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 16px; }
    .header h1 { font-size: 28px; color: #dc2626; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
    .info-box { border: 1px solid #ccc; padding: 8px; text-align: center; border-radius: 4px; }
    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 16px 0; }
    .stat-box { border: 2px solid #dc2626; padding: 12px; text-align: center; border-radius: 4px; }
    .stat-box .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .stat-box .value { font-size: 24px; font-weight: bold; }
    .stat-box .mod { font-size: 14px; color: #dc2626; }
    .section { margin: 16px 0; }
    .section h3 { font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
    .notes { min-height: 60px; border: 1px solid #ddd; padding: 8px; font-size: 12px; white-space: pre-wrap; }
    .print-btn { display: block; margin: 20px auto; padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print Sheet</button>
  <div class="sheet">
    <div class="header">
      <h1>${char.name || 'Unnamed'}</h1>
      <p>${char.race} ${char.class} ${char.level} • ${char.alignment}</p>
    </div>
    <div class="info-grid">
      <div class="info-box"><strong>HP</strong><br>${char.hp}</div>
      <div class="info-box"><strong>AC</strong><br>${char.ac}</div>
      <div class="info-box"><strong>Speed</strong><br>${char.speed} ft</div>
      <div class="info-box"><strong>Level</strong><br>${char.level}</div>
    </div>
    <div class="stats-grid">
      ${(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => `
        <div class="stat-box">
          <div class="label">${stat}</div>
          <div class="value">${char.abilities[stat]}</div>
          <div class="mod">${getMod(char.abilities[stat])}</div>
        </div>
      `).join('')}
    </div>
    <div class="section">
      <h3>Quillverse Element</h3>
      <p>${PETALS[char.tek8Element].element} (${char.tek8Element})</p>
    </div>
    <div class="section">
      <h3>Backstory</h3>
      <div class="notes">${char.backstory || '(Write backstory here)'}</div>
    </div>
  </div>
</body>
</html>`;
}

function generateMnMHTML(char: MnMCharacter): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${char.name || 'Character'} - M&M 3e</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
    @media print { body { background: white; padding: 0; } .no-print { display: none; } }
    .sheet { background: white; border: 2px solid #2563eb; padding: 24px; border-radius: 8px; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 16px; }
    .header h1 { font-size: 28px; color: #2563eb; }
    .pl-box { display: flex; justify-content: center; gap: 32px; margin: 16px 0; }
    .pl-item { text-align: center; }
    .pl-item .value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
    .stat-box { border: 1px solid #ccc; padding: 8px; text-align: center; border-radius: 4px; }
    .stat-box .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .stat-box .value { font-size: 20px; font-weight: bold; }
    .defenses { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 16px 0; }
    .section { margin: 16px 0; }
    .section h3 { font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
    .complications { display: flex; flex-wrap: wrap; gap: 8px; }
    .complication { background: #dbeafe; padding: 4px 12px; border-radius: 16px; font-size: 12px; }
    .notes { min-height: 60px; border: 1px solid #ddd; padding: 8px; font-size: 12px; white-space: pre-wrap; }
    .print-btn { display: block; margin: 20px auto; padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print Sheet</button>
  <div class="sheet">
    <div class="header">
      <h1>${char.name || 'Unnamed Hero'}</h1>
      ${char.heroIdentity ? `<p>aka ${char.heroIdentity}</p>` : ''}
    </div>
    <div class="pl-box">
      <div class="pl-item">
        <div class="value">PL ${char.powerLevel}</div>
        <div>Power Level</div>
      </div>
      <div class="pl-item">
        <div class="value">${char.powerPoints}</div>
        <div>Power Points</div>
      </div>
    </div>
    <div class="section">
      <h3>Abilities</h3>
      <div class="stats-grid">
        ${Object.entries(char.abilities).map(([stat, value]) => `
          <div class="stat-box">
            <div class="label">${stat}</div>
            <div class="value">${value >= 0 ? '+' : ''}${value}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="section">
      <h3>Defenses</h3>
      <div class="defenses">
        ${Object.entries(char.defenses).map(([def, value]) => `
          <div class="stat-box">
            <div class="label">${def}</div>
            <div class="value">${value}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ${char.complications.length > 0 ? `
    <div class="section">
      <h3>Complications</h3>
      <div class="complications">
        ${char.complications.map(c => `<span class="complication">${c}</span>`).join('')}
      </div>
    </div>
    ` : ''}
    ${char.powers ? `
    <div class="section">
      <h3>Powers</h3>
      <div class="notes">${char.powers}</div>
    </div>
    ` : ''}
    <div class="section">
      <h3>Quillverse Element</h3>
      <p>${PETALS[char.tek8Element].element} (${char.tek8Element})</p>
    </div>
    <div class="section">
      <h3>Origin Story</h3>
      <div class="notes">${char.backstory || '(Write origin story here)'}</div>
    </div>
  </div>
</body>
</html>`;
}
