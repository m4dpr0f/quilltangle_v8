import { useState, useEffect } from 'react';

interface TokenMetaphysics {
  mintAddress: string;
  symbol: string;
  name: string;
  lifeForceScore: number;
  vitalityIndex: number;
  permanenceScore: number;
  totalQlxInflow: number;
  totalQlxOutflow: number;
  swapCountTotal: number;
  nationName?: string;
  roadId?: string;
}

export default function MetaphysicsDashboard() {
  const [tokens, setTokens] = useState<TokenMetaphysics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metaphysics/leaderboard/lifeforce?limit=20')
      .then(res => res.json())
      .then(data => {
        setTokens(data.leaderboard || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card text-center py-12">Loading metaphysics data...</div>;
  }

  if (tokens.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">No tokens with swap activity yet.</p>
        <p className="text-sm text-gray-500 mt-2">Create a token and start swapping to see the metaphysics index!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-4xl font-bold text-green-400">{tokens.length}</p>
          <p className="text-gray-400">Active Tokens</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-bold text-orange-400">
            {tokens.reduce((sum, t) => sum + t.swapCountTotal, 0)}
          </p>
          <p className="text-gray-400">Total Swaps</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-bold text-purple-400">
            {tokens.filter(t => t.roadId).length}
          </p>
          <p className="text-gray-400">Roads Claimed</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4">Life Force Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2">#</th>
                <th className="pb-2">Token</th>
                <th className="pb-2">Nation</th>
                <th className="pb-2">Road</th>
                <th className="pb-2 text-right">Life Force</th>
                <th className="pb-2 text-right">Vitality</th>
                <th className="pb-2 text-right">Swaps</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, i) => (
                <tr key={token.mintAddress} className="border-b border-gray-800">
                  <td className="py-2 text-gray-500">{i + 1}</td>
                  <td className="py-2">
                    <span className="font-bold">{token.symbol}</span>
                    <span className="text-gray-500 ml-2 text-xs">{token.name}</span>
                  </td>
                  <td className="py-2 text-gray-400">{token.nationName || '-'}</td>
                  <td className="py-2">
                    {token.roadId ? (
                      <span className="px-2 py-1 bg-purple-600/30 rounded text-purple-300 text-xs">
                        {token.roadId}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-2 text-right font-mono text-green-400">
                    {token.lifeForceScore.toFixed(1)}
                  </td>
                  <td className="py-2 text-right font-mono text-orange-400">
                    {token.vitalityIndex.toFixed(0)}%
                  </td>
                  <td className="py-2 text-right font-mono">{token.swapCountTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
