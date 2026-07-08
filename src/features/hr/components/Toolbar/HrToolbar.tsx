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
  elite: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
  strong: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  watch: 'bg-blue-500/15 text-blue-300 ring-blue-500/40',
  sleeper: 'bg-purple-500/15 text-purple-300 ring-purple-500/40',
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
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{
        borderColor: 'hsl(var(--ve-border))',
        background: 'hsl(var(--ve-bg-panel))',
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search players, teams, pitchers..."
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-9 pr-9 text-sm text-slate-100 placeholder:text-zinc-600 outline-none transition duration-200 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
          />
          {searchValue.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition duration-200 hover:text-cyan-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mode pill group */}
        <div className="flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] p-1">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSourceModeChange(opt.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
                sourceMode === opt.key
                  ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              aria-pressed={sourceMode === opt.key}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* View mode toggle — Cards / Table */}
        <div
          className="flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] p-1"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            aria-pressed={viewMode === 'cards'}
            title="Card view"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
              viewMode === 'cards'
                ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
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
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
              viewMode === 'table'
                ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
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
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
              viewMode === 'treemap'
                ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
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
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-zinc-300 transition duration-200 hover:border-cyan-500/30 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tier filters */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-600" />
          {TIER_OPTIONS.map((tier) => {
            const active = activeTiers.includes(tier.key);
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => onToggleTier(tier.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition duration-200 ${
                  active
                    ? TIER_ACTIVE_CLASSES[tier.key] || 'bg-white/10 text-slate-200 ring-white/20'
                    : 'bg-white/[0.02] text-zinc-500 ring-white/[0.06] hover:text-zinc-300'
                }`}
                aria-pressed={active}
              >
                {tier.label}
              </button>
            );
          })}
        </div>

        {/* Count badge */}
        <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-zinc-400">
          {countLabel}
        </span>
      </div>
    </div>
  );
};

export default HrToolbar;
