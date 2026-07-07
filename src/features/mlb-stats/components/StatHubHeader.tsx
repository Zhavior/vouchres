/**
 * StatHubHeader — Top bar: title, date picker, search, mode toggle, tier filter badges
 * All colors via CSS tokens.
 */

import React from 'react';
import type { StatType, StatViewMode, StatTier, StatScope } from '../types/statHubTypes';
import { STAT_CONFIG, STAT_ORDER } from '../engine/statHubConfig';
import { StatModeToggle } from './StatModeToggle';

interface Props {
  activeStatType:  StatType;
  date:            string;
  statScope:       StatScope;
  search:          string;
  viewMode:        StatViewMode;
  tierFilter:      StatTier[];
  tierCounts:      { elite: number; strong: number; watch: number; sleeper: number; total: number };
  onStatType:      (t: StatType) => void;
  onDate:          (d: string) => void;
  onStatScope:     (s: StatScope) => void;
  onSearch:        (s: string) => void;
  onViewMode:      (m: StatViewMode) => void;
  onToggleTier:    (t: StatTier) => void;
}

const TIER_COLORS: Record<StatTier, string> = {
  elite:   '--ve-accent-gold',
  strong:  '--ve-accent-cyan',
  watch:   '--ve-accent-pink',
  sleeper: '--ve-text-muted',
  fade:    '--ve-text-muted',
};

const TIER_LABELS_DEFAULT: Record<StatTier, string> = {
  elite: 'Elite', strong: 'Strong', watch: 'Watch', sleeper: 'Sleeper', fade: 'Fade',
};

export const StatHubHeader: React.FC<Props> = ({
  activeStatType, date, statScope, search, viewMode, tierFilter, tierCounts,
  onStatType, onDate, onStatScope, onSearch, onViewMode, onToggleTier,
}) => {
  const config = STAT_CONFIG[activeStatType];

  return (
    <header className="flex flex-col gap-3 pb-4 border-b border-[hsl(var(--ve-border)/0.5)]">
      {/* Row 1: Title + mode toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{config.icon}</span>
          <div>
            <h1 className="text-lg font-bold text-[hsl(var(--ve-text-primary))] leading-tight">
              MLB Stat Intelligence Hub
            </h1>
            <p className="text-xs text-[hsl(var(--ve-text-muted))] mt-0.5">
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatModeToggle value={viewMode} onChange={onViewMode} />
        </div>
      </div>

      {/* Row 2: Stat type tabs */}
      <div
        role="tablist"
        aria-label="Stat category"
        className="flex gap-1 overflow-x-auto pb-1 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {STAT_ORDER.map(st => {
          const cfg   = STAT_CONFIG[st];
          const active = st === activeStatType;
          const token  = cfg.token;
          return (
            <button
              key={st}
              role="tab"
              aria-selected={active}
              onClick={() => onStatType(st)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap',
                'transition-all duration-[var(--ve-duration-fast)]',
                'focus-visible:outline focus-visible:outline-2',
                active
                  ? `bg-[hsl(var(--${token})/0.15)] text-[hsl(var(--${token}))] border border-[hsl(var(--${token})/0.4)] shadow-sm`
                  : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))] hover:bg-[hsl(var(--ve-surface-raised)/0.5)] border border-transparent',
              ].join(' ')}
            >
              <span aria-hidden="true">{cfg.icon}</span>
              <span>{cfg.shortLabel}</span>
              {cfg.phase === 2 && (
                <span className="text-[10px] px-1 py-0 rounded bg-[hsl(var(--ve-accent-pink)/0.2)] text-[hsl(var(--ve-accent-pink))] border border-[hsl(var(--ve-accent-pink)/0.3)] leading-snug">
                  β
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Row 3: Search + date + tier filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--ve-text-muted))] text-xs pointer-events-none" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Player, team…"
            value={search}
            onChange={e => onSearch(e.target.value)}
            aria-label="Search players"
            className={[
              'w-full pl-7 pr-3 py-1.5 rounded-lg text-xs',
              'bg-[hsl(var(--ve-surface))] border border-[hsl(var(--ve-border)/0.6)]',
              'text-[hsl(var(--ve-text-primary))] placeholder:text-[hsl(var(--ve-text-muted))]',
              'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ve-accent-cyan)/0.5)]',
            ].join(' ')}
          />
        </div>

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={e => onDate(e.target.value)}
          aria-label="Select date"
          disabled={statScope === 'overall'}
          className={[
            'px-2.5 py-1.5 rounded-lg text-xs',
            'bg-[hsl(var(--ve-surface))] border border-[hsl(var(--ve-border)/0.6)]',
            'text-[hsl(var(--ve-text-primary))]',
            statScope === 'overall' ? 'opacity-45 cursor-not-allowed' : '',
            'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ve-accent-cyan)/0.5)]',
          ].join(' ')}
        />

        <div role="group" aria-label="Stat range" className="flex rounded-lg border border-[hsl(var(--ve-border)/0.55)] bg-[hsl(var(--ve-surface)/0.55)] p-0.5">
          {(['season', 'overall'] as StatScope[]).map(scope => {
            const active = statScope === scope;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => onStatScope(scope)}
                aria-pressed={active}
                className={[
                  'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide transition-all',
                  active
                    ? 'bg-[hsl(var(--ve-accent-cyan)/0.18)] text-[hsl(var(--ve-accent-cyan))]'
                    : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))]',
                ].join(' ')}
              >
                {scope === 'season' ? 'Season' : 'Overall'}
              </button>
            );
          })}
        </div>

        {/* Tier filter badges */}
        <div role="group" aria-label="Filter by tier" className="flex gap-1 ml-auto">
          {(['elite', 'strong', 'watch', 'sleeper'] as StatTier[]).map(tier => {
            const active = tierFilter.includes(tier);
            const token  = TIER_COLORS[tier];
            const count  = tierCounts[tier as keyof typeof tierCounts] as number;
            return (
              <button
                key={tier}
                onClick={() => onToggleTier(tier)}
                aria-pressed={active}
                className={[
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all',
                  active
                    ? `bg-[hsl(var(${token})/0.2)] text-[hsl(var(${token}))] border border-[hsl(var(${token})/0.5)]`
                    : 'bg-[hsl(var(--ve-surface)/0.4)] text-[hsl(var(--ve-text-muted))] border border-[hsl(var(--ve-border)/0.4)] hover:border-[hsl(var(--ve-border))]',
                ].join(' ')}
              >
                {TIER_LABELS_DEFAULT[tier]}
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[hsl(var(--ve-bg-deep)/0.6)] text-[9px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
