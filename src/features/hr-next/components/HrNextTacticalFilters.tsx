import React from 'react';
import { Flame, Sparkles, Wind, Target, Zap, Layers } from 'lucide-react';
import type { TacticalFilterTag } from '../hooks/useHrNextData';

export interface HrNextTacticalFiltersProps {
  activeTag: TacticalFilterTag;
  onTagChange: (tag: TacticalFilterTag) => void;
  counts: Record<TacticalFilterTag, number>;
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
      accent: 'cyan',
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
      label: 'Vulnerable SP',
      icon: Target,
      accent: 'rose',
    },
    {
      id: 'platoon',
      label: 'Power Mismatch',
      icon: Zap,
      accent: 'cyan',
    },
  ];

  return (
    <div
      className={`font-mono ${
        isColumn
          ? 'flex flex-col items-stretch gap-1'
          : 'flex items-center gap-2 overflow-x-auto pb-1 tn-scrollbar-none'
      }`}
      role="toolbar"
      aria-label="Tactical Filter Slicers"
    >
      {filters.map(({ id, label, icon: Icon }) => {
        const isActive = activeTag === id;
        const count = counts[id] ?? 0;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onTagChange(id)}
            aria-pressed={isActive}
            className={`group flex items-center justify-between gap-2 border font-bold transition-all cursor-pointer ${
              isColumn ? 'w-full px-2.5 py-1.5 text-xs' : 'whitespace-nowrap px-3 py-1.5 text-xs'
            } ${
              isActive
                ? 'border-2 border-cyan-400 bg-zinc-950 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-black'
                : 'border-white/10 bg-black text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-white/25'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              <span className="truncate">{label}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-black tabular-nums border ${
                isActive
                  ? 'border-cyan-400/50 bg-cyan-950/50 text-cyan-200'
                  : 'border-white/10 bg-zinc-950 text-zinc-500'
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
