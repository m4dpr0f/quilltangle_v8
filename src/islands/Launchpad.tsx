import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, Keypair } from '@solana/web3.js';
import WalletProvider from './WalletProvider';
import UnverifiedDisclaimer, { hasAcceptedDisclaimer, VerificationBadge } from './UnverifiedDisclaimer';

interface LaunchForm {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: string;
  initialSolLiquidity: string;
  tokenLiquidityPercent: string;
  tek8Guild: string;
  roadId: string;
  nationName: string;
  // Socials
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  // Royalties
  creatorRoyaltyPercent: string;
  distributeToHolders: boolean;
  creatorShareOfRoyalties: string; // What % of collected royalties go to creator vs holders
}

interface Launch {
  id: number;
  name: string;
  symbol: string;
  phase: string;
  token_mint?: string;
  pool_address?: string;
  image_url?: string;
  current_price?: number;
  total_supply: number;
  initial_sol_liquidity: number;
  created_at: string;
  live_at?: string;
  // Verification fields
  verification_status?: 'pending' | 'under_review' | 'verified' | 'flagged' | 'rejected';
  is_featured?: boolean;
}

const TEK8_GUILDS = [
  { id: 'D2', name: 'Coin', element: 'Luck', color: 'yellow' },
  { id: 'D4', name: 'Fire', element: 'Smiths', color: 'red' },
  { id: 'D6', name: 'Earth', element: 'Grounders', color: 'green' },
  { id: 'D8', name: 'Air', element: 'Translators', color: 'cyan' },
  { id: 'D10', name: 'Chaos', element: 'Tricksters', color: 'orange' },
  { id: 'D12', name: 'Ether', element: 'Assemblers', color: 'purple' },
  { id: 'D20', name: 'Water', element: 'Healers', color: 'blue' },
  { id: 'D100', name: 'Order', element: 'Archivists', color: 'white' },
];

const PHASE_BADGES: Record<string, { color: string; label: string }> = {
  pending_signature: { color: 'bg-yellow-600 animate-pulse', label: 'Sign Now' },
  preparation: { color: 'bg-yellow-600', label: 'Preparing' },
  seeding: { color: 'bg-blue-600', label: 'Seeding' },
  live: { color: 'bg-green-600 animate-pulse', label: 'LIVE' },
  graduated: { color: 'bg-purple-600', label: 'Graduated' },
  cancelled: { color: 'bg-gray-600', label: 'Cancelled' },
  failed: { color: 'bg-red-600', label: 'Failed' },
};

