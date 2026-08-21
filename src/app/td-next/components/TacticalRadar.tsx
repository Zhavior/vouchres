import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, Filter, Radio, ShieldAlert, Zap, Flame } from 'lucide-react';
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
    { key: 'ALL', label: 'All Touchdowns' },
    { key: 'GLR', label: 'Goal-Line Rushers (GLR)', sub: '>70% GL snaps' },
    { key: 'RZ_ALPHA', label: 'RZ Target Alpha (WR/TE)', sub: '>30% RZ target' },
    { key: 'DUAL_QB', label: 'Dual-Threat QBs', sub: 'Inside-10 sneak/run' },
    { key: 'RB', label: 'Running Backs (RB)' },
    { key: 'WR', label: 'Wide Receivers (WR)' },
    { key: 'TE', label: 'Tight Ends (TE)' },
    { key: 'QB', label: 'Quarterbacks (QB)' },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4 rounded-xl border border-white/10 bg-[#090A0F]/90 p-3.5 sm:p-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Tactical Radar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-bold">
            {filteredCount}/{totalCount}
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            title="Reset Filters"
            className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onUpdateFilter('searchQuery', e.target.value)}
          placeholder="Filter player or team..."
          className="w-full rounded border border-white/15 bg-black/60 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
        />
      </div>

      {/* Section 1: Position Focus */}
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
          <span>▼ POSITION FOCUS</span>
        </div>
        <div className="space-y-1">
          {positionOptions.map((opt) => {
            const isChecked = filters.positionFocus === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onUpdateFilter('positionFocus', opt.key)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition-all cursor-pointer ${
                  isChecked
                    ? 'border border-cyan-400/60 bg-cyan-950/40 text-cyan-300 font-bold shadow-[inset_2px_0_0_#06b6d4]'
                    : 'border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border text-[9px] font-bold ${
                    isChecked ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-zinc-700 bg-black text-transparent'
                  }`}>
                    ✓
                  </span>
                  <span className="truncate">{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Collision Filters */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
          <span>▼ COLLISION FILTERS</span>
        </div>
        <div className="space-y-1.5">
          {/* Filter: RZ Touch Share > 25% */}
          <label className="flex items-center gap-2.5 rounded px-2 py-1 hover:bg-white/5 text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.rzTouchShareMin25}
              onChange={(e) => onUpdateFilter('rzTouchShareMin25', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-cyan-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs">RZ Touch Share &gt; 25%</span>
          </label>

          {/* Filter: Inside-10 Target > 30% */}
          <label className="flex items-center gap-2.5 rounded px-2 py-1 hover:bg-white/5 text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.inside10TargetMin30}
              onChange={(e) => onUpdateFilter('inside10TargetMin30', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-cyan-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs">Inside-10 Volume (8+)</span>
          </label>

          {/* Filter: Opp RZ Def: Bottom 10 */}
          <label className="flex items-center gap-2.5 rounded px-2 py-1 hover:bg-white/5 text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.oppRzDefBottom10}
              onChange={(e) => onUpdateFilter('oppRzDefBottom10', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-cyan-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs flex items-center gap-1">
              Opp RZ Def: Bottom 10
              <ShieldAlert className="h-3 w-3 text-rose-400" />
            </span>
          </label>

          {/* Filter: Implied Team Total ≥ 24.5 */}
          <label className="flex items-center gap-2.5 rounded px-2 py-1 hover:bg-white/5 text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.impliedTotalMin24_5}
              onChange={(e) => onUpdateFilter('impliedTotalMin24_5', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-cyan-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs">Implied Total ≥ 24.5</span>
          </label>

          {/* Filter: Positive Edge > +10% */}
          <label className="flex items-center gap-2.5 rounded px-2 py-1 hover:bg-white/5 text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.positiveEdgeOnly}
              onChange={(e) => onUpdateFilter('positiveEdgeOnly', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-cyan-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs flex items-center gap-1 text-emerald-400">
              Model Edge &gt; +10%
              <Zap className="h-3 w-3" />
            </span>
          </label>

          {/* Filter: Red Zone Alert (Live Only) */}
          <label className="flex items-center gap-2.5 rounded px-2 py-1 hover:bg-white/5 text-rose-300 cursor-pointer select-none border border-rose-500/20 bg-rose-950/20 mt-1">
            <input
              type="checkbox"
              checked={filters.redZoneAlertOnly}
              onChange={(e) => onUpdateFilter('redZoneAlertOnly', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-rose-700 bg-black text-rose-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs font-bold flex items-center gap-1">
              <Radio className="h-3 w-3 text-rose-400" />
              Live Red Zone Only
            </span>
          </label>
        </div>
      </div>
    </aside>
  );
};
