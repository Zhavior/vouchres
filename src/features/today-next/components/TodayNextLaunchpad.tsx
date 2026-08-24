import React from 'react';
import {
  Activity,
  BarChart3,
  Flame,
  Sparkles,
  Target,
  Tv,
  UserRoundSearch,
  Newspaper,
  Trophy,
} from 'lucide-react';
import type { TodayNextVitals } from '../hooks/useTodayNextHome';

interface TodayNextLaunchpadProps {
  vitals: TodayNextVitals;
  onRoute: (section: string) => void;
}

export function TodayNextLaunchpad({ vitals, onRoute }: TodayNextLaunchpadProps) {
  const tiles = [
    {
      section: 'news',
      icon: Newspaper,
      label: 'News Wire & Blog',
      detail: 'MLB news & engineering blog',
      count: 'LIVE',
      accent: 'text-ve-emerald',
      key: '1',
    },
    {
      section: 'hr_board',
      icon: Flame,
      label: 'HR Intelligence',
      detail: 'Ranked home-run evidence',
      count: vitals.hrSignals != null ? `${vitals.hrSignals} rows` : null,
      accent: 'text-ve-emerald',
      key: '2',
    },
    {
      section: 'nfl_touchdown',
      icon: Trophy,
      label: 'NFL Touchdown',
      detail: 'Anytime TD probability models',
      count: 'NEXT GEN',
      accent: 'text-ve-amber',
      key: '3',
    },
    {
      section: 'live_games',
      icon: Tv,
      label: 'Live Games',
      detail: 'Scores & in-game context',
      count: vitals.live > 0 ? `${vitals.live} live` : null,
      accent: vitals.live > 0 ? 'text-ve-red' : 'text-white/55',
      key: '4',
    },
    {
      section: 'research',
      icon: UserRoundSearch,
      label: 'Player Evidence',
      detail: 'Source-level dossiers',
      count: null,
      accent: 'text-ve-cyan',
      key: '5',
    },
    {
      section: 'results',
      icon: BarChart3,
      label: 'Track Record',
      detail: 'Projection vs outcome',
      count: null,
      accent: 'text-ve-emerald',
      key: '6',
    },
  ];

  return (
    <section aria-label="Research workspaces" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5 font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-3.5 w-3.5 text-ve-emerald shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/70 truncate">
            SYSTEM WORKSPACES
          </h2>
          <span className="text-white/30 hidden sm:inline">|</span>
          <span className="text-[9px] text-white/40 uppercase hidden md:inline truncate font-mono">
            HOTKEYS: [1-6] LAUNCH · [K] SEARCH · [?] KEYS
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Docked MY LIST Trigger */}
          <button
            type="button"
            onClick={() => onRoute('live_parlays')}
            className="inline-flex items-center gap-1.5 border border-white/[0.12] bg-white/[0.06] px-2.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-white/80 hover:bg-white/[0.10] hover:text-white rounded-none transition-colors cursor-pointer"
            title="Open My List Workspace [5]"
          >
            <Target className="h-3 w-3 text-ve-emerald" />
            <span>{vitals.pendingSlips > 0 ? `${vitals.pendingSlips} MY LIST` : 'MY LIST'}</span>
            <kbd className="hidden sm:inline-block border border-white/20 bg-black/40 px-1 text-[8px] font-mono text-white/55 rounded">
              [5]
            </kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-white/[0.08] lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.section}
              type="button"
              onClick={() => onRoute(tile.section)}
              className="group flex min-h-[92px] flex-col justify-between border-b border-white/[0.08] px-4 py-4 text-left rounded-none transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-cyan cursor-pointer [&:not(:nth-child(2n+1))]:border-l lg:[&:not(:nth-child(3n+1))]:border-l lg:[&:nth-child(2n+1)]:border-l-0 lg:[&:not(:nth-child(3n+1))]:border-l [&]:border-white/[0.08]"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${tile.accent}`} aria-hidden="true" />
                  <strong className="truncate font-sans text-sm font-medium text-white group-hover:text-ve-cyan transition-colors">
                    {tile.label}
                  </strong>
                </span>
                <kbd className="hidden shrink-0 px-0 text-[9px] font-medium text-white/30 sm:block font-mono">
                  [{tile.key}]
                </kbd>
              </div>

              <span className="mt-1.5 truncate font-sans text-xs font-light text-white/45">{tile.detail}</span>

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
