import { useState, useEffect } from 'react';
import { PETALS, POSITIONS, ALL_ROADS, ELEMENTAL_ORDER, type Petal, type Road } from '../lib/tek8-roads';

interface ExplorerState {
  selectedPetal: string | null;
  selectedRoad: Road | null;
  viewMode: 'lotus' | 'grid' | 'list';
}

/**
 * TEK8 Roads Explorer
 *
 * A visual interface for exploring the 40 Roads of the TEK8 Lotus Core.
 * 8 Petals × 5 Positions = 40 developmental territories for exploration.
 */
export default function RoadsExplorer() {
  const [state, setState] = useState<ExplorerState>({
    selectedPetal: null,
    selectedRoad: null,
    viewMode: 'lotus',
  });

  const selectPetal = (petalKey: string) => {
    setState(prev => ({
      ...prev,
      selectedPetal: petalKey,
      selectedRoad: null,
    }));
  };

  const selectRoad = (road: Road) => {
    setState(prev => ({
      ...prev,
      selectedRoad: road,
    }));
  };

  const clearSelection = () => {
    setState(prev => ({
      ...prev,
      selectedPetal: null,
      selectedRoad: null,
    }));
  };

  const setViewMode = (mode: 'lotus' | 'grid' | 'list') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  return (
    <div className="space-y-8">
      {/* View Mode Toggle */}
      <div className="flex justify-center gap-2">
        {(['lotus', 'grid', 'list'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              state.viewMode === mode
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {mode === 'lotus' ? '🪷 Lotus' : mode === 'grid' ? '📊 Grid' : '📜 List'}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Visualization */}
        <div className="lg:col-span-2">
          {state.viewMode === 'lotus' && (
            <LotusView
              selectedPetal={state.selectedPetal}
              onSelectPetal={selectPetal}
              onClearSelection={clearSelection}
            />
          )}
          {state.viewMode === 'grid' && (
            <GridView
              selectedRoad={state.selectedRoad}
              onSelectRoad={selectRoad}
            />
          )}
          {state.viewMode === 'list' && (
            <ListView
              selectedRoad={state.selectedRoad}
              onSelectRoad={selectRoad}
            />
          )}
        </div>

        {/* Right: Details Panel */}
        <div className="lg:col-span-1">
          <DetailsPanel
            selectedPetal={state.selectedPetal}
            selectedRoad={state.selectedRoad}
            onSelectRoad={selectRoad}
            onClearSelection={clearSelection}
          />
        </div>
      </div>

      {/* Quick Reference */}
      <QuickReference />
    </div>
  );
}

/**
 * Lotus View - Visual lotus flower representation
 */
function LotusView({
  selectedPetal,
  onSelectPetal,
  onClearSelection,
}: {
  selectedPetal: string | null;
  onSelectPetal: (key: string) => void;
  onClearSelection: () => void;
}) {
  // Position petals in a circle
  const positions = ELEMENTAL_ORDER.map((key, index) => {
    const angle = (index * 45 - 90) * (Math.PI / 180); // Start from top, go clockwise
    const radius = 120;
    return {
      key,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

  return (
    <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800">
      <h3 className="text-xl font-bold text-center mb-6">TEK8 Lotus Core</h3>

      <div className="relative w-full aspect-square max-w-md mx-auto">
        {/* Center */}
        <button
          onClick={onClearSelection}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition z-10"
          title="TEK8 Center - Click to clear selection"
        >
          🪷
        </button>

        {/* Petals */}
        {positions.map(({ key, x, y }) => {
          const petal = PETALS[key];
          const isSelected = selectedPetal === key;

          return (
            <button
              key={key}
              onClick={() => onSelectPetal(key)}
              className={`absolute w-16 h-16 rounded-full flex flex-col items-center justify-center text-xs font-medium transition transform hover:scale-110 ${
                isSelected
                  ? 'ring-4 ring-white scale-110 z-10'
                  : ''
              }`}
              style={{
                left: `calc(50% + ${x}px - 32px)`,
                top: `calc(50% + ${y}px - 32px)`,
                background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                '--tw-gradient-from': getGradientFrom(petal.color),
                '--tw-gradient-to': getGradientTo(petal.color),
              } as React.CSSProperties}
              title={`${petal.element} - ${petal.ability}`}
            >
              <span className="text-lg">{getElementEmoji(petal.element)}</span>
              <span className="text-[10px] opacity-80">{key}</span>
            </button>
          );
        })}

        {/* Connecting lines (decorative) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <circle
            cx="50%"
            cy="50%"
            r="100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-purple-500"
          />
          <circle
            cx="50%"
            cy="50%"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-amber-500"
          />
        </svg>
      </div>

      <p className="text-center text-gray-500 text-sm mt-6">
        Click a petal to explore its 5 roads
      </p>
    </div>
  );
}

/**
 * Grid View - 8x5 matrix of all roads
 */
function GridView({
  selectedRoad,
  onSelectRoad,
}: {
  selectedRoad: Road | null;
  onSelectRoad: (road: Road) => void;
}) {
  const positionKeys = Object.keys(POSITIONS);

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 overflow-x-auto">
      <h3 className="text-xl font-bold mb-4">40 Roads Grid</h3>

      {/* Header Row */}
      <div className="grid grid-cols-9 gap-1 text-xs mb-2 min-w-[500px]">
        <div className="text-gray-500 p-2"></div>
        {ELEMENTAL_ORDER.map(key => (
          <div key={key} className="text-center p-2 font-bold text-gray-400">
            {key}
          </div>
        ))}
      </div>

      {/* Data Rows */}
      {positionKeys.map(posKey => (
        <div key={posKey} className="grid grid-cols-9 gap-1 mb-1 min-w-[500px]">
          <div className="text-xs text-gray-400 p-2 flex items-center">
            {posKey}
          </div>
          {ELEMENTAL_ORDER.map(petalKey => {
            const road = ALL_ROADS.find(r => r.petal === petalKey && r.position === posKey);
            if (!road) return <div key={`${petalKey}${posKey}`} className="p-2" />;

            const petal = PETALS[petalKey];
            const isSelected = selectedRoad?.id === road.id;

            return (
              <button
                key={road.id}
                onClick={() => onSelectRoad(road)}
                className={`p-2 rounded text-center transition ${
                  isSelected
                    ? 'ring-2 ring-white scale-105 z-10'
                    : 'hover:scale-105'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${getGradientFrom(petal.color)}, ${getGradientTo(petal.color)})`,
                }}
                title={road.name}
              >
                <span className="text-sm">{getElementEmoji(petal.element)}</span>
              </button>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        {Object.entries(POSITIONS).map(([key, pos]) => (
          <span key={key} className="text-gray-400">
            <strong>{key}</strong>: {pos.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * List View - Grouped by petal
 */
function ListView({
  selectedRoad,
  onSelectRoad,
}: {
  selectedRoad: Road | null;
  onSelectRoad: (road: Road) => void;
}) {
  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 max-h-[600px] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">All 40 Roads</h3>

      <div className="space-y-6">
        {ELEMENTAL_ORDER.map(petalKey => {
          const petal = PETALS[petalKey];
          const roads = ALL_ROADS.filter(r => r.petal === petalKey);

          return (
            <div key={petalKey}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getElementEmoji(petal.element)}</span>
                <h4 className="font-bold" style={{ color: getGradientFrom(petal.color) }}>
                  {petal.element} ({petalKey})
                </h4>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {roads.map(road => (
                  <button
                    key={road.id}
                    onClick={() => onSelectRoad(road)}
                    className={`p-2 rounded text-xs text-left transition ${
                      selectedRoad?.id === road.id
                        ? 'bg-white/20 ring-1 ring-white'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-bold">{road.id}</div>
                    <div className="text-gray-400 truncate">{POSITIONS[road.position as keyof typeof POSITIONS].name}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Details Panel - Shows selected petal or road info
 */
function DetailsPanel({
  selectedPetal,
  selectedRoad,
  onSelectRoad,
  onClearSelection,
}: {
  selectedPetal: string | null;
  selectedRoad: Road | null;
  onSelectRoad: (road: Road) => void;
  onClearSelection: () => void;
}) {
  // Show road details if a road is selected
  if (selectedRoad) {
    const petal = PETALS[selectedRoad.petal];

    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 sticky top-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{selectedRoad.id}</h3>
          <button
            onClick={onClearSelection}
            className="text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-lg" style={{ color: getGradientFrom(petal.color) }}>
              {selectedRoad.name}
            </h4>
            <p className="text-gray-400 text-sm mt-1">{selectedRoad.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoBox label="Element" value={`${getElementEmoji(petal.element)} ${petal.element}`} />
            <InfoBox label="Die" value={petal.die} />
            <InfoBox label="Ability" value={petal.ability} />
            <InfoBox label="Wellness" value={petal.wellness} />
            <InfoBox label="Sense" value={petal.sense} />
            <InfoBox label="Capital" value={petal.capital} />
            <InfoBox label="IB Area" value={petal.aok} />
            <InfoBox label="Virtue" value={petal.virtue} />
          </div>

          <div>
            <h5 className="font-bold text-sm mb-2">Road Challenges</h5>
            <ul className="space-y-1 text-xs text-gray-400">
              {selectedRoad.challenges.map((challenge, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-purple-400">•</span>
                  {challenge}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h5 className="font-bold text-sm mb-2">Crystal School</h5>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <div>
                <p className="font-medium">{petal.crystalSchool}</p>
                <p className="text-xs text-gray-500">{petal.wordCount}-word mastery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show petal details if a petal is selected
  if (selectedPetal) {
    const petal = PETALS[selectedPetal];
    const roads = ALL_ROADS.filter(r => r.petal === selectedPetal);

    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 sticky top-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getElementEmoji(petal.element)}</span>
            <h3 className="text-xl font-bold">{petal.element} Petal</h3>
          </div>
          <button
            onClick={onClearSelection}
            className="text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-400 text-sm">{petal.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoBox label="Die" value={petal.die} />
            <InfoBox label="Sense" value={petal.sense} />
            <InfoBox label="Ability" value={petal.ability} />
            <InfoBox label="Wellness" value={petal.wellness} />
            <InfoBox label="Capital" value={petal.capital} />
            <InfoBox label="IB Area" value={petal.aok} />
            <InfoBox label="Virtue" value={petal.virtue} />
            <InfoBox label="Words" value={String(petal.wordCount)} />
          </div>

          <div>
            <h5 className="font-bold text-sm mb-2">Crystal School</h5>
            <p className="text-purple-400">{petal.crystalSchool}</p>
          </div>

          <div>
            <h5 className="font-bold text-sm mb-2">5 Roads</h5>
            <div className="space-y-2">
              {roads.map(road => (
                <button
                  key={road.id}
                  onClick={() => onSelectRoad(road)}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{road.id}</span>
                    <span className="text-xs text-gray-400">{POSITIONS[road.position as keyof typeof POSITIONS].name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default welcome state
  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 sticky top-4">
      <div className="text-center py-8">
        <span className="text-5xl mb-4 block">🪷</span>
        <h3 className="font-bold text-xl mb-2">Explore the 40 Roads</h3>
        <p className="text-gray-400 text-sm mb-6">
          The TEK8 Lotus has 8 petals, each with 5 roads.
          Click on a petal or road to explore.
        </p>

        <div className="text-left space-y-2 text-xs">
          <p className="text-gray-500 font-bold uppercase tracking-wide">8 Elements:</p>
          <div className="flex flex-wrap gap-2">
            {ELEMENTAL_ORDER.map(key => (
              <span
                key={key}
                className="px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: getGradientFrom(PETALS[key].color) + '30' }}
              >
                {getElementEmoji(PETALS[key].element)} {PETALS[key].element}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Reference - Position meanings
 */
function QuickReference() {
  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
      <h3 className="font-bold mb-4">Position Guide</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(POSITIONS).map(([key, pos]) => (
          <div key={key} className="text-center">
            <div className="text-2xl mb-1">{getPositionEmoji(key)}</div>
            <div className="font-bold text-sm">{key}</div>
            <div className="text-xs text-gray-400">{pos.name}</div>
            <div className="text-xs text-gray-500 mt-1">{pos.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Info Box Component
 */
function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-gray-800 rounded">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

// Helper functions
function getElementEmoji(element: string): string {
  const emojis: Record<string, string> = {
    Ether: '🌌',
    Air: '💨',
    Fire: '🔥',
    Water: '💧',
    Earth: '🌍',
    Chaos: '🌀',
    Order: '⚖️',
    Coin: '🪙',
  };
  return emojis[element] || '✨';
}

function getPositionEmoji(position: string): string {
  const emojis: Record<string, string> = {
    OUT: '⭕',
    UP: '⬆️',
    DWN: '⬇️',
    U45: '↗️',
    D45: '↘️',
  };
  return emojis[position] || '•';
}

function getGradientFrom(color: string): string {
  const colors: Record<string, string> = {
    purple: '#a855f7',
    cyan: '#22d3ee',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    orange: '#f97316',
    gray: '#9ca3af',
    yellow: '#facc15',
  };
  return colors[color] || '#9333ea';
}

function getGradientTo(color: string): string {
  const colors: Record<string, string> = {
    purple: '#7c3aed',
    cyan: '#3b82f6',
    red: '#f97316',
    blue: '#6366f1',
    green: '#10b981',
    orange: '#dc2626',
    gray: '#ffffff',
    yellow: '#f59e0b',
  };
  return colors[color] || '#6366f1';
}
