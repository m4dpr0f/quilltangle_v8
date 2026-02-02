import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Garu {
  id: number;
  name: string;
  phase: 'egg' | 'hatched';
  level: number;
  primaryElement: string;
  riderBond: number;
  stats: Record<string, number>;
}

interface CareStatus {
  petals: { dimension: string; completed: boolean; notes: string | null }[];
  completedCount: number;
  allComplete: boolean;
  instrumentPracticed: boolean;
  instrumentMinutes: number;
}

interface Streak {
  current: number;
  totalDays: number;
  totalDimensions: number;
}

const DIMENSION_INFO: Record<string, { icon: string; label: string; prompt: string; element: string }> = {
  physical: {
    icon: '💪',
    label: 'Physical',
    prompt: 'How did you move your body today?',
    element: 'earth',
  },
  emotional: {
    icon: '💙',
    label: 'Emotional',
    prompt: 'What feelings came up today?',
    element: 'water',
  },
  intellectual: {
    icon: '🧠',
    label: 'Intellectual',
    prompt: 'What did you learn today?',
    element: 'air',
  },
  social: {
    icon: '👥',
    label: 'Social',
    prompt: 'How did you connect with others?',
    element: 'coin',
  },
  occupational: {
    icon: '🔥',
    label: 'Occupational',
    prompt: 'What meaningful work did you do?',
    element: 'fire',
  },
  spiritual: {
    icon: '✨',
    label: 'Spiritual',
    prompt: 'How did you nourish your spirit?',
    element: 'ether',
  },
  environmental: {
    icon: '🌿',
    label: 'Environmental',
    prompt: 'How did you care for your space?',
    element: 'earth',
  },
  financial: {
    icon: '💰',
    label: 'Financial',
    prompt: 'How did you tend to your resources?',
    element: 'order',
  },
};

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

