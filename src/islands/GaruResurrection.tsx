import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface DeceasedGaru {
  id: number;
  name: string;
  level: number;
  element: string;
  generation: number;
  memoryCount: number;
  diedAt: string;
}

interface ResurrectionInfo {
  garu: {
    id: number;
    name: string;
    level: number;
    generation: number;
    primaryElement: string;
    diedAt: string;
  };
  requirements: {
    memories: { required: number; have: number; met: boolean };
    descendant: { required: number; have: number; met: boolean };
    cooldown: { active: boolean; endsAt: string | null };
  };
  canResurrect: boolean;
  restorationQuality: string;
  memories: {
    tracks: { id: number; title: string; level: number; bond: number }[];
    writings: { id: number; title: string; level: number }[];
    milestones: { id: number; event: string; level: number }[];
  };
  bestMemory: { id: number; type: string; title: string; level: number; bond: number } | null;
  descendants: { id: number; name: string; level: number; phase: string; element: string }[];
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

const QUALITY_COLORS: Record<string, string> = {
  full: 'text-green-400',
  substantial: 'text-blue-400',
  partial: 'text-yellow-400',
};

function GaruResurrectionInner() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const [deceasedGaru, setDeceasedGaru] = useState<DeceasedGaru[]>([]);
  const [resurrectable, setResurrectable] = useState<DeceasedGaru[]>([]);
  const [selectedGaru, setSelectedGaru] = useState<number | null>(null);
  const [resurrectionInfo, setResurrectionInfo] = useState<ResurrectionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Resurrection form
  const [selectedDescendant, setSelectedDescendant] = useState<number | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<number | null>(null);
  const [selectedAdditionalMemories, setSelectedAdditionalMemories] = useState<number[]>([]);
  const [newName, setNewName] = useState('');
  const [performing, setPerforming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch deceased Garu
  useEffect(() => {
    if (!mounted || !connected || !publicKey) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const wallet = publicKey.toBase58();
        const res = await fetch(`/api/garu/resurrect?wallet=${wallet}`);
        const data = await res.json();

        if (data.success) {
          setDeceasedGaru(data.deceasedGaru || []);
          setResurrectable(data.resurrectable || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted, connected, publicKey]);

  // Fetch resurrection info when Garu selected
  useEffect(() => {
    if (!selectedGaru || !publicKey) return;

    const fetchInfo = async () => {
      try {
        const wallet = publicKey.toBase58();
        const res = await fetch(`/api/garu/resurrect?wallet=${wallet}&garuId=${selectedGaru}`);
        const data = await res.json();

        if (data.success) {
          setResurrectionInfo(data);
          // Auto-select best memory if available
          if (data.bestMemory) {
            setSelectedMemory(data.bestMemory.id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchInfo();
  }, [selectedGaru, publicKey]);

  const handleResurrect = async () => {
    if (!publicKey || !selectedGaru || !selectedDescendant || !selectedMemory) return;

    setPerforming(true);
    setError('');

    try {
      const res = await fetch('/api/garu/resurrect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          deceasedGaruId: selectedGaru,
          descendantGaruId: selectedDescendant,
          memoryId: selectedMemory,
          additionalMemoryIds: selectedAdditionalMemories,
          newName: newName || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data);
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPerforming(false);
    }
  };

  const toggleAdditionalMemory = (memId: number) => {
    if (memId === selectedMemory) return; // Can't toggle primary
    setSelectedAdditionalMemories(prev =>
      prev.includes(memId)
        ? prev.filter(id => id !== memId)
        : [...prev, memId]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-pulse">✨</div>
        <p className="text-gray-400">Loading resurrection shrine...</p>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-8xl mb-6">✨</div>
        <h2 className="text-3xl font-bold mb-4 text-purple-400">{success.ceremony.title}</h2>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">{success.ceremony.description}</p>

        <div className={`max-w-md mx-auto bg-gradient-to-r ${ELEMENT_COLORS[success.resurrectedGaru.element]} p-1 rounded-xl mb-6`}>
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-2xl font-bold">{success.resurrectedGaru.name}</h3>
            <div className={`text-sm ${QUALITY_COLORS[success.restoration.quality.toLowerCase()]}`}>
              {success.restoration.quality} Restoration
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Level {success.resurrectedGaru.level}
              {success.resurrectedGaru.originalLevel !== success.resurrectedGaru.level && (
                <span className="text-gray-500"> (was {success.resurrectedGaru.originalLevel})</span>
              )}
            </p>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 max-w-lg mx-auto mb-6">
          <h4 className="font-bold mb-3">Restoration Details</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{success.restoration.levelPercent}%</div>
              <div className="text-xs text-gray-400">Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{success.restoration.statPercent}%</div>
              <div className="text-xs text-gray-400">Stats</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">{success.restoration.bondPercent}%</div>
              <div className="text-xs text-gray-400">Bond</div>
            </div>
          </div>
        </div>

        <div className="bg-amber-900/30 rounded-xl p-4 max-w-lg mx-auto mb-6 text-amber-400 text-sm">
          <strong>{success.channelGaru.name}</strong> gained <strong>Ancestor Bond</strong>: +10% bond and a special connection to their ancestor.
        </div>

        {success.hint && (
          <p className="text-gray-500 text-sm mb-6">{success.hint}</p>
        )}

        <a
          href="/garu"
          className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-lg px-8"
        >
          Welcome Back {success.resurrectedGaru.name}! →
        </a>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-12 bg-gray-900/50 rounded-xl">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-xl font-bold mb-4">Connect Wallet</h3>
        <p className="text-gray-400 mb-6">
          Connect your wallet to access the Resurrection Shrine.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl animate-pulse">✨</div>
        <p className="text-gray-400 mt-4">Loading shrine...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {deceasedGaru.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-xl">
          <div className="text-4xl mb-4">🕊️</div>
          <p className="text-gray-400">No perished Garu found.</p>
          <p className="text-sm text-gray-500 mt-2">
            May your companions live long and prosperous journeys!
          </p>
        </div>
      ) : !selectedGaru ? (
        // Garu Selection
        <div>
          <h3 className="font-bold text-lg mb-4">Select a Perished Garu</h3>

          {resurrectable.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm text-green-400 mb-2">Ready for Resurrection</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {resurrectable.map(garu => (
                  <button
                    key={garu.id}
                    onClick={() => setSelectedGaru(garu.id)}
                    className="p-4 rounded-xl border-2 border-green-500/50 bg-green-900/20 hover:bg-green-900/30 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl p-2 rounded-lg bg-gradient-to-br ${ELEMENT_COLORS[garu.element]}`}>
                        💫
                      </div>
                      <div>
                        <div className="font-bold">{garu.name}</div>
                        <div className="text-sm text-gray-400">
                          Level {garu.level} • Gen {garu.generation}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-400">
                      {garu.memoryCount} memories available
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {deceasedGaru.filter(g => !resurrectable.find(r => r.id === g.id)).length > 0 && (
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Not Yet Resurrectable</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {deceasedGaru
                  .filter(g => !resurrectable.find(r => r.id === g.id))
                  .map(garu => (
                    <button
                      key={garu.id}
                      onClick={() => setSelectedGaru(garu.id)}
                      className="p-4 rounded-xl border border-gray-700 bg-gray-900/50 hover:bg-gray-900 text-left transition opacity-75"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl p-2 rounded-lg bg-gradient-to-br ${ELEMENT_COLORS[garu.element]} opacity-50`}>
                          💫
                        </div>
                        <div>
                          <div className="font-bold">{garu.name}</div>
                          <div className="text-sm text-gray-400">
                            Level {garu.level} • Gen {garu.generation}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {garu.memoryCount} memories • Needs descendant or more memories
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : resurrectionInfo ? (
        // Resurrection Ritual
        <div>
          <button
            onClick={() => {
              setSelectedGaru(null);
              setResurrectionInfo(null);
              setSelectedDescendant(null);
              setSelectedMemory(null);
              setSelectedAdditionalMemories([]);
            }}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to selection
          </button>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Garu & Requirements */}
            <div className="space-y-4">
              <div className={`p-4 rounded-xl bg-gradient-to-r ${ELEMENT_COLORS[resurrectionInfo.garu.primaryElement]}`}>
                <div className="text-2xl font-bold">{resurrectionInfo.garu.name}</div>
                <div className="text-sm opacity-90">
                  Level {resurrectionInfo.garu.level} • Generation {resurrectionInfo.garu.generation}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  Passed: {formatDate(resurrectionInfo.garu.diedAt)}
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h4 className="font-bold mb-3">Requirements</h4>
                <div className="space-y-2">
                  <div className={`flex justify-between ${resurrectionInfo.requirements.memories.met ? 'text-green-400' : 'text-red-400'}`}>
                    <span>Memories</span>
                    <span>{resurrectionInfo.requirements.memories.have}/{resurrectionInfo.requirements.memories.required} {resurrectionInfo.requirements.memories.met ? '✓' : '✗'}</span>
                  </div>
                  <div className={`flex justify-between ${resurrectionInfo.requirements.descendant.met ? 'text-green-400' : 'text-red-400'}`}>
                    <span>Descendant</span>
                    <span>{resurrectionInfo.requirements.descendant.have}/{resurrectionInfo.requirements.descendant.required} {resurrectionInfo.requirements.descendant.met ? '✓' : '✗'}</span>
                  </div>
                  {resurrectionInfo.requirements.cooldown.active && (
                    <div className="text-yellow-400">
                      Cooldown until: {formatDate(resurrectionInfo.requirements.cooldown.endsAt!)}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h4 className="font-bold mb-2">Expected Restoration</h4>
                <div className={`text-lg ${QUALITY_COLORS[resurrectionInfo.restorationQuality]}`}>
                  {resurrectionInfo.restorationQuality.charAt(0).toUpperCase() + resurrectionInfo.restorationQuality.slice(1)} Quality
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {resurrectionInfo.restorationQuality === 'full'
                    ? '100% level and stats restored'
                    : resurrectionInfo.restorationQuality === 'substantial'
                    ? '75% level, 70% stats restored'
                    : '50% level and stats restored'}
                </p>
              </div>
            </div>

            {/* Ritual Form */}
            <div className="space-y-4">
              {/* Select Descendant */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h4 className="font-bold mb-3">Select Channeling Descendant *</h4>
                {resurrectionInfo.descendants.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No descendants found. Claim an egg from {resurrectionInfo.garu.name}'s legacy.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {resurrectionInfo.descendants.map(desc => (
                      <button
                        key={desc.id}
                        onClick={() => setSelectedDescendant(desc.id)}
                        className={`w-full p-3 rounded-lg text-left transition ${
                          selectedDescendant === desc.id
                            ? 'bg-purple-600'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-bold">{desc.name}</div>
                        <div className="text-xs text-gray-400">
                          Level {desc.level} • {desc.phase}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Select Memories */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h4 className="font-bold mb-3">Select Memories</h4>

                {resurrectionInfo.memories.tracks.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-400 mb-1">🎵 Musical Tracks</div>
                    <div className="space-y-1">
                      {resurrectionInfo.memories.tracks.map(track => (
                        <button
                          key={track.id}
                          onClick={() => {
                            if (selectedMemory === track.id) return;
                            if (!selectedMemory) {
                              setSelectedMemory(track.id);
                            } else {
                              toggleAdditionalMemory(track.id);
                            }
                          }}
                          className={`w-full p-2 rounded text-left text-sm transition ${
                            selectedMemory === track.id
                              ? 'bg-purple-600'
                              : selectedAdditionalMemories.includes(track.id)
                              ? 'bg-purple-800'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          {track.title} (Lv{track.level})
                          {selectedMemory === track.id && <span className="ml-2 text-xs">Primary</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {resurrectionInfo.memories.writings.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-400 mb-1">📜 Writings</div>
                    <div className="space-y-1">
                      {resurrectionInfo.memories.writings.map(writing => (
                        <button
                          key={writing.id}
                          onClick={() => {
                            if (selectedMemory === writing.id) return;
                            if (!selectedMemory) {
                              setSelectedMemory(writing.id);
                            } else {
                              toggleAdditionalMemory(writing.id);
                            }
                          }}
                          className={`w-full p-2 rounded text-left text-sm transition ${
                            selectedMemory === writing.id
                              ? 'bg-purple-600'
                              : selectedAdditionalMemories.includes(writing.id)
                              ? 'bg-purple-800'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          {writing.title} (Lv{writing.level})
                          {selectedMemory === writing.id && <span className="ml-2 text-xs">Primary</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Select a primary memory, then click others to add them for bonus restoration.
                </p>
              </div>

              {/* Optional Rename */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <h4 className="font-bold mb-2">Rename (Optional)</h4>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={resurrectionInfo.garu.name}
                  className="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:border-purple-500"
                />
              </div>

              {/* Perform Resurrection */}
              <button
                onClick={handleResurrect}
                disabled={!resurrectionInfo.canResurrect || !selectedDescendant || !selectedMemory || performing}
                className="btn w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-4 text-lg disabled:opacity-50"
              >
                {performing ? 'Performing Ritual...' : `Resurrect ${resurrectionInfo.garu.name}`}
              </button>

              {!resurrectionInfo.canResurrect && (
                <p className="text-center text-red-400 text-sm">
                  Requirements not met. Create more memories or find a descendant.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl animate-spin">✨</div>
        </div>
      )}
    </div>
  );
}

export default function GaruResurrection() {
  return (
    <WalletProvider>
      <GaruResurrectionInner />
    </WalletProvider>
  );
}
