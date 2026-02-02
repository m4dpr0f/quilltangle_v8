import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import WalletProvider from './WalletProvider';

interface Pool {
  mintAddress: string;
  symbol: string;
  name: string;
  nationName?: string;
  roadId?: string;
  availableBalance: number;
  imageUri?: string;
}

interface SwapState {
  step: 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error';
  message: string;
  txSignature?: string;
}

const QLX_MINT = '4ag4s7uTViKSG4BjNiYeiuYmazwhzaJy3XUqU3Fg1P9F';

function SwapInterfaceInner() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [direction, setDirection] = useState<'qlx_to_gcn' | 'gcn_to_qlx'>('qlx_to_gcn');
  const [amount, setAmount] = useState('');
  const [swapState, setSwapState] = useState<SwapState>({ step: 'idle', message: '' });
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null);

  // Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch available pools
  useEffect(() => {
    fetch('/api/swap')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPools(data.pools || []);
          setTreasuryAddress(data.treasury);
        }
      })
      .catch(console.error);
  }, []);

  // Computed values
  const fromToken = direction === 'qlx_to_gcn' ? 'QLX' : selectedPool?.symbol || '—';
  const toToken = direction === 'qlx_to_gcn' ? selectedPool?.symbol || '—' : 'QLX';
  const fromMint = direction === 'qlx_to_gcn' ? QLX_MINT : selectedPool?.mintAddress;
  const toMint = direction === 'qlx_to_gcn' ? selectedPool?.mintAddress : QLX_MINT;

  // Handle swap
  const handleSwap = async () => {
    if (!publicKey || !signTransaction || !selectedPool || !amount || !fromMint || !toMint) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSwapState({ step: 'error', message: 'Invalid amount' });
      return;
    }

    // Check pool balance for QLX → GCN direction
    if (direction === 'qlx_to_gcn' && amountNum > selectedPool.availableBalance) {
      setSwapState({
        step: 'error',
        message: `Insufficient pool balance. Available: ${selectedPool.availableBalance.toFixed(2)} ${selectedPool.symbol}`,
      });
      return;
    }

    try {
      // Step 1: Prepare the transaction
      setSwapState({ step: 'preparing', message: 'Building transaction...' });

      const prepareRes = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          fromMint,
          toMint,
          amount: amountNum,
          userWallet: publicKey.toBase58(),
        }),
      });

      const prepareData = await prepareRes.json();

      if (!prepareData.success) {
        setSwapState({ step: 'error', message: prepareData.error || 'Failed to prepare swap' });
        return;
      }

      // Step 2: Sign the transaction
      setSwapState({ step: 'signing', message: 'Please sign the transaction in your wallet...' });

      // Decode base64 transaction
      const txBytes = Uint8Array.from(atob(prepareData.transaction), c => c.charCodeAt(0));
      const transaction = Transaction.from(txBytes);

      // Sign with user's wallet
      const signedTx = await signTransaction(transaction);

      // Step 3: Submit to network
      setSwapState({ step: 'confirming', message: 'Submitting to Solana network...' });

      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed on-chain');
      }

      // Step 4: Confirm with backend
      const confirmRes = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          fromMint,
          toMint,
          amount: amountNum,
          userWallet: publicKey.toBase58(),
          txSignature: signature,
        }),
      });

      const confirmData = await confirmRes.json();

      setSwapState({
        step: 'success',
        message: `Successfully swapped ${amountNum} ${fromToken} for ${amountNum} ${toToken}!`,
        txSignature: signature,
      });

      // Refresh pools
      const poolsRes = await fetch('/api/swap');
      const poolsData = await poolsRes.json();
      if (poolsData.success) {
        setPools(poolsData.pools || []);
        // Update selected pool
        const updatedPool = poolsData.pools.find((p: Pool) => p.mintAddress === selectedPool.mintAddress);
        if (updatedPool) setSelectedPool(updatedPool);
      }

      // Reset amount
      setAmount('');

    } catch (error: any) {
      console.error('Swap error:', error);
      setSwapState({
        step: 'error',
        message: error.message || 'Swap failed. Please try again.',
      });
    }
  };

  // Reset state
  const resetSwap = () => {
    setSwapState({ step: 'idle', message: '' });
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-2xl font-bold mb-2">LotusXchange</h2>
        <p className="text-gray-400 mb-6">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-2xl font-bold mb-2">LotusXchange</h2>
        <p className="text-gray-400 mb-6">
          Swap QLX ↔ GCN tokens at 1:1 through the Commons Treasury.
          <br />
          <span className="text-green-400 text-sm italic">"Water the garden of the Quillverse together."</span>
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">🌿 LotusXchange</h2>
            <p className="text-xs text-gray-500">Reciprocity Pool Swap</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Direction Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setDirection('qlx_to_gcn')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              direction === 'qlx_to_gcn'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            QLX → GCN
          </button>
          <button
            onClick={() => setDirection('gcn_to_qlx')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              direction === 'gcn_to_qlx'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            GCN → QLX
          </button>
        </div>

        {/* Pool Selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Select GCN Token</label>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {pools.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No tokens in reciprocity pool yet.
              </div>
            ) : (
              pools.map((pool) => (
                <button
                  key={pool.mintAddress}
                  onClick={() => setSelectedPool(pool)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition ${
                    selectedPool?.mintAddress === pool.mintAddress
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {pool.imageUri ? (
                      <img src={pool.imageUri} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {pool.symbol?.[0]}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-medium">{pool.symbol}</div>
                      <div className="text-xs text-gray-500">{pool.nationName || pool.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-400">{pool.availableBalance.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">available</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Swap Form */}
        {selectedPool && (
          <>
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">You send</span>
                <span className="text-purple-400 font-mono">{fromToken}</span>
              </div>
              <input
                type="number"
                className="w-full bg-transparent text-2xl font-bold outline-none"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={swapState.step !== 'idle' && swapState.step !== 'error'}
              />
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-900">
                <span className="text-green-400">↓</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">You receive</span>
                <span className="text-green-400 font-mono">{toToken}</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {amount || '0.00'}
              </div>
              <div className="text-xs text-gray-500 mt-1">1:1 exchange rate</div>
            </div>

            {/* Swap Status */}
            {swapState.step !== 'idle' && (
              <div className={`p-4 rounded-lg mb-4 ${
                swapState.step === 'error' ? 'bg-red-900/30 border border-red-500/50' :
                swapState.step === 'success' ? 'bg-green-900/30 border border-green-500/50' :
                'bg-blue-900/30 border border-blue-500/50'
              }`}>
                <div className="flex items-center gap-3">
                  {swapState.step === 'preparing' || swapState.step === 'signing' || swapState.step === 'confirming' ? (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                  ) : swapState.step === 'success' ? (
                    <span className="text-green-400 text-xl">✓</span>
                  ) : (
                    <span className="text-red-400 text-xl">✕</span>
                  )}
                  <div>
                    <p className={`font-medium ${
                      swapState.step === 'error' ? 'text-red-400' :
                      swapState.step === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      {swapState.message}
                    </p>
                    {swapState.txSignature && (
                      <a
                        href={`https://solscan.io/tx/${swapState.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:underline"
                      >
                        View on Solscan →
                      </a>
                    )}
                  </div>
                </div>
                {(swapState.step === 'error' || swapState.step === 'success') && (
                  <button
                    onClick={resetSwap}
                    className="mt-3 text-sm text-gray-400 hover:text-white"
                  >
                    {swapState.step === 'success' ? 'Swap Again' : 'Try Again'}
                  </button>
                )}
              </div>
            )}

            {/* Swap Button */}
            {(swapState.step === 'idle' || swapState.step === 'error') && (
              <button
                onClick={handleSwap}
                disabled={!amount || parseFloat(amount) <= 0}
                className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Swap {fromToken} for {toToken}
              </button>
            )}
          </>
        )}

        {/* Info */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• 1:1 swap ratio through Commons Treasury</p>
            <p>• No slippage, no fees (beyond network tx fee)</p>
            <p>• Swaps contribute to Reciprocity Challenge scores</p>
            {treasuryAddress && (
              <p className="font-mono truncate">
                Treasury: {treasuryAddress.slice(0, 8)}...{treasuryAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SwapInterface() {
  return (
    <WalletProvider>
      <SwapInterfaceInner />
    </WalletProvider>
  );
}
