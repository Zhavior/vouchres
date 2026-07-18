import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Download, SlidersHorizontal, LayoutGrid, Table2, LayoutDashboard, ChevronDown } from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';
import type { HrRiskTier } from '../Cards/HrPlayerCard';
import { HR_EXPORT_ENABLED, HR_MAP_ENABLED } from '../../featureAvailability';

export type HrSourceMode = 'confirmed' | 'preview' | 'all';
export type HrViewMode = 'cards' | 'table' | 'treemap';

export interface HrTierFilter {
  key: HrRiskTier;
  label: string;
}

export interface HrToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sourceMode: HrSourceMode;
  onSourceModeChange: (mode: HrSourceMode) => void;
  activeTiers: HrRiskTier[];
  onToggleTier: (tier: HrRiskTier) => void;
  visibleCount: number;
  rows: HrWatchRow[];
  viewMode: HrViewMode;
  onViewModeChange: (mode: HrViewMode) => void;
  /** Confirmed-bucket count — used so Preview copy does not lie when lineups exist. */
  confirmedCount?: number;
}

const TIER_OPTIONS: HrTierFilter[] = [
  { key: 'elite', label: 'Elite' },
  { key: 'strong', label: 'Strong' },
  { key: 'watch', label: 'Watch' },
  { key: 'sleeper', label: 'Sleeper' },
];

const MODE_OPTIONS: { key: HrSourceMode; label: string }[] = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preview', label: 'Preview' },
  { key: 'all', label: 'All' },
];

const TIER_ACTIVE_CLASSES: Record<string, string> = {
  elite: 'border-ve-ion/45 bg-ve-ion/10 text-ve-ion',
  strong: 'border-vouch-emerald/40 bg-vouch-emerald/8 text-vouch-emerald',
  watch: 'border-ve-fuse/55 bg-ve-graphite/50 text-ve-flash',
  sleeper: 'border-vouch-amber/35 bg-vouch-amber/8 text-vouch-amber',
};

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: HrWatchRow[]): string {
  const headers = [
    'playerName',
    'team',
    'opponent',
    'pitcherName',
    'venue',
    'gameTime',
    'rank',
    'hrScore',
    'hitterPower',
    'pitcherVulnerability',
    'parkFactor',
    'recentForm',
    'vouchScore',
    'dataConfidence',
    'truthStatus',
    'riskTier',
    'oddsLabel',
    'sourceMode',
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    const line = [
      row.playerName,
      row.team,
      row.opponent,
      row.pitcherName,
      row.venue,
      row.gameTime,
      row.rank,
      row.hrScore,
      row.hitterPower,
      row.pitcherVulnerability,
      row.parkFactor,
      row.recentForm,
      row.vouchScore,
      row.dataConfidence,
      row.truthStatus,
      row.riskTier,
      row.oddsLabel,
      row.sourceMode,
    ]
      .map(csvEscape)
      .join(',');
    lines.push(line);
  }

  return lines.join('\n');
}

function downloadCsv(rows: HrWatchRow[]): void {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.href = url;
  link.download = `home-run-intelligence-${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function TierFilterButtons({
  activeTiers,
  onToggleTier,
  className = '',
}: {
  activeTiers: HrRiskTier[];
  onToggleTier: (tier: HrRiskTier) => void;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:flex sm:h-10 sm:flex-nowrap sm:items-stretch sm:gap-0 sm:border sm:border-white/10 sm:bg-black/30 sm:p-1 ${className}`}>
      {TIER_OPTIONS.map((tier) => {
        const active = activeTiers.includes(tier.key);
        return (
          <button
            key={tier.key}
            type="button"
            onClick={() => onToggleTier(tier.key)}
            className={`min-h-11 min-w-0 border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition duration-200 sm:h-8 sm:min-h-0 sm:border sm:px-3 sm:py-0 sm:text-[10px] ${
              active
                ? TIER_ACTIVE_CLASSES[tier.key] || 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                : 'border-white/10 bg-black/25 text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
            }`}
            aria-pressed={active}
          >
            {tier.label}
          </button>
        );
      })}
    </div>
  );
}

