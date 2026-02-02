import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import WalletProvider from './WalletProvider';

interface Treasury {
  id: string;
  name: string;
  address: string;
  realm: string;
}

interface GiftTier {
  name: string;
  minAmount: number;
  emoji: string;
}

interface LeaderboardEntry {
  from_wallet: string;
  total_gifted: string;
  gift_count: number;
  tier: string;
  tierEmoji: string;
}

function GivingInterfaceInner() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [selectedTreasury, setSelectedTreasury] = useState<Treasury | null>(null);
  const [userTokens, setUserTokens] = useState<Array<{ mint: string; name: string; symbol: string; balance?: number }>>([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tiers, setTiers] = useState<GiftTier[]>([]);
  const [giftState, setGiftState] = useState<{
    step: 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error';
    message: string;
    txSignature?: string;
  }>({ step: 'idle', message: '' });

  // Fetch treasuries
  useEffect(() => {
    fetch('/api/gifts?action=treasuries')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreasuries(data.treasuries);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    fetch('/api/gifts?action=leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeaderboard(data.leaderboard.slice(0, 10));
          setTiers(data.tiers);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch user's tokens
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

  const handleGift = async () => {
    if (!publicKey || !signTransaction || !selectedTreasury || !selectedToken || !amount) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setGiftState({ step: 'error', message: 'Invalid amount' });
      return;
    }

    try {
      setGiftState({ step: 'preparing', message: 'Building transaction...' });

      const prepareRes = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          fromWallet: publicKey.toBase58(),
          treasuryId: selectedTreasury.id,
          tokenMint: selectedToken,
          amount: amountNum,
          message: message || null,
          isAnonymous,
        }),
      });

      const prepareData = await prepareRes.json();

      if (!prepareData.success) {
        setGiftState({ step: 'error', message: prepareData.error || 'Failed to prepare gift' });
        return;
      }

      setGiftState({ step: 'signing', message: 'Please sign the transaction...' });

      const txBytes = Uint8Array.from(atob(prepareData.transaction), c => c.charCodeAt(0));
      const transaction = Transaction.from(txBytes);
      const signedTx = await signTransaction(transaction);

      setGiftState({ step: 'confirming', message: 'Submitting to Solana network...' });

      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      // Confirm with backend
      await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          giftId: prepareData.giftId,
          txSignature: signature,
        }),
      });

      setGiftState({
        step: 'success',
        message: `Gift complete! You've reached ${prepareData.tierEmoji} ${prepareData.tier} tier!`,
        txSignature: signature,
      });

      // Refresh leaderboard
      const leaderRes = await fetch('/api/gifts?action=leaderboard');
      const leaderData = await leaderRes.json();
      if (leaderData.success) {
        setLeaderboard(leaderData.leaderboard.slice(0, 10));
      }

      setAmount('');
      setMessage('');

    } catch (error: any) {
      setGiftState({ step: 'error', message: error.message || 'Gift failed' });
    }
  };

  const realmColors: Record<string, string> = {
    QLX: 'from-green-600 to-green-800',
    QLY: 'from-orange-600 to-orange-800',
    QLZ: 'from-purple-600 to-purple-800',
    GCN: 'from-blue-600 to-blue-800',
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🎁</div>
        <h2 className="text-2xl font-bold mb-2">Treasury Giving</h2>
        <p className="text-gray-400 mb-6">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🎁</div>
        <h2 className="text-2xl font-bold mb-2">Treasury Giving</h2>
        <p className="text-gray-400 mb-6">
          Gift tokens to the Commons Treasury and support the Quillverse ecosystem.
          <br />
          <span className="text-green-400 text-sm italic">"We compete to give, not take."</span>
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Gift Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">🎁 Give to Treasury</h2>

          {/* Treasury Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {treasuries.map(treasury => (
              <button
                key={treasury.id}
                onClick={() => setSelectedTreasury(treasury)}
                className={`p-4 rounded-lg border transition bg-gradient-to-br ${
                  selectedTreasury?.id === treasury.id
                    ? `${realmColors[treasury.realm]} border-white`
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <p className="font-bold text-sm">{treasury.id}</p>
                <p className="text-xs text-gray-300">{treasury.realm}</p>
              </button>
            ))}
          </div>

          {selectedTreasury && (
            <>
              <div className="p-3 bg-gray-800 rounded-lg mb-4">
                <p className="text-sm text-gray-400">Sending to:</p>
                <p className="font-bold">{selectedTreasury.name}</p>
                <p className="text-xs font-mono text-gray-500 break-all">{selectedTreasury.address}</p>
              </div>

              {/* Token Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Token to Gift</label>
                {userTokens.length > 0 ? (
                  <select
                    className="input w-full"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
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
                    type="text"
                    className="input w-full"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    placeholder="Token mint address"
                  />
                )}
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                <input
                  type="number"
                  className="input w-full text-2xl"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Message (optional)</label>
                <input
                  type="text"
                  className="input w-full"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A note for the treasury..."
                  maxLength={200}
                />
              </div>

              {/* Anonymous */}
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">Give anonymously</span>
              </label>

              {/* Status */}
              {giftState.step !== 'idle' && (
                <div className={`p-4 rounded-lg mb-4 ${
                  giftState.step === 'error' ? 'bg-red-900/30 border border-red-500' :
                  giftState.step === 'success' ? 'bg-green-900/30 border border-green-500' :
                  'bg-blue-900/30 border border-blue-500'
                }`}>
                  <p className={
                    giftState.step === 'error' ? 'text-red-400' :
                    giftState.step === 'success' ? 'text-green-400' :
                    'text-blue-400'
                  }>
                    {giftState.message}
                  </p>
                  {giftState.txSignature && (
                    <a
                      href={`https://solscan.io/tx/${giftState.txSignature}`}
                      target="_blank"
                      className="text-xs text-purple-400 hover:underline"
                    >
                      View on Solscan →
                    </a>
                  )}
                  {(giftState.step === 'error' || giftState.step === 'success') && (
                    <button
                      onClick={() => setGiftState({ step: 'idle', message: '' })}
                      className="block mt-2 text-sm text-gray-400 hover:text-white"
                    >
                      {giftState.step === 'success' ? 'Give Again' : 'Try Again'}
                    </button>
                  )}
                </div>
              )}

              {/* Give Button */}
              {(giftState.step === 'idle' || giftState.step === 'error') && (
                <button
                  onClick={handleGift}
                  disabled={!selectedToken || !amount || parseFloat(amount) <= 0}
                  className="btn-primary w-full py-3 text-lg disabled:opacity-50"
                >
                  Give to {selectedTreasury.id} Treasury
                </button>
              )}
            </>
          )}
        </div>

        {/* Gift Tiers */}
        <div className="card">
          <h3 className="font-bold mb-4">Gift Tiers</h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {tiers.map(tier => (
              <div key={tier.name} className="p-2 bg-gray-800 rounded">
                <p className="text-2xl">{tier.emoji}</p>
                <p className="font-bold">{tier.name}</p>
                <p className="text-gray-500">{(tier.minAmount / 1_000_000).toLocaleString()}+</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <h3 className="font-bold mb-4">🏆 Hall of Givers</h3>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No gifts yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.from_wallet}
                className="flex items-center gap-3 p-2 rounded bg-gray-800"
              >
                <span className="text-lg font-bold text-gray-500 w-6">{i + 1}</span>
                <span className="text-xl">{entry.tierEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs truncate">{entry.from_wallet}</p>
                  <p className="text-xs text-gray-400">{entry.tier}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">
                    {(Number(entry.total_gifted) / 1_000_000).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{entry.gift_count} gifts</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-700">
          <WalletMultiButton />
        </div>
      </div>
    </div>
  );
}

export default function GivingInterface() {
  return (
    <WalletProvider>
      <GivingInterfaceInner />
    </WalletProvider>
  );
}
