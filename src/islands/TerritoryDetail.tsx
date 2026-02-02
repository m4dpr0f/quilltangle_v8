import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';
import StakeManager from './StakeManager';
import ContestPanel from './ContestPanel';

interface TerritoryDetailProps {
  roadId: string;
}

interface TerritoryData {
  territory: {
    id: number;
    road_id: string;
    dice_type: string;
    direction: string;
    realm: string;
    grid_x: number;
    grid_y: number;
    status: string;
    defense_level: number;
    total_staked: number;
    claimed_at: string | null;
    nation: {
      id: number;
      name: string;
      emoji: string;
      founder_wallet: string;
      defense_rating: number;
      attack_rating: number;
      total_territory_count: number;
    } | null;
  };
  stakes: any[];
  events: any[];
  activeContest: any | null;
  adjacent: any[];
}

const REALM_INFO: Record<string, { name: string; color: string; description: string }> = {
  QLX: { name: 'Music/Seed', color: 'text-green-400', description: 'Play-to-Earn realm' },
  QLY: { name: 'Business/Egg', color: 'text-orange-400', description: 'Build-to-Earn realm' },
  QLZ: { name: 'Tech/Meteorite', color: 'text-purple-400', description: 'Create-to-Earn realm' },
};

const STATUS_BADGES: Record<string, { color: string; label: string }> = {
  unclaimed: { color: 'bg-gray-600', label: 'Unclaimed' },
  claimed: { color: 'bg-green-600', label: 'Claimed' },
  contested: { color: 'bg-red-600 animate-pulse', label: 'Under Attack!' },
  fortified: { color: 'bg-yellow-600', label: 'Fortified' },
};

