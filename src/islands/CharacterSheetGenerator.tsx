import { useState } from 'react';
import { PETALS, ELEMENTAL_ORDER, type Petal } from '../lib/tek8-roads';

interface CharacterStats {
  // 8 elemental stats (from each petal)
  ether: number;   // D12 - Creativity
  air: number;     // D8 - Strength
  fire: number;    // D4 - Agility
  water: number;   // D20 - Empathy
  earth: number;   // D6 - Endurance
  chaos: number;   // D10 - Willpower
  order: number;   // D100 - Focus
  coin: number;    // D2 - Instinct
}

interface CharacterSheet {
  name: string;
  crystalSchool: string;
  primaryElement: string;
  secondaryElement: string;
  stats: CharacterStats;
  codexProgress: Record<string, number>; // words written per school
  backstory: string;
  goals: string;
  notes: string;
}

const DEFAULT_STATS: CharacterStats = {
  ether: 8,
  air: 8,
  fire: 8,
  water: 8,
  earth: 8,
  chaos: 8,
  order: 8,
  coin: 8,
};

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

const CODEX_RANKS = [
  { name: 'Novice', words: 0 },
  { name: 'Initiate', words: 500 },
  { name: 'Adept', words: 1500 },
  { name: 'Insider', words: 3000 },
  { name: 'Master', words: 5000 },
];

