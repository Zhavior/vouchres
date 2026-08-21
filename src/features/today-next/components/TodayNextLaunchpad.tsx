import React from 'react';
import {
  Activity,
  BarChart3,
  Flame,
  Sparkles,
  Target,
  Tv,
  UserRoundSearch,
} from 'lucide-react';
import type { TodayNextVitals } from '../hooks/useTodayNextHome';

interface TodayNextLaunchpadProps {
  vitals: TodayNextVitals;
  onRoute: (section: string) => void;
}

export function TodayNextLaunchpad({ vitals, onRoute }: TodayNextLaunchpadProps) {
  const tiles = [
    {
      section: 'hr_board',
      icon: Flame,
      label: 'HR Intelligence',
      detail: 'Ranked home-run evidence',
      count: vitals.hrSignals != null ? `${vitals.hrSignals} rows` : null,
      accent: 'text-emerald-400',
      key: '1',
    },
    {
      section: 'admin_hr_next',
      icon: Sparkles,
      label: 'HR Next Terminal',
      detail: 'Terminal board & telemetry',
      count: null,
      accent: 'text-sky-400',
      key: '2',
    },
    {
      section: 'live_games',
      icon: Tv,
      label: 'Live Games',
      detail: 'Scores & in-game context',
      count: vitals.live > 0 ? `${vitals.live} live` : null,
      accent: vitals.live > 0 ? 'text-rose-400' : 'text-zinc-400',
      key: '3',
    },
    {
      section: 'research',
      icon: UserRoundSearch,
      label: 'Player Evidence',
      detail: 'Source-level dossiers',
      count: null,
      accent: 'text-sky-400',
      key: '4',
    },
    {
      section: 'live_parlays',
      icon: Target,
      label: 'Decision Slips',
      detail: 'Slips in progress',
      count: vitals.pendingSlips > 0 ? `${vitals.pendingSlips} pending` : null,
      accent: vitals.pendingSlips > 0 ? 'text-amber-300' : 'text-emerald-400',
      key: '5',
    },
    {
      section: 'results',
      icon: BarChart3,
      label: 'Track Record',
      detail: 'Projection vs outcome',
      count: null,
      accent: 'text-emerald-400',
      key: '6',
    },
  ];

  return (
    <section aria-label="Research workspaces" className="font-mono space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5 font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 truncate">
            SYSTEM WORKSPACES
          </h2>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-[9px] text-zinc-500 uppercase hidden md:inline truncate font-mono">
            HOTKEYS: [1-6] LAUNCH · [K] SEARCH · [?] KEYS
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Docked MY LIST Trigger */}
          <button
            type="button"
            onClick={() => onRoute('live_parlays')}
            className="inline-flex items-center gap-1.5 border border-white/[0.12] bg-white/[0.06] px-2.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-200 hover:bg-white/[0.10] hover:text-white rounded-md transition-colors cursor-pointer"
            title="Open My List Workspace [5]"
          >
            <Target className="h-3 w-3 text-emerald-400" />
            <span>{vitals.pendingSlips > 0 ? `${vitals.pendingSlips} MY LIST` : 'MY LIST'}</span>
            <kbd className="hidden sm:inline-block border border-white/20 bg-black/40 px-1 text-[8px] font-mono text-zinc-400 rounded">
              [5]
            </kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.section}
              type="button"
              onClick={() => onRoute(tile.section)}
              className="group flex min-h-[92px] flex-col justify-between border border-white/[0.08] bg-[#111113] p-4 text-left font-mono rounded-xl transition-all hover:border-white/[0.18] hover:bg-[#18181B] shadow-md cursor-pointer"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${tile.accent}`} aria-hidden="true" />
                  <strong className="truncate text-xs font-medium text-[#F4F4F5] group-hover:text-white transition-colors">
                    {tile.label}
                  </strong>
                </span>
                <kbd className="hidden shrink-0 border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 sm:block font-mono rounded">
                  [{tile.key}]
                </kbd>
              </div>

              <span className="mt-1.5 truncate text-[10px] text-zinc-400">{tile.detail}</span>

              {tile.count && (
                <span className={`mt-2 text-[10px] font-bold tabular-nums font-mono ${tile.accent}`}>
                  ● {tile.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default TodayNextLaunchpad;
