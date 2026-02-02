import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Memory {
  id: number;
  garuId: number;
  garuName?: string;
  type: 'track' | 'writing' | 'milestone';
  title: string;
  description?: string;
  content?: string;
  audioUrl?: string;
  snapshotLevel: number;
  snapshotBond: number;
  createdAt: string;
  element?: string;
  phase?: string;
}

interface Garu {
  id: number;
  name: string;
  level: number;
  phase: string;
  primaryElement: string;
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

const TYPE_ICONS: Record<string, string> = {
  track: '🎵',
  writing: '📜',
  milestone: '🏆',
};

function GaruMemoriesInner() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const [tab, setTab] = useState<'create' | 'view'>('create');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeGaru, setActiveGaru] = useState<Garu | null>(null);
  const [loading, setLoading] = useState(true);

  // Create memory form
  const [memoryType, setMemoryType] = useState<'track' | 'writing'>('track');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!mounted || !connected || !publicKey) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const wallet = publicKey.toBase58();

        // Get active Garu
        const garuRes = await fetch(`/api/garu?wallet=${wallet}`);
        const garuData = await garuRes.json();
        if (garuData.success && garuData.currentGaru) {
          setActiveGaru(garuData.currentGaru);

          // Get memories for this Garu
          const memRes = await fetch(`/api/garu/memory?wallet=${wallet}&garuId=${garuData.currentGaru.id}`);
          const memData = await memRes.json();
          if (memData.success) {
            setMemories(memData.memories);
          }
        }

        // Also get all memories for viewing
        const allMemRes = await fetch(`/api/garu/memory?wallet=${wallet}`);
        const allMemData = await allMemRes.json();
        if (allMemData.success && !activeGaru) {
          setMemories(allMemData.memories);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted, connected, publicKey]);

  const handleCreateMemory = async () => {
    if (!publicKey || !activeGaru) return;

    if (memoryType === 'track' && !audioUrl) {
      setError('Audio URL is required for musical tracks');
      return;
    }
    if (memoryType === 'writing' && !content) {
      setError('Content is required for writings');
      return;
    }
    if (!title) {
      setError('Title is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/garu/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          garuId: activeGaru.id,
          memoryType,
          title,
          description,
          content: memoryType === 'writing' ? content : undefined,
          audioUrl: memoryType === 'track' ? audioUrl : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data);
        setTitle('');
        setDescription('');
        setContent('');
        setAudioUrl('');

        // Refresh memories
        const memRes = await fetch(`/api/garu/memory?wallet=${publicKey.toBase58()}&garuId=${activeGaru.id}`);
        const memData = await memRes.json();
        if (memData.success) {
          setMemories(memData.memories);
        }
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
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
        <div className="text-6xl mb-4 animate-pulse">🎵</div>
        <p className="text-gray-400">Loading memories...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-12 bg-gray-900/50 rounded-xl">
        <div className="text-4xl mb-4">🎵</div>
        <h3 className="text-xl font-bold mb-4">Connect Wallet</h3>
        <p className="text-gray-400 mb-6">
          Connect your wallet to create and view memories.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl animate-pulse">🎵</div>
        <p className="text-gray-400 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setTab('create')}
          className={`pb-3 px-4 transition ${
            tab === 'create' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Create Memory
        </button>
        <button
          onClick={() => setTab('view')}
          className={`pb-3 px-4 transition ${
            tab === 'view' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          View Memories ({memories.length})
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-400">
          <div className="font-bold">{success.message}</div>
          <div className="text-sm mt-1">{success.hint}</div>
        </div>
      )}

      {/* CREATE MEMORY TAB */}
      {tab === 'create' && (
        <div>
          {!activeGaru || activeGaru.phase === 'dead' ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-4">🥚</div>
              <p className="text-gray-400">
                You need an active Garu to create memories.
              </p>
              <a href="/garu/eggs" className="btn mt-4 bg-purple-600 hover:bg-purple-500 inline-block">
                Find an Egg
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Active Garu Info */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="font-bold mb-4">Creating Memory For:</h3>
                <div className={`p-4 rounded-lg bg-gradient-to-r ${ELEMENT_COLORS[activeGaru.primaryElement]}`}>
                  <div className="text-2xl font-bold">{activeGaru.name}</div>
                  <div className="text-sm opacity-90">
                    Level {activeGaru.level} • {activeGaru.phase}
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  Memories capture a snapshot of {activeGaru.name}'s current state.
                  If they ever perish, these memories can help bring them back.
                </p>
                <div className="mt-4 p-3 bg-amber-900/30 rounded-lg text-amber-400 text-sm">
                  <strong>Tip:</strong> Create musical tracks regularly!
                  3+ tracks enable full level restoration during resurrection.
                </div>
              </div>

              {/* Create Form */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setMemoryType('track')}
                    className={`flex-1 p-4 rounded-lg transition ${
                      memoryType === 'track'
                        ? 'bg-purple-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">🎵</div>
                    <div className="font-bold">Musical Track</div>
                    <div className="text-xs text-gray-400">Record a song</div>
                  </button>
                  <button
                    onClick={() => setMemoryType('writing')}
                    className={`flex-1 p-4 rounded-lg transition ${
                      memoryType === 'writing'
                        ? 'bg-purple-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">📜</div>
                    <div className="font-bold">Journal Entry</div>
                    <div className="text-xs text-gray-400">Write your thoughts</div>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={memoryType === 'track' ? 'Song for the Road' : 'Day 15 - First Flight'}
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A brief note about this memory..."
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500"
                    />
                  </div>

                  {memoryType === 'track' ? (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Audio URL * (IPFS, SoundCloud, etc.)</label>
                      <input
                        type="url"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload your track to IPFS or a music platform first
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Journal Entry *</label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write about your journey with your Garu..."
                        rows={6}
                        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 resize-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleCreateMemory}
                    disabled={creating}
                    className="btn w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-3 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : `Create ${memoryType === 'track' ? 'Musical' : 'Written'} Memory`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MEMORIES TAB */}
      {tab === 'view' && (
        <div>
          {memories.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-400">No memories created yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Create musical tracks and journal entries to preserve your Garu's legacy.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {memories.map(memory => (
                <div
                  key={memory.id}
                  className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl p-2 rounded-lg ${
                        memory.element ? `bg-gradient-to-br ${ELEMENT_COLORS[memory.element]}` : 'bg-gray-800'
                      }`}>
                        {TYPE_ICONS[memory.type]}
                      </div>
                      <div>
                        <div className="font-bold">{memory.title}</div>
                        <div className="text-sm text-gray-400">
                          {memory.garuName && `${memory.garuName} • `}
                          {formatDate(memory.createdAt)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded capitalize">
                      {memory.type}
                    </span>
                  </div>

                  {memory.description && (
                    <p className="text-gray-400 text-sm mb-3">{memory.description}</p>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Snapshot Level</span>
                    <span className="font-bold text-blue-400">Lv {memory.snapshotLevel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Snapshot Bond</span>
                    <span className="font-bold text-pink-400">{memory.snapshotBond}%</span>
                  </div>

                  {memory.type === 'track' && memory.audioUrl && (
                    <a
                      href={memory.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-center text-sm text-purple-400 hover:text-purple-300"
                    >
                      Listen to Track →
                    </a>
                  )}

                  {memory.type === 'writing' && memory.content && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-sm text-gray-300 max-h-24 overflow-y-auto">
                      {memory.content.substring(0, 200)}
                      {memory.content.length > 200 && '...'}
                    </div>
                  )}

                  {memory.phase === 'dead' && (
                    <div className="mt-3 p-2 bg-purple-900/30 rounded text-purple-400 text-xs text-center">
                      Can be used for resurrection
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GaruMemories() {
  return (
    <WalletProvider>
      <GaruMemoriesInner />
    </WalletProvider>
  );
}
