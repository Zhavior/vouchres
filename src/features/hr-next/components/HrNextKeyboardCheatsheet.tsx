import React from 'react';
import { X, Command } from 'lucide-react';

export interface HrNextKeyboardCheatsheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HrNextKeyboardCheatsheet({ isOpen, onClose }: HrNextKeyboardCheatsheetProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'J / ↓', desc: 'Select next player down the board' },
    { key: 'K / ↑', desc: 'Select previous player up the board' },
    { key: 'Space / Enter', desc: 'Toggle Deep Research telemetry for focused player' },
    { key: 'S', desc: 'Add focused player to Parlay Slip' },
    { key: 'F', desc: 'Star / Save focused player to My List' },
    { key: '1 - 6', desc: 'Switch telemetry tabs (Arsenal, Park, SP, Odds, Trends, Read)' },
    { key: '/', desc: 'Focus player & matchup search' },
    { key: 'Esc', desc: 'Close open research panels / Blur inputs' },
    { key: '?', desc: 'Toggle this keyboard shortcut helper' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div className="relative w-full max-w-md rounded-2xl bg-[#060a0a] border border-white/10 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)]">
              <Command className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Terminal Keybindings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-white/70 font-sans">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/15 text-[var(--aurora-max-emerald)] font-bold text-[11px] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-white/40 text-center pt-2 border-t border-white/5">
          Press <kbd className="text-white px-1 py-0.5 bg-white/10 rounded">?</kbd> anytime to toggle
        </div>
      </div>
    </div>
  );
}