export default function CharacterSheetGenerator() {
  const [sheet, setSheet] = useState<CharacterSheet>({
    name: '',
    crystalSchool: 'D12',
    primaryElement: 'D12',
    secondaryElement: 'D8',
    stats: { ...DEFAULT_STATS },
    codexProgress: Object.fromEntries(ELEMENTAL_ORDER.map(k => [k, 0])),
    backstory: '',
    goals: '',
    notes: '',
  });

  const [previewMode, setPreviewMode] = useState(false);

  const updateStat = (stat: keyof CharacterStats, value: number) => {
    setSheet(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Math.max(1, Math.min(20, value)) },
    }));
  };

  const updateField = (field: keyof CharacterSheet, value: string | number) => {
    setSheet(prev => ({ ...prev, [field]: value }));
  };

  const updateCodex = (school: string, words: number) => {
    setSheet(prev => ({
      ...prev,
      codexProgress: { ...prev.codexProgress, [school]: words },
    }));
  };

  const getCodexRank = (words: number): string => {
    for (let i = CODEX_RANKS.length - 1; i >= 0; i--) {
      if (words >= CODEX_RANKS[i].words) return CODEX_RANKS[i].name;
    }
    return 'Novice';
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.name || 'character'}_sheet.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPrintableHTML = () => {
    const html = generatePrintableHTML(sheet);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Character Sheet Preview</h2>
          <button
            onClick={() => setPreviewMode(false)}
            className="btn bg-gray-700 hover:bg-gray-600"
          >
            ← Back to Edit
          </button>
        </div>
        <SheetPreview sheet={sheet} />
        <div className="flex gap-4">
          <button onClick={openPrintableHTML} className="btn bg-purple-600 hover:bg-purple-500">
            Open Printable HTML
          </button>
          <button onClick={downloadJSON} className="btn bg-gray-700 hover:bg-gray-600">
            Download JSON
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg mb-4">Character Info</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Character Name</label>
              <input
                type="text"
                value={sheet.name}
                onChange={e => updateField('name', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                placeholder="Enter character name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Crystal Sword School</label>
              <select
                value={sheet.crystalSchool}
                onChange={e => updateField('crystalSchool', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
              >
                {ELEMENTAL_ORDER.map(key => (
                  <option key={key} value={key}>
                    {SCHOOL_MAP[key]} ({PETALS[key].element})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Primary Element</label>
                <select
                  value={sheet.primaryElement}
                  onChange={e => updateField('primaryElement', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                >
                  {ELEMENTAL_ORDER.map(key => (
                    <option key={key} value={key}>{PETALS[key].element}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Secondary Element</label>
                <select
                  value={sheet.secondaryElement}
                  onChange={e => updateField('secondaryElement', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                >
                  {ELEMENTAL_ORDER.map(key => (
                    <option key={key} value={key}>{PETALS[key].element}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg mb-4">8 Elemental Stats</h3>
          <p className="text-xs text-gray-500 mb-4">Each stat ranges from 1-20. Default is 8.</p>

          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(sheet.stats) as (keyof CharacterStats)[]).map(stat => {
              const petalKey = stat === 'ether' ? 'D12' :
                              stat === 'air' ? 'D8' :
                              stat === 'fire' ? 'D4' :
                              stat === 'water' ? 'D20' :
                              stat === 'earth' ? 'D6' :
                              stat === 'chaos' ? 'D10' :
                              stat === 'order' ? 'D100' : 'D2';
              const petal = PETALS[petalKey];

              return (
                <div key={stat} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 capitalize">{stat}</p>
                    <p className="text-xs text-gray-500">{petal.ability}</p>
                  </div>
                  <input
                    type="number"
                    value={sheet.stats[stat]}
                    onChange={e => updateStat(stat, parseInt(e.target.value) || 0)}
                    className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center"
                    min="1"
                    max="20"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSheet(prev => ({ ...prev, stats: { ...DEFAULT_STATS } }))}
              className="text-xs text-gray-400 hover:text-white"
            >
              Reset to Default
            </button>
            <button
              onClick={() => {
                const random: CharacterStats = {
                  ether: Math.floor(Math.random() * 12) + 6,
                  air: Math.floor(Math.random() * 12) + 6,
                  fire: Math.floor(Math.random() * 12) + 6,
                  water: Math.floor(Math.random() * 12) + 6,
                  earth: Math.floor(Math.random() * 12) + 6,
                  chaos: Math.floor(Math.random() * 12) + 6,
                  order: Math.floor(Math.random() * 12) + 6,
                  coin: Math.floor(Math.random() * 12) + 6,
                };
                setSheet(prev => ({ ...prev, stats: random }));
              }}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Roll Random
            </button>
          </div>
        </div>
      </div>

      {/* Codex Progress */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold text-lg mb-4">Codex Progress</h3>
        <p className="text-xs text-gray-500 mb-4">
          Track words written for each Crystal School. 500 words = Initiate access,
          1500 = Adept, 3000 = Insider, 5000 = Master.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ELEMENTAL_ORDER.map(key => (
            <div key={key} className="bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{PETALS[key].element}</span>
                <span className="text-xs text-purple-400">
                  {getCodexRank(sheet.codexProgress[key] || 0)}
                </span>
              </div>
              <input
                type="number"
                value={sheet.codexProgress[key] || 0}
                onChange={e => updateCodex(key, parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                min="0"
                placeholder="Words"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Backstory & Notes */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg mb-4">Backstory</h3>
          <textarea
            value={sheet.backstory}
            onChange={e => updateField('backstory', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-40 resize-none"
            placeholder="Write your character's backstory..."
          />
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-4">Goals</h3>
            <textarea
              value={sheet.goals}
              onChange={e => updateField('goals', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-20 resize-none"
              placeholder="Character goals and motivations..."
            />
          </div>

          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-4">Notes</h3>
            <textarea
              value={sheet.notes}
              onChange={e => updateField('notes', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 h-20 resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => setPreviewMode(true)}
          className="btn bg-purple-600 hover:bg-purple-500"
        >
          Preview Sheet
        </button>
        <button onClick={openPrintableHTML} className="btn bg-amber-600 hover:bg-amber-500">
          Open Printable HTML
        </button>
        <button onClick={downloadJSON} className="btn bg-gray-700 hover:bg-gray-600">
          Export JSON
        </button>
      </div>
    </div>
  );
}

/**
 * Preview component for the character sheet
 */
function SheetPreview({ sheet }: { sheet: CharacterSheet }) {
  const primary = PETALS[sheet.primaryElement];
  const school = SCHOOL_MAP[sheet.crystalSchool];

  return (
    <div className="bg-gray-900 rounded-xl p-8 border border-gray-700 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h2 className="text-3xl font-bold text-center">{sheet.name || 'Unnamed Character'}</h2>
        <div className="flex justify-center gap-4 mt-2 text-sm text-gray-400">
          <span>{school}</span>
          <span>•</span>
          <span>{primary.element} / {PETALS[sheet.secondaryElement].element}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(Object.entries(sheet.stats) as [keyof CharacterStats, number][]).map(([stat, value]) => (
          <div key={stat} className="text-center p-2 bg-gray-800 rounded">
            <p className="text-xs text-gray-400 uppercase">{stat}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Word Count Mechanics */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="font-bold text-sm mb-2">Word Resonance</h4>
        <p className="text-xs text-gray-400">
          As a {school} ({PETALS[sheet.crystalSchool].element}),
          your actions require {PETALS[sheet.crystalSchool].wordCount}-word declarations.
        </p>
      </div>

      {/* Codex */}
      <div className="mb-6">
        <h4 className="font-bold text-sm mb-2">Codex Progress</h4>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {ELEMENTAL_ORDER.map(key => {
            const words = sheet.codexProgress[key] || 0;
            const rank = words >= 5000 ? 'Master' :
                        words >= 3000 ? 'Insider' :
                        words >= 1500 ? 'Adept' :
                        words >= 500 ? 'Initiate' : 'Novice';
            return (
              <div key={key} className="bg-gray-800 rounded p-2 text-center">
                <p className="text-gray-400">{PETALS[key].element}</p>
                <p className="font-medium">{rank}</p>
                <p className="text-gray-500">{words}w</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backstory */}
      {sheet.backstory && (
        <div className="mb-4">
          <h4 className="font-bold text-sm mb-1">Backstory</h4>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{sheet.backstory}</p>
        </div>
      )}

      {/* Goals */}
      {sheet.goals && (
        <div className="mb-4">
          <h4 className="font-bold text-sm mb-1">Goals</h4>
          <p className="text-sm text-gray-400">{sheet.goals}</p>
        </div>
      )}

      {/* Notes */}
      {sheet.notes && (
        <div>
          <h4 className="font-bold text-sm mb-1">Notes</h4>
          <p className="text-sm text-gray-400">{sheet.notes}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Generate printable HTML for the character sheet
 */
function generatePrintableHTML(sheet: CharacterSheet): string {
  const primary = PETALS[sheet.primaryElement];
  const school = SCHOOL_MAP[sheet.crystalSchool];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${sheet.name || 'Character'} - CrySword Saga Character Sheet</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      background: #f5f5f5;
    }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none; }
    }
    .sheet {
      background: white;
      border: 2px solid #333;
      padding: 24px;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }
    .stat-box {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: center;
      border-radius: 4px;
    }
    .stat-box .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .stat-box .value { font-size: 20px; font-weight: bold; }
    .section { margin-bottom: 16px; }
    .section h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .codex-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      font-size: 10px;
    }
    .codex-item {
      border: 1px solid #ddd;
      padding: 4px;
      text-align: center;
    }
    .notes-area {
      min-height: 60px;
      border: 1px solid #ddd;
      padding: 8px;
      font-size: 12px;
      white-space: pre-wrap;
    }
    .word-box {
      background: #f0f0f0;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      text-align: center;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #999;
      margin-top: 20px;
    }
    .print-btn {
      display: block;
      margin: 20px auto;
      padding: 12px 24px;
      font-size: 16px;
      cursor: pointer;
      background: #7c3aed;
      color: white;
      border: none;
      border-radius: 8px;
    }
    .print-btn:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print Character Sheet</button>

  <div class="sheet">
    <div class="header">
      <h1>${sheet.name || 'Character Name'}</h1>
      <div class="subtitle">
        ${school} (${PETALS[sheet.crystalSchool].element}) |
        ${primary.element} / ${PETALS[sheet.secondaryElement].element}
      </div>
    </div>

    <div class="stats-grid">
      ${Object.entries(sheet.stats).map(([stat, value]) => `
        <div class="stat-box">
          <div class="label">${stat}</div>
          <div class="value">${value}</div>
        </div>
      `).join('')}
    </div>

    <div class="word-box">
      <strong>Word Resonance:</strong> ${PETALS[sheet.crystalSchool].wordCount} words per action
      <br><small>(${school} - ${PETALS[sheet.crystalSchool].ability})</small>
    </div>

    <div class="section">
      <h3>Codex Progress</h3>
      <div class="codex-grid">
        ${ELEMENTAL_ORDER.map(key => {
          const words = sheet.codexProgress[key] || 0;
          const rank = words >= 5000 ? 'Master' :
                      words >= 3000 ? 'Insider' :
                      words >= 1500 ? 'Adept' :
                      words >= 500 ? 'Initiate' : 'Novice';
          return `
            <div class="codex-item">
              <div>${PETALS[key].element}</div>
              <div><strong>${rank}</strong></div>
              <div>${words}w</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="section">
      <h3>Backstory</h3>
      <div class="notes-area">${sheet.backstory || '(Write your backstory here)'}</div>
    </div>

    <div class="section">
      <h3>Goals</h3>
      <div class="notes-area">${sheet.goals || '(Character goals)'}</div>
    </div>

    <div class="section">
      <h3>Session Notes</h3>
      <div class="notes-area">${sheet.notes || '(Notes)'}</div>
    </div>

    <div class="footer">
      CrySword Saga Character Sheet | TEK8 Lotus Core System
    </div>
  </div>
</body>
</html>`;
}
