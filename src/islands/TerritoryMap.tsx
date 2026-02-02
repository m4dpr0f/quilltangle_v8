import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Nation {
  id: number;
  name: string;
  emoji: string;
}

interface Territory {
  road_id: string;
  dice_type: string;
  direction: string;
  realm: string;
  status: string;
  defense_level: number;
  total_staked: number;
  nation: Nation | null;
  contest: {
    id: number;
    attacker: string;
    attacker_emoji: string;
    deadline: string;
  } | null;
}

interface MapData {
  grid: (Territory | null)[][];
  diceTypes: string[];
  directions: string[];
  nations: Nation[];
  stats: {
    total: number;
    claimed: number;
    contested: number;
    fortified: number;
    unclaimed: number;
  };
}

const REALM_COLORS: Record<string, string> = {
  QLX: 'bg-green-600 hover:bg-green-500',
  QLY: 'bg-orange-600 hover:bg-orange-500',
  QLZ: 'bg-purple-600 hover:bg-purple-500',
};

const REALM_LABELS: Record<string, string> = {
  QLX: 'Music/Seed',
  QLY: 'Business/Egg',
  QLZ: 'Tech/Meteorite',
};

const STATUS_STYLES: Record<string, string> = {
  unclaimed: 'opacity-60',
  claimed: 'ring-2 ring-white/50',
  contested: 'animate-pulse ring-2 ring-red-500',
  fortified: 'ring-2 ring-yellow-400',
};

