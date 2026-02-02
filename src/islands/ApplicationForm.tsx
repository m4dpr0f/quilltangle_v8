import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';
import GuildSelector from './GuildSelector';
import InstrumentSelector from './InstrumentSelector';
import { type TEK8Guild } from '../lib/tek8-guilds';
import { type SacredInstrument } from '../lib/instruments';

interface ApplicationData {
  // Character
  tek8Guild: TEK8Guild | null;
  soulDescription: string;
  nationName: string;
  characterName: string;

  // QLX - Music
  sacredInstrument: SacredInstrument | null;
  instrumentProposal: {
    name: string;
    element: string;
    culturalOrigin: string;
    description: string;
  } | null;

  // QLY - Business
  crowdfundingPlatform: string;
  crowdfundingUrl: string;
  businessDescription: string;
  arcadeStaffPillars: string[];

  // QLZ - Technology
  techInnovationType: string;
  techDescription: string;

  // Road
  roadId: string;

  // Token (optional)
  tokenMintAddress: string;
  tokenSymbol: string;

  // Contact & Notifications
  contactEmail: string;
  contactTelegram: string;
  contactDiscord: string;
  notificationPrefs: {
    email: boolean;
    telegram: boolean;
    discord: boolean;
    in_app: boolean;
  };
}

const STEPS = [
  { id: 1, title: 'Character Creation', subtitle: 'Select your TEK8 Guild' },
  { id: 2, title: 'QLX: Culture & Music', subtitle: 'Choose your Sacred Instrument' },
  { id: 3, title: 'QLY: Business & Sports', subtitle: 'Your Crowdfunding Campaign' },
  { id: 4, title: 'QLZ: Character & Technology', subtitle: 'Your Magical Innovation' },
  { id: 5, title: 'Road Selection', subtitle: 'Choose your Rainbow Road' },
  { id: 6, title: 'Review & Submit', subtitle: 'Schedule Interview' },
];

const CROWDFUNDING_PLATFORMS = [
  { id: 'kickstarter', name: 'Kickstarter', url: 'kickstarter.com' },
  { id: 'indiegogo', name: 'Indiegogo', url: 'indiegogo.com' },
  { id: 'gofundme', name: 'GoFundMe', url: 'gofundme.com' },
  { id: 'patreon', name: 'Patreon', url: 'patreon.com' },
  { id: 'kofi', name: 'Ko-fi', url: 'ko-fi.com' },
  { id: 'opencollective', name: 'OpenCollective', url: 'opencollective.com' },
];

const ARCADE_STAFF_PILLARS = [
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'gardening', name: 'Gardening', icon: '🌱' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'survival', name: 'Survival', icon: '🏕️' },
  { id: 'telecom', name: 'Telecommunications', icon: '📡' },
];

const TECH_TYPES = [
  { id: 'software', name: 'Software', description: 'Apps, games, tools, platforms' },
  { id: 'hardware', name: 'Hardware', description: 'Devices, instruments, equipment' },
  { id: 'protocol', name: 'Protocol', description: 'Governance, economics, communication systems' },
  { id: 'integration', name: 'Integration', description: 'Bridging existing systems together' },
];

