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

/**
 * The workspaces the day actually routes into. Counts are only shown when the
 * number is one this page already verified — never a placeholder.
 */
export function TodayNextLaunchpad({ vitals, onRoute }: TodayNextLaunchpadProps) {
  const tiles = [
    {
      section: 'hr_board',
      icon: Flame,
      label: 'HR Intelligence',
      detail: 'Ranked home-run evidence',
      count: vitals.hrSignals != null ? `${vitals.hrSignals} rows` : null,
      accent: 'text-[var(--aurora-max-emerald)]',
      key: '1',
    },
    {
      section: 'admin_hr_next',
      icon: Sparkles,
      label: 'HR Next',
      detail: 'Terminal board, pro telemetry',
      count: null,
      accent: 'text-[var(--aurora-max-emerald)]',
      key: '2',
    },
    {
      section: 'live_games',
      icon: Tv,
      label: 'Live Games',
      detail: 'Scores and in-game context',
      count: vitals.live > 0 ? `${vitals.live} live` : null,
      accent: vitals.live > 0 ? 'text-rose-300' : 'text-[var(--aurora-max-emerald)]',
      key: '3',
    },
    {
      section: 'research',
      icon: UserRoundSearch,
      label: 'Player Evidence',
      detail: 'Source-level dossiers',
      count: null,
      accent: 'text-[var(--aurora-max-emerald)]',
      key: '4',
    },
    {
      section: 'live_parlays',
      icon: Target,
      label: 'My List',
      detail: 'Slips in progress',
      count: vitals.pendingSlips > 0 ? `${vitals.pendingSlips} pending` : null,
      accent: vitals.pendingSlips > 0 ? 'text-amber-300' : 'text-[var(--aurora-max-emerald)]',
      key: '5',
    },
    {
      section: 'results',
      icon: BarChart3,
      label: 'Track Record',
      detail: 'Projection vs outcome',
      count: null,
      accent: 'text-[var(--aurora-max-emerald)]',
      key: '6',
    },
  ];

  return (
    <section aria-label="Research workspaces">
      <h2 className="mb-2.5 flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        <Activity className="h-3 w-3" aria-hidden="true" />
        Workspaces
      </h2>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.section}
              type="button"
              onClick={() => onRoute(tile.section)}
              className="group flex min-h-[84px] flex-col items-start rounded-xl border border-white/10 bg-ve-obsidian/90 p-3.5 text-left font-mono transition-all hover:border-[var(--aurora-max-emerald)]/40 hover:bg-ve-graphite"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${tile.accent}`} aria-hidden="true" />
                  <span className="truncate text-[11px] font-black text-white">{tile.label}</span>
                </span>
                <kbd className="hidden shrink-0 rounded border border-white/10 bg-black/40 px-1 text-[9px] text-white/30 sm:block">
                  {tile.key}
                </kbd>
              </div>

              <span className="mt-1 truncate text-[10px] text-white/40">{tile.detail}</span>

              {tile.count && (
                <span className={`mt-auto pt-2 text-[10px] font-black tabular-nums ${tile.accent}`}>
                  {tile.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
