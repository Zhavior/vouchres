import React from 'react';
import { Flame, Sparkles, Wind, Target, Zap, Layers } from 'lucide-react';
import type { TacticalFilterTag } from '../hooks/useHrNextData';

export interface HrNextTacticalFiltersProps {
  activeTag: TacticalFilterTag;
  onTagChange: (tag: TacticalFilterTag) => void;
  counts: Record<TacticalFilterTag, number>;
}

export function HrNextTacticalFilters({
  activeTag,
  onTagChange,
  counts,
}: HrNextTacticalFiltersProps) {
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
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono"
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
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
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
            <span>{label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black ${
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
