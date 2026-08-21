import React from 'react';
import { X, Command } from 'lucide-react';

export interface TodayNextKeyboardCheatsheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Enter', desc: 'Run the brief’s recommended next step' },
  { key: '1', desc: 'Open HR Intelligence' },
  { key: '2', desc: 'Open HR Next' },
  { key: '3', desc: 'Open Live Games' },
  { key: '4', desc: 'Open Player Evidence' },
  { key: '5', desc: 'Open My List' },
  { key: '6', desc: 'Open Track Record' },
  { key: 'R', desc: 'Re-sync today’s report and board' },
  { key: 'Esc', desc: 'Close this helper' },
  { key: '?', desc: 'Toggle this keyboard shortcut helper' },
];

export function TodayNextKeyboardCheatsheet({ isOpen, onClose }: TodayNextKeyboardCheatsheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono backdrop-blur-sm duration-150 animate-in fade-in">
      <div className="relative w-full max-w-md space-y-4 border-2 border-white/20 bg-[#131B1E] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-950/80 p-1.5 text-[#00FF87] border border-[#00FF87]/40">
              <Command className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Command Keybindings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="flex h-7 w-7 items-center justify-center border border-white/15 bg-[#0A0D0E] text-zinc-400 transition-colors hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto text-xs">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between gap-3 border border-white/10 bg-[#0A0D0E] p-2.5"
            >
              <span className="font-sans text-zinc-300">{shortcut.desc}</span>
              <kbd className="shrink-0 border border-[#00FF87]/40 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-[#00FF87] shadow-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-2 text-center text-[10px] text-zinc-400">
          Press <kbd className="border border-white/20 bg-[#0A0D0E] px-1 py-0.5 text-white">[?]</kbd> anytime to toggle
        </div>
      </div>
    </div>
  );
}
