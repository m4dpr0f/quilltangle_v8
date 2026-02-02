import { useState } from 'react';

interface Token {
  symbol: string;
  name: string;
  pillar: string;
  element: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  icon: string;
  description: string;
  earnMethod: string;
  link: string;
  linkText: string;
  contractAddress?: string;
  status: 'live' | 'coming_soon';
}

const TOKENS: Token[] = [
  {
    symbol: 'QLX',
    name: 'QUILUX',
    pillar: 'SEED',
    element: 'Plant / Music',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-600 to-amber-700',
    borderColor: 'border-yellow-500',
    icon: '🌱',
    description: 'The original Quillverse token. Earned through gameplay, typing races, and creative contributions.',
    earnMethod: 'Play to Earn',
    link: 'https://quillverse.org',
    linkText: 'Earn at Quillverse.org',
    contractAddress: '7xfPD1wLSjDk7FcQCX7juL9t3S6KFLZPLm9c7vPump',
    status: 'live'
  },
  {
    symbol: 'QLY',
    name: 'QUILY',
    pillar: 'EGG',
    element: 'Animal / Business',
    color: 'text-purple-400',
    bgGradient: 'from-purple-600 to-violet-700',
    borderColor: 'border-purple-500',
    icon: '🥚',
    description: 'The business pillar token. Powers crowdfunding, creator economy, and real-world product launches.',
    earnMethod: 'Build to Earn',
    link: 'https://8xm.fun',
    linkText: 'Launch at 8xM.fun',
    status: 'live'
  },
  {
    symbol: 'QLZ',
    name: 'QUILZ',
    pillar: 'METEORITE',
    element: 'Mineral / Technology',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-600 to-teal-700',
    borderColor: 'border-cyan-500',
    icon: '☄️',
    description: 'The innovation pillar token. Fuels software, hardware, protocols, and magical technology development.',
    earnMethod: 'Create to Earn',
    link: 'https://8xm.fun',
    linkText: 'Coming Soon',
    status: 'coming_soon'
  }
];

export default function TokenEcosystem() {
  const [activeToken, setActiveToken] = useState<string>('QLY');
  const [showDetails, setShowDetails] = useState(false);

  const selectedToken = TOKENS.find(t => t.symbol === activeToken)!;

  return (
    <div className="space-y-8">
      {/* Token Selector */}
      <div className="flex justify-center gap-4 flex-wrap">
        {TOKENS.map((token) => (
          <button
            key={token.symbol}
            onClick={() => {
              setActiveToken(token.symbol);
              setShowDetails(true);
            }}
            className={`relative px-8 py-4 rounded-xl font-bold text-xl transition-all duration-300 ${
              activeToken === token.symbol
                ? `bg-gradient-to-r ${token.bgGradient} scale-105 shadow-lg`
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{token.icon}</span>
            {token.symbol}
            {token.status === 'coming_soon' && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-xs px-2 py-1 rounded-full">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Token Display */}
      <div className={`border ${selectedToken.borderColor} rounded-2xl p-8 bg-gradient-to-br from-gray-900 to-gray-800 transition-all duration-500`}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{selectedToken.icon}</span>
              <div>
                <h2 className={`text-4xl font-bold ${selectedToken.color}`}>
                  {selectedToken.name}
                </h2>
                <p className="text-gray-400">${selectedToken.symbol}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Pillar:</span>
                <span className={`font-bold ${selectedToken.color}`}>{selectedToken.pillar}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Element:</span>
                <span className="text-white">{selectedToken.element}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Method:</span>
                <span className="text-white">{selectedToken.earnMethod}</span>
              </div>
              {selectedToken.contractAddress && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Contract:</span>
                  <code className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {selectedToken.contractAddress.slice(0, 8)}...{selectedToken.contractAddress.slice(-8)}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              {selectedToken.description}
            </p>

            {selectedToken.status === 'live' ? (
              <a
                href={selectedToken.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block text-center bg-gradient-to-r ${selectedToken.bgGradient} px-6 py-3 rounded-lg font-bold hover:opacity-90 transition`}
              >
                {selectedToken.linkText} →
              </a>
            ) : (
              <div className="text-center bg-gray-700 px-6 py-3 rounded-lg font-bold text-gray-400">
                {selectedToken.linkText}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-yellow-400">QLX</div>
          <div className="text-sm text-gray-400">Play & Create</div>
          <div className="text-green-400 text-sm mt-1">● Live</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-purple-400">QLY</div>
          <div className="text-sm text-gray-400">Build & Launch</div>
          <div className="text-green-400 text-sm mt-1">● Live</div>
        </div>
        <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-cyan-400">QLZ</div>
          <div className="text-sm text-gray-400">Innovate & Ship</div>
          <div className="text-orange-400 text-sm mt-1">◐ Coming Soon</div>
        </div>
      </div>

      {/* TEK8 Element Mapping */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-center">TEK8 Element Alignment</h3>
        <p className="text-gray-400 text-center mb-4">
          Each token aligns with realms of the 8-element system
        </p>
        <div className="flex justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-2xl">🌱</span>
            <span className="text-gray-300">Plant Realm → QLX</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-2xl">🥚</span>
            <span className="text-gray-300">Animal Realm → QLY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-2xl">☄️</span>
            <span className="text-gray-300">Mineral Realm → QLZ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
