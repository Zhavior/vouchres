import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Download, SlidersHorizontal, LayoutGrid, Table2, LayoutDashboard } from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';
import type { HrRiskTier } from '../Cards/HrPlayerCard';

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
  elite: 'border-ve-ion/55 bg-ve-ion/12 text-ve-ion shadow-[0_0_14px_rgba(0,229,255,0.18)]',
  strong: 'border-vouch-emerald/45 bg-vouch-emerald/10 text-vouch-emerald shadow-[0_0_12px_rgba(0,255,148,0.12)]',
  watch: 'border-ve-fuse/55 bg-ve-graphite/50 text-ve-flash',
  sleeper: 'border-vouch-amber/40 bg-vouch-amber/10 text-vouch-amber',
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
    <div className={`grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 ${className}`}>
      {TIER_OPTIONS.map((tier) => {
        const active = activeTiers.includes(tier.key);
        return (
          <button
            key={tier.key}
            type="button"
            onClick={() => onToggleTier(tier.key)}
            className={`min-h-11 min-w-0 border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition duration-200 sm:min-h-0 sm:px-3.5 sm:py-1.5 sm:text-xs ${
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
    <div className={`flex items-center border border-white/10 bg-black/30 p-1 ${className}`}>
      {MODE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSourceModeChange(opt.key)}
          className={`min-h-11 flex-1 border px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition duration-200 sm:min-h-0 sm:flex-none sm:px-3 sm:py-1.5 sm:text-xs ${
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
      <div className="glass-command flex w-full min-w-0 flex-col gap-3 border border-ve-fuse/45 p-3 font-mono sm:p-4">
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

        {/* Desktop: full toolbar */}
        <div className="hidden flex-col gap-3 md:flex md:flex-row md:flex-wrap md:items-center">
          <div className="relative w-full min-w-0 md:flex-1 md:min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vouch-cyan/60" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search players, teams, pitchers..."
              className="w-full border border-white/10 bg-black/30 py-2.5 pl-9 pr-9 text-sm text-slate-100 placeholder:text-zinc-600 outline-none transition duration-200 focus:border-vouch-cyan/45 focus:ring-1 focus:ring-vouch-cyan/25"
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

          <SourceModeButtons sourceMode={sourceMode} onSourceModeChange={onSourceModeChange} className="w-auto" />

          <div
            className="flex items-center border border-white/10 bg-black/30 p-1"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              aria-pressed={viewMode === 'cards'}
              title="Card view"
              className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition duration-200 ${
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
              className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition duration-200 ${
                viewMode === 'table'
                  ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                  : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('treemap')}
              aria-pressed={viewMode === 'treemap'}
              title="Treemap view"
              className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition duration-200 ${
                viewMode === 'treemap'
                  ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                  : 'border-transparent text-zinc-500 hover:border-vouch-cyan/30 hover:text-zinc-300'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Map
            </button>
          </div>

          <button
            type="button"
            onClick={() => downloadCsv(rows)}
            disabled={exportDisabled}
            className="flex items-center gap-1.5 border border-white/10 bg-black/30 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-zinc-300 transition duration-200 hover:border-vouch-cyan/35 hover:text-vouch-cyan disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-vouch-cyan/60" />
            <TierFilterButtons activeTiers={activeTiers} onToggleTier={onToggleTier} className="w-auto" />
          </div>
          <span className="border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-400">
            {countLabel}
          </span>
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
                    Preview candidates use projected lineups — official batting orders not posted yet.
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
                  ]).map((opt) => (
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
              <button
                type="button"
                onClick={() => downloadCsv(rows)}
                disabled={exportDisabled}
                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 border border-white/10 bg-black/30 text-xs font-bold uppercase tracking-wide text-zinc-300 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
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
