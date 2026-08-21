import type { ApiGame } from '../../../../types/mlb';

interface TodayMobileLiveStripProps {
  games: readonly ApiGame[];
  onRoute: (section: string) => void;
}

function abbr(team: { abbreviation?: string | null; name?: string | null } | null | undefined, fallback: string) {
  return team?.abbreviation || team?.name?.slice(0, 3).toUpperCase() || fallback;
}

/*
 * Live scores as a swipe strip.
 *
 * The design called for "Bot 6th" — ApiGame carries `inning` but no
 * half-inning, so the half is not rendered rather than guessed. The feed's own
 * status string is shown beside the inning, which is the real label.
 */
export function TodayMobileLiveStrip({ games, onRoute }: TodayMobileLiveStripProps) {
  if (games.length === 0) return null;

  return (
    <section aria-label="Live games" className="md:hidden">
      <div className="flex items-baseline justify-between px-4 pb-2">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">Live games</h2>
        <button
          type="button"
          onClick={() => onRoute('live_games')}
          className="font-mono text-[10px] font-medium text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
        >
          All →
        </button>
      </div>

      <div className="tn-scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
        {games.map((game) => {
          const away = abbr(game.awayTeam, 'AWY');
          const home = abbr(game.homeTeam, 'HOM');
          const awayScore = game.score?.away ?? 0;
          const homeScore = game.score?.home ?? 0;
          const leadHome = homeScore > awayScore;
          const leadAway = awayScore > homeScore;

          return (
            <button
              key={game.gamePk}
              type="button"
              onClick={() => onRoute('live_games')}
              className="w-[46vw] max-w-[190px] shrink-0 snap-start rounded-xl border border-white/[0.08] bg-[#111113] p-3 text-left active:scale-[0.98] shadow-md"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`font-mono text-[12px] font-bold ${leadAway ? 'text-[#F4F4F5]' : 'text-zinc-500'}`}>{away}</span>
                <span className={`font-mono text-[15px] font-bold tabular-nums ${leadAway ? 'text-[#F4F4F5]' : 'text-zinc-500'}`}>{awayScore}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className={`font-mono text-[12px] font-bold ${leadHome ? 'text-[#F4F4F5]' : 'text-zinc-500'}`}>{home}</span>
                <span className={`font-mono text-[15px] font-bold tabular-nums ${leadHome ? 'text-[#F4F4F5]' : 'text-zinc-500'}`}>{homeScore}</span>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 truncate border-t border-white/[0.06] pt-1.5 font-mono text-[9px] uppercase tracking-wider text-rose-400">
                <span className="h-1 w-1 shrink-0 animate-pulse rounded-full bg-rose-400" aria-hidden="true" />
                {game.inning != null ? `Inn ${game.inning}` : game.status || 'Live'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
