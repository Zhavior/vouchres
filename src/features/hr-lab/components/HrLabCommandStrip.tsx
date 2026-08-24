import React from 'react';
import { useMemo, useState } from 'react';
import { Search, X, RotateCw, ChevronDown } from 'lucide-react';
import type { SlateTelemetry } from '../../hr-next/utils/slateTelemetry';
import type { TacticalFilterTag } from '../../hr-next/hooks/useHrNextData';

/**
 * Command strip.
 *
 * HR Next carried a permanent left sidebar that took a fixed column of the
 * viewport at every width; the intelligence surface got what was left. The same
 * controls live here as one quiet horizontal layer, so the stage and register
 * own the workspace. Nothing was dropped — search, date, sort, grouping,
 * tactical filters and the sync action are all still here.
 */

const FILTERS: { tag: TacticalFilterTag; label: string }[] = [
  { tag: 'all', label: 'All' },
  { tag: 'hot', label: 'Hot' },
  { tag: 'high_ev', label: 'High EV' },
  { tag: 'wind_out', label: 'Wind out' },
  { tag: 'vulnerable_sp', label: 'Vuln SP' },
  { tag: 'platoon', label: 'Platoon' },
];

export type HrLabView = 'tier' | 'matchup' | 'none' | 'matrix' | 'team';

const VIEWS: { key: HrLabView; label: string }[] = [
  { key: 'tier', label: 'Tier' },
  { key: 'matchup', label: 'Game' },
  { key: 'none', label: 'Flat' },
  { key: 'team', label: 'Team' },
  { key: 'matrix', label: 'Matrix' },
];

/** Lineup certainty, mapped to the board's own HrWatchMode values. */
const CERTAINTY: { key: 'all' | 'curated' | 'confirmed'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'curated', label: 'Projected' },
  { key: 'confirmed', label: 'Confirmed' },
];

const SORTS: { key: 'hrpi' | 'name' | 'time'; label: string }[] = [
  { key: 'hrpi', label: 'HRPI' },
  { key: 'name', label: 'Name' },
  { key: 'time', label: 'Time' },
];

export interface HrLabCommandStripProps {
  telemetry: SlateTelemetry;
  searchQuery: string;
  onSearch: (v: string) => void;
  filterTag: TacticalFilterTag;
  onFilterTag: (t: TacticalFilterTag) => void;
  filterCounts: Record<string, number>;
  view: string;
  onView: (v: any) => void;
  lineupMode: string;
  onLineupMode: (m: any) => void;
  statcastResolved: boolean;
  onToggleStatcast: () => void;
  onExport: (format: 'json' | 'csv') => void;
  exportStatus: string | null;
  savedCount: number;
  onOpenKeys: () => void;
  sortKey: string;
  onSortKey: (s: any) => void;
  date: string;
  onDate: (d: string) => void;
  syncing: boolean;
  onRefresh: () => void;
  proMode: boolean;
  onProMode: (v: boolean) => void;
}

/** Type-only control chip. Cyan marks the active state, nothing else. */
function Chip({
  active,
  onClick,
  children,
  count,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`inline-flex min-h-8 items-baseline gap-1.5 border-b pb-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? 'border-ve-cyan text-ve-cyan'
          : 'border-transparent text-white/40 hover:border-white/20 hover:text-white'
      }`}
    >
      {children}
      {count != null && (
        <span className={active ? 'text-ve-cyan/60' : 'text-white/25'}>{count}</span>
      )}
    </button>
  );
}

function OptionRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? '' : 'mb-3 border-b border-white/[0.06] pb-3'}>
      <span className="terminal-text block">{label}</span>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-2">{children}</div>
    </div>
  );
}

