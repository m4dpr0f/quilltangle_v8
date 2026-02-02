import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Garu {
  id: number;
  name: string;
  level: number;
  generation: number;
  primaryElement: string;
  secondaryElement?: string;
  bondLevel: number;
  compositeType?: string;
}

interface FusionProposal {
  id: number;
  garu1: { id: number; name: string; element: string; level: number };
  garu2: { id: number; name: string; element: string; level: number };
  proposedType?: string;
  proposer: string;
  target: string;
  isProposer: boolean;
  createdAt: string;
  expiresAt: string;
}

interface CompositeType {
  name: string;
  description: string;
  elements: string[];
  rarity: string;
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

const ELEMENT_NAMES: Record<string, string> = {
  fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water',
  ether: 'Ether', chaos: 'Chaos', order: 'Order', coin: 'Coin',
};

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-orange-400',
  mythic: 'text-pink-400',
};

function GaruFusionInner() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const [tab, setTab] = useState<'fuse' | 'proposals' | 'composites'>('fuse');
  const [myGaru, setMyGaru] = useState<Garu[]>([]);
  const [proposals, setProposals] = useState<FusionProposal[]>([]);
  const [composites, setComposites] = useState<CompositeType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fusion state
  const [selectedGaru1, setSelectedGaru1] = useState<Garu | null>(null);
  const [selectedGaru2, setSelectedGaru2] = useState<Garu | null>(null);
  const [fusionPreview, setFusionPreview] = useState<any>(null);
  const [newGaruName, setNewGaruName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch composites
        const compRes = await fetch('/api/garu/fusion?action=composites');
        const compData = await compRes.json();
        if (compData.success) {
          setComposites(compData.composites);
        }

        // Fetch proposals and garu if connected
        if (connected && publicKey) {
          const wallet = publicKey.toBase58();

          const [proposalRes, garuRes] = await Promise.all([
            fetch(`/api/garu/fusion?action=proposals&wallet=${wallet}`),
            fetch(`/api/garu?wallet=${wallet}`),
          ]);

          const proposalData = await proposalRes.json();
          const garuData = await garuRes.json();

          if (proposalData.success) {
            setProposals(proposalData.proposals);
          }

          if (garuData.success && garuData.garu) {
            // Filter to only hatched Garu that meet fusion requirements
            const eligible = garuData.garu
              .filter((g: any) => g.phase === 'hatched' && g.level >= 10 && g.bondLevel >= 75)
              .map((g: any) => ({
                id: g.id,
                name: g.name,
                level: g.level,
                generation: g.generation,
                primaryElement: g.primaryElement,
                secondaryElement: g.secondaryElement,
                bondLevel: g.bondLevel,
                compositeType: g.compositeType,
              }));
            setMyGaru(eligible);
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

  // Preview fusion when both Garu selected
  useEffect(() => {
    if (!selectedGaru1 || !selectedGaru2) {
      setFusionPreview(null);
      return;
    }

    const fetchPreview = async () => {
      const res = await fetch(
        `/api/garu/fusion?action=preview&element1=${selectedGaru1.primaryElement}&element2=${selectedGaru2.primaryElement}`
      );
      const data = await res.json();
      if (data.success) {
        setFusionPreview(data.result);
      }
    };

    fetchPreview();
  }, [selectedGaru1, selectedGaru2]);

  const handleProposeFusion = async () => {
    if (!publicKey || !selectedGaru1 || !selectedGaru2) return;

    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/garu/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          action: 'propose',
          garu1Id: selectedGaru1.id,
          garu2Id: selectedGaru2.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.proposal.readyToExecute) {
          // Same owner, auto-accepted - show execution UI
          setSuccess({
            type: 'proposed_ready',
            ...data,
          });
        } else {
          setSuccess({
            type: 'proposed',
            ...data,
          });
        }
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptProposal = async (proposalId: number) => {
    if (!publicKey) return;

    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/garu/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          action: 'accept',
          proposalId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Refresh proposals
        const wallet = publicKey.toBase58();
        const proposalRes = await fetch(`/api/garu/fusion?action=proposals&wallet=${wallet}`);
        const proposalData = await proposalRes.json();
        if (proposalData.success) {
          setProposals(proposalData.proposals);
        }
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleExecuteFusion = async (proposalId: number) => {
    if (!publicKey || !newGaruName) return;

    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/garu/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          action: 'execute',
          proposalId,
          newGaruName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess({
          type: 'executed',
          ...data,
        });
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelProposal = async (proposalId: number) => {
    if (!publicKey) return;

    try {
      const res = await fetch('/api/garu/fusion', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          proposalId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setProposals(proposals.filter(p => p.id !== proposalId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-pulse">🔮</div>
        <p className="text-gray-400">Loading fusion chamber...</p>
      </div>
    );
  }

  // Success screen for executed fusion
  if (success?.type === 'executed') {
    return (
      <div className="text-center py-12">
        <div className="text-8xl mb-6">✨</div>
        <h2 className="text-3xl font-bold mb-4 text-purple-400">{success.ceremony.title}</h2>
        <p className="text-gray-300 mb-6">{success.ceremony.description}</p>

        <div className={`max-w-md mx-auto bg-gradient-to-r ${ELEMENT_COLORS[success.newGaru.primaryElement]} p-1 rounded-xl mb-6`}>
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-2xl font-bold">{success.newGaru.name}</h3>
            {success.composite && (
              <span className={`text-sm ${RARITY_COLORS[success.composite.rarity]}`}>
                {success.composite.name}
              </span>
            )}
            <p className="text-gray-400 text-sm mt-2">
              Generation {success.newGaru.generation} • Level {success.newGaru.level}
            </p>
            <p className="text-sm mt-2">
              Born from {success.parents.garu1} + {success.parents.garu2}
            </p>
          </div>
        </div>

        <a
          href="/garu"
          className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-lg px-8"
        >
          Care for {success.newGaru.name} →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setTab('fuse')}
          className={`pb-3 px-4 transition ${
            tab === 'fuse' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Create Fusion
        </button>
        <button
          onClick={() => setTab('proposals')}
          className={`pb-3 px-4 transition relative ${
            tab === 'proposals' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Proposals
          {proposals.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-purple-600 text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {proposals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('composites')}
          className={`pb-3 px-4 transition ${
            tab === 'composites' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Composite Types
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* CREATE FUSION TAB */}
      {tab === 'fuse' && (
        <div>
          {!connected ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-4">🔮</div>
              <h3 className="text-xl font-bold mb-4">Connect Wallet to Fuse</h3>
              <p className="text-gray-400 mb-6">
                Connect your wallet to access the Fusion Chamber.
              </p>
              <WalletMultiButton />
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="text-4xl animate-spin">🔮</div>
              <p className="text-gray-400 mt-4">Loading your Garu...</p>
            </div>
          ) : myGaru.length < 2 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-4">🥚</div>
              <h3 className="text-xl font-bold mb-4">Not Enough Garu</h3>
              <p className="text-gray-400 mb-4">
                You need at least 2 hatched Garu at level 10+ with 75%+ bond to perform fusion.
              </p>
              <p className="text-sm text-gray-500">
                Current eligible Garu: {myGaru.length}
              </p>
              <a href="/garu/eggs" className="btn mt-4 bg-purple-600 hover:bg-purple-500">
                Find Wild Eggs
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Garu 1 Selection */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold mb-4">Select First Garu</h3>
                <div className="space-y-2">
                  {myGaru.map(garu => (
                    <button
                      key={garu.id}
                      onClick={() => {
                        setSelectedGaru1(garu);
                        if (selectedGaru2?.id === garu.id) setSelectedGaru2(null);
                      }}
                      disabled={selectedGaru2?.id === garu.id}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        selectedGaru1?.id === garu.id
                          ? `bg-gradient-to-r ${ELEMENT_COLORS[garu.primaryElement]}`
                          : selectedGaru2?.id === garu.id
                          ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-bold">{garu.name}</div>
                      <div className="text-xs text-gray-400">
                        {ELEMENT_NAMES[garu.primaryElement]} • Lv{garu.level} • Gen{garu.generation}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fusion Preview */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 flex flex-col items-center justify-center">
                {selectedGaru1 && selectedGaru2 ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${ELEMENT_COLORS[selectedGaru1.primaryElement]}`}>
                        <span className="text-2xl">🐦</span>
                      </div>
                      <span className="text-2xl">+</span>
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${ELEMENT_COLORS[selectedGaru2.primaryElement]}`}>
                        <span className="text-2xl">🐦</span>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-xl">↓</div>
                      <div className="text-4xl my-2">✨</div>
                      {fusionPreview && (
                        <div className={`${RARITY_COLORS[fusionPreview.rarity]} font-bold`}>
                          {fusionPreview.name}
                        </div>
                      )}
                    </div>

                    {success?.type === 'proposed_ready' ? (
                      <div className="w-full space-y-4">
                        <input
                          type="text"
                          placeholder="Name your new Garu"
                          value={newGaruName}
                          onChange={(e) => setNewGaruName(e.target.value)}
                          maxLength={50}
                          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
                        />
                        <button
                          onClick={() => handleExecuteFusion(success.proposal.id)}
                          disabled={processing || !newGaruName}
                          className="btn w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-3 disabled:opacity-50"
                        >
                          {processing ? 'Fusing...' : 'Complete Fusion'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleProposeFusion}
                        disabled={processing}
                        className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-3 px-8 disabled:opacity-50"
                      >
                        {processing ? 'Processing...' : 'Propose Fusion'}
                      </button>
                    )}

                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Warning: Both parent Garu will be consumed in the fusion.
                    </p>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">🔮</div>
                    <p>Select two Garu to preview fusion</p>
                  </div>
                )}
              </div>

              {/* Garu 2 Selection */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold mb-4">Select Second Garu</h3>
                <div className="space-y-2">
                  {myGaru.map(garu => (
                    <button
                      key={garu.id}
                      onClick={() => {
                        setSelectedGaru2(garu);
                        if (selectedGaru1?.id === garu.id) setSelectedGaru1(null);
                      }}
                      disabled={selectedGaru1?.id === garu.id}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        selectedGaru2?.id === garu.id
                          ? `bg-gradient-to-r ${ELEMENT_COLORS[garu.primaryElement]}`
                          : selectedGaru1?.id === garu.id
                          ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-bold">{garu.name}</div>
                      <div className="text-xs text-gray-400">
                        {ELEMENT_NAMES[garu.primaryElement]} • Lv{garu.level} • Gen{garu.generation}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROPOSALS TAB */}
      {tab === 'proposals' && (
        <div>
          {!connected ? (
            <div className="text-center py-12">
              <WalletMultiButton />
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-4">📬</div>
              <p className="text-gray-400">No pending fusion proposals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map(proposal => (
                <div key={proposal.id} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${ELEMENT_COLORS[proposal.garu1.element]}`}>
                        <span className="text-xl">🐦</span>
                      </div>
                      <div>
                        <div className="font-bold">{proposal.garu1.name}</div>
                        <div className="text-xs text-gray-400">Lv{proposal.garu1.level}</div>
                      </div>
                      <span className="text-xl">+</span>
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${ELEMENT_COLORS[proposal.garu2.element]}`}>
                        <span className="text-xl">🐦</span>
                      </div>
                      <div>
                        <div className="font-bold">{proposal.garu2.name}</div>
                        <div className="text-xs text-gray-400">Lv{proposal.garu2.level}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {proposal.isProposer ? (
                        <>
                          <span className="text-sm text-gray-400">Awaiting response</span>
                          <button
                            onClick={() => handleCancelProposal(proposal.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAcceptProposal(proposal.id)}
                            disabled={processing}
                            className="btn bg-green-600 hover:bg-green-500 text-sm px-4"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleCancelProposal(proposal.id)}
                            className="btn bg-red-600 hover:bg-red-500 text-sm px-4"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {proposal.proposedType && (
                    <div className="mt-3 text-sm text-purple-400">
                      Would create: {proposal.proposedType}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPOSITES TAB */}
      {tab === 'composites' && (
        <div className="grid md:grid-cols-2 gap-4">
          {composites.map(composite => (
            <div key={composite.name} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold text-lg ${RARITY_COLORS[composite.rarity]}`}>
                  {composite.name}
                </h3>
                <span className={`text-xs uppercase ${RARITY_COLORS[composite.rarity]}`}>
                  {composite.rarity}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-4">{composite.description}</p>

              <div className="flex flex-wrap gap-2">
                {composite.elements.map(element => (
                  <span
                    key={element}
                    className={`px-2 py-1 rounded text-xs bg-gradient-to-r ${ELEMENT_COLORS[element]}`}
                  >
                    {ELEMENT_NAMES[element]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GaruFusion() {
  return (
    <WalletProvider>
      <GaruFusionInner />
    </WalletProvider>
  );
}
