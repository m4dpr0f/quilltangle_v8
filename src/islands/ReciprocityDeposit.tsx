import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import WalletProvider from './WalletProvider';

interface UserToken {
  mint_address: string;
  name: string;
  symbol: string;
  phase: string;
  pool_balance: number;
  in_pool: boolean;
}

interface PoolInfo {
  mint_address: string;
  symbol: string;
  name: string;
  total_deposited: number;
  available_balance: number;
  total_swaps_in: number;
  total_swaps_out: number;
}

interface DepositState {
  step: 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error';
  message: string;
  txSignature?: string;
}

function ReciprocityDepositInner() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [allPools, setAllPools] = useState<PoolInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<UserToken | null>(null);
  const [manualMint, setManualMint] = useState('');
  const [amount, setAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [depositState, setDepositState] = useState<DepositState>({ step: 'idle', message: '' });

  // Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user's tokens
  useEffect(() => {
    if (!publicKey) return;

    fetch(`/api/reciprocity/deposit?wallet=${publicKey.toBase58()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserTokens(data.tokens || []);
        }
      })
      .catch(console.error);
  }, [publicKey]);

  // Fetch all pools
  useEffect(() => {
    fetch('/api/reciprocity/deposit')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAllPools(data.pools || []);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch wallet balance when token selected
  useEffect(() => {
    if (!publicKey || !connection) return;

    const mintAddress = selectedToken?.mint_address || manualMint;
    if (!mintAddress || mintAddress.length < 32) {
      setWalletBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const mintPubkey = new PublicKey(mintAddress);
        console.log('Checking balance for wallet:', publicKey.toBase58());
        console.log('Token mint:', mintAddress);

        // Try Token-2022 first (8xM uses Token-2022)
        try {
          const ata2022 = await getAssociatedTokenAddress(
            mintPubkey,
            publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );
          console.log('Token-2022 ATA:', ata2022.toBase58());
          const account = await getAccount(connection, ata2022, 'confirmed', TOKEN_2022_PROGRAM_ID);
          console.log('Token-2022 balance found:', Number(account.amount) / 1e6);
          setWalletBalance(Number(account.amount) / 1e6);
          return;
        } catch (err2022) {
          console.log('No Token-2022 account, trying standard Token Program...');
        }

        // Fallback to standard Token Program
        const ata = await getAssociatedTokenAddress(mintPubkey, publicKey);
        console.log('Standard Token ATA:', ata.toBase58());
        const account = await getAccount(connection, ata);
        console.log('Standard balance found:', Number(account.amount) / 1e6);
        setWalletBalance(Number(account.amount) / 1e6);
      } catch (err) {
        console.log('No token account found in either program:', err);
        setWalletBalance(0);
      }
    };

    fetchBalance();
  }, [publicKey, connection, selectedToken, manualMint]);

  const handleDeposit = async () => {
    const mintAddress = selectedToken?.mint_address || manualMint;
    if (!publicKey || !signTransaction || !mintAddress || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setDepositState({ step: 'error', message: 'Invalid amount' });
      return;
    }

    if (walletBalance !== null && amountNum > walletBalance) {
      const shortWallet = publicKey.toBase58().slice(0, 4) + '...' + publicKey.toBase58().slice(-4);
      setDepositState({
        step: 'error',
        message: `Insufficient balance. Wallet ${shortWallet} has ${walletBalance} tokens. Make sure you're connected with the wallet that holds the tokens.`
      });
      return;
    }

    try {
      // Step 1: Prepare
      setDepositState({ step: 'preparing', message: 'Building transaction...' });

      const prepareRes = await fetch('/api/reciprocity/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          tokenMint: mintAddress,
          amount: amountNum,
          userWallet: publicKey.toBase58(),
        }),
      });

      const prepareData = await prepareRes.json();

      if (!prepareData.success) {
        setDepositState({ step: 'error', message: prepareData.error || 'Failed to prepare deposit' });
        return;
      }

      // Step 2: Sign
      setDepositState({ step: 'signing', message: 'Please sign the transaction in your wallet...' });

      const txBytes = Uint8Array.from(atob(prepareData.transaction), c => c.charCodeAt(0));
      const transaction = Transaction.from(txBytes);
      const signedTx = await signTransaction(transaction);

      // Step 3: Submit
      setDepositState({ step: 'confirming', message: 'Submitting to Solana network...' });

      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed on-chain');
      }

      // Step 4: Confirm with backend
      const confirmRes = await fetch('/api/reciprocity/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          tokenMint: mintAddress,
          amount: amountNum,
          userWallet: publicKey.toBase58(),
          txSignature: signature,
        }),
      });

      const confirmData = await confirmRes.json();

      setDepositState({
        step: 'success',
        message: `Successfully deposited ${amountNum} tokens! They're now available for swapping.`,
        txSignature: signature,
      });

      // Refresh data
      setAmount('');
      if (walletBalance !== null) {
        setWalletBalance(walletBalance - amountNum);
      }

      // Refresh pools
      const poolsRes = await fetch('/api/reciprocity/deposit');
      const poolsData = await poolsRes.json();
      if (poolsData.success) {
        setAllPools(poolsData.pools || []);
      }

      // Refresh user tokens
      if (publicKey) {
        const tokensRes = await fetch(`/api/reciprocity/deposit?wallet=${publicKey.toBase58()}`);
        const tokensData = await tokensRes.json();
        if (tokensData.success) {
          setUserTokens(tokensData.tokens || []);
        }
      }

    } catch (error: any) {
      console.error('Deposit error:', error);
      setDepositState({
        step: 'error',
        message: error.message || 'Deposit failed. Please try again.',
      });
    }
  };

  const resetDeposit = () => {
    setDepositState({ step: 'idle', message: '' });
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🌊</div>
        <h2 className="text-2xl font-bold mb-2">Deposit to Reciprocity Pool</h2>
        <p className="text-gray-400 mb-6">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🌊</div>
        <h2 className="text-2xl font-bold mb-2">Deposit to Reciprocity Pool</h2>
        <p className="text-gray-400 mb-6">
          Deposit tokens to make them available for 1:1 swaps with QLX.
          <br />
          <span className="text-green-400 text-sm italic">"Share your tokens with the commons."</span>
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Deposit Form */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">🌊 Deposit Tokens</h2>
              <p className="text-xs text-gray-500">Add liquidity to the reciprocity pool</p>
            </div>
            <WalletMultiButton />
          </div>

          {/* Token Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Select Token</label>

            {/* User's tokens */}
            {userTokens.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500">Your launched tokens:</p>
                {userTokens.map((token) => (
                  <button
                    key={token.mint_address}
                    onClick={() => {
                      setSelectedToken(token);
                      setManualMint('');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                      selectedToken?.mint_address === token.mint_address
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {token.symbol?.[0]}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {token.in_pool ? (
                        <>
                          <div className="text-sm text-green-400">{token.pool_balance.toFixed(0)} in pool</div>
                          <div className="text-xs text-gray-500">Active</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-orange-400">Not in pool</div>
                          <div className="text-xs text-gray-500">Deposit to enable swaps</div>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Manual mint input */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Or enter token mint address:</p>
              <input
                type="text"
                className="input w-full"
                placeholder="Token mint address..."
                value={manualMint}
                onChange={(e) => {
                  setManualMint(e.target.value);
                  setSelectedToken(null);
                }}
              />
            </div>
          </div>

          {/* Amount Input */}
          {(selectedToken || manualMint.length > 30) && (
            <>
              {/* Wallet Info */}
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Connected wallet:</span>
                  <span className="font-mono text-gray-300">
                    {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-400">Token balance in this wallet:</span>
                  <span className={walletBalance === 0 ? 'text-red-400' : 'text-green-400'}>
                    {walletBalance !== null ? walletBalance.toLocaleString() : 'Loading...'}
                  </span>
                </div>
                {walletBalance === 0 && (
                  <p className="mt-2 text-yellow-400">
                    This wallet has no tokens. Connect the wallet that holds the tokens you want to deposit.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">Amount to Deposit</label>
                  {walletBalance !== null && walletBalance > 0 && (
                    <button
                      onClick={() => setAmount(walletBalance.toString())}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Max: {walletBalance.toLocaleString()}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  className="input w-full text-2xl"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                  disabled={depositState.step !== 'idle' && depositState.step !== 'error'}
                />
              </div>

              {/* Status */}
              {depositState.step !== 'idle' && (
                <div className={`p-4 rounded-lg mb-4 ${
                  depositState.step === 'error' ? 'bg-red-900/30 border border-red-500/50' :
                  depositState.step === 'success' ? 'bg-green-900/30 border border-green-500/50' :
                  'bg-blue-900/30 border border-blue-500/50'
                }`}>
                  <div className="flex items-center gap-3">
                    {depositState.step === 'preparing' || depositState.step === 'signing' || depositState.step === 'confirming' ? (
                      <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                    ) : depositState.step === 'success' ? (
                      <span className="text-green-400 text-xl">✓</span>
                    ) : (
                      <span className="text-red-400 text-xl">✕</span>
                    )}
                    <div>
                      <p className={`font-medium ${
                        depositState.step === 'error' ? 'text-red-400' :
                        depositState.step === 'success' ? 'text-green-400' :
                        'text-blue-400'
                      }`}>
                        {depositState.message}
                      </p>
                      {depositState.txSignature && (
                        <a
                          href={`https://solscan.io/tx/${depositState.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:underline"
                        >
                          View on Solscan
                        </a>
                      )}
                    </div>
                  </div>
                  {(depositState.step === 'error' || depositState.step === 'success') && (
                    <button
                      onClick={resetDeposit}
                      className="mt-3 text-sm text-gray-400 hover:text-white"
                    >
                      {depositState.step === 'success' ? 'Deposit More' : 'Try Again'}
                    </button>
                  )}
                </div>
              )}

              {/* Deposit Button */}
              {(depositState.step === 'idle' || depositState.step === 'error') && (
                <button
                  onClick={handleDeposit}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deposit to Pool
                </button>
              )}
            </>
          )}

          {/* Info */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Deposited tokens enable 1:1 QLX swaps</p>
              <p>• Anyone can swap QLX for your deposited tokens</p>
              <p>• Deposits contribute to your Reciprocity score</p>
              <p>• Tokens go to the Commons Treasury</p>
            </div>
          </div>
        </div>

        {/* Current Pools */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">🌿 Active Pools</h2>

          {allPools.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">🏜️</p>
              <p>No pools active yet.</p>
              <p className="text-sm">Be the first to deposit!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allPools.map((pool) => (
                <div
                  key={pool.mint_address}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                      {pool.symbol?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{pool.symbol}</div>
                      <div className="text-xs text-gray-500">{pool.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      {pool.available_balance.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pool.total_swaps_in + pool.total_swaps_out} swaps
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{allPools.length}</div>
                <div className="text-xs text-gray-500">Pools Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {allPools.reduce((sum, p) => sum + p.available_balance, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Liquidity</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Deposit Section */}
      <div className="card bg-gradient-to-r from-green-900/20 to-purple-900/20">
        <h2 className="text-2xl font-bold text-center mb-6">Why Deposit to the Pool?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="font-bold mb-2">Enable Trading</h3>
            <p className="text-sm text-gray-400">
              Your deposited tokens can be swapped 1:1 with QLX, creating liquidity for your token.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-bold mb-2">Earn Recognition</h3>
            <p className="text-sm text-gray-400">
              Deposits boost your Reciprocity score and appear in the Giving leaderboard.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🌳</div>
            <h3 className="font-bold mb-2">Grow the Commons</h3>
            <p className="text-sm text-gray-400">
              Tokens in the pool support the entire Quillverse ecosystem and its shared treasury.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReciprocityDeposit() {
  return (
    <WalletProvider>
      <ReciprocityDepositInner />
    </WalletProvider>
  );
}