function TerritoryDetailInner({ roadId }: TerritoryDetailProps) {
  const { publicKey, connected } = useWallet();
  const [data, setData] = useState<TerritoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'stakes' | 'events'>('overview');
  const [userNation, setUserNation] = useState<any>(null);

  const fetchTerritoryData = async () => {
    try {
      const res = await fetch(`/api/territory/${roadId}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritoryData();
  }, [roadId]);

  useEffect(() => {
    if (publicKey) {
      fetch(`/api/nation/create?wallet=${publicKey.toBase58()}`)
        .then(res => res.json())
        .then(result => {
          if (result.nations?.length > 0) {
            setUserNation(result.nations[0]);
          }
        })
        .catch(console.error);
    }
  }, [publicKey]);

  const handleStakeChange = () => {
    fetchTerritoryData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">{error || 'Failed to load territory'}</div>
        <a href="/territory" className="text-purple-400 hover:underline">Back to Map</a>
      </div>
    );
  }

  const { territory, stakes, events, activeContest, adjacent } = data;
  const realmInfo = REALM_INFO[territory.realm];
  const statusBadge = STATUS_BADGES[territory.status];

  // Check if user can stake (owns the nation controlling this territory)
  const canStake = connected && userNation && territory.nation?.id === userNation.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href="/territory" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">
            &larr; Back to Map
          </a>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {territory.nation ? (
              <span className="text-4xl">{territory.nation.emoji}</span>
            ) : null}
            Territory {territory.road_id}
          </h1>
        </div>
        <WalletMultiButton />
      </div>

      {/* Status Banner */}
      {activeContest && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <span className="animate-pulse">!</span>
            TERRITORY UNDER ATTACK
          </div>
          <div className="text-sm text-gray-300 mt-1">
            Defender has until {new Date(activeContest.defense_deadline).toLocaleString()} to respond
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Territory Card */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
              <div className="text-right">
                <div className={`font-bold ${realmInfo.color}`}>{realmInfo.name}</div>
                <div className="text-xs text-gray-400">{realmInfo.description}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Dice Type</div>
                <div className="font-bold text-lg">{territory.dice_type}</div>
              </div>
              <div>
                <div className="text-gray-400">Direction</div>
                <div className="font-bold text-lg">{territory.direction}</div>
              </div>
              <div>
                <div className="text-gray-400">Grid Position</div>
                <div className="font-mono">({territory.grid_x}, {territory.grid_y})</div>
              </div>
              <div>
                <div className="text-gray-400">Defense Level</div>
                <div className={`font-bold text-lg ${territory.defense_level >= 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {territory.defense_level}
                </div>
              </div>
            </div>

            {/* Nation Info */}
            {territory.nation && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Controlled By</div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{territory.nation.emoji}</span>
                  <div>
                    <div className="font-bold text-lg">{territory.nation.name}</div>
                    <div className="text-xs text-gray-400">
                      {territory.nation.total_territory_count} territories •
                      Defense: {territory.nation.defense_rating} •
                      Attack: {territory.nation.attack_rating}
                    </div>
                  </div>
                </div>
                {territory.claimed_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Claimed {new Date(territory.claimed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-700">
              {['overview', 'stakes', 'events'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === tab
                      ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Adjacent Territories */}
                  <div>
                    <h4 className="font-bold text-sm mb-2">Adjacent Territories</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {adjacent.map((adj: any) => (
                        <a
                          key={adj.road_id}
                          href={`/territory/${adj.road_id}`}
                          className="flex justify-between items-center p-2 bg-gray-800 rounded hover:bg-gray-700"
                        >
                          <span>{adj.road_id}</span>
                          <span className={`text-xs ${
                            adj.status === 'unclaimed' ? 'text-gray-400' :
                            adj.status === 'claimed' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {adj.status}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-xs">Total Staked</div>
                      <div className="font-mono text-lg">{Number(territory.total_staked).toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-xs">Active Stakers</div>
                      <div className="font-mono text-lg">{stakes.length}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stakes' && (
                <div className="space-y-4">
                  {stakes.length > 0 ? (
                    stakes.map((stake: any) => (
                      <div key={stake.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                        <div>
                          <div className="font-mono text-sm">
                            {stake.staker_wallet.slice(0, 8)}...{stake.staker_wallet.slice(-6)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {stake.stake_type} • {new Date(stake.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{Number(stake.amount).toLocaleString()}</div>
                          {stake.locked_until && (
                            <div className="text-xs text-yellow-400">
                              Locked until {new Date(stake.locked_until).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-4">No stakes yet</div>
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-2">
                  {events.length > 0 ? (
                    events.map((event: any) => (
                      <div key={event.id} className="flex items-start gap-3 p-2 border-b border-gray-800">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          event.event_type === 'claimed' ? 'bg-green-500' :
                          event.event_type === 'staked' ? 'bg-blue-500' :
                          event.event_type === 'unstaked' ? 'bg-orange-500' :
                          event.event_type === 'contested' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-bold capitalize">{event.event_type}</span>
                            {event.actor_emoji && (
                              <span className="ml-2">{event.actor_emoji} {event.actor_name}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(event.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-4">No events yet</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Stake Manager */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="font-bold mb-4">Stake Management</h3>
            <StakeManager
              roadId={territory.road_id}
              realm={territory.realm}
              currentStakes={stakes}
              totalStaked={Number(territory.total_staked)}
              defenseLevel={territory.defense_level}
              nationId={canStake ? territory.nation?.id || null : null}
              walletAddress={publicKey?.toBase58() || null}
              onStakeChange={handleStakeChange}
            />
          </div>

          {/* Combat Actions */}
          {(territory.status === 'claimed' || territory.status === 'contested' || territory.status === 'fortified') && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="font-bold mb-3">Combat</h3>
              <ContestPanel
                roadId={territory.road_id}
                territoryStatus={territory.status}
                defenseLevel={territory.defense_level}
                totalStaked={Number(territory.total_staked)}
                controllerNation={territory.nation}
                activeContest={activeContest}
                userNation={userNation}
                walletAddress={publicKey?.toBase58() || null}
                onContestChange={fetchTerritoryData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TerritoryDetail({ roadId }: TerritoryDetailProps) {
  return (
    <WalletProvider>
      <TerritoryDetailInner roadId={roadId} />
    </WalletProvider>
  );
}
