import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface WildEgg {
  id: number;
  territory: string;
  element: string;
  secondary?: string;
  potency: number;
  parentName?: string;
  generation: number;
  isPrimordial: boolean;
  age: string;
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

const TERRITORY_GROUPS = [
  { prefix: 'D2', name: 'Coin Roads', element: 'coin' },
  { prefix: 'D4', name: 'Fire Roads', element: 'fire' },
  { prefix: 'D6', name: 'Earth Roads', element: 'earth' },
  { prefix: 'D8', name: 'Air Roads (Wilderness)', element: 'air' },
  { prefix: 'D10', name: 'Chaos Roads', element: 'chaos' },
  { prefix: 'D12', name: 'Ether Roads', element: 'ether' },
  { prefix: 'D20', name: 'Water Roads', element: 'water' },
  { prefix: 'D100', name: 'Order Roads', element: 'order' },
];

function WildEggExplorerInner() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const [eggs, setEggs] = useState<WildEgg[]>([]);
  const [byTerritory, setByTerritory] = useState<Record<string, WildEgg[]>>({});
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [selectedEgg, setSelectedEgg] = useState<WildEgg | null>(null);
  const [claimingEgg, setClaimingEgg] = useState(false);
  const [garuName, setGaruName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch wild eggs
  useEffect(() => {
    if (!mounted) return;

    const fetchEggs = async () => {
      setLoading(true);
      try {
        const url = selectedTerritory
          ? `/api/garu/death?territory=${selectedTerritory}`
          : '/api/garu/death';
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setEggs(data.eggs);
          setByTerritory(data.byTerritory || {});
          setTotalAvailable(data.totalAvailable);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchEggs();
  }, [mounted, selectedTerritory]);

  const handleClaim = async () => {
    if (!publicKey || !selectedEgg || !garuName) return;

    setClaimingEgg(true);
    setError('');

    try {
      const res = await fetch('/api/garu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          eggId: selectedEgg.id,
          garuName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data);
        setSelectedEgg(null);
        // Remove claimed egg from list
        setEggs(eggs.filter(e => e.id !== selectedEgg.id));
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClaimingEgg(false);
    }
  };

  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-pulse">🥚</div>
        <p className="text-gray-400">Loading wild eggs...</p>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-8xl mb-6">🥚</div>
        <h2 className="text-3xl font-bold mb-4 text-green-400">{success.message}</h2>

        <div className={`max-w-md mx-auto bg-gradient-to-r ${ELEMENT_COLORS[success.garu.primaryElement]} p-1 rounded-xl mb-6`}>
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-2xl font-bold">{success.garu.name}</h3>
            <p className="text-gray-400">
              {success.garu.parentLegacy} • Generation {success.garu.generation}
            </p>
            <p className="text-sm mt-2">
              Primary: <span className="font-bold">{ELEMENT_NAMES[success.garu.primaryElement]}</span>
              {success.garu.secondaryElement && (
                <> • Secondary: <span className="font-bold">{ELEMENT_NAMES[success.garu.secondaryElement]}</span></>
              )}
            </p>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 max-w-lg mx-auto mb-6">
          <h4 className="font-bold mb-3">Next Steps:</h4>
          <ul className="text-left space-y-2 text-sm text-gray-300">
            {success.nextSteps?.map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <a
          href="/garu"
          className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-lg px-8"
        >
          Begin Caring for {success.garu.name} →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-2xl font-bold">{totalAvailable}</span>
          <span className="text-gray-400 ml-2">eggs waiting to be discovered</span>
        </div>
        {connected && <WalletMultiButton />}
      </div>

      {/* Territory Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedTerritory(null)}
          className={`px-3 py-1 rounded-lg text-sm transition ${
            !selectedTerritory ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          All Territories
        </button>
        {TERRITORY_GROUPS.map((group) => (
          <button
            key={group.prefix}
            onClick={() => setSelectedTerritory(`${group.prefix}OUT`)}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              selectedTerritory?.startsWith(group.prefix)
                ? `bg-gradient-to-r ${ELEMENT_COLORS[group.element]}`
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-bounce">🥚</div>
          <p className="text-gray-400 mt-4">Searching for eggs...</p>
        </div>
      ) : eggs.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-xl">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">No eggs found in this area.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try exploring other territories, or wait for Garu to fall and scatter new eggs.
          </p>
        </div>
      ) : (
        <>
          {/* Egg Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {eggs.map((egg) => (
              <button
                key={egg.id}
                onClick={() => setSelectedEgg(egg)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedEgg?.id === egg.id
                    ? 'border-purple-500 scale-105 bg-purple-900/30'
                    : 'border-gray-700 hover:border-gray-500 bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-3xl p-2 rounded-lg bg-gradient-to-br ${ELEMENT_COLORS[egg.element]}`}>
                    🥚
                  </div>
                  {egg.isPrimordial && (
                    <span className="text-xs bg-amber-600 px-2 py-0.5 rounded">Primordial</span>
                  )}
                </div>

                <div className="text-sm font-bold mb-1">
                  {ELEMENT_NAMES[egg.element]} Egg
                  {egg.secondary && <span className="text-gray-400"> + {ELEMENT_NAMES[egg.secondary]}</span>}
                </div>

                <div className="text-xs text-gray-400 space-y-0.5">
                  <div>Territory: {egg.territory}</div>
                  <div>Generation: {egg.generation}</div>
                  <div>Potency: {'⭐'.repeat(Math.min(egg.potency, 5))}</div>
                  {egg.parentName && (
                    <div className="text-purple-400">Legacy of {egg.parentName}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Claim Modal */}
          {selectedEgg && connected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedEgg(null)} />

              <div className="relative bg-gray-900 rounded-xl p-6 max-w-md w-full border border-purple-500">
                <button
                  onClick={() => setSelectedEgg(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  ✕
                </button>

                <div className="text-center mb-6">
                  <div className={`text-6xl p-4 inline-block rounded-xl bg-gradient-to-br ${ELEMENT_COLORS[selectedEgg.element]}`}>
                    🥚
                  </div>
                  <h3 className="text-xl font-bold mt-4">
                    {ELEMENT_NAMES[selectedEgg.element]} Egg
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedEgg.isPrimordial ? 'A primordial mystery' : `Legacy of ${selectedEgg.parentName}`}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Name Your Garu</label>
                  <input
                    type="text"
                    value={garuName}
                    onChange={(e) => setGaruName(e.target.value)}
                    placeholder="Enter a name (2-50 characters)"
                    maxLength={50}
                    className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleClaim}
                  disabled={claimingEgg || garuName.length < 2}
                  className="btn w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-3 disabled:opacity-50"
                >
                  {claimingEgg ? 'Claiming...' : `Claim ${garuName || 'This Egg'}`}
                </button>

                <p className="text-center text-xs text-gray-500 mt-3">
                  This will bond you to this egg for the next 25+ days
                </p>
              </div>
            </div>
          )}

          {/* Connect Wallet Prompt */}
          {selectedEgg && !connected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedEgg(null)} />

              <div className="relative bg-gray-900 rounded-xl p-6 max-w-md w-full text-center">
                <div className="text-4xl mb-4">🥚</div>
                <h3 className="text-xl font-bold mb-4">Connect Wallet to Claim</h3>
                <p className="text-gray-400 mb-6">
                  Connect your Solana wallet to claim this egg and begin your Garu journey.
                </p>
                <WalletMultiButton />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function WildEggExplorer() {
  return (
    <WalletProvider>
      <WildEggExplorerInner />
    </WalletProvider>
  );
}
