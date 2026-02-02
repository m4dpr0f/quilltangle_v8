import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Alliance {
  id: number;
  proposer_nation_id: number;
  target_nation_id: number;
  alliance_type: string;
  terms: any;
  status: string;
  proposed_at: string;
  accepted_at: string | null;
  expires_at: string;
  proposer_name: string;
  proposer_emoji: string;
  proposer_territories?: number;
  target_name: string;
  target_emoji: string;
  target_territories?: number;
  user_role?: 'proposer' | 'target';
}

interface Nation {
  id: number;
  name: string;
  emoji: string;
  total_territory_count: number;
  diplomatic_standing?: number;
}

interface GroupedAlliances {
  pending: Alliance[];
  outgoing: Alliance[];
  active: Alliance[];
  broken: Alliance[];
}

const ALLIANCE_TYPES = [
  {
    type: 'trade',
    name: 'Trade Agreement',
    icon: '💰',
    description: 'Reduced swap fees between nations',
    color: 'yellow',
  },
  {
    type: 'defense',
    name: 'Defense Pact',
    icon: '🛡️',
    description: 'Shared defense bonuses and mutual protection',
    color: 'blue',
  },
  {
    type: 'border',
    name: 'Non-Aggression',
    icon: '🕊️',
    description: 'Cannot attack each other\'s territories',
    color: 'green',
  },
  {
    type: 'federation',
    name: 'Federation',
    icon: '👑',
    description: 'Full alliance with shared governance and combined stats',
    color: 'purple',
  },
];

