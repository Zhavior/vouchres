/**
 * HrNextControlRail — the board's query controls, in a sticky left column.
 */

import React, { useCallback, useId } from 'react';
import { Search, CalendarDays, Download, Zap, RefreshCw } from 'lucide-react';
import { HrNextTacticalFilters } from './HrNextTacticalFilters';
import type { TacticalFilterTag } from '../hooks/useHrNextData';
import type { HrWatchMode } from '../../hr/types/hrWatch';

export type HrNextViewMode = 'tier' | 'matchup' | 'none' | 'matrix';

export interface HrNextControlRailProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  date: string;
  onDateChange: (next: string) => void;
  isToday: boolean;
  syncing: boolean;
  onRefresh: () => void;

  viewModes: ReadonlyArray<{ key: HrNextViewMode; label: string }>;
  viewMode: HrNextViewMode;
  onViewModeChange: (next: HrNextViewMode) => void;

  lineupMode: HrWatchMode;
  onLineupModeChange: (next: HrWatchMode) => void;

  filterTag: TacticalFilterTag;
  onFilterTagChange: (tag: TacticalFilterTag) => void;
  filterCounts: Record<TacticalFilterTag, number>;

  statcastResolved: boolean;
  onToggleStatcast: () => void;
  onExport: (format: 'json' | 'csv') => void;
  exportStatus: string | null;
  savedCount: number;
  variant?: 'rail' | 'sheet';
}

const LINEUP_MODES: ReadonlyArray<{ key: HrWatchMode; label: string }> = [
  { key: 'all', label: 'ALL' },
  { key: 'curated', label: 'PROJECTED' },
  { key: 'confirmed', label: 'CONFIRMED' },
];

function RailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5 font-mono">
      <h3 className="px-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </h3>
      {children}
    </section>
  );
}

export const HrNextControlRail = React.memo(function HrNextControlRail({
  searchQuery,
  onSearchChange,
  searchInputRef,
  date,
  onDateChange,
  isToday,
  syncing,
  onRefresh,
  viewModes,
  viewMode,
  onViewModeChange,
  lineupMode,
  onLineupModeChange,
  filterTag,
  onFilterTagChange,
  filterCounts,
  statcastResolved,
  onToggleStatcast,
  onExport,
  exportStatus,
  savedCount,
  variant = 'rail',
}: HrNextControlRailProps) {
  const dateFieldId = useId();

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value),
    [onSearchChange],
  );

  const handleDate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onDateChange(event.target.value),
    [onDateChange],
  );

  const isRail = variant === 'rail';
  const Frame = isRail ? 'aside' : 'div';

  return (
    <Frame
      className={
        isRail
          ? 've-hr-control-rail sticky top-0 hidden w-64 shrink-0 space-y-5 self-start overflow-y-auto border-r-2 border-white/15 bg-black p-4 font-mono lg:block'
          : 've-hr-control-sheet grid grid-cols-1 gap-x-4 gap-y-5 border-2 border-white/15 bg-black p-4 font-mono sm:grid-cols-2'
      }
      aria-label="Board controls"
    >
      {/* Search */}
      <RailSection label="SEARCH SLATE">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="PLAYER / TEAM / SP"
            aria-label="Search the slate"
            className="w-full border border-white/15 bg-zinc-950 py-2 pl-8 pr-7 font-mono text-xs text-white placeholder-zinc-600 transition-colors focus:border-cyan-400 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 border border-white/15 bg-zinc-900 px-1 text-[9px] text-zinc-500">
            /
          </kbd>
        </div>
      </RailSection>

      {/* Slate date */}
      <RailSection label="SLATE DATE">
        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              id={dateFieldId}
              type="date"
              value={date}
              onChange={handleDate}
              aria-label="Slate date"
              className="w-full border border-white/15 bg-zinc-950 py-1.5 pl-8 pr-2 font-mono text-xs text-white transition-colors focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh the slate"
            aria-label="Refresh the slate"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center border border-white/15 bg-zinc-950 text-zinc-400 transition-colors hover:border-white hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
        <p className="px-0.5 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
          {isToday ? "TODAY'S ACTIVE SLATE" : 'ARCHIVED HISTORICAL SLATE'}
        </p>
      </RailSection>

      {/* View mode */}
      <RailSection label="VIEW MODE">
        <div
          role="tablist"
          aria-label="Board view"
          className="flex flex-col gap-1 border border-white/10 bg-zinc-950 p-1"
        >
          {viewModes.map(({ key, label }) => {
            const isActive = viewMode === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onViewModeChange(key)}
                className={`w-full px-2.5 py-1.5 text-left text-xs font-black uppercase tracking-wider transition-colors border cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </RailSection>

      {/* Lineup certainty */}
      <RailSection label="LINEUP CERTAINTY">
        <div className="grid grid-cols-3 gap-1 border border-white/10 bg-zinc-950 p-1">
          {LINEUP_MODES.map(({ key, label }) => {
            const isActive = lineupMode === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => onLineupModeChange(key)}
                className={`px-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider transition-colors border cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300 font-bold'
                    : 'border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </RailSection>

      {/* Radar filters */}
      <RailSection label="TACTICAL RADAR FILTERS">
        <HrNextTacticalFilters
          activeTag={filterTag}
          onTagChange={onFilterTagChange}
          counts={filterCounts}
          orientation="column"
        />
      </RailSection>

      {/* Utilities */}
      <RailSection label="DATA EXPORT & UTILS">
        <button
          type="button"
          onClick={onToggleStatcast}
          aria-pressed={statcastResolved}
          title="Resolve every plotted node against its Statcast reading"
          className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
            statcastResolved
              ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
              : 'border-white/15 bg-zinc-950 text-zinc-400 hover:text-white hover:border-white/30'
          }`}
        >
          <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="min-w-0 flex-1 truncate text-left">STATCAST RESOLVE</span>
        </button>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => onExport('json')}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 border border-white/15 bg-zinc-950 px-2 py-1.5 text-xs font-bold text-zinc-300 hover:border-white hover:text-white transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">JSON</span>
          </button>
          <button
            type="button"
            onClick={() => onExport('csv')}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 border border-white/15 bg-zinc-950 px-2 py-1.5 text-xs font-bold text-zinc-300 hover:border-white hover:text-white transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">CSV</span>
          </button>
        </div>

        <p className="px-0.5 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
          {exportStatus ?? `${savedCount} SIGNALS SAVED`}
        </p>
      </RailSection>
    </Frame>
  );
});

export default HrNextControlRail;

