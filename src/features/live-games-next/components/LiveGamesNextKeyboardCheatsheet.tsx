import React from 'react';
import { X, Command } from 'lucide-react';

export interface LiveGamesNextKeyboardCheatsheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveGamesNextKeyboardCheatsheet({ isOpen, onClose }: LiveGamesNextKeyboardCheatsheetProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '← / H', desc: 'Previous team vs team matchup' },
    { key: '→ / L', desc: 'Next team vs team matchup' },
    { key: 'J / ↓', desc: 'Move the featured game down the slate' },
    { key: 'K / ↑', desc: 'Move the featured game up the slate' },
    { key: 'Space / Enter', desc: 'Open the matchup drawer for the featured game' },
    { key: 'R', desc: 'Fast sync — refresh the live feed and HR board' },
    { key: 'Esc', desc: 'Close the matchup drawer' },
    { key: '?', desc: 'Toggle this keyboard shortcut helper' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono">
      <div className="relative w-full max-w-md bg-black border-2 border-white/20 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 border border-cyan-400/40 bg-cyan-950/40 text-cyan-300">
              <Command className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Terminal Keybindings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-white/20 text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 border border-white/10 bg-zinc-950">
              <span className="text-zinc-300">{sc.desc}</span>
              <kbd className="px-2 py-0.5 border border-cyan-400/50 bg-cyan-950/50 text-cyan-300 font-bold text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-zinc-500 text-center pt-3 border-t border-white/10">
          PRESS <kbd className="text-zinc-300 px-1 py-0.5 border border-white/20 bg-zinc-900">[?]</kbd> ANYTIME TO TOGGLE KEYBINDINGS
        </div>
      </div>
    </div>
  );
}