function DiplomacyPanelInner() {
  const { publicKey, connected } = useWallet();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [userNation, setUserNation] = useState<Nation | null>(null);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [grouped, setGrouped] = useState<GroupedAlliances | null>(null);
  const [nations, setNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Proposal form state
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [selectedNation, setSelectedNation] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState('defense');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionResult, setActionResult] = useState<{ id: number; message: string; success: boolean } | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history' | 'propose'>('active');

  // Fetch user's nation
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

  // Fetch alliances
  const fetchAlliances = async () => {
    if (!publicKey) return;

    try {
      const res = await fetch(`/api/diplomacy/alliances?wallet=${publicKey.toBase58()}`);
      const result = await res.json();

      if (result.success) {
        setAlliances(result.alliances);
        setGrouped(result.grouped);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all nations for proposal dropdown
  const fetchNations = async () => {
    try {
      // Use the nation create endpoint with a dummy wallet to get list
      const res = await fetch('/api/nation/create?wallet=list');
      const result = await res.json();
      if (result.nations) {
        setNations(result.nations.filter((n: Nation) => n.id !== userNation?.id));
      }
    } catch (err) {
      console.error('Failed to fetch nations:', err);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchAlliances();
    }
  }, [publicKey]);

  useEffect(() => {
    if (userNation) {
      fetchNations();
    }
  }, [userNation]);

  // Handle alliance proposal
  const handlePropose = async () => {
    if (!selectedNation || !publicKey) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/diplomacy/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetNationId: selectedNation,
          allianceType: selectedType,
          walletAddress: publicKey.toBase58(),
          message,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setShowProposalForm(false);
        setSelectedNation(null);
        setMessage('');
        setActiveTab('pending');
        fetchAlliances();
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle alliance response (accept/reject)
  const handleRespond = async (allianceId: number, action: 'accept' | 'reject') => {
    if (!publicKey) return;

    setActionLoading(allianceId);

    try {
      const res = await fetch('/api/diplomacy/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allianceId,
          action,
          walletAddress: publicKey.toBase58(),
        }),
      });

      const result = await res.json();

      setActionResult({
        id: allianceId,
        message: result.message || result.error,
        success: result.success,
      });

      if (result.success) {
        fetchAlliances();
      }
    } catch (err: any) {
      setActionResult({
        id: allianceId,
        message: err.message,
        success: false,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle breaking alliance
  const handleBreak = async (allianceId: number) => {
    if (!publicKey || !confirm('Are you sure you want to break this alliance? This will damage your diplomatic standing.')) return;

    setActionLoading(allianceId);

    try {
      const res = await fetch('/api/diplomacy/alliances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allianceId,
          action: 'break',
          walletAddress: publicKey.toBase58(),
        }),
      });

      const result = await res.json();

      setActionResult({
        id: allianceId,
        message: result.message || result.error,
        success: result.success,
      });

      if (result.success) {
        fetchAlliances();
      }
    } catch (err: any) {
      setActionResult({
        id: allianceId,
        message: err.message,
        success: false,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Clear action result after delay
  useEffect(() => {
    if (actionResult) {
      const timer = setTimeout(() => setActionResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionResult]);

  const getAllianceTypeInfo = (type: string) => {
    return ALLIANCE_TYPES.find(t => t.type === type) || ALLIANCE_TYPES[0];
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Diplomacy</h2>
        <p className="text-gray-400 mb-6">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Diplomacy</h2>
        <p className="text-gray-400 mb-6">Connect your wallet to manage alliances</p>
        <WalletMultiButton />
      </div>
    );
  }

  if (!userNation) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Diplomacy</h2>
        <p className="text-gray-400 mb-6">You need to found a nation first to engage in diplomacy.</p>
        <a href="/territory" className="btn bg-purple-600 hover:bg-purple-500">
          View Territory Map
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href="/territory" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">
            &larr; Back to Territory Map
          </a>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">{userNation.emoji}</span>
            {userNation.name} Diplomacy
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Diplomatic Standing: {userNation.diplomatic_standing || 100}
          </p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {[
          { id: 'pending', label: 'Pending', count: (grouped?.pending.length || 0) + (grouped?.outgoing.length || 0) },
          { id: 'active', label: 'Active Alliances', count: grouped?.active.length || 0 },
          { id: 'history', label: 'History', count: grouped?.broken.length || 0 },
          { id: 'propose', label: '+ New Proposal', count: 0 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                tab.id === 'pending' ? 'bg-yellow-600' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {/* Incoming Proposals */}
          {grouped?.pending && grouped.pending.length > 0 && (
            <div>
              <h3 className="font-bold text-yellow-400 mb-3">Incoming Proposals</h3>
              <div className="space-y-3">
                {grouped.pending.map(alliance => {
                  const typeInfo = getAllianceTypeInfo(alliance.alliance_type);
                  return (
                    <div key={alliance.id} className="bg-gray-900 rounded-lg p-4 border border-yellow-600/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{typeInfo.icon}</span>
                          <div>
                            <div className="font-bold">
                              {alliance.proposer_emoji} {alliance.proposer_name}
                            </div>
                            <div className="text-sm text-gray-400">
                              proposes {typeInfo.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {alliance.proposer_territories} territories
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(alliance.id, 'accept')}
                            disabled={actionLoading === alliance.id}
                            className="btn bg-green-600 hover:bg-green-500 text-sm px-4"
                          >
                            {actionLoading === alliance.id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRespond(alliance.id, 'reject')}
                            disabled={actionLoading === alliance.id}
                            className="btn bg-red-600 hover:bg-red-500 text-sm px-4"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      {alliance.terms?.message && (
                        <div className="mt-3 p-2 bg-gray-800 rounded text-sm text-gray-300 italic">
                          "{alliance.terms.message}"
                        </div>
                      )}
                      {actionResult?.id === alliance.id && (
                        <div className={`mt-2 text-sm ${actionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {actionResult.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outgoing Proposals */}
          {grouped?.outgoing && grouped.outgoing.length > 0 && (
            <div>
              <h3 className="font-bold text-blue-400 mb-3">Outgoing Proposals</h3>
              <div className="space-y-3">
                {grouped.outgoing.map(alliance => {
                  const typeInfo = getAllianceTypeInfo(alliance.alliance_type);
                  return (
                    <div key={alliance.id} className="bg-gray-900 rounded-lg p-4 border border-blue-600/50">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{typeInfo.icon}</span>
                        <div>
                          <div className="font-bold">
                            {typeInfo.name} to {alliance.target_emoji} {alliance.target_name}
                          </div>
                          <div className="text-sm text-gray-400">
                            Awaiting response...
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Proposed {new Date(alliance.proposed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!grouped?.pending || grouped.pending.length === 0) &&
           (!grouped?.outgoing || grouped.outgoing.length === 0) && (
            <div className="text-center py-10 text-gray-400">
              No pending proposals
            </div>
          )}
        </div>
      )}

      {/* Active Alliances Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {grouped?.active && grouped.active.length > 0 ? (
            grouped.active.map(alliance => {
              const typeInfo = getAllianceTypeInfo(alliance.alliance_type);
              const partner = alliance.user_role === 'proposer'
                ? { name: alliance.target_name, emoji: alliance.target_emoji, territories: alliance.target_territories }
                : { name: alliance.proposer_name, emoji: alliance.proposer_emoji, territories: alliance.proposer_territories };

              return (
                <div key={alliance.id} className={`bg-gray-900 rounded-lg p-4 border-l-4 border-${typeInfo.color}-500`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{typeInfo.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{typeInfo.name}</span>
                          <span className="text-xs px-2 py-1 bg-green-600/30 text-green-400 rounded">ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl">{partner.emoji}</span>
                          <span className="font-medium">{partner.name}</span>
                          <span className="text-xs text-gray-500">({partner.territories} territories)</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Formed {alliance.accepted_at ? new Date(alliance.accepted_at).toLocaleDateString() : 'N/A'}
                          {alliance.expires_at && (
                            <span> • Expires {new Date(alliance.expires_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBreak(alliance.id)}
                      disabled={actionLoading === alliance.id}
                      className="btn bg-gray-700 hover:bg-red-600 text-sm px-3"
                      title="Break Alliance"
                    >
                      {actionLoading === alliance.id ? '...' : '✕ Break'}
                    </button>
                  </div>

                  {/* Alliance Benefits */}
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Alliance Benefits:</div>
                    <div className="flex flex-wrap gap-2">
                      {alliance.alliance_type === 'trade' && (
                        <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded text-xs">
                          -{(alliance.terms?.fee_reduction || 0.25) * 100}% swap fees
                        </span>
                      )}
                      {alliance.alliance_type === 'defense' && (
                        <>
                          <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs">
                            +{alliance.terms?.defense_bonus || 25} defense
                          </span>
                          <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs">
                            Mutual protection
                          </span>
                        </>
                      )}
                      {alliance.alliance_type === 'border' && (
                        <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">
                          Non-aggression pact
                        </span>
                      )}
                      {alliance.alliance_type === 'federation' && (
                        <>
                          <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-xs">
                            +50 defense, +25 attack
                          </span>
                          <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-xs">
                            Shared governance
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {actionResult?.id === alliance.id && (
                    <div className={`mt-3 text-sm ${actionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {actionResult.message}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p>No active alliances</p>
              <button
                onClick={() => setActiveTab('propose')}
                className="btn bg-purple-600 hover:bg-purple-500 mt-4"
              >
                Propose an Alliance
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {grouped?.broken && grouped.broken.length > 0 ? (
            grouped.broken.map(alliance => {
              const typeInfo = getAllianceTypeInfo(alliance.alliance_type);
              const partner = alliance.user_role === 'proposer'
                ? { name: alliance.target_name, emoji: alliance.target_emoji }
                : { name: alliance.proposer_name, emoji: alliance.proposer_emoji };

              return (
                <div key={alliance.id} className="bg-gray-900/50 rounded-lg p-4 opacity-75">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl grayscale">{typeInfo.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{typeInfo.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded uppercase">
                          {alliance.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        with {partner.emoji} {partner.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-400">
              No alliance history
            </div>
          )}
        </div>
      )}

      {/* Propose Tab */}
      {activeTab === 'propose' && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="font-bold text-xl mb-6">Propose New Alliance</h3>

          {/* Alliance Type Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-3">Select Alliance Type</label>
            <div className="grid grid-cols-2 gap-3">
              {ALLIANCE_TYPES.map(type => (
                <button
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className={`p-4 rounded-lg border text-left ${
                    selectedType === type.type
                      ? `border-${type.color}-500 bg-${type.color}-900/30`
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-bold">{type.name}</span>
                  </div>
                  <p className="text-xs text-gray-400">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target Nation Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Select Target Nation</label>
            <select
              className="input w-full"
              value={selectedNation || ''}
              onChange={(e) => setSelectedNation(parseInt(e.target.value) || null)}
            >
              <option value="">Choose a nation...</option>
              {nations.map(nation => (
                <option key={nation.id} value={nation.id}>
                  {nation.emoji} {nation.name} ({nation.total_territory_count} territories)
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Message (optional)</label>
            <textarea
              className="input w-full h-24 resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to your proposal..."
            />
          </div>

          {/* Submit */}
          <button
            onClick={handlePropose}
            disabled={!selectedNation || submitting}
            className="btn w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
          >
            {submitting ? 'Sending Proposal...' : 'Send Alliance Proposal'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DiplomacyPanel() {
  return (
    <WalletProvider>
      <DiplomacyPanelInner />
    </WalletProvider>
  );
}
