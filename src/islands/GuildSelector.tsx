import { useState } from 'react';
import { TEK8_GUILDS, type TEK8Guild } from '../lib/tek8-guilds';

interface GuildSelectorProps {
  value?: string;
  onChange: (guild: TEK8Guild) => void;
}

export default function GuildSelector({ value, onChange }: GuildSelectorProps) {
  const [selectedGuild, setSelectedGuild] = useState<string | undefined>(value);

  const handleSelect = (guild: TEK8Guild) => {
    setSelectedGuild(guild.id);
    onChange(guild);
  };

  const selected = TEK8_GUILDS.find(g => g.id === selectedGuild);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEK8_GUILDS.map((guild) => (
          <button
            key={guild.id}
            type="button"
            onClick={() => handleSelect(guild)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedGuild === guild.id
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: guild.color + '33', color: guild.color }}
              >
                {guild.dice}
              </span>
              <span className="font-semibold text-sm" style={{ color: guild.color }}>
                {guild.element}
              </span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{guild.name}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="card border-2" style={{ borderColor: selected.color + '66' }}>
          <div className="flex items-center gap-3 mb-4">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: selected.color + '33', color: selected.color }}
            >
              {selected.dice}
            </span>
            <div>
              <h3 className="font-bold text-lg" style={{ color: selected.color }}>
                {selected.name}
              </h3>
              <p className="text-sm text-gray-400">{selected.element} Element</p>
            </div>
          </div>

          <p className="text-gray-300 mb-4">{selected.description}</p>

          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Your Garu Egg Question
            </p>
            <p className="text-lg italic text-purple-300">
              "{selected.garuEggQuestion}"
            </p>
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span>Essence: {selected.garuEssence}</span>
              <span>Hatching: {selected.hatchingMethod}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
