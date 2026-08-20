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
      accent: 'text-cyan-300',
      key: '2',
    },
    {
      section: 'live_games',
      icon: Tv,
      label: 'Live Games',
      detail: 'Scores & in-game context',
      count: vitals.live > 0 ? `${vitals.live} live` : null,
      accent: vitals.live > 0 ? 'text-rose-400' : 'text-zinc-300',
      key: '3',
    },
    {
      section: 'research',
      icon: UserRoundSearch,
      label: 'Player Evidence',
      detail: 'Source-level dossiers',
      count: null,
      accent: 'text-cyan-300',
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
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
          <Activity className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          SYSTEM WORKSPACES
        </h2>
        <span className="text-[9px] text-zinc-600 uppercase">PRESS [1-6] TO LAUNCH</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.section}
              type="button"
              onClick={() => onRoute(tile.section)}
              className="group flex min-h-[92px] flex-col justify-between border-2 border-white/10 bg-black p-4 text-left font-mono transition-all hover:border-cyan-400/80 hover:bg-zinc-950 cursor-pointer"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${tile.accent}`} aria-hidden="true" />
                  <strong className="truncate text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {tile.label}
                  </strong>
                </span>
                <kbd className="hidden shrink-0 border border-white/20 bg-zinc-900 px-1.5 py-0.2 text-[9px] font-bold text-zinc-400 sm:block">
                  [{tile.key}]
                </kbd>
              </div>

              <span className="mt-1.5 truncate text-[10px] text-zinc-400">{tile.detail}</span>

              {tile.count && (
                <span className={`mt-2 text-[10px] font-bold tabular-nums ${tile.accent}`}>
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

