import { useState, useEffect } from 'react';

interface TreasuryWallet {
  id: string;
  token: string;
  name: string;
  pillar: string;
  icon: string;
  color: string;
  address: string;
  balance?: number;
  lastUpdated?: string;
}

interface Transaction {
  signature: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  from: string;
  to: string;
  timestamp: string;
  token: string;
}

const TREASURY_WALLETS: TreasuryWallet[] = [
  {
    id: 'qlx',
    token: 'QLX',
    name: 'QUILUX Treasury',
    pillar: 'SEED',
    icon: '🌱',
    color: 'yellow',
    address: '7xfPD1wLSjDk7FcQCX7juL9t3S6KFLZPLm9c7vPump'
  },
  {
    id: 'qly',
    token: 'QLY',
    name: 'QUILY Treasury',
    pillar: 'EGG',
    icon: '🥚',
    color: 'purple',
    address: '3PUQ877fxMgELnSmEDTtzdT7mPem7VS5Cvbb1ULtwRJy'
  },
  {
    id: 'qlz',
    token: 'QLZ',
    name: 'QUILZ Treasury',
    pillar: 'METEORITE',
    icon: '☄️',
    color: 'cyan',
    address: 'kBc5fceyjpLxhLYrtr41zoQ9GJsfkmrMd35kEtsMVkJ'
  },
  {
    id: 'platform',
    token: 'SOL',
    name: 'Platform Operations',
    pillar: 'OPERATIONS',
    icon: '⚙️',
    color: 'gray',
    address: '4wZcD1PUdzTbaVx1msgkNmqgCZv5q8T5swoSxmnkCwvA'
  }
];

export default function TreasuryControlPanel() {
  const [wallets, setWallets] = useState<TreasuryWallet[]>(TREASURY_WALLETS);
  const [selectedWallet, setSelectedWallet] = useState<string>('qlx');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');

  const selectedTreasury = wallets.find(w => w.id === selectedWallet)!;

  const fetchBalance = async (address: string) => {
    if (address.startsWith('PENDING')) return null;
    try {
      // Using public Solana RPC
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });
      const data = await response.json();
      return data.result?.value / 1e9 || 0;
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      return null;
    }
  };

  const refreshBalances = async () => {
    setIsLoading(true);
    const updatedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        const balance = await fetchBalance(wallet.address);
        return {
          ...wallet,
          balance: balance ?? wallet.balance,
          lastUpdated: new Date().toISOString()
        };
      })
    );
    setWallets(updatedWallets);
    setIsLoading(false);
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      alert('Address copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      yellow: { bg: 'bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-400' },
      purple: { bg: 'bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-400' },
      cyan: { bg: 'bg-cyan-900/30', border: 'border-cyan-500', text: 'text-cyan-400' },
      gray: { bg: 'bg-gray-800/50', border: 'border-gray-600', text: 'text-gray-400' }
    };
    return colors[color] || colors.gray;
  };

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Treasury Control Panel</h2>
          <p className="text-gray-400">Manage QLX, QLY, and QLZ treasury wallets</p>
        </div>
        <button
          onClick={refreshBalances}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Balances'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {wallets.map((wallet) => {
          const colors = getColorClasses(wallet.color);
          return (
            <button
              key={wallet.id}
              onClick={() => setSelectedWallet(wallet.id)}
              className={`${colors.bg} border ${
                selectedWallet === wallet.id ? colors.border : 'border-transparent'
              } rounded-xl p-4 text-left transition hover:border-gray-600`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{wallet.icon}</span>
                <span className={`font-bold ${colors.text}`}>{wallet.token}</span>
              </div>
              <div className="text-2xl font-bold">
                {wallet.balance !== undefined ? `${wallet.balance.toFixed(4)} SOL` : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">{wallet.pillar}</div>
            </button>
          );
        })}
      </div>

      {/* Total Balance */}
      <div className="bg-gradient-to-r from-yellow-900/20 via-purple-900/20 to-cyan-900/20 rounded-xl p-6 text-center">
        <p className="text-gray-400 mb-2">Total Treasury Balance</p>
        <p className="text-4xl font-bold">{totalBalance.toFixed(4)} SOL</p>
      </div>

      {/* Selected Wallet Details */}
      <div className={`border ${getColorClasses(selectedTreasury.color).border} rounded-2xl p-8 bg-gray-900/50`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{selectedTreasury.icon}</span>
            <div>
              <h3 className={`text-2xl font-bold ${getColorClasses(selectedTreasury.color).text}`}>
                {selectedTreasury.name}
              </h3>
              <p className="text-gray-400">{selectedTreasury.pillar} Pillar</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              {selectedTreasury.balance?.toFixed(4) || '--'} SOL
            </p>
            {selectedTreasury.lastUpdated && (
              <p className="text-xs text-gray-500">
                Updated: {new Date(selectedTreasury.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm mb-2">Wallet Address:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-gray-900 px-3 py-2 rounded font-mono overflow-x-auto">
              {selectedTreasury.address.startsWith('PENDING')
                ? 'Address not configured yet'
                : selectedTreasury.address}
            </code>
            {!selectedTreasury.address.startsWith('PENDING') && (
              <>
                <button
                  onClick={() => copyAddress(selectedTreasury.address)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  Copy
                </button>
                <a
                  href={`https://solscan.io/account/${selectedTreasury.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  Solscan
                </a>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href={`https://solscan.io/account/${selectedTreasury.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-center transition"
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm font-medium">View Transactions</div>
          </a>
          <button className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-center transition">
            <div className="text-2xl mb-1">📥</div>
            <div className="text-sm font-medium">Deposit</div>
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-center transition">
            <div className="text-2xl mb-1">📤</div>
            <div className="text-sm font-medium">Withdraw</div>
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-center transition">
            <div className="text-2xl mb-1">🔔</div>
            <div className="text-sm font-medium">Set Alerts</div>
          </button>
        </div>
      </div>

      {/* Add New Wallet */}
      <div className="border border-gray-700 rounded-xl p-6">
        <button
          onClick={() => setShowAddWallet(!showAddWallet)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <span>{showAddWallet ? '▼' : '▶'}</span>
          <span>Configure Wallet Addresses</span>
        </button>

        {showAddWallet && (
          <div className="mt-6 space-y-4">
            <p className="text-gray-400 text-sm">
              Update treasury addresses. Changes will be saved to the database.
            </p>

            {wallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center gap-4">
                <span className="w-16 text-center">{wallet.icon}</span>
                <span className="w-20 font-bold">{wallet.token}</span>
                <input
                  type="text"
                  value={wallet.address}
                  onChange={(e) => {
                    setWallets(wallets.map(w =>
                      w.id === wallet.id ? { ...w, address: e.target.value } : w
                    ));
                  }}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm"
                  placeholder="Solana wallet address..."
                />
              </div>
            ))}

            <button className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-lg font-bold transition">
              Save Addresses
            </button>
          </div>
        )}
      </div>

      {/* Monitor Info */}
      <div className="bg-gray-800/30 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm">
          Treasury monitoring powered by Solscan API.
          <br />
          Incoming donations are tracked and benefits applied automatically.
        </p>
      </div>
    </div>
  );
}