function TerritoryMapInner() {
  const { publicKey, connected } = useWallet();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [userNation, setUserNation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');

  // Fetch map data
  useEffect(() => {
    fetchMapData();
  }, []);

  // Fetch user's nation
  useEffect(() => {
    if (publicKey) {
      fetch(`/api/nation/create?wallet=${publicKey.toBase58()}`)
        .then(res => res.json())
        .then(data => {
          if (data.nations?.length > 0) {
            setUserNation(data.nations[0]);
          }
        })
        .catch(console.error);
    }
  }, [publicKey]);

  const fetchMapData = async () => {
    try {
      const res = await fetch('/api/territory/map');
      const data = await res.json();
      if (data.success) {
        setMapData(data);
      }
    } catch (error) {
      console.error('Failed to fetch map:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerritoryClick = (territory: Territory | null) => {
    if (!territory) return;
    setSelectedTerritory(territory);
  };

  const handleClaim = async () => {
    if (!selectedTerritory || !userNation || !publicKey) return;

    setClaiming(true);
    try {
      const res = await fetch('/api/territory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadId: selectedTerritory.road_id,
          nationId: userNation.id,
          stakeAmount: parseInt(stakeAmount) || undefined,
          walletAddress: publicKey.toBase58(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Territory ${selectedTerritory.road_id} claimed!`);
        setShowClaimModal(false);
        setSelectedTerritory(null);
        fetchMapData();
      } else {
        alert(data.error);
      }
    } catch (error: any) {
      alert('Claim failed: ' + error.message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!mapData) {
    return <div className="text-center text-red-500">Failed to load map</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-gray-800 rounded">
            Total: {mapData.stats.total}
          </span>
          <span className="px-3 py-1 bg-green-800/50 rounded">
            Claimed: {mapData.stats.claimed}
          </span>
          <span className="px-3 py-1 bg-red-800/50 rounded">
            Contested: {mapData.stats.contested}
          </span>
          <span className="px-3 py-1 bg-gray-700 rounded">
            Available: {mapData.stats.unclaimed}
          </span>
        </div>
        <WalletMultiButton />
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Map */}
        <div className="md:col-span-2 bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-center">QUILLVERSE TERRITORY MAP</h2>

          {/* Dice Type Headers */}
          <div className="grid grid-cols-9 gap-1 mb-2">
            <div></div>
            {mapData.diceTypes.map(dice => (
              <div key={dice} className="text-center text-xs text-gray-400 font-mono">
                {dice}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {mapData.grid.map((row, y) => (
            <div key={y} className="grid grid-cols-9 gap-1 mb-1">
              {/* Direction Label */}
              <div className="flex items-center justify-end pr-2 text-xs text-gray-400 font-mono">
                {mapData.directions[y]}
              </div>

              {/* Territory Cells */}
              {row.map((territory, x) => {
                if (!territory) return <div key={x} className="aspect-square" />;

                const realmColor = REALM_COLORS[territory.realm];
                const statusStyle = STATUS_STYLES[territory.status];
                const isSelected = selectedTerritory?.road_id === territory.road_id;

                return (
                  <button
                    key={x}
                    onClick={() => handleTerritoryClick(territory)}
                    className={`
                      aspect-square rounded flex items-center justify-center
                      text-lg font-bold transition-all
                      ${realmColor} ${statusStyle}
                      ${isSelected ? 'ring-4 ring-white scale-110 z-10' : ''}
                    `}
                    title={`${territory.road_id} - ${territory.status}`}
                  >
                    {territory.status === 'contested' ? (
                      <span className="text-red-300">!</span>
                    ) : territory.nation ? (
                      territory.nation.emoji
                    ) : territory.status === 'fortified' ? (
                      '#'
                    ) : (
                      <span className="text-white/30">~</span>
                    )}
                  </button>
                );
              })}

              {/* Realm Label */}
              <div className="flex items-center pl-2 text-xs text-gray-500">
                {y === 0 && 'QLX'}
                {(y === 1 || y === 2) && 'QLY'}
                {(y === 3 || y === 4) && 'QLZ'}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs justify-center">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-600 rounded"></span> QLX (Music)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-orange-600 rounded"></span> QLY (Business)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-purple-600 rounded"></span> QLZ (Tech)
            </span>
            <span className="text-gray-400">~ = unclaimed</span>
            <span className="text-red-400">! = contested</span>
            <span className="text-yellow-400"># = fortified</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Territory Panel */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="font-bold mb-3">
              {selectedTerritory ? `Territory: ${selectedTerritory.road_id}` : 'Select a Territory'}
            </h3>

            {selectedTerritory ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-400">Realm:</div>
                  <div>{REALM_LABELS[selectedTerritory.realm]}</div>
                  <div className="text-gray-400">Status:</div>
                  <div className={
                    selectedTerritory.status === 'claimed' ? 'text-green-400' :
                    selectedTerritory.status === 'contested' ? 'text-red-400' :
                    'text-gray-400'
                  }>
                    {selectedTerritory.status}
                  </div>
                  <div className="text-gray-400">Defense:</div>
                  <div>{selectedTerritory.defense_level}</div>
                </div>

                {selectedTerritory.nation && (
                  <div className="border-t border-gray-700 pt-3">
                    <div className="font-bold text-purple-400">
                      {selectedTerritory.nation.emoji} {selectedTerritory.nation.name}
                    </div>
                  </div>
                )}

                {selectedTerritory.contest && (
                  <div className="border-t border-gray-700 pt-3 text-red-400">
                    <div>Under Attack!</div>
                    <div className="text-xs">
                      By: {selectedTerritory.contest.attacker_emoji} {selectedTerritory.contest.attacker}
                    </div>
                  </div>
                )}

                {/* View Details Link */}
                <a
                  href={`/territory/${selectedTerritory.road_id}`}
                  className="block text-center text-purple-400 hover:text-purple-300 text-sm mt-3"
                >
                  View Full Details &rarr;
                </a>

                {/* Claim Button */}
                {selectedTerritory.status === 'unclaimed' && connected && userNation && (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="btn-primary w-full mt-4"
                  >
                    Claim Territory
                  </button>
                )}

                {selectedTerritory.status === 'unclaimed' && connected && !userNation && (
                  <div className="text-sm text-yellow-400 mt-4">
                    Found a nation first to claim territories
                  </div>
                )}

                {!connected && selectedTerritory.status === 'unclaimed' && (
                  <div className="text-sm text-gray-400 mt-4">
                    Connect wallet to claim
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Click a territory on the map to view details</p>
            )}
          </div>

          {/* User Nation Panel */}
          {connected && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Your Nation</h3>
              {userNation ? (
                <div className="space-y-2 text-sm">
                  <div className="text-2xl">{userNation.emoji} {userNation.name}</div>
                  <div className="text-gray-400">
                    Territories: {userNation.total_territory_count}
                  </div>
                  <div className="text-gray-400">
                    Defense: {userNation.defense_rating}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <p>No nation yet.</p>
                  <a href="/apply" className="text-purple-400 hover:underline">
                    Apply for GCN to found a nation
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Active Nations Leaderboard */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="font-bold mb-3">Top Nations</h3>
            {mapData.nations.length > 0 ? (
              <div className="space-y-2 text-sm">
                {mapData.nations.slice(0, 5).map((nation: any) => (
                  <div key={nation.id} className="flex justify-between items-center">
                    <span>{nation.emoji} {nation.name}</span>
                    <span className="text-gray-400">{nation.total_territory_count} territories</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No nations yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedTerritory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Claim {selectedTerritory.road_id}</h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Realm: {selectedTerritory.realm}</div>
                <div className="text-sm text-gray-400">
                  Minimum stake: {
                    selectedTerritory.realm === 'QLX' ? '100,000' :
                    selectedTerritory.realm === 'QLY' ? '250,000' : '500,000'
                  } tokens
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Stake Amount (optional)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Leave empty for minimum"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="btn flex-1 bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {claiming ? 'Claiming...' : 'Claim Territory'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TerritoryMap() {
  return (
    <WalletProvider>
      <TerritoryMapInner />
    </WalletProvider>
  );
}
