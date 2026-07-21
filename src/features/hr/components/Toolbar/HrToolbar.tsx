import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Download, SlidersHorizontal, LayoutGrid, Table2, LayoutDashboard, ChevronDown, ShieldCheck, TriangleAlert, Layers } from 'lucide-react';
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
  confirmedCount?: number;
  previewCount?: number;
}

const TIER_OPTIONS: HrTierFilter[] = [
  { key: 'elite', label: 'Elite' },
  { key: 'strong', label: 'Strong' },
  { key: 'watch', label: 'Watch' },
  { key: 'sleeper', label: 'Sleeper' },
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
    <div className={`flex overflow-x-auto gap-1 py-0.5 scrollbar-none snap-x sm:grid sm:grid-cols-2 sm:h-10 sm:flex-nowrap sm:items-stretch w-full min-w-0 max-w-full rounded-xl border border-white/15 bg-[#0a121d] p-1 ${className}`}>
      {TIER_OPTIONS.map((tier) => {
        const active = activeTiers.includes(tier.key);
        const activeClasses =
          tier.key === 'elite'
            ? 'border-vouch-cyan/60 bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_12px_rgba(0,240,255,0.25)]'
            : tier.key === 'strong'
              ? 'border-vouch-emerald/60 bg-vouch-emerald/20 text-vouch-emerald shadow-[0_0_12px_rgba(0,255,148,0.25)]'
              : tier.key === 'sleeper'
                ? 'border-vouch-amber/60 bg-vouch-amber/20 text-vouch-amber shadow-[0_0_12px_rgba(255,183,0,0.25)]'
                : 'border-white/30 bg-white/15 text-slate-100 shadow-[0_0_12px_rgba(255,255,255,0.1)]';

        return (
          <button
            key={tier.key}
            type="button"
            onClick={() => onToggleTier(tier.key)}
            className={`shrink-0 snap-start flex-1 min-w-[70px] sm:min-w-0 rounded-lg border px-2 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 sm:h-8 sm:px-3 sm:py-0 truncate ${
              active
                ? activeClasses
                : 'border-white/10 bg-black/40 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
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
  confirmedCount,
  previewCount,
  className = '',
}: {
  sourceMode: HrSourceMode;
  onSourceModeChange: (mode: HrSourceMode) => void;
  confirmedCount?: number;
  previewCount?: number;
  className?: string;
}) {
  const modes: Array<{
    key: HrSourceMode;
    label: string;
    count?: number;
    activeClasses: string;
    dotClasses: string;
  }> = [
    {
      key: 'confirmed',
      label: 'Confirmed',
      count: confirmedCount,
      activeClasses: 'border-vouch-emerald/60 bg-vouch-emerald/20 text-vouch-emerald shadow-[0_0_14px_rgba(0,255,148,0.25)]',
      dotClasses: 'bg-vouch-emerald shadow-[0_0_8px_rgba(0,255,148,0.8)]',
    },
    {
      key: 'preview',
      label: 'Preview',
      count: previewCount,
      activeClasses: 'border-vouch-amber/60 bg-vouch-amber/20 text-vouch-amber shadow-[0_0_14px_rgba(255,183,0,0.25)]',
      dotClasses: 'bg-vouch-amber shadow-[0_0_8px_rgba(255,183,0,0.8)]',
    },
    {
      key: 'all',
      label: 'All Signals',
      count: confirmedCount != null && previewCount != null ? confirmedCount + previewCount : undefined,
      activeClasses: 'border-vouch-cyan/60 bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_14px_rgba(0,240,255,0.25)]',
      dotClasses: 'bg-vouch-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)]',
    },
  ];

  return (
    <div className={`grid grid-cols-3 w-full min-w-0 max-w-full overflow-hidden items-stretch rounded-xl border border-white/15 bg-[#0a121d] p-1 gap-1 ${className}`}>
      {modes.map((opt) => {
        const active = sourceMode === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSourceModeChange(opt.key)}
            className={`min-w-0 flex-1 inline-flex items-center justify-center gap-1 rounded-lg border px-1 py-1 text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              active
                ? opt.activeClasses
                : 'border-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300'
            }`}
            aria-pressed={active}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${active ? opt.dotClasses : 'bg-white/20'}`} />
            <span className="truncate min-w-0">{opt.label}</span>
            {opt.count != null && (
              <span className={`ml-0.5 shrink-0 rounded px-1 py-0.2 font-mono text-[8px] sm:text-[9px] font-bold ${active ? 'bg-black/40' : 'bg-white/[0.06] text-white/40'}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
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
  confirmedCount,
  previewCount,
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
      <div className="flex w-full min-w-0 flex-col gap-2 border border-white/[0.08] bg-black/20 p-2 font-mono shadow-[inset_0_1px_rgba(255,255,255,0.025)] md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {/* Mobile: Compact top controls */}
        <div className="flex flex-col gap-2 rounded-xl border border-white/12 bg-[#060c14]/90 p-2.5 shadow-xl backdrop-blur-xl md:hidden">
          {/* Row 1: Search + View Switcher + Filter Button */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vouch-cyan" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search players, teams..."
                className="h-9 w-full rounded-lg border border-white/15 bg-black/40 pl-8 pr-7 font-mono text-[11px] text-white placeholder:text-zinc-500 outline-none transition duration-200 focus:border-vouch-cyan focus:ring-1 focus:ring-vouch-cyan/30"
              />
              {searchValue.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-zinc-400 hover:text-vouch-cyan"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Quick View Mode Switcher */}
            <div className="flex h-9 shrink-0 items-stretch rounded-lg border border-white/15 bg-black/40 p-0.5">
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                aria-pressed={viewMode === 'cards'}
                title="Card View"
                className={`flex h-8 w-8 items-center justify-center rounded border transition duration-200 ${
                  viewMode === 'cards'
                    ? 'border-vouch-cyan/60 bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                aria-pressed={viewMode === 'table'}
                title="Table View"
                className={`flex h-8 w-8 items-center justify-center rounded border transition duration-200 ${
                  viewMode === 'table'
                    ? 'border-vouch-cyan/60 bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Table2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Filter Sheet Trigger */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Open filters"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vouch-cyan/40 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_12px_rgba(0,240,255,0.2)] transition duration-200 hover:border-vouch-cyan hover:bg-vouch-cyan/25"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-vouch-cyan bg-vouch-cyan px-1 font-mono text-[8px] font-black text-black shadow-md">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Row 2: Source Mode Tabs */}
          <SourceModeButtons
            sourceMode={sourceMode}
            onSourceModeChange={onSourceModeChange}
            confirmedCount={confirmedCount}
            previewCount={previewCount}
            className="w-full"
          />

          {/* Row 3: Tier Filters Bar */}
          <TierFilterButtons activeTiers={activeTiers} onToggleTier={onToggleTier} className="w-full" />

          {/* Row 4: Summary Count Bar */}
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            <span>{countLabel} found</span>
            <span className="text-zinc-500">Sorted by Signal Score</span>
          </div>
        </div>

        {/* Desktop controls */}
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
                className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 text-zinc-500 transition duration-200 hover:text-vouch-cyan"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <SourceModeButtons
            sourceMode={sourceMode}
            onSourceModeChange={onSourceModeChange}
            confirmedCount={confirmedCount}
            previewCount={previewCount}
            className="w-auto justify-self-end"
          />

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
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-3xl border-t border-vouch-cyan/35 bg-[#070e17] shadow-[0_-10px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            {/* Drawer Handle */}
            <div className="flex items-center justify-center pt-2.5 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2.5 font-mono text-base font-black uppercase tracking-wider text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-vouch-cyan/40 bg-vouch-cyan/15 text-vouch-cyan">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <span>Slate Filters</span>
                {activeFilterCount > 0 && (
                  <span className="rounded border border-vouch-cyan/40 bg-vouch-cyan/20 px-2 py-0.5 font-mono text-xs font-bold text-vouch-cyan">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-zinc-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 font-mono">
              {/* Lineup Source Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-widest text-vouch-cyan">Lineup Source</p>
                  <span className="text-[10px] font-bold text-zinc-500">Truth OS Verified</span>
                </div>
                <SourceModeButtons
                  sourceMode={sourceMode}
                  onSourceModeChange={onSourceModeChange}
                  confirmedCount={confirmedCount}
                  previewCount={previewCount}
                  className="w-full"
                />
                <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-[11px] text-zinc-400">
                  {sourceMode === 'confirmed' ? (
                    <p className="flex items-center gap-1.5 font-bold text-vouch-emerald">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      Official MLB lineups only. Unconfirmed rosters filtered.
                    </p>
                  ) : sourceMode === 'preview' ? (
                    <p className="flex items-center gap-1.5 font-bold text-vouch-amber">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                      Projected lineups — official orders not posted yet by MLB.
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 font-bold text-vouch-cyan">
                      <Layers className="h-3.5 w-3.5 shrink-0" />
                      Combined view — confirmed & projected hitters labeled.
                    </p>
                  )}
                </div>
              </div>

              {/* Tiers Section */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-black uppercase tracking-widest text-vouch-cyan">Risk Tier Filter</p>
                <TierFilterButtons activeTiers={activeTiers} onToggleTier={onToggleTier} />
              </div>

              {/* View Mode Section */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-black uppercase tracking-widest text-vouch-cyan">Display Layout</p>
                <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-1.5" role="group" aria-label="View mode">
                  {([
                    { key: 'cards' as const, label: 'Cards Grid', icon: <LayoutGrid className="h-4 w-4" /> },
                    { key: 'table' as const, label: 'Table View', icon: <Table2 className="h-4 w-4" /> },
                    { key: 'treemap' as const, label: 'Map View', icon: <LayoutDashboard className="h-4 w-4" /> },
                  ].filter((opt) => opt.key !== 'treemap' || HR_MAP_ENABLED)).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onViewModeChange(opt.key)}
                      aria-pressed={viewMode === opt.key}
                      className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border text-xs font-black uppercase tracking-wide transition duration-200 ${
                        viewMode === opt.key
                          ? 'border-vouch-cyan/60 bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 border-t border-white/10 bg-black/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {viewMode === 'table' && HR_EXPORT_ENABLED ? (
                <button
                  type="button"
                  onClick={() => downloadCsv(rows)}
                  disabled={exportDisabled}
                  className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-black/40 px-4 text-xs font-bold uppercase tracking-wide text-zinc-300 disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-vouch-cyan via-cyan-400 to-vouch-emerald px-6 text-sm font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(0,240,255,0.35)] transition hover:brightness-110 active:scale-[0.98]"
              >
                Apply & Show {countLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HrToolbar;
