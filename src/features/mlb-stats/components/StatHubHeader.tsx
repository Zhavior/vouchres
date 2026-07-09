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
    <header className={`${Z8_SECTION_HEADER} flex flex-col gap-3 pb-4 border-b border-white/10`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{config.icon}</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              MLB Stat Intelligence Hub
            </h1>
            <p className={`${Z8_LABEL} mt-0.5 text-white/45`}>
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatModeToggle value={viewMode} onChange={onViewMode} />
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Stat category"
        className="flex gap-1 overflow-x-auto pb-1 scrollbar-none"
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
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
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

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35 text-xs pointer-events-none" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Player, team…"
            value={search}
            onChange={e => onSearch(e.target.value)}
            aria-label="Search players"
            className={`${Z8_SURFACE} w-full rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-vouch-cyan/45 focus:outline-none focus:ring-1 focus:ring-vouch-cyan/25`}
          />
        </div>

        <input
          type="date"
          value={date}
          onChange={e => onDate(e.target.value)}
          aria-label="Select date"
          disabled={statScope === 'overall'}
          className={`${Z8_SURFACE} rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-vouch-cyan/45 focus:outline-none focus:ring-1 focus:ring-vouch-cyan/25 ${statScope === 'overall' ? 'opacity-45 cursor-not-allowed' : ''}`}
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
                  'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide transition-all',
                  active ? 'bg-vouch-cyan/15 text-vouch-cyan' : 'text-white/45 hover:text-white',
                ].join(' ')}
              >
                {scope === 'season' ? 'Season' : 'Overall'}
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Filter by tier" className="flex gap-1 ml-auto">
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
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition-all',
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
