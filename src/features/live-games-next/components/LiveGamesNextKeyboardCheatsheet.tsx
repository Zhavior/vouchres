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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 font-mono">
      <div className="relative w-full max-w-md bg-[#050505] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 border border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan">
              <Command className="w-4 h-4" />
            </span>
            <h3 className="text-[11px] font-semibold text-white uppercase tracking-[0.24em]">Live keybindings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg-control p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 p-2.5 border border-white/[0.06] bg-white/[0.02]">
              <span className="text-white/70">{sc.desc}</span>
              <kbd className="shrink-0 px-2 py-0.5 border border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan font-medium text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-white/30 text-center pt-3 border-t border-white/[0.06] uppercase tracking-wider">
          Press <kbd className="text-white/55 px-1 py-0.5 border border-white/[0.08] bg-white/[0.04]">[?]</kbd> anytime to toggle keybindings
        </div>
      </div>
    </div>
  );
}

