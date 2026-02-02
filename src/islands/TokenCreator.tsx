import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface TokenForm {
  name: string;
  symbol: string;
  supply: string;
  description: string;
  imageUrl: string;
}

function TokenCreatorInner() {
  const { publicKey, connected } = useWallet();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [form, setForm] = useState<TokenForm>({
    name: '',
    symbol: '',
    supply: '1000000000', // 1 billion - recommended for GCN tokens
    description: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; mintAddress?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/tokens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          supply: parseInt(form.supply),
          creatorWallet: publicKey.toBase58(),
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 mb-4">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 mb-4">Connect your wallet to create a token</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Token Details</h2>
          <WalletMultiButton />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Token Name</label>
            <input
              type="text"
              className="input w-full"
              placeholder="My Awesome Token"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Symbol (1-10 chars)</label>
            <input
              type="text"
              className="input w-full uppercase"
              placeholder="MAT"
              maxLength={10}
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Supply (recommended: 1 billion)</label>
            <input
              type="number"
              className="input w-full"
              placeholder="1000000000"
              min={1}
              max={1000000000000}
              value={form.supply}
              onChange={(e) => setForm({ ...form, supply: e.target.value })}
              required
            />
            {(() => {
              const supply = parseInt(form.supply || '0');
              const percentDeposit = supply * 0.01;
              const minDeposit = 1_000_000;
              const requiredDeposit = Math.max(percentDeposit, minDeposit);
              const effectivePercent = supply > 0 ? ((requiredDeposit / supply) * 100).toFixed(2) : '0';
              return (
                <p className="text-xs text-gray-500 mt-1">
                  Commons Treasury deposit: <span className="text-purple-400">{requiredDeposit.toLocaleString()}</span> tokens ({effectivePercent}%)
                  {percentDeposit < minDeposit && supply > 0 && (
                    <span className="text-yellow-500 ml-1">(min 1M required)</span>
                  )}
                </p>
              );
            })()}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              className="input w-full h-24 resize-none"
              placeholder="Describe your token..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Token (~0.05 SOL)'}
          </button>
        </form>

        {result && (
          <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            {result.success ? (
              <p className="text-green-400">Token created! Mint: {result.mintAddress}</p>
            ) : (
              <p className="text-red-400">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TokenCreator() {
  return (
    <WalletProvider>
      <TokenCreatorInner />
    </WalletProvider>
  );
}
