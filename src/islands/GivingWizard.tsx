import { useState } from 'react';

interface Treasury {
  token: string;
  name: string;
  symbol: string;
  pillar: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  address: string;
  benefits: string[];
}

const TREASURIES: Treasury[] = [
  {
    token: 'QLX',
    name: 'QUILUX Treasury',
    symbol: '$QLX',
    pillar: 'SEED',
    icon: '🌱',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-600',
    borderColor: 'border-yellow-500',
    address: '4ag4s7uTViKSG4BjNiYeiuYmazwhzaJy3XUqU3Fg1P9F',
    benefits: [
      'Sacred Instrument NFT airdrop eligibility',
      'Priority access to music challenges',
      'Quillverse Hall of Givers recognition',
      'Bonus XP multiplier in typing races'
    ]
  },
  {
    token: 'QLY',
    name: 'QUILY Treasury',
    symbol: '$QLY',
    pillar: 'EGG',
    icon: '🥚',
    color: 'text-purple-400',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-500',
    address: '3PUQ877fxMgELnSmEDTtzdT7mPem7VS5Cvbb1ULtwRJy',
    benefits: [
      'GCN application priority review',
      'Reduced road claim fees',
      '8xM partner network access',
      'Crowdfunding boost visibility'
    ]
  },
  {
    token: 'QLZ',
    name: 'QUILZ Treasury',
    symbol: '$QLZ',
    pillar: 'METEORITE',
    icon: '☄️',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-600',
    borderColor: 'border-cyan-500',
    address: 'kBc5fceyjpLxhLYrtr41zoQ9GJsfkmrMd35kEtsMVkJ',
    benefits: [
      'Early access to new tech features',
      'Innovation showcase spotlight',
      'API & tool priority access',
      'Builder community membership'
    ]
  }
];

const GIFT_TIERS = [
  { name: 'Seedling', min: 0.1, color: 'text-green-400', badge: '🌿' },
  { name: 'Sapling', min: 1, color: 'text-blue-400', badge: '🌲' },
  { name: 'Grove', min: 10, color: 'text-purple-400', badge: '🏔️' },
  { name: 'Forest', min: 100, color: 'text-yellow-400', badge: '🌟' },
  { name: 'World Tree', min: 1000, color: 'text-orange-400', badge: '🌳✨' }
];

export default function GivingWizard() {
  const [selectedTreasury, setSelectedTreasury] = useState<string>('QLY');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);

  const treasury = TREASURIES.find(t => t.token === selectedTreasury)!;

  const copyAddress = async (address: string, token: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(token);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getSolscanUrl = (address: string) => {
    return `https://solscan.io/account/${address}`;
  };

  return (
    <div className="space-y-8">
      {/* Treasury Selector */}
      <div className="flex justify-center gap-4 flex-wrap">
        {TREASURIES.map((t) => (
          <button
            key={t.token}
            onClick={() => setSelectedTreasury(t.token)}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              selectedTreasury === t.token
                ? `${t.bgColor} scale-105 shadow-lg`
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{t.icon}</span>
            Give {t.token}
          </button>
        ))}
      </div>

      {/* Selected Treasury Card */}
      <div className={`border ${treasury.borderColor} rounded-2xl p-8 bg-gradient-to-br from-gray-900 to-gray-800`}>
        <div className="text-center mb-6">
          <span className="text-6xl">{treasury.icon}</span>
          <h3 className={`text-2xl font-bold ${treasury.color} mt-4`}>{treasury.name}</h3>
          <p className="text-gray-400">{treasury.pillar} Pillar • {treasury.symbol}</p>
        </div>

        {/* Address Display */}
        <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm mb-2">Treasury Address:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-gray-800 px-3 py-2 rounded font-mono overflow-hidden text-ellipsis">
              {treasury.address.startsWith('PENDING')
                ? 'Address coming soon...'
                : treasury.address}
            </code>
            {!treasury.address.startsWith('PENDING') && (
              <>
                <button
                  onClick={() => copyAddress(treasury.address, treasury.token)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    copiedAddress === treasury.token
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {copiedAddress === treasury.token ? '✓ Copied!' : 'Copy'}
                </button>
                <a
                  href={getSolscanUrl(treasury.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  View
                </a>
              </>
            )}
          </div>
        </div>

        {/* Quick Copy All Addresses */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TREASURIES.map((t) => (
            <button
              key={t.token}
              onClick={() => !t.address.startsWith('PENDING') && copyAddress(t.address, t.token)}
              disabled={t.address.startsWith('PENDING')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                t.address.startsWith('PENDING')
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : copiedAddress === t.token
                  ? 'bg-green-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {t.icon} {copiedAddress === t.token ? 'Copied!' : `Copy ${t.token}`}
            </button>
          ))}
        </div>

        {/* Benefits Toggle */}
        <button
          onClick={() => setShowBenefits(!showBenefits)}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          {showBenefits ? '▼' : '▶'} View Giving Benefits
        </button>

        {showBenefits && (
          <div className="mt-4 space-y-3">
            {treasury.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-gray-300">
                <span className={treasury.color}>✦</span>
                {benefit}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gift Tiers */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h4 className="text-lg font-bold mb-4 text-center">Gift Recognition Tiers</h4>
        <div className="flex flex-wrap justify-center gap-4">
          {GIFT_TIERS.map((tier) => (
            <div key={tier.name} className="text-center">
              <div className="text-3xl mb-1">{tier.badge}</div>
              <div className={`font-bold ${tier.color}`}>{tier.name}</div>
              <div className="text-xs text-gray-400">{tier.min}+ SOL</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-yellow-900/20 via-purple-900/20 to-cyan-900/20 border border-gray-700 rounded-xl p-6 text-center">
        <p className="text-gray-300 text-sm">
          All treasury contributions are tracked and qualify you for special benefits.
          <br />
          <span className="text-gray-400">
            Send SOL or tokens directly to the treasury addresses above.
          </span>
        </p>
        <a
          href="https://quilu.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-purple-400 hover:text-purple-300 transition"
        >
          Learn more at quilu.xyz →
        </a>
      </div>
    </div>
  );
}
