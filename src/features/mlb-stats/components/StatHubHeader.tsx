import React from 'react';
import type { StatType, StatViewMode, StatTier, StatScope } from '../types/statHubTypes';
import { STAT_CONFIG, STAT_ORDER } from '../engine/statHubConfig';
import { StatModeToggle } from './StatModeToggle';
import { BarChart3, Search, Calendar, Filter, Sparkles } from 'lucide-react';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_SECTION_HEADER, Z8_ICON_BOX } from '../../../theme/z8Tokens';

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

const TIER_COLORS: Record<StatTier, string> = {
  elite: 'border-vouch-emerald/40 bg-vouch-emerald/15 text-vouch-emerald',
  strong: 'border-vouch-cyan/40 bg-vouch-cyan/15 text-vouch-cyan',
  watch: 'border-amber-400/40 bg-amber-400/15 text-amber-300',
  sleeper: 'border-sky-400/40 bg-sky-400/15 text-sky-300',
  fade: 'border-slate-500/40 bg-slate-500/15 text-slate-400',
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
    <header className="flex flex-col gap-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`${Z8_ICON_BOX} h-12 w-12 rounded-2xl bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan shadow-[0_0_15px_rgba(79,184,220,0.25)]`}>
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`${Z8_SECTION_HEADER} text-lg sm:text-xl font-black uppercase text-white tracking-tight`}>
                MLB Stat Intelligence Hub
              </h1>
              <span className="font-mono text-[9px] uppercase tracking-widest text-vouch-cyan font-bold bg-vouch-cyan/10 border border-vouch-cyan/30 px-2.5 py-0.5 rounded-full">
                Z8 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">{config.description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <StatModeToggle value={viewMode} onChange={onViewMode} />
          <span className="rounded-xl border border-white/12 bg-black/40 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-vouch-emerald shadow-inner">
            {loading ? 'Syncing...' : `${rowCount} Rows Loaded`}
          </span>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div role="tablist" aria-label="Stat category" className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-black font-mono uppercase tracking-wider transition ${
                active
                  ? 'border-vouch-cyan bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_12px_rgba(79,184,220,0.2)]'
                  : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>{cfg.shortLabel}</span>
              {cfg.phase === 2 && (
                <span className="font-mono text-[9px] font-bold text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1 rounded">
                  BETA
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar: Search, Date, Scope */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search player or team..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-xl border border-white/12 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-vouch-cyan focus:outline-none focus:ring-1 focus:ring-vouch-cyan/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => onDate(e.target.value)}
              disabled={statScope === 'overall'}
              className="w-full rounded-xl border border-white/12 bg-black/40 pl-9 pr-3 py-2 text-xs font-mono text-white focus:border-vouch-cyan focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>

        <div className="flex rounded-xl border border-white/12 bg-black/40 p-1">
          {(['season', 'overall'] as StatScope[]).map((scope) => {
            const active = statScope === scope;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => onStatScope(scope)}
                aria-pressed={active}
                className={`flex-1 rounded-lg py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                  active
                    ? 'bg-vouch-emerald/20 border border-vouch-emerald/40 text-vouch-emerald shadow-[0_0_10px_rgba(49,181,131,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {scope === 'season' ? 'Season Scope' : 'Overall Career'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Filter className="h-3 w-3 text-vouch-cyan" /> Tier Filter:
        </span>
        {(['elite', 'strong', 'watch', 'sleeper'] as StatTier[]).map((tier) => {
          const active = tierFilter.includes(tier);
          const count = tierCounts[tier as keyof typeof tierCounts] as number;
          const colorStyle = TIER_COLORS[tier];

          return (
            <button
              key={tier}
              type="button"
              onClick={() => onToggleTier(tier)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition ${
                active
                  ? `${colorStyle} shadow-[0_0_10px_rgba(255,255,255,0.1)]`
                  : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>{TIER_LABELS[tier]}</span>
              <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] tabular-nums text-white font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl border px-3 py-2 text-xs font-mono font-bold leading-relaxed ${
        error ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-white/10 bg-black/40 text-slate-400'
      }`}>
        {error
          ? `Status Alert: ${error}`
          : loading
            ? 'Syncing official MLB Stats API feeds...'
            : `Verified Dataset: ${rowCount} Official Rows · Category: ${config.label}`}
      </div>
    </header>
  );
};
