import React, { useState } from 'react';
import { Zap, Target, Rocket, RefreshCw } from 'lucide-react';

interface TacticalPresetsProps {
  onApplyPreset: (preset: 'HEAVY_GL' | 'MISMATCH' | 'VALUE') => void;
  onReset: () => void;
}

export function TacticalPresets({ onApplyPreset, onReset }: TacticalPresetsProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleApply = (preset: 'HEAVY_GL' | 'MISMATCH' | 'VALUE') => {
    setActivePreset(preset);
    onApplyPreset(preset);
  };

  const handleReset = () => {
    setActivePreset(null);
    onReset();
  };

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2 shrink-0">
        META STRATEGIES
      </span>
      
      <button
        onClick={() => handleApply('HEAVY_GL')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
          activePreset === 'HEAVY_GL'
            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
            : 'border-white/10 bg-black text-zinc-400 hover:text-white hover:border-white/30'
        }`}
      >
        <Zap className="w-3 h-3" />
        Heavy Goal-Line Machines
      </button>

      <button
        onClick={() => handleApply('MISMATCH')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
          activePreset === 'MISMATCH'
            ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            : 'border-white/10 bg-black text-zinc-400 hover:text-white hover:border-white/30'
        }`}
      >
        <Target className="w-3 h-3" />
        Mismatch Exploits
      </button>

      <button
        onClick={() => handleApply('VALUE')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
          activePreset === 'VALUE'
            ? 'border-purple-400 bg-purple-950/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
            : 'border-white/10 bg-black text-zinc-400 hover:text-white hover:border-white/30'
        }`}
      >
        <Rocket className="w-3 h-3" />
        Value Longshots
      </button>

      {activePreset && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1.5 ml-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