const DICE_TYPES = ['D2', 'D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];
const DIRECTIONS = [
  { id: 'OUT', realm: 'QLX', color: 'green' },
  { id: 'UP', realm: 'QLY', color: 'orange' },
  { id: 'DWN', realm: 'QLY', color: 'orange' },
  { id: 'U45', realm: 'QLZ', color: 'purple' },
  { id: 'D45', realm: 'QLZ', color: 'purple' },
];

interface Road {
  roadId: string;
  available: boolean;
  realm: string;
  claimedBy?: string;
}

function ApplicationFormInner() {
  const { publicKey, connected } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [roads, setRoads] = useState<Road[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [launchId, setLaunchId] = useState<string | null>(null);

  const [data, setData] = useState<ApplicationData>({
    tek8Guild: null,
    soulDescription: '',
    nationName: '',
    characterName: '',
    sacredInstrument: null,
    instrumentProposal: null,
    crowdfundingPlatform: '',
    crowdfundingUrl: '',
    businessDescription: '',
    arcadeStaffPillars: [],
    techInnovationType: '',
    techDescription: '',
    roadId: '',
    tokenMintAddress: '',
    tokenSymbol: '',
    contactEmail: '',
    contactTelegram: '',
    contactDiscord: '',
    notificationPrefs: {
      email: true,
      telegram: false,
      discord: false,
      in_app: true,
    },
  });

  // Parse URL params on mount (from launchpad)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLaunchId = params.get('launch_id');
    const urlNation = params.get('nation');
    const urlSymbol = params.get('symbol');

    if (urlLaunchId) setLaunchId(urlLaunchId);
    if (urlNation || urlSymbol) {
      setData(prev => ({
        ...prev,
        nationName: urlNation || prev.nationName,
        tokenSymbol: urlSymbol || prev.tokenSymbol,
      }));
    }
  }, []);

  useEffect(() => {
    fetch('/api/gcn/roads/available')
      .then(res => res.json())
      .then(result => setRoads(result.roads || []))
      .catch(console.error);
  }, []);

  const updateData = (updates: Partial<ApplicationData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.tek8Guild && data.soulDescription.length >= 50 && data.nationName.length >= 2;
      case 2:
        return data.sacredInstrument || data.instrumentProposal;
      case 3:
        return data.crowdfundingPlatform && data.crowdfundingUrl && data.businessDescription;
      case 4:
        return data.techInnovationType && data.techDescription.length >= 50;
      case 5:
        return true; // Road selection is optional at application time
      case 6:
        return connected;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!publicKey) return;
    setSubmitting(true);

    try {
      const payload = {
        creatorWallet: publicKey.toBase58(),
        launchId: launchId || null,
        nationName: data.nationName,
        soulDescription: data.soulDescription,
        roadId: data.roadId || null,
        tek8Guild: data.tek8Guild?.id,
        garuEggQuestion: data.tek8Guild?.garuEggQuestion,
        characterName: data.characterName || null,
        sacredInstrument: data.sacredInstrument?.id || null,
        instrumentElement: data.sacredInstrument?.element || data.instrumentProposal?.element,
        voiceIsInstrument: data.sacredInstrument?.isVoice || false,
        instrumentProposal: data.instrumentProposal,
        crowdfundingPlatform: data.crowdfundingPlatform,
        crowdfundingUrl: data.crowdfundingUrl,
        businessDescription: data.businessDescription,
        arcadeStaffPillars: data.arcadeStaffPillars,
        techInnovationType: data.techInnovationType,
        techDescription: data.techDescription,
        tokenMintAddress: data.tokenMintAddress || null,
        tokenSymbol: data.tokenSymbol || null,
        contactEmail: data.contactEmail || null,
        contactTelegram: data.contactTelegram || null,
        contactDiscord: data.contactDiscord || null,
        notificationPrefs: data.notificationPrefs,
      };

      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setSubmitted(true);
      } else {
        alert('Submission failed: ' + result.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-6">🌈</div>
        <h2 className="text-3xl font-bold mb-4 text-green-400">Application Submitted!</h2>
        <p className="text-gray-300 mb-6">
          Thank you for applying to join Rainbow Roads. Your application is now under review.
        </p>
        <div className="card mb-6">
          <h3 className="font-bold mb-2">Next Steps:</h3>
          <ol className="text-left text-gray-300 space-y-2">
            <li>1. Schedule your video interview using the Calendly link below</li>
            <li>2. Complete the interview to discuss your vision</li>
            <li>3. Upon approval, create your GCN token (if not already done)</li>
            <li>4. Claim your road on Rainbow Roads!</li>
          </ol>
        </div>
        <a
          href="https://calendly.com/quillverse/gcn-interview"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block"
        >
          Schedule Video Interview
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Coming from Launchpad Banner */}
      {launchId && (
        <div className="mb-6 bg-gradient-to-r from-green-900/50 to-purple-900/50 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="text-green-400 font-bold">Token Launch in Progress</p>
              <p className="text-sm text-gray-300">
                Completing character creation for <strong className="text-white">{data.nationName || 'your nation'}</strong>
                {data.tokenSymbol && <span className="text-purple-400 ml-1">(${data.tokenSymbol})</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${currentStep === step.id ? 'bg-purple-600 text-white' :
                  currentStep > step.id ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}
              `}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-xl font-bold">{STEPS[currentStep - 1].title}</h2>
          <p className="text-gray-400">{STEPS[currentStep - 1].subtitle}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="card mb-6">
        {/* Step 1: Character Creation */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4">Select Your TEK8 Guild</h3>
              <GuildSelector
                value={data.tek8Guild?.id}
                onChange={(guild) => updateData({ tek8Guild: guild })}
              />
            </div>

            {data.tek8Guild && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Character Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={data.characterName}
                    onChange={(e) => updateData({ characterName: e.target.value })}
                    placeholder="Give your character a name..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Soul Description (Your Answer to the Garu Egg Question)
                  </label>
                  <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 mb-3">
                    <p className="italic text-purple-300">"{data.tek8Guild.garuEggQuestion}"</p>
                  </div>
                  <textarea
                    className="input w-full h-32 resize-none"
                    value={data.soulDescription}
                    onChange={(e) => updateData({ soulDescription: e.target.value })}
                    placeholder="Contemplate and answer this question to birth your world..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {data.soulDescription.length}/1000 (minimum 50 characters)
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Nation Name
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={data.nationName}
                    onChange={(e) => updateData({ nationName: e.target.value })}
                    placeholder="Name your Galactic Cluster Nation..."
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: QLX - Culture & Music */}
        {currentStep === 2 && (
          <div>
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-xs text-gray-500">Realm: <span className="text-green-400">Plant</span> • Essence: <span className="text-green-400">SEED</span></p>
              <p className="text-sm text-green-400 font-medium">Pillar: Culture & Music</p>
            </div>
            <p className="text-gray-400 mb-4">
              Select the sacred instrument that resonates with your creative spirit. Your voice always counts!
            </p>
            <InstrumentSelector
              value={data.sacredInstrument?.id}
              onChange={(instrument, isProposal, proposalData) => {
                if (isProposal && proposalData) {
                  updateData({ sacredInstrument: null, instrumentProposal: proposalData });
                } else {
                  updateData({ sacredInstrument: instrument, instrumentProposal: null });
                }
              }}
              recommendedElement={data.tek8Guild?.element}
            />
          </div>
        )}

        {/* Step 3: QLY - Business & Sports */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="mb-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
              <p className="text-xs text-gray-500">Realm: <span className="text-orange-400">Animal</span> • Essence: <span className="text-orange-400">EGG</span></p>
              <p className="text-sm text-orange-400 font-medium">Pillar: Business & Sports</p>
            </div>
            <p className="text-gray-400 mb-4">
              Link your qualifying crowdfunding campaign to demonstrate your commitment to building something real.
            </p>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Crowdfunding Platform</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CROWDFUNDING_PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => updateData({ crowdfundingPlatform: platform.id })}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      data.crowdfundingPlatform === platform.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
                    }`}
                  >
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-xs text-gray-500">{platform.url}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Campaign URL</label>
              <input
                type="url"
                className="input w-full"
                value={data.crowdfundingUrl}
                onChange={(e) => updateData({ crowdfundingUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Business Description</label>
              <textarea
                className="input w-full h-24 resize-none"
                value={data.businessDescription}
                onChange={(e) => updateData({ businessDescription: e.target.value })}
                placeholder="Describe your product or service..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Arcade Staff Pillars (Select all that apply)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Inspired by <a href="https://arcadestaff.com" target="_blank" rel="noopener" className="text-purple-400 hover:underline">arcadestaff.com</a>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ARCADE_STAFF_PILLARS.map((pillar) => (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => {
                      const pillars = data.arcadeStaffPillars.includes(pillar.id)
                        ? data.arcadeStaffPillars.filter(p => p !== pillar.id)
                        : [...data.arcadeStaffPillars, pillar.id];
                      updateData({ arcadeStaffPillars: pillars });
                    }}
                    className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                      data.arcadeStaffPillars.includes(pillar.id)
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
                    }`}
                  >
                    <span className="text-xl">{pillar.icon}</span>
                    <span>{pillar.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: QLZ - Character & Technology */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-gray-500">Realm: <span className="text-purple-400">Mineral</span> • Essence: <span className="text-purple-400">METEORITE</span></p>
              <p className="text-sm text-purple-400 font-medium">Pillar: Character & Technology</p>
            </div>
            <p className="text-gray-400 mb-4">
              Describe the magical new technology your project brings to the Quillverse.
            </p>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Innovation Type</label>
              <div className="grid grid-cols-2 gap-3">
                {TECH_TYPES.map((tech) => (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => updateData({ techInnovationType: tech.id })}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      data.techInnovationType === tech.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
                    }`}
                  >
                    <p className="font-medium">{tech.name}</p>
                    <p className="text-xs text-gray-500">{tech.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Technology Description</label>
              <textarea
                className="input w-full h-32 resize-none"
                value={data.techDescription}
                onChange={(e) => updateData({ techDescription: e.target.value })}
                placeholder="Describe the technological innovation your project brings..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {data.techDescription.length}/2000 (minimum 50 characters)
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Road Selection */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <p className="text-gray-400 mb-4">
              Select a Rainbow Road to claim. This step is optional - you can also claim a road
              after your application is approved. Roads are first-come, first-served.
            </p>

            <div className="grid grid-cols-8 gap-1 text-xs">
              {DICE_TYPES.map(dice => (
                <div key={dice} className="text-center font-bold text-gray-500">{dice}</div>
              ))}
              {DIRECTIONS.map(dir => (
                <>
                  {DICE_TYPES.map(dice => {
                    const roadId = dice + dir.id;
                    const road = roads.find(r => r.roadId === roadId);
                    const isAvailable = road?.available ?? true;
                    const colorClass = dir.color === 'green' ? 'bg-green-600' :
                                      dir.color === 'orange' ? 'bg-orange-600' : 'bg-purple-600';
                    return (
                      <button
                        key={roadId}
                        type="button"
                        onClick={() => isAvailable && updateData({ roadId: data.roadId === roadId ? '' : roadId })}
                        disabled={!isAvailable}
                        className={`p-2 rounded text-center ${
                          data.roadId === roadId ? 'ring-2 ring-white' : ''
                        } ${isAvailable ? colorClass + ' hover:opacity-80' : 'bg-gray-700 opacity-50'}`}
                        title={roadId + (isAvailable ? ' (available)' : ' (claimed)')}
                      >
                        {dir.id.charAt(0)}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>

            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded"></span> QLX Plant (OUT)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-600 rounded"></span> QLY Animal (UP/DWN)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-600 rounded"></span> QLZ Mineral (U45/D45)</span>
            </div>

            {data.roadId && (
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Selected Road:</p>
                <p className="font-bold text-lg text-purple-300">{data.roadId}</p>
              </div>
            )}

            <div className="border-t border-gray-700 pt-4">
              <h4 className="font-bold mb-3">Token Information (Optional)</h4>
              <p className="text-xs text-gray-500 mb-3">
                If you've already created your GCN token, enter it here. Otherwise, you can create it after approval.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Token Mint Address</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={data.tokenMintAddress}
                    onChange={(e) => updateData({ tokenMintAddress: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Token Symbol</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={data.tokenSymbol}
                    onChange={(e) => updateData({ tokenSymbol: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {!connected ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Connect your wallet to submit your application</p>
                <WalletMultiButton />
              </div>
            ) : (
              <>
                <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-lg border-b border-gray-700 pb-2">Application Summary</h3>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Nation Name</p>
                      <p className="font-medium">{data.nationName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">TEK8 Guild</p>
                      <p className="font-medium" style={{ color: data.tek8Guild?.color }}>
                        {data.tek8Guild?.name} ({data.tek8Guild?.element})
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sacred Instrument</p>
                      <p className="font-medium">
                        {data.sacredInstrument?.name || data.instrumentProposal?.name}
                        {data.instrumentProposal && ' (Proposed)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Crowdfunding</p>
                      <p className="font-medium">
                        {CROWDFUNDING_PLATFORMS.find(p => p.id === data.crowdfundingPlatform)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Technology Type</p>
                      <p className="font-medium">
                        {TECH_TYPES.find(t => t.id === data.techInnovationType)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Road Selection</p>
                      <p className="font-medium">{data.roadId || 'Not selected (will choose later)'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">Soul Description</p>
                    <p className="text-sm mt-1">{data.soulDescription}</p>
                  </div>
                </div>

                {/* Contact & Notification Preferences */}
                <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-lg border-b border-gray-700 pb-2">🔔 Contact & Notifications</h3>
                  <p className="text-sm text-gray-400">
                    How would you like to receive updates about your application? We respect your privacy.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        className="input w-full"
                        value={data.contactEmail}
                        onChange={(e) => updateData({ contactEmail: e.target.value })}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Telegram (Optional)</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={data.contactTelegram}
                        onChange={(e) => updateData({ contactTelegram: e.target.value })}
                        placeholder="@username or chat ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Discord (Optional)</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={data.contactDiscord}
                        onChange={(e) => updateData({ contactDiscord: e.target.value })}
                        placeholder="username#1234"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Notification Channels:</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.notificationPrefs.in_app}
                          onChange={(e) => updateData({
                            notificationPrefs: { ...data.notificationPrefs, in_app: e.target.checked }
                          })}
                          className="rounded"
                        />
                        <span className="text-sm">In-App Messages</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.notificationPrefs.email}
                          onChange={(e) => updateData({
                            notificationPrefs: { ...data.notificationPrefs, email: e.target.checked }
                          })}
                          disabled={!data.contactEmail}
                          className="rounded disabled:opacity-50"
                        />
                        <span className={`text-sm ${!data.contactEmail ? 'text-gray-500' : ''}`}>Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.notificationPrefs.telegram}
                          onChange={(e) => updateData({
                            notificationPrefs: { ...data.notificationPrefs, telegram: e.target.checked }
                          })}
                          disabled={!data.contactTelegram}
                          className="rounded disabled:opacity-50"
                        />
                        <span className={`text-sm ${!data.contactTelegram ? 'text-gray-500' : ''}`}>Telegram</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.notificationPrefs.discord}
                          onChange={(e) => updateData({
                            notificationPrefs: { ...data.notificationPrefs, discord: e.target.checked }
                          })}
                          disabled={!data.contactDiscord}
                          className="rounded disabled:opacity-50"
                        />
                        <span className={`text-sm ${!data.contactDiscord ? 'text-gray-500' : ''}`}>Discord DM</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="font-bold mb-2">📅 Video Interview Required</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    After submitting, you'll need to schedule a video interview to discuss your vision
                    and demonstrate alignment with the Quillverse community.
                  </p>
                  <a
                    href="https://calendly.com/quillverse/gcn-interview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm"
                  >
                    Preview Calendly availability →
                  </a>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary w-full py-4 text-lg disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(s => s - 1)}
          disabled={currentStep === 1}
          className="btn-secondary disabled:opacity-50"
        >
          ← Previous
        </button>

        {currentStep < 6 ? (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-50"
          >
            Next →
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ApplicationForm() {
  return (
    <WalletProvider>
      <ApplicationFormInner />
    </WalletProvider>
  );
}
