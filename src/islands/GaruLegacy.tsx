import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface DeathRecord {
  id: number;
  garuName: string;
  level: number;
  generation: number;
  cause: string;
  location: string;
  eggsSpawned: number;
  territories: string[];
  diedAt: string;
  owner?: string;
}

interface HallOfFameEntry {
  name: string;
  id: number;
  level: number;
  generation: number;
  eggs?: number;
  element?: string;
  status?: string;
  diedAt?: string;
}

interface Stats {
  totalDeaths: number;
  totalEggsSpawned: number;
  highestLevelDeath: number;
  mostProlificLegacy: { name: string; eggs: number } | null;
  deathCauses: { cause: string; count: number }[];
  compositesCreated: { type: string; count: number }[];
}

const ELEMENT_COLORS: Record<string, string> = {
  fire: 'from-red-500 to-orange-500',
  earth: 'from-green-500 to-emerald-600',
  air: 'from-cyan-400 to-blue-500',
  water: 'from-blue-500 to-indigo-600',
  ether: 'from-purple-500 to-violet-600',
  chaos: 'from-orange-500 to-red-600',
  order: 'from-gray-300 to-white',
  coin: 'from-yellow-400 to-amber-500',
};

const CAUSE_LABELS: Record<string, string> = {
  adventure: 'Fell in Adventure',
  battle: 'Fallen in Battle',
  sacrifice: 'Noble Sacrifice',
  natural: 'Natural Passing',
};

