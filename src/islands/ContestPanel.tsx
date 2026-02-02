import { useState, useEffect } from 'react';

interface ContestPanelProps {
  roadId: string;
  territoryStatus: string;
  defenseLevel: number;
  totalStaked: number;
  controllerNation: {
    id: number;
    name: string;
    emoji: string;
  } | null;
  activeContest: any | null;
  userNation: {
    id: number;
    name: string;
    emoji: string;
  } | null;
  walletAddress: string | null;
  onContestChange: () => void;
}

const DICE_OPTIONS = [
  { type: 'D2', element: 'Coin', color: 'yellow', desc: 'Luck-based (50/50)' },
  { type: 'D4', element: 'Fire', color: 'red', desc: 'Fast strikes' },
  { type: 'D6', element: 'Earth', color: 'green', desc: 'Stable power' },
  { type: 'D8', element: 'Air', color: 'cyan', desc: 'Agile attacks' },
  { type: 'D10', element: 'Chaos', color: 'orange', desc: 'Wild variance' },
  { type: 'D12', element: 'Ether', color: 'purple', desc: 'Processing' },
  { type: 'D20', element: 'Water', color: 'blue', desc: 'Flow power' },
  { type: 'D100', element: 'Order', color: 'white', desc: 'Maximum range' },
];

// Element advantages for display
const ELEMENT_TIPS: Record<string, string> = {
  D4: 'Fire beats Earth (D6)',
  D6: 'Earth beats Water (D20)',
  D8: 'Air beats Fire (D4)',
  D10: 'Chaos is unpredictable!',
  D12: 'Ether is neutral',
  D20: 'Water beats Air (D8)',
  D100: 'Order beats Chaos (D10)',
  D2: 'Coin flip luck!',
};

