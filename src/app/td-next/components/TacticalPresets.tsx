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
    <section className="space-y-1.5 font-mono">
      <h3 className="px-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/40 flex justify-between items-center">
        <span>META STRATEGIES</span>
        {activePreset && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-white/55 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            CLEAR
          </button>
        )}
      </h3>
      
      <div className="flex flex-col gap-1 border border-white/10 bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => handleApply('HEAVY_GL')}
          aria-pressed={activePreset === 'HEAVY_GL'}
          className={`flex items-center justify-between w-full px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider transition-colors border cursor-pointer ${
            activePreset === 'HEAVY_GL'
              ? 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan shadow-[0_0_12px_rgba(0,240,255,0.15)]'
              : 'border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          <span>Goal-Line Machines</span>
          <Zap className="w-3.5 h-3.5 opacity-50" />
        </button>

        <button
          type="button"
          onClick={() => handleApply('MISMATCH')}
          aria-pressed={activePreset === 'MISMATCH'}
          className={`flex items-center justify-between w-full px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider transition-colors border cursor-pointer ${
            activePreset === 'MISMATCH'
              ? 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          <span>Mismatch Exploits</span>
          <Target className="w-3.5 h-3.5 opacity-50" />
        </button>

        <button
          type="button"
          onClick={() => handleApply('VALUE')}
          aria-pressed={activePreset === 'VALUE'}
          className={`flex items-center justify-between w-full px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider transition-colors border cursor-pointer ${
            activePreset === 'VALUE'
              ? 'border-purple-400 bg-purple-950/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
              : 'border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          <span>Value Longshots</span>
          <Rocket className="w-3.5 h-3.5 opacity-50" />
        </button>
      </div>
    </section>
  );
}
