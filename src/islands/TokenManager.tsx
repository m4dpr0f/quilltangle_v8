import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import WalletProvider from './WalletProvider';

interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creatorWallet: string;
  nationName: string;
  tek8Guild: string;
  phase: string;
  createdAt: string;
}

interface MetadataStatus {
  hasMetaplex: boolean;
  metadataPDA: string;
}

interface OnChainInfo {
  exists: boolean;
  decimals?: number;
  supply?: string;
  mintAuthority?: string | null;
}

function TokenManagerInner() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [metadata, setMetadata] = useState<MetadataStatus | null>(null);
  const [onChain, setOnChain] = useState<OnChainInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSymbol, setEditSymbol] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Fetch user's tokens
  useEffect(() => {
    if (!publicKey) return;

    setLoading(true);
    fetch(`/api/launchpad/create?wallet=${publicKey.toBase58()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.launches) {
          setTokens(data.launches.filter((l: any) => l.token_mint).map((l: any) => ({
            mint: l.token_mint,
            name: l.name,
            symbol: l.symbol,
            description: l.description || '',
            imageUrl: l.image_url || '',
            creatorWallet: l.creator_wallet,
            nationName: l.nation_name || '',
            tek8Guild: l.tek8_guild || '',
            phase: l.phase,
            createdAt: l.created_at,
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicKey]);

  // Fetch token details when selected
  useEffect(() => {
    if (!selectedToken || !publicKey) return;

    fetch(`/api/tokens/metadata?mint=${selectedToken.mint}&wallet=${publicKey.toBase58()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetadata(data.metadata);
          setOnChain(data.onChain);
        }
      })
      .catch(console.error);
  }, [selectedToken, publicKey]);

  // Populate edit form when token selected
  useEffect(() => {
    if (selectedToken) {
      setEditName(selectedToken.name);
      setEditSymbol(selectedToken.symbol);
      setEditDescription(selectedToken.description);
      setEditImageUrl(selectedToken.imageUrl);
    }
  }, [selectedToken]);

  const handleSaveMetadata = async () => {
    if (!selectedToken || !publicKey || !signTransaction) return;

    setSaving(true);
    setMessage(null);

    try {
      // Build transaction
      const response = await fetch('/api/tokens/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenMint: selectedToken.mint,
          walletAddress: publicKey.toBase58(),
          name: editName !== selectedToken.name ? editName : undefined,
          symbol: editSymbol !== selectedToken.symbol ? editSymbol : undefined,
          description: editDescription !== selectedToken.description ? editDescription : undefined,
          imageUrl: editImageUrl !== selectedToken.imageUrl ? editImageUrl : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage({ type: 'error', text: data.error });
        return;
      }

      setMessage({ type: 'info', text: 'Please sign the transaction in your wallet...' });

      // Decode and sign transaction
      const txBytes = Uint8Array.from(atob(data.transaction), c => c.charCodeAt(0));
      const transaction = Transaction.from(txBytes);
      const signedTx = await signTransaction(transaction);

      // Submit to network
      setMessage({ type: 'info', text: 'Submitting to Solana network...' });
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(signature, 'confirmed');

      setMessage({
        type: 'success',
        text: `Metadata ${data.action === 'create' ? 'added' : 'updated'} successfully! View on Solscan: ${signature.slice(0, 8)}...`,
      });

      // Update local state
      setSelectedToken({
        ...selectedToken,
        name: editName,
        symbol: editSymbol,
        description: editDescription,
        imageUrl: editImageUrl,
      });

      // Refresh metadata status
      const refreshResponse = await fetch(`/api/tokens/metadata?mint=${selectedToken.mint}&wallet=${publicKey.toBase58()}`);
      const refreshData = await refreshResponse.json();
      if (refreshData.success) {
        setMetadata(refreshData.metadata);
      }

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update metadata' });
    } finally {
      setSaving(false);
    }
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🎨</div>
        <h2 className="text-2xl font-bold mb-2">Token Manager</h2>
        <p className="text-gray-400 mb-6">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🎨</div>
        <h2 className="text-2xl font-bold mb-2">Token Manager</h2>
        <p className="text-gray-400 mb-6">
          Connect your wallet to manage your token metadata.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">🎨 Token Manager</h2>
            <p className="text-xs text-gray-500">Edit metadata for your tokens</p>
          </div>
          <WalletMultiButton />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-gray-400">Loading your tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">You haven't created any tokens yet.</p>
            <a href="/launchpad" className="btn-primary">Launch a Token</a>
          </div>
        ) : (
          <div className="grid gap-3">
            {tokens.map((token) => (
              <button
                key={token.mint}
                onClick={() => setSelectedToken(token)}
                className={`flex items-center justify-between p-4 rounded-lg border transition text-left ${
                  selectedToken?.mint === token.mint
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  {token.imageUrl ? (
                    <img src={token.imageUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      {token.symbol?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <p className="text-sm text-purple-400">${token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{token.nationName}</p>
                  <p className="text-xs font-mono text-gray-600">{token.mint.slice(0, 8)}...</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedToken && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Edit: {selectedToken.name}</h3>

          {/* Metadata Status */}
          <div className={`p-3 rounded-lg mb-4 ${
            metadata?.hasMetaplex
              ? 'bg-green-900/30 border border-green-500/50'
              : 'bg-yellow-900/30 border border-yellow-500/50'
          }`}>
            {metadata?.hasMetaplex ? (
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-400">Metaplex metadata exists</span>
                <a
                  href={`https://solscan.io/account/${metadata.metadataPDA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-300 hover:underline ml-auto"
                >
                  View on Solscan →
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <span className="text-yellow-400">No metadata - token may not display properly in wallets</span>
              </div>
            )}
          </div>

          {/* On-chain info */}
          {onChain && (
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-gray-400">On-Chain Status</p>
                <p className={onChain.exists ? 'text-green-400' : 'text-red-400'}>
                  {onChain.exists ? '✓ Exists' : '✗ Not Found'}
                </p>
              </div>
              {onChain.supply && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-gray-400">Supply</p>
                  <p className="text-white">{Number(onChain.supply) / 1e6} tokens</p>
                </div>
              )}
            </div>
          )}

          {/* Edit Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Token Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input w-full"
                maxLength={32}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Symbol</label>
              <input
                type="text"
                value={editSymbol}
                onChange={(e) => setEditSymbol(e.target.value.toUpperCase())}
                className="input w-full"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="input w-full h-24"
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Image URL</label>
              <input
                type="url"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                className="input w-full"
                placeholder="https://..."
              />
              {editImageUrl && (
                <img
                  src={editImageUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg mt-2 object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg ${
                message.type === 'error' ? 'bg-red-900/30 border border-red-500/50 text-red-400' :
                message.type === 'success' ? 'bg-green-900/30 border border-green-500/50 text-green-400' :
                'bg-blue-900/30 border border-blue-500/50 text-blue-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveMetadata}
              disabled={saving}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {metadata?.hasMetaplex ? 'Updating...' : 'Adding Metadata...'}
                </span>
              ) : (
                metadata?.hasMetaplex ? 'Update Metadata' : 'Add Metadata to Token'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              This will create an on-chain transaction that requires your signature.
              {!metadata?.hasMetaplex && ' Adding metadata costs ~0.01 SOL for rent.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TokenManager() {
  return (
    <WalletProvider>
      <TokenManagerInner />
    </WalletProvider>
  );
}
