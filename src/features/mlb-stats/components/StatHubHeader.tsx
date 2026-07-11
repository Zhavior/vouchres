/**
 * StatHubHeader — compact professional chrome for MLB Stat Intelligence Hub
 */

import React from 'react';
import type { StatType, StatViewMode, StatTier, StatScope } from '../types/statHubTypes';
import { STAT_CONFIG, STAT_ORDER } from '../engine/statHubConfig';
import { StatModeToggle } from './StatModeToggle';

interface Props {
  activeStatType: StatType;
  date: string;
  statScope: StatScope;
  search: string;
  viewMode: StatViewMode;
  tierFilter: StatTier[];
  tierCounts: { elite: number; strong: number; watch: number; sleeper: number; total: number };
  rowCount?: number;
  loading?: boolean;
  error?: string | null;
  onStatType: (t: StatType) => void;
  onDate: (d: string) => void;
  onStatScope: (s: StatScope) => void;
  onSearch: (s: string) => void;
  onViewMode: (m: StatViewMode) => void;
  onToggleTier: (t: StatTier) => void;
}

const TIER_LABELS: Record<StatTier, string> = {
  elite: 'Elite',
  strong: 'Strong',
  watch: 'Watch',
  sleeper: 'Sleep',
  fade: 'Fade',
};

export const StatHubHeader: React.FC<Props> = ({
  activeStatType,
  date,
  statScope,
  search,
  viewMode,
  tierFilter,
  tierCounts,
  rowCount = 0,
  loading = false,
  error = null,
  onStatType,
  onDate,
  onStatScope,
  onSearch,
  onViewMode,
  onToggleTier,
}) => {
  const config = STAT_CONFIG[activeStatType];

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">MLB Research</p>
          <h1 className="ve-stat-hub-title mt-0.5 text-lg font-bold leading-tight text-white sm:text-xl">
            Stat Intelligence Hub
          </h1>
          <p className="ve-stat-hub-subtitle mt-1 text-xs text-white/45">{config.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatModeToggle value={viewMode} onChange={onViewMode} />
          <span className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white/45">
            {loading ? 'Loading…' : `${rowCount} rows`}
          </span>
        </div>
      </div>

      <div role="tablist" aria-label="Stat category" className="ve-stat-hub-scroll-x">
        {STAT_ORDER.map((st) => {
          const cfg = STAT_CONFIG[st];
          const active = st === activeStatType;
          return (
            <button
              key={st}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatType(st)}
              className={[
                've-stat-hub-pill rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition',
                active
                  ? 'border-white/25 bg-white/10 text-white'
                  : 'border-white/8 bg-black/25 text-white/45 hover:border-white/15 hover:text-white/70',
              ].join(' ')}
            >
              {cfg.shortLabel}
              {cfg.phase === 2 && (
                <span className="ml-1 font-mono text-[8px] uppercase text-amber-200/80">β</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="ve-stat-hub-toolbar flex flex-wrap items-center gap-2">
        <div className="ve-stat-hub-search relative min-w-[140px] flex-1">
          <input
            type="search"
            placeholder="Search player or team…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search players"
            className="w-full rounded-lg border border-white/10 bg-[var(--ve-stat-panel-raised)] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          aria-label="Select date"
          disabled={statScope === 'overall'}
          className={`rounded-lg border border-white/10 bg-[var(--ve-stat-panel-raised)] px-2.5 py-2 text-xs text-white focus:border-white/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${statScope === 'overall' ? '' : ''}`}
        />

        <div role="group" aria-label="Stat range" className="flex rounded-lg border border-white/10 bg-[var(--ve-stat-panel-raised)] p-0.5">
          {(['season', 'overall'] as StatScope[]).map((scope) => {
            const active = statScope === scope;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => onStatScope(scope)}
                aria-pressed={active}
                className={[
                  'rounded-md px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wide transition',
                  active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/65',
                ].join(' ')}
              >
                {scope === 'season' ? 'Season' : 'Overall'}
              </button>
            );
          })}
        </div>
      </div>

      <div role="group" aria-label="Filter by tier" className="ve-stat-hub-tier-row ve-stat-hub-scroll-x">
        {(['elite', 'strong', 'watch', 'sleeper'] as StatTier[]).map((tier) => {
          const active = tierFilter.includes(tier);
          const count = tierCounts[tier as keyof typeof tierCounts] as number;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onToggleTier(tier)}
              aria-pressed={active}
              className={[
                've-stat-hub-pill flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wide transition',
                active
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/8 bg-black/20 text-white/40 hover:border-white/15 hover:text-white/60',
              ].join(' ')}
            >
              {TIER_LABELS[tier]}
              <span className="rounded bg-black/40 px-1 py-0.5 text-[8px] tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      <div
        className={[
          've-stat-hub-status rounded-lg border px-3 py-2 text-xs leading-relaxed',
          error ? 'border-red-500/25 bg-red-500/8 text-red-200/85' : 'border-white/8 bg-black/25 text-white/45',
        ].join(' ')}
      >
        {error
          ? `${error}. No mock Stat Hub rows are shown.`
          : loading
            ? 'Loading schedule, rosters, and MLB Stats API data…'
            : `${rowCount} official MLB API row${rowCount === 1 ? '' : 's'} · ${config.label} · lineups not inferred`}
      </div>
    </header>
  );
};
