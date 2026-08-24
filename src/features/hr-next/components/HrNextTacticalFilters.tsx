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
                ? 'border-2 border-ve-cyan bg-obsidian-950 text-ve-cyan font-black'
                : 'border-white/10 bg-black text-white/55 hover:text-white hover:bg-obsidian-800 hover:border-white/25'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-ve-cyan' : 'text-white/40 group-hover:text-white/70'
                }`}
              />
              <span className="truncate">{label}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-black tabular-nums border ${
                isActive
                  ? 'border-ve-cyan/50 bg-ve-cyan/50 text-ve-cyan'
                  : 'border-white/10 bg-obsidian-950 text-white/40'
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