export default function ContestPanel({
  roadId,
  territoryStatus,
  defenseLevel,
  totalStaked,
  controllerNation,
  activeContest,
  userNation,
  walletAddress,
  onContestChange,
}: ContestPanelProps) {
  const [burnAmount, setBurnAmount] = useState('');
  const [selectedDice, setSelectedDice] = useState('D10');
  const [attacking, setAttacking] = useState(false);
  const [defending, setDefending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [rollingDice, setRollingDice] = useState<string | null>(null);

  // Calculate minimum burn
  const minBurn = Math.max(10000, Math.floor(totalStaked * 0.1), defenseLevel * 1000);

  // Time remaining for active contest
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!activeContest?.defense_deadline) return;

    const updateTime = () => {
      const deadline = new Date(activeContest.defense_deadline);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('EXPIRED');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeContest]);

  // Dice roll animation
  const animateDiceRoll = (diceType: string, finalRoll: number) => {
    setShowDiceRoll(true);
    setRollingDice(diceType);

    // Animate for 2 seconds
    setTimeout(() => {
      setRollingDice(null);
    }, 2000);
  };

  const handleAttack = async () => {
    if (!walletAddress || !userNation || !burnAmount) return;

    const amount = parseInt(burnAmount);
    if (amount < minBurn) {
      setError(`Minimum burn: ${minBurn.toLocaleString()} tokens`);
      return;
    }

    setAttacking(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/territory/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadId,
          burnAmount: amount,
          walletAddress,
          diceType: selectedDice,
        }),
      });

      const data = await res.json();

      if (data.success) {
        animateDiceRoll(selectedDice, data.contest.diceRoll.roll);
        setResult({
          type: 'attack',
          ...data,
        });
        setBurnAmount('');
        onContestChange();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAttacking(false);
    }
  };

  const handleDefend = async () => {
    if (!walletAddress || !activeContest) return;

    setDefending(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/territory/defend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId: activeContest.id,
          burnAmount: parseInt(burnAmount) || 0,
          walletAddress,
        }),
      });

      const data = await res.json();

      if (data.success) {
        animateDiceRoll(data.result.defenseRoll.die, data.result.defenseRoll.roll);
        setResult({
          type: 'defense',
          ...data,
        });
        setBurnAmount('');
        onContestChange();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDefending(false);
    }
  };

  // User is the attacker of active contest
  const isAttacker = activeContest && userNation?.id === activeContest.attacker_nation_id;

  // User is the defender
  const isDefender = activeContest && controllerNation && userNation?.id === controllerNation.id;

  // Can attack (has nation, not own territory, not already contested)
  const canAttack = walletAddress &&
    userNation &&
    controllerNation &&
    userNation.id !== controllerNation.id &&
    territoryStatus !== 'contested' &&
    territoryStatus !== 'unclaimed';

  return (
    <div className="space-y-4">
      {/* Active Contest Display */}
      {activeContest && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-red-400 flex items-center gap-2">
              <span className="animate-pulse">!</span>
              TERRITORY UNDER ATTACK
            </h4>
            <span className={`text-sm font-mono ${timeRemaining === 'EXPIRED' ? 'text-red-500' : 'text-yellow-400'}`}>
              {timeRemaining}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Attacker</div>
              <div className="font-bold">
                {activeContest.attacker_emoji} {activeContest.attacker_name || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">
                Power: {Number(activeContest.attack_power).toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Defender</div>
              <div className="font-bold">
                {activeContest.defender_emoji || controllerNation?.emoji} {activeContest.defender_name || controllerNation?.name}
              </div>
              <div className="text-xs text-gray-500">
                Defense Level: {defenseLevel}
              </div>
            </div>
          </div>

          {/* Defend Form */}
          {isDefender && activeContest.status === 'pending' && (
            <div className="mt-4 pt-4 border-t border-red-800">
              <div className="text-sm text-yellow-400 mb-2">
                You are defending! Burn tokens to boost your defense.
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  className="input flex-1"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  placeholder="Burn amount (optional)"
                  min="0"
                />
                <button
                  onClick={handleDefend}
                  disabled={defending}
                  className="btn bg-green-600 hover:bg-green-500 px-4"
                >
                  {defending ? 'Defending...' : 'DEFEND'}
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Your defense level ({defenseLevel}) provides passive bonus even without burning.
              </div>
            </div>
          )}

          {isAttacker && (
            <div className="mt-4 pt-4 border-t border-red-800 text-sm text-gray-400">
              Waiting for defender response... If no response within deadline, you win automatically.
            </div>
          )}
        </div>
      )}

      {/* Attack Form */}
      {canAttack && !activeContest && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <span className="text-red-400">*</span>
            Attack Territory
          </h4>

          {/* Dice Selection */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2">Select Attack Dice</label>
            <div className="grid grid-cols-4 gap-1">
              {DICE_OPTIONS.map((dice) => (
                <button
                  key={dice.type}
                  onClick={() => setSelectedDice(dice.type)}
                  className={`p-2 rounded text-xs ${
                    selectedDice === dice.type
                      ? `bg-${dice.color}-600 ring-2 ring-white`
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={`${dice.element}: ${dice.desc}`}
                >
                  <div className="font-bold">{dice.type}</div>
                  <div className="text-[10px] text-gray-300">{dice.element}</div>
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Tip: {ELEMENT_TIPS[selectedDice]}
            </div>
          </div>

          {/* Burn Amount */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">
              Burn Amount (min: {minBurn.toLocaleString()})
            </label>
            <input
              type="number"
              className="input w-full"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              placeholder={`Minimum ${minBurn.toLocaleString()} tokens`}
              min={minBurn}
            />
            <div className="text-xs text-gray-500 mt-1">
              Burned tokens are destroyed permanently for attack power.
            </div>
          </div>

          {/* Target Info */}
          <div className="bg-gray-900 p-3 rounded mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Target Defense:</span>
              <span className="font-bold">{defenseLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Staked Tokens:</span>
              <span className="font-mono">{totalStaked.toLocaleString()}</span>
            </div>
          </div>

          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

          <button
            onClick={handleAttack}
            disabled={attacking || !burnAmount || parseInt(burnAmount) < minBurn}
            className="btn w-full bg-red-600 hover:bg-red-500 disabled:opacity-50"
          >
            {attacking ? 'Attacking...' : `ATTACK with ${selectedDice}`}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`rounded-lg p-4 ${
          result.type === 'attack' ? 'bg-orange-900/30 border border-orange-500' :
          result.result?.winner === 'defender' ? 'bg-green-900/30 border border-green-500' :
          'bg-red-900/30 border border-red-500'
        }`}>
          <h4 className="font-bold mb-2">
            {result.type === 'attack' ? 'Attack Launched!' :
             result.result?.winner === 'defender' ? 'VICTORY! Territory Defended!' :
             'DEFEAT! Territory Lost!'}
          </h4>
          <p className="text-sm">{result.narrative}</p>

          {result.contest?.diceRoll && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl">{result.contest.diceRoll.die}</span>
              <span className="text-3xl font-bold">
                {result.contest.diceRoll.roll}
              </span>
              {result.contest.diceRoll.critical && (
                <span className="text-yellow-400 text-xs">CRITICAL!</span>
              )}
            </div>
          )}

          {result.result && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>Attack: {result.result.attackPower}</div>
              <div>Defense: {result.result.defensePower}</div>
            </div>
          )}
        </div>
      )}

      {/* Dice Roll Animation */}
      {showDiceRoll && rollingDice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl font-bold animate-bounce mb-4">
              {rollingDice}
            </div>
            <div className="text-2xl text-gray-400 animate-pulse">
              Rolling...
            </div>
          </div>
        </div>
      )}

      {/* Info when can't attack */}
      {!canAttack && !activeContest && territoryStatus !== 'unclaimed' && (
        <div className="text-sm text-gray-400 text-center py-4">
          {!walletAddress && 'Connect wallet to attack'}
          {walletAddress && !userNation && 'Found a nation first to attack territories'}
          {userNation && controllerNation && userNation.id === controllerNation.id && 'This is your territory'}
        </div>
      )}
    </div>
  );
}