export function HrLabCommandStrip({
  telemetry,
  searchQuery,
  onSearch,
  filterTag,
  onFilterTag,
  filterCounts,
  view,
  onView,
  lineupMode,
  onLineupMode,
  statcastResolved,
  onToggleStatcast,
  onExport,
  exportStatus,
  savedCount,
  onOpenKeys,
  sortKey,
  onSortKey,
  date,
  onDate,
  syncing,
  onRefresh,
  proMode,
  onProMode,
}: HrLabCommandStripProps) {
  const { volume, lineup, weather } = telemetry;
  const [optionsOpen, setOptionsOpen] = useState(false);

  /*
   * Collapsing controls must never hide live state. Anything set away from its
   * default is echoed on the primary line, so the reader can always see that a
   * filter is narrowing the board without opening the panel.
   */
  const activeSummary = useMemo(() => {
    const out: string[] = [];
    if (sortKey !== 'hrpi') out.push(`Sort ${SORTS.find((s) => s.key === sortKey)?.label ?? sortKey}`);
    if (lineupMode !== 'all')
      out.push(CERTAINTY.find((c) => c.key === lineupMode)?.label ?? String(lineupMode));
    if (filterTag !== 'all') out.push(FILTERS.find((f) => f.tag === filterTag)?.label ?? filterTag);
    if (statcastResolved) out.push('Statcast');
    return out;
  }, [sortKey, lineupMode, filterTag, statcastResolved]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-obsidian-950/90 backdrop-blur-sm">
      {/* Identity + live slate telemetry. Values come from the board's own
          telemetry model; weather prints N/A when the feed is absent. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-5 pt-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ve-emerald">
            HR Next
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
            Home Run Intelligence
          </span>
        </div>

        <dl className="flex flex-wrap items-baseline gap-x-7 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em]">
          <div className="flex items-baseline gap-2">
            <dt className="text-white/30">Slate</dt>
            <dd className="tabular-nums text-white/80">{volume.games}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-white/30">Confirmed</dt>
            <dd className="tabular-nums text-ve-emerald">{lineup.confirmed}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-white/30">Analyzed</dt>
            <dd className="tabular-nums text-white/80">{volume.players}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-white/30">Weather</dt>
            <dd className="tabular-nums text-white/80">
              {weather.hasFeed ? weather.boostedRows : 'N/A'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Primary controls. Only what is used on nearly every interaction:
          search, the view the page transforms into, and tier's modifier.
          Everything else moved behind Options — but any non-default setting
          still surfaces here as a chip, so collapsing never hides live state. */}
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3 px-5 py-3">
        <div className="relative min-w-0 flex-1 sm:max-w-[220px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25"
          />
          <label htmlFor="hrlab-search" className="sr-only">
            Search the slate
          </label>
          <input
            id="hrlab-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Player / team"
            className="w-full border-b border-white/10 bg-transparent py-1.5 pl-6 pr-6 font-mono text-[11px] uppercase tracking-[0.12em] text-white placeholder:text-white/25 transition-colors focus:border-ve-cyan focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          {VIEWS.map((v) => (
            <Chip key={v.key} active={view === v.key} onClick={() => onView(v.key)}>
              {v.label}
            </Chip>
          ))}
        </div>

        <span aria-hidden="true" className="h-3 w-px bg-white/10" />

        <Chip active={proMode} onClick={() => onProMode(!proMode)} disabled={view !== 'tier'}>
          Pro
        </Chip>

        {/* Non-default settings stay visible even while collapsed. */}
        {activeSummary.length > 0 && (
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {activeSummary.map((label) => (
              <span
                key={label}
                className="font-mono text-[9px] uppercase tracking-[0.16em] text-ve-cyan/70"
              >
                {label}
              </span>
            ))}
          </span>
        )}

        <div className="ml-auto flex items-center gap-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOptionsOpen((v) => !v)}
              aria-expanded={optionsOpen}
              aria-haspopup="true"
              className={`inline-flex min-h-8 items-center gap-1.5 border-b pb-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                optionsOpen
                  ? 'border-ve-cyan text-ve-cyan'
                  : 'border-transparent text-white/40 hover:border-white/20 hover:text-white'
              }`}
            >
              Options
              <ChevronDown
                aria-hidden="true"
                className={`h-3 w-3 transition-transform ${optionsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {optionsOpen && (
              <>
                {/* Click-away without trapping focus: the panel is a disclosure,
                    not a modal, and the page stays interactive behind it. */}
                <button
                  type="button"
                  aria-label="Close options"
                  onClick={() => setOptionsOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-[300px] border border-white/[0.10] bg-obsidian-950 p-4"
                  role="group"
                  aria-label="Board options"
                >
                  <OptionRow label="Sort">
                    {SORTS.map((so) => (
                      <Chip key={so.key} active={sortKey === so.key} onClick={() => onSortKey(so.key)}>
                        {so.label}
                      </Chip>
                    ))}
                  </OptionRow>

                  <OptionRow label="Lineup">
                    {CERTAINTY.map((c) => (
                      <Chip key={c.key} active={lineupMode === c.key} onClick={() => onLineupMode(c.key)}>
                        {c.label}
                      </Chip>
                    ))}
                  </OptionRow>

                  <OptionRow label="Radar">
                    {FILTERS.map((f) => (
                      <Chip
                        key={f.tag}
                        active={filterTag === f.tag}
                        onClick={() => onFilterTag(f.tag)}
                        count={filterCounts[f.tag]}
                      >
                        {f.label}
                      </Chip>
                    ))}
                  </OptionRow>

                  <OptionRow label="Utils" last>
                    <Chip active={statcastResolved} onClick={onToggleStatcast}>
                      Statcast
                    </Chip>
                    <Chip active={false} onClick={() => onExport('json')}>
                      JSON
                    </Chip>
                    <Chip active={false} onClick={() => onExport('csv')}>
                      CSV
                    </Chip>
                    <Chip active={false} onClick={onOpenKeys}>
                      Keys
                    </Chip>
                  </OptionRow>

                  <p className="mt-3 border-t border-white/[0.08] pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
                    {exportStatus ?? `${savedCount} saved`}
                  </p>
                </div>
              </>
            )}
          </div>

          <label htmlFor="hrlab-date" className="sr-only">
            Slate date
          </label>
          <input
            id="hrlab-date"
            type="date"
            value={date}
            onChange={(e) => onDate(e.target.value)}
            className="border-b border-white/10 bg-transparent py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition-colors focus:border-ve-cyan focus:outline-none"
          />

          <button
            type="button"
            onClick={onRefresh}
            disabled={syncing}
            className="inline-flex min-h-8 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-ve-cyan disabled:opacity-40"
          >
            <RotateCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {syncing ? 'Syncing' : 'Sync'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default HrLabCommandStrip;
