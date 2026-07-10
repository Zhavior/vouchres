/**
 * StatHubHeader — Top bar: title, date picker, search, mode toggle, tier filter badges
 */

import React from 'react';
import type { StatType, StatViewMode, StatTier, StatScope } from '../types/statHubTypes';
import { STAT_CONFIG, STAT_ORDER } from '../engine/statHubConfig';
import { StatModeToggle } from './StatModeToggle';
import { Z8_ACTIVE, Z8_IDLE, Z8_LABEL, Z8_SECTION_HEADER, Z8_SURFACE } from '../../../theme/z8Tokens';

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

const TIER_CLASSES: Record<StatTier, { active: string; idle: string }> = {
  elite:   { active: 'border-vouch-amber/40 bg-vouch-amber/15 text-vouch-amber', idle: 'text-white/45' },
  strong:  { active: 'border-vouch-cyan/40 bg-vouch-cyan/15 text-vouch-cyan', idle: 'text-white/45' },
  watch:   { active: 'border-vouch-emerald/35 bg-vouch-emerald/10 text-vouch-emerald', idle: 'text-white/45' },
  sleeper: { active: 'border-white/20 bg-white/5 text-white/70', idle: 'text-white/45' },
  fade:    { active: 'border-red-500/30 bg-red-500/10 text-red-300', idle: 'text-white/45' },
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
    <header className={`${Z8_SECTION_HEADER} flex flex-col gap-3 pb-3 sm:pb-4 border-b border-white/10`}>
      <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="text-xl sm:text-2xl shrink-0" aria-hidden="true">{config.icon}</span>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
              MLB Stat Intelligence Hub
            </h1>
            <p className={`${Z8_LABEL} mt-0.5 text-white/45 line-clamp-2 sm:line-clamp-none`}>
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatModeToggle value={viewMode} onChange={onViewMode} />
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Stat category"
        className="stat-hub-stat-tabs flex gap-1 overflow-x-auto pb-1 snap-x snap-mandatory no-scrollbar -mx-1 px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {STAT_ORDER.map(st => {
          const cfg   = STAT_CONFIG[st];
          const active = st === activeStatType;
          return (
            <button
              key={st}
              role="tab"
              aria-selected={active}
              onClick={() => onStatType(st)}
              className={[
                'flex shrink-0 snap-start items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-9 touch-manipulation',
                active ? `${Z8_ACTIVE} rounded-lg` : `${Z8_IDLE} rounded-lg border border-transparent`,
              ].join(' ')}
            >
              <span aria-hidden="true">{cfg.icon}</span>
              <span>{cfg.shortLabel}</span>
              {cfg.phase === 2 && (
                <span className={`${Z8_LABEL} rounded border border-vouch-cyan/30 bg-vouch-cyan/10 px-1 py-0 text-vouch-cyan`}>
                  β
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="relative w-full sm:flex-1 sm:min-w-[160px] sm:max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35 text-xs pointer-events-none" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Player, team…"
            value={search}
            onChange={e => onSearch(e.target.value)}
            aria-label="Search players"
            className={`${Z8_SURFACE} w-full rounded-lg pl-7 pr-3 py-2.5 sm:py-1.5 text-xs text-white placeholder:text-white/30 focus:border-vouch-cyan/45 focus:outline-none focus:ring-1 focus:ring-vouch-cyan/25 min-h-11 sm:min-h-0`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => onDate(e.target.value)}
            aria-label="Select date"
            disabled={statScope === 'overall'}
            className={`${Z8_SURFACE} rounded-lg px-2.5 py-2.5 sm:py-1.5 text-xs text-white focus:border-vouch-cyan/45 focus:outline-none focus:ring-1 focus:ring-vouch-cyan/25 min-h-11 sm:min-h-0 ${statScope === 'overall' ? 'opacity-45 cursor-not-allowed' : ''}`}
          />

          <div role="group" aria-label="Stat range" className={`${Z8_SURFACE} flex rounded-lg p-0.5`}>
            {(['season', 'overall'] as StatScope[]).map(scope => {
              const active = statScope === scope;
              return (
                <button
                  key={scope}
                  type="button"
                  onClick={() => onStatScope(scope)}
                  aria-pressed={active}
                  className={[
                    'px-3 py-2 sm:px-2.5 sm:py-1 rounded-md text-[10px] font-black uppercase tracking-wide transition-all min-h-9 sm:min-h-0 touch-manipulation',
                    active ? 'bg-vouch-cyan/15 text-vouch-cyan' : 'text-white/45 hover:text-white',
                  ].join(' ')}
                >
                  {scope === 'season' ? 'Season' : 'Overall'}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter by tier"
          className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:ml-auto sm:overflow-visible sm:flex-wrap"
        >
          {(['elite', 'strong', 'watch', 'sleeper'] as StatTier[]).map(tier => {
            const active = tierFilter.includes(tier);
            const tierCls = TIER_CLASSES[tier];
            const count  = tierCounts[tier as keyof typeof tierCounts] as number;
            return (
              <button
                key={tier}
                onClick={() => onToggleTier(tier)}
                aria-pressed={active}
                className={[
                  'flex shrink-0 items-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition-all min-h-9 sm:min-h-0 touch-manipulation',
                  active ? tierCls.active : `${Z8_SURFACE} ${tierCls.idle} hover:border-white/20`,
                ].join(' ')}
              >
                {TIER_LABELS_DEFAULT[tier]}
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-black/40 text-[9px]">
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
