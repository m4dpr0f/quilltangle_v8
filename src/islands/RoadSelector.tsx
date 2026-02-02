import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

const DICE_TYPES = ['D2', 'D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];
const DIRECTIONS = [
  { id: 'OUT', realm: 'QLX', color: 'green' },
  { id: 'UP', realm: 'QLY', color: 'orange' },
  { id: 'DWN', realm: 'QLY', color: 'orange' },
  { id: 'U45', realm: 'QLZ', color: 'purple' },
  { id: 'D45', realm: 'QLZ', color: 'purple' },
];

interface Road {
  roadId: string;
  diceType: string;
  direction: string;
  realm: string;
  available: boolean;
  element: string;
  elementEmoji: string;
  elementDescription: string;
  directionName: string;
  realmDescription: string;
  nationName?: string;
  nationEmoji?: string;
  claimedBy?: string;
  territoryStatus?: string;
  defenseLevel?: number;
}

function RoadSelectorInner() {
  const { publicKey, connected } = useWallet();
  const [roads, setRoads] = useState<Road[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<Road | null>(null);
  const [tokenAddress, setTokenAddress] = useState('');
  const [nationName, setNationName] = useState('');
  const [soulDescription, setSoulDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalRoads: 40, availableCount: 40, claimedCount: 0 });
  const [userTokens, setUserTokens] = useState<Array<{ mint: string; name: string; symbol: string }>>([]);

  useEffect(() => {
    fetch('/api/gcn/roads/available')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRoads(data.roads || []);
          setStats({
            totalRoads: data.totalRoads,
            availableCount: data.availableCount,
            claimedCount: data.claimedCount,
          });
        }
      })
      .catch(console.error);
  }, []);

  // Fetch user's tokens when wallet connected
  useEffect(() => {
    if (!publicKey) return;
    fetch(`/api/launchpad/create?wallet=${publicKey.toBase58()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.launches) {
          setUserTokens(data.launches
            .filter((l: any) => l.token_mint && l.phase === 'live')
            .map((l: any) => ({
              mint: l.token_mint,
              name: l.name,
              symbol: l.symbol,
            }))
          );
        }
      })
      .catch(console.error);
  }, [publicKey]);

  const handleClaim = async () => {
    if (!publicKey || !selectedRoad || !tokenAddress || !nationName || !soulDescription) return;
    setLoading(true);

    try {
      const res = await fetch('/api/gcn/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress,
          roadId: selectedRoad.roadId,
          nationName,
          soulDescription,
          creatorWallet: publicKey.toBase58(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Road claimed successfully! Your nation has been registered.');
        // Refresh roads
        const refreshRes = await fetch('/api/gcn/roads/available');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setRoads(refreshData.roads);
          setStats({
            totalRoads: refreshData.totalRoads,
            availableCount: refreshData.availableCount,
            claimedCount: refreshData.claimedCount,
          });
        }
        setSelectedRoad(null);
      } else {
        alert(data.error || 'Claim failed');
      }
    } catch (error: any) {
      alert('Claim failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoadColor = (road: Road) => {
    if (!road.available) return 'bg-gray-600';
    switch (road.realm) {
      case 'QLX': return 'bg-green-600 hover:bg-green-500';
      case 'QLY': return 'bg-orange-600 hover:bg-orange-500';
      case 'QLZ': return 'bg-purple-600 hover:bg-purple-500';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-400">{stats.availableCount}</p>
          <p className="text-sm text-gray-400">Available Roads</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.claimedCount}</p>
          <p className="text-sm text-gray-400">Claimed Nations</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-white">{stats.totalRoads}</p>
          <p className="text-sm text-gray-400">Total Roads</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Road Map */}
        <div className="lg:col-span-2 card">
          <h3 className="text-xl font-bold mb-4">Rainbow Roads Map</h3>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs mb-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-600 rounded"></span>
              QLX (Music)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-600 rounded"></span>
              QLY (Marketing)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-600 rounded"></span>
              QLZ (Technology)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-600 rounded"></span>
              Claimed
            </span>
          </div>

          {/* Grid Header */}
          <div className="grid grid-cols-9 gap-1 text-xs mb-1">
            <div></div>
            {DICE_TYPES.map(dice => (
              <div key={dice} className="text-center font-bold text-gray-400">{dice}</div>
            ))}
          </div>

          {/* Grid Rows */}
          {DIRECTIONS.map(dir => (
            <div key={dir.id} className="grid grid-cols-9 gap-1 mb-1">
              <div className="text-xs font-bold text-gray-400 flex items-center">{dir.id}</div>
              {DICE_TYPES.map(dice => {
                const roadId = dice + dir.id;
                const road = roads.find(r => r.roadId === roadId);
                if (!road) return <div key={roadId} className="p-3 bg-gray-800 rounded" />;

                return (
                  <button
                    key={roadId}
                    onClick={() => setSelectedRoad(road)}
                    className={`p-2 rounded text-center transition-all ${getRoadColor(road)} ${
                      selectedRoad?.roadId === roadId ? 'ring-2 ring-white scale-105' : ''
                    }`}
                    title={road.available
                      ? `${roadId} - ${road.element} (Available)`
                      : `${roadId} - ${road.nationName || 'Claimed'}`
                    }
                  >
                    <span className="text-lg">{road.available ? road.elementEmoji : (road.nationEmoji || '🏳️')}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Details Panel */}
        <div className="card">
          {selectedRoad ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedRoad.roadId}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedRoad.available ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {selectedRoad.available ? 'Available' : 'Claimed'}
                </span>
              </div>

              {/* Road Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Element:</span>
                  <span>{selectedRoad.elementEmoji} {selectedRoad.element}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Direction:</span>
                  <span>{selectedRoad.directionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Realm:</span>
                  <span className={
                    selectedRoad.realm === 'QLX' ? 'text-green-400' :
                    selectedRoad.realm === 'QLY' ? 'text-orange-400' : 'text-purple-400'
                  }>{selectedRoad.realm}</span>
                </div>
                <p className="text-xs text-gray-500 italic">{selectedRoad.elementDescription}</p>
              </div>

              {selectedRoad.available ? (
                /* Claim Form */
                connected ? (
                  <div className="space-y-3 pt-4 border-t border-gray-700">
                    <h4 className="font-bold">Claim This Road</h4>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Your GCN Token</label>
                      {userTokens.length > 0 ? (
                        <select
                          className="input w-full"
                          value={tokenAddress}
                          onChange={(e) => setTokenAddress(e.target.value)}
                        >
                          <option value="">Select a token...</option>
                          {userTokens.map(t => (
                            <option key={t.mint} value={t.mint}>
                              {t.name} (${t.symbol})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input w-full"
                          value={tokenAddress}
                          onChange={(e) => setTokenAddress(e.target.value)}
                          placeholder="Token mint address"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nation Name</label>
                      <input
                        className="input w-full"
                        value={nationName}
                        onChange={(e) => setNationName(e.target.value)}
                        placeholder="e.g., Kingdom of Fire"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Soul Description ({soulDescription.length}/1000)
                      </label>
                      <textarea
                        className="input w-full h-24 resize-none"
                        value={soulDescription}
                        onChange={(e) => setSoulDescription(e.target.value)}
                        placeholder="Describe your nation's essence, values, and vision..."
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500">Min 50 characters</p>
                    </div>

                    <button
                      onClick={handleClaim}
                      disabled={loading || !tokenAddress || !nationName || soulDescription.length < 50}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {loading ? 'Claiming...' : 'Claim Road'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 mb-3">Connect wallet to claim</p>
                    <WalletMultiButton />
                  </div>
                )
              ) : (
                /* Claimed Info */
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedRoad.nationEmoji || '🏳️'}</span>
                    <div>
                      <h4 className="font-bold">{selectedRoad.nationName}</h4>
                      <p className="text-xs text-gray-400">Nation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-gray-800 rounded">
                      <p className="text-gray-400 text-xs">Status</p>
                      <p className="capitalize">{selectedRoad.territoryStatus || 'claimed'}</p>
                    </div>
                    <div className="p-2 bg-gray-800 rounded">
                      <p className="text-gray-400 text-xs">Defense</p>
                      <p>{selectedRoad.defenseLevel || 0}</p>
                    </div>
                  </div>

                  <a
                    href={`/territory/${selectedRoad.roadId}`}
                    className="btn bg-purple-600 hover:bg-purple-500 w-full text-center block"
                  >
                    View Territory
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">🌈</p>
              <h3 className="font-bold mb-2">Select a Road</h3>
              <p className="text-sm text-gray-400">
                Click on any road in the map to view details or claim it for your nation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Realm Descriptions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-900/30 to-green-800/10 border-green-500/30">
          <h4 className="font-bold text-green-400 mb-2">🌱 QLX Realm (SEED)</h4>
          <p className="text-sm text-gray-300">
            Music & Sound. The Outward direction. Nations here focus on creative expression,
            entertainment, and the arts.
          </p>
        </div>
        <div className="card bg-gradient-to-br from-orange-900/30 to-orange-800/10 border-orange-500/30">
          <h4 className="font-bold text-orange-400 mb-2">🥚 QLY Realm (EGG)</h4>
          <p className="text-sm text-gray-300">
            Marketing & Growth. The Upward and Downward directions. Nations here specialize in
            community building and outreach.
          </p>
        </div>
        <div className="card bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-purple-500/30">
          <h4 className="font-bold text-purple-400 mb-2">☄️ QLZ Realm (METEORITE)</h4>
          <p className="text-sm text-gray-300">
            Technology & Innovation. The Diagonal directions. Nations here develop tools,
            systems, and technical solutions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RoadSelector() {
  return (
    <WalletProvider>
      <RoadSelectorInner />
    </WalletProvider>
  );
}
