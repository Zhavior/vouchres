import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, ShieldAlert, Zap, Flame, Radio } from 'lucide-react';
import type { TacticalRadarFilters, PositionFocusFilter } from '../../../types/touchdown';

interface TacticalRadarProps {
  filters: TacticalRadarFilters;
  onUpdateFilter: <K extends keyof TacticalRadarFilters>(key: K, value: TacticalRadarFilters[K]) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  filters,
  onUpdateFilter,
  onResetFilters,
  filteredCount,
  totalCount,
}) => {
  const positionOptions: { key: PositionFocusFilter; label: string; sub?: string }[] = [
    { key: 'ALL', label: 'All Positions' },
    { key: 'GLR', label: 'GL Rushers' },
    { key: 'RZ_ALPHA', label: 'RZ Alpha' },
    { key: 'DUAL_QB', label: 'Dual-Threat' },
    { key: 'RB', label: 'RBs Only' },
    { key: 'WR', label: 'WRs Only' },
    { key: 'TE', label: 'TEs Only' },
    { key: 'QB', label: 'QBs Only' },
  ];

  return (
    <div className="w-full shrink-0 space-y-5 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-ve-cyan">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Tactical Radar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 font-bold">
            {filteredCount}/{totalCount}
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            title="Reset Filters"
            className="flex items-center gap-1 rounded-none bg-black/40 px-1.5 py-0.5 text-[9px] text-white/55 hover:text-white border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onUpdateFilter('searchQuery', e.target.value)}
          placeholder="Filter player or team..."
          className="w-full rounded-none border border-white/[0.08] bg-white/[0.02] pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-ve-cyan/25 focus:outline-none focus:ring-1 focus:ring-ve-cyan/50 transition-all font-mono"
        />
      </div>

      {/* Section 1: Position Focus (Grid of buttons instead of list) */}
      <section className="space-y-1.5">
        <h3 className="text-[9px] font-semibold uppercase tracking-widest text-white/40">
          POSITION FOCUS
        </h3>
        <div className="grid grid-cols-2 gap-1 border border-white/10 bg-white/[0.02] p-1">
          {positionOptions.map((opt) => {
            const isChecked = filters.positionFocus === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isChecked}
                onClick={() => onUpdateFilter('positionFocus', opt.key)}
                className={`px-1 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider transition-colors border cursor-pointer ${
                  isChecked
                    ? 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan'
                    : 'border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Collision Filters */}
      <section className="space-y-1.5">
        <h3 className="text-[9px] font-semibold uppercase tracking-widest text-white/40">
          COLLISION FILTERS
        </h3>
        <div className="flex flex-col gap-1 border border-white/10 bg-white/[0.02] p-1">
          {/* RZ Touch Share > 25% */}
          <button
            type="button"
            aria-pressed={filters.rzTouchShareMin25}
            onClick={() => onUpdateFilter('rzTouchShareMin25', !filters.rzTouchShareMin25)}
            className={`w-full px-2.5 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer flex justify-between items-center ${
              filters.rzTouchShareMin25
                ? 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan'
                : 'border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span>RZ Touch Share &gt; 25%</span>
            <Flame className="w-3.5 h-3.5 opacity-50" />
          </button>

          {/* Inside-10 Target > 30% */}
          <button
            type="button"
            aria-pressed={filters.inside10TargetMin30}
            onClick={() => onUpdateFilter('inside10TargetMin30', !filters.inside10TargetMin30)}
            className={`w-full px-2.5 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer flex justify-between items-center ${
              filters.inside10TargetMin30
                ? 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan'
                : 'border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span>Inside-10 Tgt &gt; 30%</span>
            <Zap className="w-3.5 h-3.5 opacity-50" />
          </button>

          {/* Opp RZ Def: Bottom 10 */}
          <button
            type="button"
            aria-pressed={filters.oppRzDefBottom10}
            onClick={() => onUpdateFilter('oppRzDefBottom10', !filters.oppRzDefBottom10)}
            className={`w-full px-2.5 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer flex justify-between items-center ${
              filters.oppRzDefBottom10
                ? 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan'
                : 'border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span>Opp RZ Def Rank &ge; 23</span>
            <ShieldAlert className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>
      </section>
    </div>
  );
};
