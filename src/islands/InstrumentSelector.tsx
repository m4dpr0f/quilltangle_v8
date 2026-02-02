import { useState } from 'react';
import { SACRED_INSTRUMENTS, type SacredInstrument } from '../lib/instruments';
import { TEK8_GUILDS } from '../lib/tek8-guilds';

interface InstrumentSelectorProps {
  value?: string;
  onChange: (instrument: SacredInstrument | null, isProposal?: boolean, proposalData?: ProposalData) => void;
  recommendedElement?: string;
}

interface ProposalData {
  name: string;
  element: string;
  culturalOrigin: string;
  description: string;
}

export default function InstrumentSelector({ value, onChange, recommendedElement }: InstrumentSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(value);
  const [filter, setFilter] = useState<string>(recommendedElement || 'All');
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState<ProposalData>({
    name: '',
    element: recommendedElement || 'Ether',
    culturalOrigin: '',
    description: ''
  });

  const elements = ['All', 'Ether', 'Air', 'Fire', 'Water', 'Earth', 'Chaos', 'Order', 'Coin'];

  const filteredInstruments = filter === 'All'
    ? SACRED_INSTRUMENTS
    : SACRED_INSTRUMENTS.filter(i => i.element === filter || i.element === 'All');

  const handleSelect = (instrument: SacredInstrument) => {
    setSelectedId(instrument.id);
    setShowProposal(false);
    onChange(instrument);
  };

  const handleProposalSubmit = () => {
    if (proposal.name && proposal.element && proposal.description) {
      setSelectedId(undefined);
      onChange(null, true, proposal);
    }
  };

  const getElementColor = (element: string) => {
    const guild = TEK8_GUILDS.find(g => g.element === element);
    return guild?.color || '#9333ea';
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {elements.map((el) => (
          <button
            key={el}
            type="button"
            onClick={() => setFilter(el)}
            className={`px-3 py-1 rounded-full text-sm transition-all ${
              filter === el
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {el}
          </button>
        ))}
      </div>

      {/* Voice Option - Always Prominent */}
      <div
        onClick={() => handleSelect(SACRED_INSTRUMENTS[0])}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          selectedId === 'voice'
            ? 'border-purple-500 bg-purple-500/20'
            : 'border-gray-600 hover:border-purple-400 bg-gradient-to-r from-purple-900/30 to-blue-900/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎤</span>
          <div>
            <h4 className="font-bold text-purple-300">Voice (Universal Instrument)</h4>
            <p className="text-sm text-gray-400">Your voice carries all elements - the original instrument</p>
          </div>
        </div>
      </div>

      {/* Instrument Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
        {filteredInstruments.filter(i => !i.isVoice).map((instrument) => (
          <button
            key={instrument.id}
            type="button"
            onClick={() => handleSelect(instrument)}
            className={`p-3 rounded-lg border transition-all text-left ${
              selectedId === instrument.id
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
            }`}
          >
            <p className="font-medium text-sm mb-1">{instrument.name}</p>
            <p className="text-xs" style={{ color: getElementColor(instrument.element) }}>
              {instrument.element} • {instrument.petal}
            </p>
            {instrument.culturalOrigin && (
              <p className="text-xs text-gray-500 mt-1">{instrument.culturalOrigin}</p>
            )}
          </button>
        ))}
      </div>

      {/* Propose New Instrument */}
      <div className="border-t border-gray-700 pt-4">
        <button
          type="button"
          onClick={() => setShowProposal(!showProposal)}
          className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-2"
        >
          <span>{showProposal ? '−' : '+'}</span>
          Propose a New Sacred Instrument
        </button>

        {showProposal && (
          <div className="mt-4 space-y-3 bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-3">
              Don't see your instrument? Propose a sacred instrument from your culture or tradition.
            </p>

            <input
              type="text"
              placeholder="Instrument name"
              className="input w-full"
              value={proposal.name}
              onChange={(e) => setProposal({ ...proposal, name: e.target.value })}
            />

            <select
              className="input w-full"
              value={proposal.element}
              onChange={(e) => setProposal({ ...proposal, element: e.target.value })}
            >
              {elements.filter(e => e !== 'All').map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Cultural origin (e.g., West African, Japanese, Celtic)"
              className="input w-full"
              value={proposal.culturalOrigin}
              onChange={(e) => setProposal({ ...proposal, culturalOrigin: e.target.value })}
            />

            <textarea
              placeholder="Brief description of this sacred instrument..."
              className="input w-full h-20 resize-none"
              value={proposal.description}
              onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
            />

            <button
              type="button"
              onClick={handleProposalSubmit}
              disabled={!proposal.name || !proposal.description}
              className="btn-secondary w-full disabled:opacity-50"
            >
              Submit Proposal
            </button>
          </div>
        )}
      </div>

      {/* Selected Display */}
      {selectedId && !showProposal && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Selected Instrument</p>
          <p className="font-bold text-lg">
            {SACRED_INSTRUMENTS.find(i => i.id === selectedId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
