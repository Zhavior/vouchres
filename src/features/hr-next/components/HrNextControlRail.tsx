/**
 * HrNextControlRail — the board's query controls, in a sticky left column.
 *
 * The global routes moved to the top bar, so the left of the screen is free for
 * what actually belongs to this surface: what slate you are looking at, how it
 * is grouped, which lineups count, and which radar cut is applied. Everything
 * here used to be crammed into the sticky header above the board, where it cost
 * the cards four rows of vertical space before the first result.
 *
 * All hooks are declared at the top of the component, above every branch — the
 * rail renders in and out with the viewport, and a hook behind a condition here
 * would change this component's hook count between renders.
 */

import React, { useCallback, useId } from 'react';
import { Search, CalendarDays, Download, Zap, RefreshCw } from 'lucide-react';
import { HrNextTacticalFilters } from './HrNextTacticalFilters';
import type { TacticalFilterTag } from '../hooks/useHrNextData';
import type { HrWatchMode } from '../../hr/types/hrWatch';

/** The four board views, mirrored from the shell so the rail stays declarative. */
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

  /**
   * The board view model's mode also carries `blocked`, which is not a lineup
   * certainty the reader picks — it stays selectable through the model, it just
   * is not one of the three segments here.
   */
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
  /**
   * `rail` is the sticky left column on lg+. `sheet` is the same controls
   * stacked above the board on narrow screens, where there is no room for a
   * 16rem column — same component either way, so the two can never drift.
   */
  variant?: 'rail' | 'sheet';
}

const LINEUP_MODES: ReadonlyArray<{ key: HrWatchMode; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'curated', label: 'Projected' },
  { key: 'confirmed', label: 'Confirmed' },
];

function RailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="px-0.5 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
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
          ? 've-hr-control-rail sticky top-0 hidden w-64 shrink-0 space-y-5 self-start overflow-y-auto border-r border-emerald-950/80 bg-[#05080d] p-4 lg:block'
          : 've-hr-control-sheet grid grid-cols-1 gap-x-4 gap-y-5 rounded-xl border border-emerald-950/80 bg-[#05080d] p-4 sm:grid-cols-2'
      }
      aria-label="Board controls"
    >
      {/* Search */}
      <RailSection label="Search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Player, team, matchup"
            aria-label="Search the slate"
            className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-8 pr-7 font-mono text-[11px] text-white placeholder-white/25 transition-colors focus:border-[var(--aurora-max-emerald)] focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-black/50 px-1 font-mono text-[9px] text-white/30">
            /
          </kbd>
        </div>
      </RailSection>

      {/* Slate date */}
      <RailSection label="Slate">
        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <input
              id={dateFieldId}
              type="date"
              value={date}
              onChange={handleDate}
              aria-label="Slate date"
              className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-8 pr-2 font-mono text-[11px] text-white transition-colors focus:border-[var(--aurora-max-emerald)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh the slate"
            aria-label="Refresh the slate"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg border border-white/10 bg-black/40 text-white/45 transition-colors hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-[var(--aurora-max-emerald)]' : ''}`} />
          </button>
        </div>
        <p className="px-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
          {isToday ? "Today's slate" : 'Archived slate'}
        </p>
      </RailSection>

      {/* View mode */}
      <RailSection label="View mode">
        <div
          role="tablist"
          aria-label="Board view"
          className="inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-emerald-950 bg-black/40 p-1"
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
                className={`flex-1 rounded-md px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-[#10B981] text-black shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'text-white/45 hover:text-white/85'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </RailSection>

      {/* Lineup certainty */}
      <RailSection label="Lineup certainty">
        <div className="inline-flex w-full items-center gap-1 rounded-lg border border-emerald-950 bg-black/40 p-1">
          {LINEUP_MODES.map(({ key, label }) => {
            const isActive = lineupMode === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => onLineupModeChange(key)}
                className={`flex-1 rounded-md px-1.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)]'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </RailSection>

      {/* Radar filters */}
      <RailSection label="Radar filters">
        <HrNextTacticalFilters
          activeTag={filterTag}
          onTagChange={onFilterTagChange}
          counts={filterCounts}
          orientation="column"
        />
      </RailSection>

      {/* Utilities */}
      <RailSection label="Utilities">
        <button
          type="button"
          onClick={onToggleStatcast}
          aria-pressed={statcastResolved}
          title="Resolve every plotted node against its Statcast reading"
          className={`flex w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors ${
            statcastResolved
              ? 'border-[var(--aurora-max-emerald)]/50 bg-[var(--aurora-max-emerald)]/15 text-[var(--aurora-max-emerald)]'
              : 'border-white/10 bg-white/5 text-white/55 hover:text-white'
          }`}
        >
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">Statcast Resolve</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onExport('json')}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] font-bold text-white/55 transition-colors hover:text-white"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">JSON</span>
          </button>
          <button
            type="button"
            onClick={() => onExport('csv')}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] font-bold text-white/55 transition-colors hover:text-white"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">CSV</span>
          </button>
        </div>

        <p className="px-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
          {exportStatus ?? `${savedCount} saved`}
        </p>
      </RailSection>
    </Frame>
  );
});

export default HrNextControlRail;
