import { useState } from 'react';

interface Stake {
  id: number;
  amount: number;
  stake_type: string;
  staker_wallet: string;
  locked_until: string | null;
  created_at: string;
  is_active: boolean;
}

interface StakeManagerProps {
  roadId: string;
  realm: string;
  currentStakes: Stake[];
  totalStaked: number;
  defenseLevel: number;
  nationId: number | null;
  walletAddress: string | null;
  onStakeChange: () => void;
}

const LOCK_OPTIONS = [
  { days: 0, label: 'No Lock', bonus: '0%' },
  { days: 7, label: '7 Days', bonus: '+10%' },
  { days: 30, label: '30 Days', bonus: '+25%' },
  { days: 90, label: '90 Days', bonus: '+50%' },
];

export default function StakeManager({
  roadId,
  realm,
  currentStakes,
  totalStaked,
  defenseLevel,
  nationId,
  walletAddress,
  onStakeChange,
}: StakeManagerProps) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockDays, setLockDays] = useState(0);
  const [staking, setStaking] = useState(false);
  const [unstaking, setUnstaking] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Filter user's stakes
  const userStakes = currentStakes.filter(s => s.staker_wallet === walletAddress && s.is_active);

  const handleStake = async () => {
    if (!walletAddress || !nationId || !stakeAmount) return;

    setStaking(true);
    setError('');

    try {
      const res = await fetch('/api/territory/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadId,
          amount: parseInt(stakeAmount),
          lockDays: lockDays || undefined,
          walletAddress,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStakeAmount('');
        setLockDays(0);
        onStakeChange();
        if (data.territory.upgraded) {
          alert('Territory upgraded to FORTIFIED!');
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStaking(false);
    }
  };

  const handleUnstake = async (stakeId: number) => {
    if (!walletAddress) return;

    setUnstaking(stakeId);
    setError('');

    try {
      const res = await fetch('/api/territory/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeId,
          walletAddress,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onStakeChange();
        if (data.territory.downgraded) {
          alert('Warning: Territory downgraded from fortified!');
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUnstaking(null);
    }
  };

  const isLocked = (stake: Stake) => {
    if (!stake.locked_until) return false;
    return new Date(stake.locked_until) > new Date();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Calculate defense bar width (max 200 for visual)
  const defenseBarWidth = Math.min(100, (defenseLevel / 200) * 100);
  const defenseColor = defenseLevel >= 100 ? 'bg-yellow-500' : defenseLevel >= 50 ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="space-y-4">
      {/* Defense Level Display */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Defense Level</span>
          <span className={`font-bold ${defenseLevel >= 100 ? 'text-yellow-400' : 'text-green-400'}`}>
            {defenseLevel}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${defenseColor} transition-all duration-500`}
            style={{ width: `${defenseBarWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>50</span>
          <span>100 (Fortified)</span>
          <span>200</span>
        </div>
      </div>

      {/* Total Staked */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Total Staked</span>
        <span className="font-mono">{totalStaked.toLocaleString()} tokens</span>
      </div>

      {/* Stake Form */}
      {walletAddress && nationId && (
        <div className="bg-gray-800 p-4 rounded-lg space-y-3">
          <h4 className="font-bold text-sm">Add Stake</h4>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              className="input w-full"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Token amount"
              min="1"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Lock Period (Bonus)</label>
            <div className="grid grid-cols-4 gap-1">
              {LOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setLockDays(opt.days)}
                  className={`px-2 py-1 text-xs rounded ${
                    lockDays === opt.days
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {opt.label}
                  {opt.bonus !== '0%' && (
                    <span className="block text-green-400 text-[10px]">{opt.bonus}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs">{error}</div>
          )}

          <button
            onClick={handleStake}
            disabled={staking || !stakeAmount}
            className="btn-primary w-full text-sm disabled:opacity-50"
          >
            {staking ? 'Staking...' : 'Stake Tokens'}
          </button>
        </div>
      )}

      {/* User's Stakes */}
      {userStakes.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-bold text-sm mb-3">Your Stakes</h4>
          <div className="space-y-2">
            {userStakes.map((stake) => (
              <div
                key={stake.id}
                className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm"
              >
                <div>
                  <div className="font-mono">{Number(stake.amount).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">
                    {stake.stake_type} • {formatDate(stake.created_at)}
                    {stake.locked_until && isLocked(stake) && (
                      <span className="text-yellow-400 ml-1">
                        (locked until {formatDate(stake.locked_until)})
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleUnstake(stake.id)}
                  disabled={unstaking === stake.id || isLocked(stake)}
                  className={`px-3 py-1 rounded text-xs ${
                    isLocked(stake)
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {unstaking === stake.id ? '...' : isLocked(stake) ? 'Locked' : 'Unstake'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Stakes (top 5) */}
      {currentStakes.length > 0 && (
        <div className="text-xs text-gray-400">
          <div className="font-bold mb-1">Top Stakers</div>
          {currentStakes.slice(0, 5).map((stake, i) => (
            <div key={stake.id} className="flex justify-between py-1 border-b border-gray-700">
              <span className="truncate w-32">
                {i + 1}. {stake.staker_wallet.slice(0, 6)}...{stake.staker_wallet.slice(-4)}
              </span>
              <span className="font-mono">{Number(stake.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Not connected message */}
      {!walletAddress && (
        <div className="text-center text-gray-400 text-sm py-4">
          Connect wallet to stake tokens
        </div>
      )}

      {/* No nation message */}
      {walletAddress && !nationId && (
        <div className="text-center text-yellow-400 text-sm py-4">
          You need to own this territory's nation to stake
        </div>
      )}
    </div>
  );
}
