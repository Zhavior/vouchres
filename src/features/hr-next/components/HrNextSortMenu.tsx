import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '../../../lib/motion';
import { ChevronDown, BarChart3, TrendingUp, Clock, Zap, Target, Check } from 'lucide-react';
import type { DeskSortKey } from '../hooks/useHrNextData';

interface HrNextSortMenuProps {
  sortKey: DeskSortKey;
  onSortChange: (key: DeskSortKey) => void;
}

const SORT_OPTIONS: { key: DeskSortKey; label: string; icon: any; desc: string }[] = [
  { key: 'hrpi', label: 'VOUCH HRPI', icon: Target, desc: 'Model base probability score' },
  { key: 'ev', label: '+EV EDGE', icon: TrendingUp, desc: 'Highest value against market odds' },
  { key: 'odds', label: 'BOOK ODDS', icon: BarChart3, desc: 'Longest odds (highest payout)' },
  { key: 'time', label: 'FIRST PITCH', icon: Clock, desc: 'Next game to start' },
  { key: 'volume', label: 'DATA VOLUME', icon: Zap, desc: 'Data confidence and signal strength' },
];

export function HrNextSortMenu({ sortKey, onSortChange }: HrNextSortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeOption = SORT_OPTIONS.find(o => o.key === sortKey) || SORT_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  return (
    <div className="relative z-50 font-mono" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-white/20 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:border-white transition-colors cursor-pointer"
      >
        <ActiveIcon className="h-3.5 w-3.5 text-cyan-400" />
        <span>SORT: {activeOption.label}</span>
        <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-1.5 w-64 origin-top-left border-2 border-white/20 bg-black shadow-2xl z-50 font-mono"
          >
            <div className="p-1 space-y-1">
              {SORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = option.key === sortKey;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      onSortChange(option.key);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 p-2 text-left transition-colors cursor-pointer border ${
                      isActive ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300' : 'border-transparent hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center border ${isActive ? 'border-cyan-400 bg-cyan-950 text-cyan-300' : 'border-white/10 bg-zinc-950 text-zinc-500'}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                        {option.label}
                      </div>
                      <div className="truncate text-[9px] text-zinc-500">
                        {option.desc}
                      </div>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