function GaruCareInner() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const [garu, setGaru] = useState<Garu | null>(null);
  const [care, setCare] = useState<CareStatus | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeDimension, setActiveDimension] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  // Instrument practice
  const [showInstrument, setShowInstrument] = useState(false);
  const [instrumentMinutes, setInstrumentMinutes] = useState(15);
  const [instrumentName, setInstrumentName] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Garu and care status
  useEffect(() => {
    if (!publicKey || !mounted) return;

    const fetchCare = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/garu/care?wallet=${publicKey.toBase58()}`);
        const data = await res.json();

        if (data.success) {
          setGaru(data.garu);
          setCare(data.todaysCare);
          setStreak(data.streak);
        } else if (!data.hasGaru) {
          setError('noGaru');
        } else {
          setError(data.error);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCare();
  }, [publicKey, mounted]);

  const handleCare = async (dimension: string) => {
    if (!publicKey || !garu) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/garu/care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          garuId: garu.id,
          dimension,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        if (care) {
          const updatedPetals = care.petals.map(p =>
            p.dimension === dimension ? { ...p, completed: true, notes } : p
          );
          setCare({
            ...care,
            petals: updatedPetals,
            completedCount: data.todaysCare.completedCount,
            allComplete: data.todaysCare.allComplete,
          });
        }

        setGaru(g => g ? {
          ...g,
          level: data.garu.level,
          riderBond: data.garu.riderBond,
        } : null);

        setStreak(s => s ? { ...s, current: data.garu.careStreak } : null);

        setShowSuccess(data.message);
        setTimeout(() => setShowSuccess(null), 3000);

        setActiveDimension(null);
        setNotes('');
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInstrumentPractice = async () => {
    if (!publicKey || !garu) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/garu/care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          garuId: garu.id,
          instrumentPracticed: true,
          instrumentMinutes,
          instrumentName: instrumentName || 'Unknown instrument',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCare(c => c ? {
          ...c,
          instrumentPracticed: true,
          instrumentMinutes: (c.instrumentMinutes || 0) + instrumentMinutes,
        } : null);

        setShowSuccess(`🎵 ${instrumentMinutes} minutes logged!`);
        setTimeout(() => setShowSuccess(null), 3000);
        setShowInstrument(false);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-pulse">🥚</div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🥚</div>
        <h1 className="text-3xl font-bold mb-4">Garu Care</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to care for your Garu</p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-bounce">🥚</div>
        <p className="text-gray-400">Loading your Garu...</p>
      </div>
    );
  }

  if (error === 'noGaru') {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🔮</div>
        <h1 className="text-3xl font-bold mb-4">No Garu Found</h1>
        <p className="text-gray-400 mb-8">
          You're currently a Chaos Shard. Find and claim an egg to begin your journey!
        </p>
        <a href="/garu/eggs" className="btn bg-purple-600 hover:bg-purple-500">
          Find Wild Eggs →
        </a>
      </div>
    );
  }

  if (!garu || !care) {
    return (
      <div className="text-center py-20 text-red-400">
        {error || 'Failed to load Garu'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {showSuccess}
        </div>
      )}

      {/* Garu Header */}
      <div className={`bg-gradient-to-r ${ELEMENT_COLORS[garu.primaryElement]} p-1 rounded-xl mb-8`}>
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl">
                {garu.phase === 'egg' ? '🥚' : '🐦'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{garu.name}</h1>
                <p className="text-gray-400">
                  Level {garu.level} • {garu.primaryElement.charAt(0).toUpperCase() + garu.primaryElement.slice(1)} Garu
                </p>
                <p className="text-sm text-purple-400">
                  {garu.phase === 'egg' ? 'Egg Phase - Contemplating' : 'Hatched - Journeying'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-400">Rider Bond</div>
              <div className="text-2xl font-bold text-pink-400">{garu.riderBond}%</div>
              <div className="w-24 h-2 bg-gray-800 rounded-full mt-1">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full transition-all"
                  style={{ width: `${garu.riderBond}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak Display */}
          {streak && streak.current > 0 && (
            <div className="mt-4 flex items-center gap-2 text-amber-400">
              <span className="text-xl">🔥</span>
              <span className="font-bold">{streak.current} day streak!</span>
              <span className="text-gray-500 text-sm">
                ({streak.totalDays} total days of care)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Today's Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Today's Care</h2>
          <span className="text-sm text-gray-400">
            {care.completedCount}/8 dimensions
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              care.allComplete
                ? 'bg-gradient-to-r from-yellow-400 via-green-500 to-purple-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-400'
            }`}
            style={{ width: `${(care.completedCount / 8) * 100}%` }}
          />
        </div>
        {care.allComplete && (
          <p className="text-center text-green-400 mt-2 animate-pulse">
            🌟 All 8 dimensions complete! +50 bonus XP
          </p>
        )}
      </div>

      {/* Wellness Petals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {care.petals.map((petal) => {
          const info = DIMENSION_INFO[petal.dimension];
          const isActive = activeDimension === petal.dimension;

          return (
            <button
              key={petal.dimension}
              onClick={() => {
                if (petal.completed) return;
                setActiveDimension(isActive ? null : petal.dimension);
                setNotes('');
              }}
              disabled={petal.completed}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                petal.completed
                  ? 'bg-green-900/30 border-green-500 cursor-default'
                  : isActive
                    ? 'bg-purple-900/30 border-purple-500 scale-105'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:scale-102'
              }`}
            >
              <div className="text-3xl mb-2">
                {petal.completed ? '🌸' : info.icon}
              </div>
              <div className="font-bold text-sm">{info.label}</div>
              {petal.completed && (
                <div className="absolute top-2 right-2 text-green-400 text-lg">✓</div>
              )}
              {!petal.completed && (
                <div className={`text-xs mt-1 ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>
                  Tap to log
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Dimension Input */}
      {activeDimension && (
        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{DIMENSION_INFO[activeDimension].icon}</span>
            <div>
              <h3 className="font-bold">{DIMENSION_INFO[activeDimension].label} Care</h3>
              <p className="text-sm text-gray-400">{DIMENSION_INFO[activeDimension].prompt}</p>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional: Describe what you did... (helps reflection!)"
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 resize-none h-24 mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setActiveDimension(null)}
              className="btn bg-gray-700 hover:bg-gray-600 flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => handleCare(activeDimension)}
              disabled={submitting}
              className="btn bg-green-600 hover:bg-green-500 flex-1 disabled:opacity-50"
            >
              {submitting ? 'Logging...' : `✓ Log ${DIMENSION_INFO[activeDimension].label}`}
            </button>
          </div>
        </div>
      )}

      {/* Instrument Practice */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎵</span>
            <div>
              <h3 className="font-bold">Sacred Instrument Practice</h3>
              <p className="text-sm text-gray-400">
                {care.instrumentPracticed
                  ? `${care.instrumentMinutes} minutes practiced today`
                  : 'Bonus XP and Ether boost!'}
              </p>
            </div>
          </div>

          {!showInstrument && (
            <button
              onClick={() => setShowInstrument(true)}
              className="btn bg-purple-600 hover:bg-purple-500"
            >
              {care.instrumentPracticed ? '+ More' : 'Log Practice'}
            </button>
          )}
        </div>

        {showInstrument && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400">Instrument</label>
                <input
                  type="text"
                  value={instrumentName}
                  onChange={(e) => setInstrumentName(e.target.value)}
                  placeholder="Guitar, Piano, Voice..."
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Minutes</label>
                <input
                  type="number"
                  value={instrumentMinutes}
                  onChange={(e) => setInstrumentMinutes(parseInt(e.target.value) || 0)}
                  min={1}
                  max={120}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInstrument(false)}
                className="btn bg-gray-700 hover:bg-gray-600 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleInstrumentPractice}
                disabled={submitting || instrumentMinutes < 1}
                className="btn bg-purple-600 hover:bg-purple-500 flex-1 disabled:opacity-50"
              >
                Log Practice
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Preview */}
      <div className="mt-8 bg-gray-900/50 rounded-xl p-6">
        <h3 className="font-bold mb-4">Garu Stats</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(garu.stats).map(([element, value]) => (
            <div key={element} className="text-center">
              <div className={`text-xs font-bold mb-1 bg-gradient-to-r ${ELEMENT_COLORS[element]} bg-clip-text text-transparent`}>
                {element.toUpperCase()}
              </div>
              <div className="h-16 bg-gray-800 rounded relative overflow-hidden">
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${ELEMENT_COLORS[element]} transition-all`}
                  style={{ height: `${value}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-bold">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hatching Progress (if egg) */}
      {garu.phase === 'egg' && (
        <div className="mt-8 text-center">
          <a
            href={`/garu/hatch?id=${garu.id}`}
            className="btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-lg px-8"
          >
            🐣 Check Hatching Readiness
          </a>
        </div>
      )}
    </div>
  );
}

export default function GaruCare() {
  return (
    <WalletProvider>
      <GaruCareInner />
    </WalletProvider>
  );
}