function LaunchpadInner() {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'launch' | 'my-launches' | 'discover' | 'leaderboard'>('launch');
  const [form, setForm] = useState<LaunchForm>({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    totalSupply: '1000000000',
    initialSolLiquidity: '1',
    tokenLiquidityPercent: '10',
    tek8Guild: '',
    roadId: '',
    nationName: '',
    // Socials
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    // Royalties
    creatorRoyaltyPercent: '2',
    distributeToHolders: false,
    creatorShareOfRoyalties: '50', // 50% to creator, 50% to top holders
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [myLaunches, setMyLaunches] = useState<Launch[]>([]);
  const [liveLaunches, setLiveLaunches] = useState<Launch[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [collectingRoyalties, setCollectingRoyalties] = useState<number | null>(null);
  const [royaltyInfo, setRoyaltyInfo] = useState<Record<number, any>>({});

  // Verification/disclaimer state
  const [showUnverified, setShowUnverified] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [unverifiedLaunches, setUnverifiedLaunches] = useState<Launch[]>([]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => hasAcceptedDisclaimer());

  // Handle file upload
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setImagePreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', form.symbol || form.name || 'token-image');

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setForm({ ...form, imageUrl: data.gatewayUrl });
      } else {
        setError(data.error || 'Upload failed');
        if (data.fallback) {
          setUploadMode('url');
        }
      }
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Calculate allocations
  const supply = parseInt(form.totalSupply) || 0;
  const liquidityPercent = parseInt(form.tokenLiquidityPercent) || 10;
  const treasuryDeposit = Math.max(supply * 0.01, 1_000_000);
  const liquidityTokens = Math.floor(supply * (liquidityPercent / 100));
  const creatorTokens = supply - liquidityTokens - treasuryDeposit;

  // Fetch data
  useEffect(() => {
    if (publicKey && activeTab === 'my-launches') {
      fetchMyLaunches();
    }
    if (activeTab === 'discover') {
      fetchLiveLaunches();
    }
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [publicKey, activeTab]);

  const fetchMyLaunches = async () => {
    try {
      const res = await fetch(`/api/launchpad/create?wallet=${publicKey?.toBase58()}`);
      const data = await res.json();
      if (data.success) setMyLaunches(data.launches);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLiveLaunches = async () => {
    try {
      // Fetch verified tokens by default (safe for public display)
      const res = await fetch('/api/launchpad/create?verified=true');
      const data = await res.json();
      if (data.success) setLiveLaunches(data.launches);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUnverifiedLaunches = async () => {
    try {
      // Fetch unverified tokens (only after disclaimer accepted)
      const res = await fetch('/api/launchpad/create?verified=false');
      const data = await res.json();
      if (data.success) setUnverifiedLaunches(data.launches);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/reciprocity/leaderboard?category=overall');
      const data = await res.json();
      if (data.success) setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Check royalties for a token
  const checkRoyalties = async (launch: Launch) => {
    if (!launch.token_mint) return;
    try {
      const res = await fetch(`/api/royalties/collect?mint=${launch.token_mint}`);
      const data = await res.json();
      if (data.success) {
        setRoyaltyInfo(prev => ({ ...prev, [launch.id]: data }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Collect royalties
  const collectRoyalties = async (launch: Launch) => {
    if (!publicKey || !signTransaction || !launch.token_mint) return;

    setCollectingRoyalties(launch.id);
    setError('');

    try {
      // Build the collect transaction
      const res = await fetch('/api/cron/harvest-royalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenMint: launch.token_mint,
          creatorWallet: publicKey.toBase58(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to build transaction');
        return;
      }

      // Sign and submit (browser-compatible base64 decode)
      const binaryString = atob(data.transaction);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const transaction = Transaction.from(bytes);
      const signedTx = await signTransaction(transaction);

      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      // Refresh royalty info
      await checkRoyalties(launch);

      alert(`Collected ${data.withheldFormatted} tokens! TX: ${signature.slice(0, 8)}...`);

    } catch (err: any) {
      setError(err.message || 'Failed to collect royalties');
    } finally {
      setCollectingRoyalties(null);
    }
  };

  const handleLaunch = async () => {
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Step 1: Get the transaction from server
      const res = await fetch('/api/launch/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalSupply: parseInt(form.totalSupply),
          initialSolLiquidity: parseFloat(form.initialSolLiquidity),
          tokenLiquidityPercent: parseInt(form.tokenLiquidityPercent),
          creatorWallet: publicKey.toBase58(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setResult(data);
      setStep(2);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign and submit the transaction
  const handleSignAndSubmit = async () => {
    if (!publicKey || !signTransaction || !result?.transaction) return;

    setSigning(true);
    setError('');

    try {
      // Deserialize the transaction from base64 (browser-compatible)
      const binaryString = atob(result.transaction);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const transaction = Transaction.from(bytes);

      // Sign with the user's wallet
      const signedTx = await signTransaction(transaction);

      // Submit to the blockchain
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }

      setTxSignature(signature);

      // Confirm the launch with our backend
      await fetch('/api/launch/create', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          launchId: result.launchId,
          signature,
        }),
      });

      setStep(3);

    } catch (err: any) {
      console.error('Transaction error:', err);
      // More detailed error for debugging
      const errorMsg = err.message || 'Transaction failed';
      const logs = err.logs ? `\nLogs: ${err.logs.join('\n')}` : '';
      setError(errorMsg + logs);
    } finally {
      setSigning(false);
    }
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-bold mb-4">8xM Launchpad</h1>
        <p className="text-gray-400 mb-8">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-bold mb-4">8xM Launchpad</h1>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
          Launch your nation's token with instant Meteora DLMM liquidity.
          Join the Reciprocity Challenge — compete to give, not just to win!
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            🚀 8xM Launchpad
          </h1>
          <p className="text-gray-400 text-sm">Launch tokens with instant Meteora DLMM liquidity</p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {[
          { id: 'launch', label: 'Launch Token' },
          { id: 'my-launches', label: 'My Launches' },
          { id: 'discover', label: 'Discover' },
          { id: 'leaderboard', label: '🌿 Reciprocity' },
        ].map((tab) => (
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
          </button>
        ))}
      </div>

      {/* Launch Tab */}
      {activeTab === 'launch' && (
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { num: 1, label: 'Configure' },
              { num: 2, label: 'Create Token' },
              { num: 3, label: 'Add Liquidity' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s.num ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {s.num}
                </div>
                <span className={`ml-2 text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>
                  {s.label}
                </span>
                {i < 2 && <div className={`w-16 h-0.5 mx-4 ${step > s.num ? 'bg-purple-500' : 'bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">Token Configuration</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Token Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Token Name *</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="My Awesome Token"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Symbol * (1-10 chars)</label>
                    <input
                      type="text"
                      className="input w-full uppercase"
                      placeholder="MAT"
                      maxLength={10}
                      value={form.symbol}
                      onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    />
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

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Token Image</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`px-3 py-1 text-xs rounded ${uploadMode === 'file' ? 'bg-purple-600' : 'bg-gray-700'}`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`px-3 py-1 text-xs rounded ${uploadMode === 'url' ? 'bg-purple-600' : 'bg-gray-700'}`}
                      >
                        Use URL
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploading}
                        />
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                          form.imageUrl ? 'border-green-500 bg-green-900/20' : 'border-gray-600 hover:border-purple-500'
                        }`}>
                          {uploading ? (
                            <div className="text-purple-400">Uploading to IPFS...</div>
                          ) : form.imageUrl ? (
                            <div className="flex items-center gap-3">
                              {imagePreview && (
                                <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded object-cover" />
                              )}
                              <div className="text-left">
                                <p className="text-green-400 text-sm">Uploaded to IPFS</p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{form.imageUrl}</p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-400">Drop image or click to upload</p>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP (max 5MB)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <input
                        type="url"
                        className="input w-full"
                        placeholder="https://... or ipfs://..."
                        value={form.imageUrl}
                        onChange={(e) => {
                          setForm({ ...form, imageUrl: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                      />
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                    <label className="block text-sm text-purple-400 mb-1 font-bold">Nation Name *</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Your Galactic Cluster Nation name"
                      value={form.nationName}
                      onChange={(e) => setForm({ ...form, nationName: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be your nation's identity in the MMORPG</p>
                  </div>

                  {/* Social Links */}
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm text-gray-400 font-bold">Social Links</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Website</label>
                        <input
                          type="url"
                          className="input w-full text-sm"
                          placeholder="https://..."
                          value={form.website}
                          onChange={(e) => setForm({ ...form, website: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">𝕏 Twitter</label>
                        <input
                          type="text"
                          className="input w-full text-sm"
                          placeholder="@handle"
                          value={form.twitter}
                          onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Telegram</label>
                        <input
                          type="text"
                          className="input w-full text-sm"
                          placeholder="t.me/..."
                          value={form.telegram}
                          onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Discord</label>
                        <input
                          type="text"
                          className="input w-full text-sm"
                          placeholder="discord.gg/..."
                          value={form.discord}
                          onChange={(e) => setForm({ ...form, discord: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supply & Liquidity */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Total Supply *</label>
                    <input
                      type="number"
                      className="input w-full"
                      placeholder="1000000000"
                      min={1000000}
                      value={form.totalSupply}
                      onChange={(e) => setForm({ ...form, totalSupply: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Initial SOL Liquidity</label>
                    <input
                      type="number"
                      className="input w-full"
                      placeholder="1"
                      min={0.1}
                      step={0.1}
                      value={form.initialSolLiquidity}
                      onChange={(e) => setForm({ ...form, initialSolLiquidity: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">SOL to pair with tokens in the pool</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Liquidity % of Supply</label>
                    <input
                      type="range"
                      className="w-full"
                      min={5}
                      max={50}
                      value={form.tokenLiquidityPercent}
                      onChange={(e) => setForm({ ...form, tokenLiquidityPercent: e.target.value })}
                    />
                    <p className="text-center text-purple-400 font-bold">{form.tokenLiquidityPercent}%</p>
                  </div>

                  {/* Token Allocation Preview */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold mb-3">Token Allocation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Liquidity Pool:</span>
                        <span className="text-green-400">{liquidityTokens.toLocaleString()} ({liquidityPercent}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Commons Treasury:</span>
                        <span className="text-purple-400">{treasuryDeposit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Creator Receives:</span>
                        <span className="text-white font-bold">{creatorTokens.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Creator Royalty - Token-2022 Transfer Fees */}
                  <div className="mt-4 p-3 bg-amber-900/30 border border-amber-500/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-amber-400 font-bold">Transfer Fee %</label>
                      <span className="text-xs bg-green-600 px-2 py-0.5 rounded">ENFORCED ON-CHAIN</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        className="flex-1"
                        min={0}
                        max={10}
                        step={0.5}
                        value={form.creatorRoyaltyPercent}
                        onChange={(e) => setForm({ ...form, creatorRoyaltyPercent: e.target.value })}
                      />
                      <span className="text-amber-400 font-bold w-12 text-right">{form.creatorRoyaltyPercent}%</span>
                    </div>

                    {/* Holder Distribution Toggle */}
                    {parseFloat(form.creatorRoyaltyPercent) > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-500/30">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.distributeToHolders}
                            onChange={(e) => setForm({ ...form, distributeToHolders: e.target.checked })}
                            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                          />
                          <span className="text-sm text-amber-300">Share royalties with top 10 holders</span>
                        </label>

                        {form.distributeToHolders && (
                          <div className="mt-3 p-2 bg-purple-900/30 rounded">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-gray-400">Your share:</span>
                              <span className="text-purple-400 font-bold">{form.creatorShareOfRoyalties}%</span>
                            </div>
                            <input
                              type="range"
                              className="w-full"
                              min={10}
                              max={90}
                              step={10}
                              value={form.creatorShareOfRoyalties}
                              onChange={(e) => setForm({ ...form, creatorShareOfRoyalties: e.target.value })}
                            />
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-purple-400">You: {form.creatorShareOfRoyalties}%</span>
                              <span className="text-green-400">Top 10 Holders: {100 - parseInt(form.creatorShareOfRoyalties)}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Holders earn proportionally based on their token balance
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      <strong className="text-green-400">Token-2022 Transfer Fees</strong> - automatically collected on every transfer.
                    </p>
                  </div>
                </div>
              </div>

              {/* TEK8 Guild Selection (Optional) */}
              <div className="mt-6">
                <label className="block text-sm text-gray-400 mb-2">TEK8 Guild (Optional - for MMORPG integration)</label>
                <div className="grid grid-cols-4 gap-2">
                  {TEK8_GUILDS.map((guild) => (
                    <button
                      key={guild.id}
                      type="button"
                      onClick={() => setForm({ ...form, tek8Guild: form.tek8Guild === guild.id ? '' : guild.id })}
                      className={`p-3 rounded-lg border text-left transition ${
                        form.tek8Guild === guild.id
                          ? `border-${guild.color}-500 bg-${guild.color}-900/30`
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-bold">{guild.id}</div>
                      <div className="text-xs text-gray-400">{guild.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleLaunch}
                disabled={loading || !form.name || !form.symbol || !form.totalSupply || !form.nationName}
                className="btn w-full bg-purple-600 hover:bg-purple-500 mt-6 disabled:opacity-50"
              >
                {loading ? 'Preparing Launch...' : '🚀 Prepare Launch'}
              </button>
              {(!form.nationName && form.name && form.symbol) && (
                <p className="text-yellow-400 text-sm text-center mt-2">↑ Don't forget your Nation Name</p>
              )}
            </div>
          )}

          {step === 2 && result && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-green-400">✓ Transaction Ready!</h2>

              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {imagePreview && (
                    <img src={imagePreview} alt={form.name} className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div>
                    <h3 className="font-bold text-xl">{form.name}</h3>
                    <p className="text-purple-400 font-mono">${form.symbol.toUpperCase()}</p>
                    <p className="text-sm text-gray-400">{form.nationName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Token Mint:</span>
                    <p className="font-mono text-xs truncate">{result.tokenMint}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Supply:</span>
                    <span className="ml-2">{parseInt(form.totalSupply).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Platform Fee:</span>
                    <span className="ml-2">{result.fees?.platformSOL?.toFixed(4)} SOL</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Guild:</span>
                    <span className="ml-2">{form.tek8Guild || 'None'}</span>
                  </div>
                </div>
                {/* Token-2022 Royalty Badge */}
                {result.royalties?.percent > 0 && (
                  <div className="mt-4 p-3 bg-amber-900/30 border border-amber-500/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">💰 {result.royalties.percent}% Creator Royalty</span>
                      <span className="text-xs bg-green-600 px-2 py-0.5 rounded">ENFORCED</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Token-2022 transfer fees - you automatically earn {result.royalties.percent}% on every trade
                    </p>
                  </div>
                )}
              </div>

              {/* Token Allocation Summary */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h4 className="font-bold mb-3">Token Allocation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">You Receive:</span>
                    <span className="text-green-400 font-bold">{result.allocations?.creator?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Liquidity Pool:</span>
                    <span className="text-blue-400">{result.allocations?.liquidity?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Commons Treasury:</span>
                    <span className="text-purple-400">{result.allocations?.treasury?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              {/* Sign & Launch Button */}
              <button
                onClick={handleSignAndSubmit}
                disabled={signing}
                className="btn w-full bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 py-4 text-lg disabled:opacity-50"
              >
                {signing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing Transaction...
                  </span>
                ) : (
                  '🚀 Sign & Launch Token'
                )}
              </button>

              <p className="text-center text-gray-500 text-sm mt-3">
                Your wallet will prompt you to sign the transaction
              </p>

              <button
                onClick={async () => {
                  // Cancel the pending launch in database
                  if (result?.launchId) {
                    try {
                      await fetch('/api/launch/cancel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ launchId: result.launchId }),
                      });
                    } catch (e) {
                      console.error('Failed to cancel launch:', e);
                    }
                  }
                  setStep(1);
                  setResult(null);
                }}
                className="btn w-full bg-gray-700 hover:bg-gray-600 mt-3"
              >
                ← Back to Edit
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && txSignature && (
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2 text-green-400">Token Launched!</h2>
              <p className="text-gray-300 mb-6">
                Your GCN token <strong className="text-white">${form.symbol.toUpperCase()}</strong> is now live on Solana!
              </p>

              <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Token Mint:</span>
                    <p className="font-mono text-xs break-all text-purple-400">{result?.tokenMint}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Transaction:</span>
                    <p className="font-mono text-xs break-all text-green-400">{txSignature}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener"
                  className="btn flex-1 bg-gray-700 hover:bg-gray-600"
                >
                  View on Solscan
                </a>
                <a
                  href={`https://solscan.io/token/${result?.tokenMint}`}
                  target="_blank"
                  rel="noopener"
                  className="btn flex-1 bg-purple-600 hover:bg-purple-500"
                >
                  View Token
                </a>
              </div>

              {/* Character Creation CTA */}
              <div className="bg-gradient-to-r from-green-900/50 to-purple-900/50 rounded-lg p-6 border border-green-500/50">
                <h3 className="text-xl font-bold mb-3">🎭 Complete Your Nation Profile</h3>
                <p className="text-gray-300 mb-4">
                  Now complete your nation's character by engaging all three pillars!
                </p>
                <a
                  href={`/apply/character?launch_id=${result?.launchId}&nation=${encodeURIComponent(form.nationName)}&symbol=${encodeURIComponent(form.symbol)}&mint=${result?.tokenMint}`}
                  className="btn w-full bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 text-lg"
                >
                  Continue to Character Creation →
                </a>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Complete the on-chain steps above first, then create your nation profile
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Launches Tab */}
      {activeTab === 'my-launches' && (
        <div className="space-y-4">
          {myLaunches.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No launches yet</p>
              <button
                onClick={() => setActiveTab('launch')}
                className="btn bg-purple-600 hover:bg-purple-500 mt-4"
              >
                Launch Your First Token
              </button>
            </div>
          ) : (
            myLaunches.map((launch) => (
              <div key={launch.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {launch.image_url && (
                      <img src={launch.image_url} alt={launch.name} className="w-12 h-12 rounded-full" />
                    )}
                    <div>
                      <h3 className="font-bold">{launch.name}</h3>
                      <p className="text-sm text-gray-400">{launch.symbol}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${PHASE_BADGES[launch.phase]?.color || 'bg-gray-600'}`}>
                    {PHASE_BADGES[launch.phase]?.label || launch.phase}
                  </span>
                </div>

                {/* Royalty Collection for live tokens */}
                {launch.phase === 'live' && launch.token_mint && (
                  <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-amber-400 text-sm font-bold">💰 Royalties</span>
                        {royaltyInfo[launch.id] ? (
                          <p className="text-xs text-gray-400">
                            {royaltyInfo[launch.id].withheld?.formatted?.toFixed(4) || 0} tokens pending
                          </p>
                        ) : (
                          <button
                            onClick={() => checkRoyalties(launch)}
                            className="text-xs text-purple-400 hover:underline"
                          >
                            Check available →
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => collectRoyalties(launch)}
                        disabled={collectingRoyalties === launch.id}
                        className="btn bg-amber-600 hover:bg-amber-500 text-sm py-1 px-3 disabled:opacity-50"
                      >
                        {collectingRoyalties === launch.id ? 'Collecting...' : 'Collect'}
                      </button>
                    </div>
                    {royaltyInfo[launch.id]?.feeConfig && (
                      <p className="text-xs text-gray-500 mt-1">
                        {royaltyInfo[launch.id].feeConfig.percent}% fee on transfers
                      </p>
                    )}
                  </div>
                )}

                {launch.pool_address && (
                  <div className="mt-3 text-sm">
                    <a
                      href={`https://app.meteora.ag/dlmm/${launch.pool_address}`}
                      target="_blank"
                      rel="noopener"
                      className="text-purple-400 hover:underline"
                    >
                      View on Meteora →
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Disclaimer Modal */}
          <UnverifiedDisclaimer
            isOpen={showDisclaimer}
            onAccept={() => {
              setDisclaimerAccepted(true);
              setShowDisclaimer(false);
              setShowUnverified(true);
              fetchUnverifiedLaunches();
            }}
            onDecline={() => {
              setShowDisclaimer(false);
            }}
          />

          {/* Verified Tokens Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Verified Tokens</h2>
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded border border-green-500/30">
                  Vetted by 8xM
                </span>
              </div>
              <span className="text-sm text-gray-400">{liveLaunches.length} tokens</span>
            </div>

            {liveLaunches.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-gray-900/50 rounded-lg">
                <p>No verified tokens yet.</p>
                <p className="text-sm mt-1">Launch your token and apply for verification!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {liveLaunches.map((launch) => (
                  <div key={launch.id} className="bg-gray-900 rounded-lg p-4 hover:border-green-500 border border-gray-800 transition cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {launch.image_url ? (
                          <img src={launch.image_url} alt={launch.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                            {launch.symbol?.[0]}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold">{launch.symbol}</h3>
                          <p className="text-xs text-gray-400">{launch.name}</p>
                        </div>
                      </div>
                      <VerificationBadge status={launch.verification_status || 'verified'} isFeatured={launch.is_featured} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Liquidity:</span>
                        <span className="ml-1">{launch.initial_sol_liquidity} SOL</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Supply:</span>
                        <span className="ml-1">{(launch.total_supply / 1e6).toFixed(0)}M</span>
                      </div>
                    </div>
                    {launch.pool_address && (
                      <a
                        href={`https://app.meteora.ag/dlmm/${launch.pool_address}`}
                        target="_blank"
                        rel="noopener"
                        className="btn w-full bg-green-600 hover:bg-green-500 mt-3 text-sm"
                      >
                        Trade on Meteora
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unverified Tokens Toggle */}
          <div className="border-t border-gray-800 pt-6">
            <button
              onClick={() => {
                if (!disclaimerAccepted) {
                  setShowDisclaimer(true);
                } else {
                  setShowUnverified(!showUnverified);
                  if (!showUnverified && unverifiedLaunches.length === 0) {
                    fetchUnverifiedLaunches();
                  }
                }
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showUnverified ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="flex items-center gap-2">
                {showUnverified ? 'Hide' : 'Show'} Unverified Tokens
                <span className="px-1.5 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">
                  High Risk
                </span>
              </span>
              {unverifiedLaunches.length > 0 && (
                <span className="text-gray-500">({unverifiedLaunches.length})</span>
              )}
            </button>

            {/* Unverified Tokens Grid */}
            {showUnverified && disclaimerAccepted && (
              <div className="mt-4">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">
                    These tokens have not been verified. Trade at your own risk. DYOR.
                  </p>
                </div>

                {unverifiedLaunches.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No unverified tokens currently listed.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 opacity-80">
                    {unverifiedLaunches.map((launch) => (
                      <div key={launch.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-yellow-500/50 transition">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {launch.image_url ? (
                              <img src={launch.image_url} alt={launch.name} className="w-10 h-10 rounded-full object-cover grayscale-[30%]" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center font-bold">
                                {launch.symbol?.[0]}
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-gray-300">{launch.symbol}</h3>
                              <p className="text-xs text-gray-500">{launch.name}</p>
                            </div>
                          </div>
                          <VerificationBadge status={launch.verification_status || 'pending'} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                          <div>
                            <span className="text-gray-600">Liquidity:</span>
                            <span className="ml-1">{launch.initial_sol_liquidity} SOL</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Supply:</span>
                            <span className="ml-1">{(launch.total_supply / 1e6).toFixed(0)}M</span>
                          </div>
                        </div>
                        {launch.pool_address && (
                          <a
                            href={`https://app.meteora.ag/dlmm/${launch.pool_address}`}
                            target="_blank"
                            rel="noopener"
                            className="btn w-full bg-yellow-600/50 hover:bg-yellow-600 mt-3 text-sm"
                          >
                            Trade (Unverified)
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab - Reciprocity Challenge */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-900 to-purple-900 rounded-lg p-6 text-center border border-green-500/30">
            <h2 className="text-2xl font-bold mb-2">🌿 Reciprocity Challenge</h2>
            <p className="text-green-300 italic">"Compete to Give, Not Just to Win"</p>
            <div className="mt-4 flex justify-center gap-8">
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {leaderboard?.stats?.total_nations || 0}
                </div>
                <div className="text-sm text-gray-400">Nations</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">
                  {((leaderboard?.stats?.total_qlx_given || 0) / 1e6).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-400">QLX Given</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">
                  {leaderboard?.stats?.active_alliances || 0}
                </div>
                <div className="text-sm text-gray-400">Alliances</div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'overall', label: 'Overall', icon: '🏆' },
              { id: 'giving', label: 'Greatest Givers', icon: '💝' },
              { id: 'lifeforce', label: 'Life Force', icon: '✨' },
              { id: 'nations', label: 'Nations', icon: '🏴' },
              { id: 'permanence', label: 'Eternal Builders', icon: '🏛️' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={async () => {
                  const res = await fetch(`/api/reciprocity/leaderboard?category=${cat.id}`);
                  const data = await res.json();
                  if (data.success) setLeaderboard(data);
                }}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  leaderboard?.category === cat.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Leaderboard Table */}
          {leaderboard?.leaderboard?.length > 0 ? (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
                <h3 className="font-bold text-green-400">{leaderboard.title}</h3>
                <p className="text-xs text-gray-500">{leaderboard.description}</p>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">#</th>
                    <th className="px-4 py-3 text-left text-sm">Nation</th>
                    <th className="px-4 py-3 text-left text-sm">Token</th>
                    <th className="px-4 py-3 text-left text-sm">Road</th>
                    <th className="px-4 py-3 text-right text-sm">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.leaderboard.map((entry: any, i: number) => (
                    <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.image_uri ? (
                            <img src={entry.image_uri} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {entry.symbol?.[0]}
                            </div>
                          )}
                          <span className="font-medium">{entry.nation_name || entry.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-purple-400 font-mono">${entry.symbol}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{entry.road_id || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-400">
                        {(entry.composite_score || entry.score || entry.life_force || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-gray-900/50 rounded-lg">
              <div className="text-4xl mb-3">🌱</div>
              <p>No nations yet. Launch your token and join the Reciprocity Challenge!</p>
              <button
                onClick={() => setActiveTab('launch')}
                className="btn bg-green-600 hover:bg-green-500 mt-4"
              >
                Launch a Nation
              </button>
            </div>
          )}

          {/* Rewards Section */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-green-500/20">
            <h4 className="font-bold text-green-400 mb-3">🎁 Reciprocity Rewards</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Featured placement on 8xM homepage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Priority in Rainbow Roads territory disputes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Quillverse Ambassador status
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Launchpad() {
  return (
    <WalletProvider>
      <LaunchpadInner />
    </WalletProvider>
  );
}
