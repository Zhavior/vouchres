import React from 'react';
import { Flame, Sparkles, Wind, Target, Zap, Layers } from 'lucide-react';
import type { TacticalFilterTag } from '../hooks/useHrNextData';

export interface HrNextTacticalFiltersProps {
  activeTag: TacticalFilterTag;
  onTagChange: (tag: TacticalFilterTag) => void;
  counts: Record<TacticalFilterTag, number>;
  /**
   * `row` is the original horizontal scroller above the board; `column` is the
   * stacked list the control rail renders. Same model either way — the rail
   * does not get its own copy of the filter definitions.
   */
  orientation?: 'row' | 'column';
}

export function HrNextTacticalFilters({
  activeTag,
  onTagChange,
  counts,
  orientation = 'row',
}: HrNextTacticalFiltersProps) {
  const isColumn = orientation === 'column';
  const filters: Array<{
    id: TacticalFilterTag;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }> = [
    {
      id: 'all',
      label: 'All Radar',
      icon: Layers,
      accent: 'emerald',
    },
    {
      id: 'hot',
      label: 'Hot Streaks',
      icon: Flame,
      accent: 'amber',
    },
    {
      id: 'high_ev',
      label: 'High EV Edge',
      icon: Sparkles,
      accent: 'emerald',
    },
    {
      id: 'wind_out',
      label: 'Wind Out Alert',
      icon: Wind,
      accent: 'cyan',
    },
    {
      id: 'vulnerable_sp',
      label: 'Vulnerable Starter',
      icon: Target,
      accent: 'rose',
    },
    {
      id: 'platoon',
      label: 'Top Power Mismatch',
      icon: Zap,
      accent: 'cyan',
    },
  ];

  return (
    <div
      className={`font-mono ${
        isColumn
          ? 'flex flex-col items-stretch gap-1'
          : 'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'
      }`}
      role="toolbar"
      aria-label="Tactical Filter Slicers"
    >
      {filters.map(({ id, label, icon: Icon, accent }) => {
        const isActive = activeTag === id;
        const count = counts[id] ?? 0;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onTagChange(id)}
            aria-pressed={isActive}
            className={`group flex items-center gap-1.5 rounded-xl border font-bold transition-all ${
              isColumn ? 'w-full px-2.5 py-1.5 text-[11px]' : 'whitespace-nowrap px-3 py-1.5 text-xs'
            } ${
              isActive
                ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] border-[var(--aurora-max-emerald)]/50 shadow-[0_0_12px_rgba(0,217,160,0.2)]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                isActive ? 'text-[var(--aurora-max-emerald)]' : 'text-white/40 group-hover:text-white'
              }`}
            />
            <span className={isColumn ? 'min-w-0 flex-1 truncate text-left' : undefined}>{label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black ${
                isColumn ? 'ml-auto shrink-0 ' : ''
              }${
                isActive
                  ? 'bg-[var(--aurora-max-emerald)]/30 text-white'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
