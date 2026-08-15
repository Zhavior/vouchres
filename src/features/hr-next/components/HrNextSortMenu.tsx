import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '../../../lib/motion';
import { ChevronDown, BarChart3, TrendingUp, Clock, Zap, Target, Check } from 'lucide-react';
import type { DeskSortKey } from '../hooks/useHrNextData';
import '../../../styles/shell-surfaces-aurora-max.css';

interface HrNextSortMenuProps {
  sortKey: DeskSortKey;
  onSortChange: (key: DeskSortKey) => void;
}

const SORT_OPTIONS: { key: DeskSortKey; label: string; icon: any; desc: string }[] = [
  { key: 'hrpi', label: 'Vouch HRPI', icon: Target, desc: 'Model base probability score' },
  { key: 'ev', label: '+EV Edge', icon: TrendingUp, desc: 'Highest value against market odds' },
  { key: 'odds', label: 'Book Odds', icon: BarChart3, desc: 'Longest odds (highest payout)' },
  { key: 'time', label: 'First Pitch', icon: Clock, desc: 'Next game to start' },
  { key: 'volume', label: 'Data Volume', icon: Zap, desc: 'Data confidence and signal strength' },
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
    <div className="relative z-50" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-obsidian-800/80 px-3 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 hover:bg-obsidian-800 transition-colors backdrop-blur-md font-z8 tracking-wide"
      >
        <ActiveIcon className="h-4 w-4 text-vouch-cyan" />
        <span>Sort: {activeOption.label}</span>
        <ChevronDown className={`h-3 w-3 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 w-64 origin-top-left overflow-hidden rounded-xl border border-white/10 bg-obsidian-900/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="p-1.5 space-y-0.5">
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
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-vouch-cyan/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-vouch-cyan/20 text-vouch-cyan' : 'bg-white/5 text-white/50'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold font-z8 tracking-wide ${isActive ? 'text-vouch-cyan' : 'text-white'}`}>
                        {option.label}
                      </div>
                      <div className="truncate text-[10px] text-white/40 font-mono">
                        {option.desc}
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-vouch-cyan shrink-0" />}
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