function GaruLegacyInner() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const [tab, setTab] = useState<'global' | 'mine' | 'hall' | 'stats'>('global');
  const [deaths, setDeaths] = useState<DeathRecord[]>([]);
  const [myDeaths, setMyDeaths] = useState<DeathRecord[]>([]);
  const [hallOfFame, setHallOfFame] = useState<{
    mostProlific: HallOfFameEntry[];
    highestLevel: HallOfFameEntry[];
    ancientLineages: HallOfFameEntry[];
  } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Global deaths
        const deathsRes = await fetch('/api/garu/legacy?action=deaths');
        const deathsData = await deathsRes.json();
        if (deathsData.success) {
          setDeaths(deathsData.deaths);
        }

        // Hall of Fame
        const hallRes = await fetch('/api/garu/legacy?action=hall_of_fame');
        const hallData = await hallRes.json();
        if (hallData.success) {
          setHallOfFame(hallData.hallOfFame);
        }

        // Stats
        const statsRes = await fetch('/api/garu/legacy?action=stats');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }

        // My deaths if connected
        if (connected && publicKey) {
          const myRes = await fetch(`/api/garu/legacy?action=deaths&wallet=${publicKey.toBase58()}`);
          const myData = await myRes.json();
          if (myData.success) {
            setMyDeaths(myData.deaths);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted, connected, publicKey]);

  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-pulse">📜</div>
        <p className="text-gray-400">Loading legacy records...</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const DeathCard = ({ death }: { death: DeathRecord }) => (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{death.garuName}</h3>
          <p className="text-sm text-gray-400">
            Generation {death.generation} • Level {death.level}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl">💫</span>
          <p className="text-xs text-gray-500">{formatDate(death.diedAt)}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Cause:</span>
          <span>{CAUSE_LABELS[death.cause] || death.cause}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Location:</span>
          <span>{death.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Legacy Eggs:</span>
          <span className="text-amber-400 font-bold">{death.eggsSpawned}</span>
        </div>
        {death.territories && death.territories.length > 0 && (
          <div className="pt-2">
            <span className="text-gray-400 text-xs">Scattered across:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {death.territories.slice(0, 5).map(t => (
                <span key={t} className="text-xs bg-gray-800 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
              {death.territories.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{death.territories.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
        {death.owner && (
          <div className="text-xs text-gray-500 pt-2">
            Rider: {death.owner}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setTab('global')}
          className={`pb-3 px-4 transition ${
            tab === 'global' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Recent Passings
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`pb-3 px-4 transition ${
            tab === 'mine' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          My Legacy
        </button>
        <button
          onClick={() => setTab('hall')}
          className={`pb-3 px-4 transition ${
            tab === 'hall' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Hall of Fame
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`pb-3 px-4 transition ${
            tab === 'stats' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Statistics
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-pulse">📜</div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : (
        <>
          {/* GLOBAL DEATHS */}
          {tab === 'global' && (
            <div>
              {deaths.length === 0 ? (
                <div className="text-center py-12 bg-gray-900/50 rounded-xl">
                  <div className="text-4xl mb-4">🕊️</div>
                  <p className="text-gray-400">No passings recorded yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    When Garu fall, their legacies will be honored here.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {deaths.map(death => (
                    <DeathCard key={death.id} death={death} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY LEGACY */}
          {tab === 'mine' && (
            <div>
              {!connected ? (
                <div className="text-center py-12 bg-gray-900/50 rounded-xl">
                  <div className="text-4xl mb-4">📜</div>
                  <h3 className="text-xl font-bold mb-4">Connect to View Your Legacy</h3>
                  <WalletMultiButton />
                </div>
              ) : myDeaths.length === 0 ? (
                <div className="text-center py-12 bg-gray-900/50 rounded-xl">
                  <div className="text-4xl mb-4">🐦</div>
                  <p className="text-gray-400">None of your Garu have passed yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    May they live long and prosperous journeys!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 mb-6">
                    <h3 className="font-bold text-lg mb-4">Your Legacy Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-bold text-purple-400">{myDeaths.length}</div>
                        <div className="text-sm text-gray-400">Garu Passed</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-amber-400">
                          {myDeaths.reduce((sum, d) => sum + d.eggsSpawned, 0)}
                        </div>
                        <div className="text-sm text-gray-400">Eggs Spawned</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-blue-400">
                          {Math.max(...myDeaths.map(d => d.level), 0)}
                        </div>
                        <div className="text-sm text-gray-400">Highest Level</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {myDeaths.map(death => (
                      <DeathCard key={death.id} death={death} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HALL OF FAME */}
          {tab === 'hall' && hallOfFame && (
            <div className="space-y-8">
              {/* Most Prolific */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl">🥚</span> Most Prolific Legacies
                </h3>
                <div className="space-y-2">
                  {hallOfFame.mostProlific.slice(0, 10).map((entry, i) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                          i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-700'
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold">{entry.name}</div>
                          <div className="text-xs text-gray-400">
                            Level {entry.level} • Gen {entry.generation}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-bold">{entry.eggs} eggs</div>
                        {entry.diedAt && (
                          <div className="text-xs text-gray-500">{formatDate(entry.diedAt)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highest Level */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl">⚔️</span> Mightiest Warriors
                </h3>
                <div className="space-y-2">
                  {hallOfFame.highestLevel.slice(0, 10).map((entry, i) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                          i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-700'
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold">{entry.name}</div>
                          <div className="text-xs text-gray-400">
                            Generation {entry.generation}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-400 font-bold">Level {entry.level}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ancient Lineages */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl">👑</span> Ancient Lineages (Living)
                </h3>
                <div className="space-y-2">
                  {hallOfFame.ancientLineages.slice(0, 10).map((entry, i) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br ${ELEMENT_COLORS[entry.element || 'ether']}`}>
                          🐦
                        </div>
                        <div>
                          <div className="font-bold">{entry.name}</div>
                          <div className="text-xs text-gray-400">
                            Level {entry.level}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-400 font-bold">Gen {entry.generation}</div>
                        <div className="text-xs text-green-400">Alive</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATISTICS */}
          {tab === 'stats' && stats && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold text-lg mb-4">Global Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Garu Passed</span>
                    <span className="font-bold">{stats.totalDeaths}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Eggs Spawned</span>
                    <span className="font-bold text-amber-400">{stats.totalEggsSpawned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Highest Level Death</span>
                    <span className="font-bold text-blue-400">{stats.highestLevelDeath}</span>
                  </div>
                  {stats.mostProlificLegacy && (
                    <div className="pt-4 border-t border-gray-700">
                      <div className="text-gray-400 text-sm mb-2">Most Prolific Legacy</div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{stats.mostProlificLegacy.name}</span>
                        <span className="text-amber-400">{stats.mostProlificLegacy.eggs} eggs</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold text-lg mb-4">Causes of Passing</h3>
                {stats.deathCauses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.deathCauses.map(({ cause, count }) => (
                      <div key={cause}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{CAUSE_LABELS[cause] || cause}</span>
                          <span>{count}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(count / stats.totalDeaths) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold text-lg mb-4">Composites Achieved Through Fusion</h3>
                {stats.compositesCreated.length === 0 ? (
                  <p className="text-gray-500 text-sm">No composite fusions yet</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {stats.compositesCreated.map(({ type, count }) => (
                      <div key={type} className="bg-gray-800 px-4 py-2 rounded-lg">
                        <div className="font-bold capitalize">{type.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-400">{count} created</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function GaruLegacy() {
  return (
    <WalletProvider>
      <GaruLegacyInner />
    </WalletProvider>
  );
}
