import React, { useMemo } from 'react';
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
  elite: 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan',
  strong: 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan',
  watch: 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan',
  sleeper: 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan',
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
  const exportDisabled = rows.length === 0;
  const countLabel = useMemo(
    () => `${visibleCount} player${visibleCount === 1 ? '' : 's'}`,
    [visibleCount],
  );

  return (
    <div className="flex flex-col gap-3 border border-white/10 bg-black/25 p-4 font-mono">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
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

        {/* Mode pill group */}
        <div className="flex items-center border border-white/10 bg-black/30 p-1">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSourceModeChange(opt.key)}
              className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition duration-200 ${
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

        {/* View mode toggle — Cards / Table */}
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
            <span className="hidden sm:inline">Cards</span>
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
            <span className="hidden sm:inline">Table</span>
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
            <span className="hidden sm:inline">Map</span>
          </button>
        </div>

        {/* CSV export */}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tier filters — 2×2 on narrow screens, inline row on sm+ */}
        <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2">
          <SlidersHorizontal className="hidden h-3.5 w-3.5 text-vouch-cyan/60 sm:block" />
          {TIER_OPTIONS.map((tier) => {
            const active = activeTiers.includes(tier.key);
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => onToggleTier(tier.key)}
                className={`min-w-0 border px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide transition duration-200 sm:px-3.5 sm:py-1.5 sm:text-xs ${
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

        {/* Count badge */}
        <span className="border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-400">
          {countLabel}
        </span>
      </div>
    </div>
  );
};

export default HrToolbar;