function SourceModeButtons({
  sourceMode,
  onSourceModeChange,
  className = '',
}: {
  sourceMode: HrSourceMode;
  onSourceModeChange: (mode: HrSourceMode) => void;
  className?: string;
}) {
  return (
    <div className={`flex h-10 items-stretch border border-white/10 bg-black/30 p-1 ${className}`}>
      {MODE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSourceModeChange(opt.key)}
          className={`min-h-11 flex-1 border px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition duration-200 sm:h-8 sm:min-h-0 sm:flex-none sm:px-3 sm:py-0 sm:text-[10px] ${
            sourceMode === opt.key
              ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
              : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
          }`}
          aria-pressed={sourceMode === opt.key}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export const HrToolbar: React.FC<HrToolbarProps> = ({
  searchValue,
  onSearchChange,
  sourceMode,
  onSourceModeChange,
  activeTiers,
  onToggleTier,
  visibleCount,
  rows,
  viewMode,
  onViewModeChange,
  confirmedCount = 0,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const exportDisabled = rows.length === 0;
  const countLabel = useMemo(
    () => `${visibleCount} player${visibleCount === 1 ? '' : 's'}`,
    [visibleCount],
  );
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sourceMode !== 'confirmed') count += 1;
    if (activeTiers.length < TIER_OPTIONS.length) count += 1;
    return count;
  }, [sourceMode, activeTiers.length]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFiltersOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-2.5 border border-white/[0.08] bg-black/20 p-3 font-mono shadow-[inset_0_1px_rgba(255,255,255,0.025)] md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {/* Mobile: compact search row + filter sheet trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vouch-cyan/60" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search players..."
              className="w-full border border-white/10 bg-black/30 py-3 pl-9 pr-9 text-sm text-slate-100 placeholder:text-zinc-600 outline-none transition duration-200 focus:border-vouch-cyan/45 focus:ring-1 focus:ring-vouch-cyan/25"
            />
            {searchValue.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-zinc-500 transition duration-200 hover:text-vouch-cyan"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label="Open filters"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-black/30 text-vouch-cyan transition duration-200 hover:border-vouch-cyan/35"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center border border-vouch-cyan/40 bg-vouch-cyan/20 px-1 text-[9px] font-black text-vouch-cyan">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between md:hidden">
          <span className="border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            {countLabel}
          </span>
          {sourceMode === 'preview' && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-vouch-amber">Preview mode</span>
          )}
        </div>

        {/* Desktop: two balanced rows when space is tight, one line on wide screens. */}
        <div className="hidden min-w-0 gap-2 md:grid md:grid-cols-[minmax(0,1fr)_auto] 2xl:grid-cols-[minmax(210px,1fr)_auto_auto_auto]">
          <div className="relative h-10 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vouch-cyan/60" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search players, teams..."
              className="h-10 w-full border border-white/[0.1] bg-black/25 pl-9 pr-9 text-[11px] text-slate-100 placeholder:text-zinc-600 outline-none transition duration-200 focus:border-vouch-cyan/45 focus:ring-1 focus:ring-vouch-cyan/20"
            />
            {searchValue.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-zinc-500 transition duration-200 hover:text-vouch-cyan"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <SourceModeButtons sourceMode={sourceMode} onSourceModeChange={onSourceModeChange} className="w-auto justify-self-end" />

          <TierFilterButtons activeTiers={activeTiers} onToggleTier={onToggleTier} className="w-auto" />

          <div className="flex min-w-0 items-stretch justify-self-end gap-2">
            <div
              className="flex h-10 items-stretch border border-white/10 bg-black/30 p-1"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                aria-pressed={viewMode === 'cards'}
                title="Card view"
                className={`flex h-8 items-center gap-1.5 border px-3 text-[10px] font-bold uppercase tracking-wide transition duration-200 ${
                  viewMode === 'cards'
                    ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                    : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                aria-pressed={viewMode === 'table'}
                title="Table view"
                className={`flex h-8 items-center gap-1.5 border px-3 text-[10px] font-bold uppercase tracking-wide transition duration-200 ${
                  viewMode === 'table'
                    ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                    : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
                }`}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </button>
              {HR_MAP_ENABLED ? (
                <button
                  type="button"
                  onClick={() => onViewModeChange('treemap')}
                  aria-pressed={viewMode === 'treemap'}
                  title="Treemap view"
                  className={`flex h-8 items-center gap-1.5 border px-3 text-[10px] font-bold uppercase tracking-wide transition duration-200 ${
                    viewMode === 'treemap'
                      ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                      : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Map
                </button>
              ) : null}
            </div>

            {HR_EXPORT_ENABLED ? (
              <button
                type="button"
                onClick={() => downloadCsv(rows)}
                disabled={exportDisabled}
                className="flex h-10 items-center gap-1.5 border border-white/10 bg-black/25 px-3 text-[10px] font-bold uppercase tracking-wide text-zinc-400 transition duration-200 hover:border-vouch-cyan/35 hover:text-vouch-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center justify-between md:flex">
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">{countLabel} found</span>
          <span className="flex items-center gap-2 text-[10px] text-zinc-500">Sorted by Signal Score <ChevronDown className="h-3.5 w-3.5" /></span>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-ve-fuse/50 bg-ve-obsidian shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide text-white">
                <SlidersHorizontal className="h-4 w-4 text-vouch-cyan" />
                Filters
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="flex h-11 w-11 items-center justify-center border border-white/10 bg-black/30 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 font-mono">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Lineup source</p>
                <SourceModeButtons sourceMode={sourceMode} onSourceModeChange={onSourceModeChange} className="w-full" />
                {sourceMode === 'preview' && (
                  <p className="text-[10px] leading-snug text-vouch-amber">
                    {confirmedCount === 0
                      ? 'Preview candidates use projected lineups — official batting orders not posted yet.'
                      : 'Preview candidates use projected lineups and are subject to change. Confirmed official lineups are also available.'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tiers</p>
                <TierFilterButtons activeTiers={activeTiers} onToggleTier={onToggleTier} />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">View</p>
                <div className="flex items-center border border-white/10 bg-black/30 p-1" role="group" aria-label="View mode">
                  {([
                    { key: 'cards' as const, label: 'Cards', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                    { key: 'table' as const, label: 'Table', icon: <Table2 className="h-3.5 w-3.5" /> },
                    { key: 'treemap' as const, label: 'Map', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
                  ].filter((opt) => opt.key !== 'treemap' || HR_MAP_ENABLED)).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onViewModeChange(opt.key)}
                      aria-pressed={viewMode === opt.key}
                      className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 border px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition duration-200 ${
                        viewMode === opt.key
                          ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                          : 'border-transparent text-zinc-500'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {viewMode === 'table' && HR_EXPORT_ENABLED ? (
                <button
                  type="button"
                  onClick={() => downloadCsv(rows)}
                  disabled={exportDisabled}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1.5 border border-white/10 bg-black/30 text-xs font-bold uppercase tracking-wide text-zinc-300 disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex min-h-11 flex-[2] items-center justify-center border border-vouch-cyan/45 bg-vouch-cyan/10 text-xs font-bold uppercase tracking-wide text-vouch-cyan"
              >
                Show {countLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HrToolbar;
