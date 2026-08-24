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
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-white/55">Live games</h2>
        <button
          type="button"
          onClick={() => onRoute('live_games')}
          className="-my-3 inline-flex min-h-11 items-center px-2 -mr-2 font-mono text-[10px] font-medium uppercase tracking-wider text-ve-cyan hover:text-white"
        >
          All →
        </button>
      </div>

      {/*
        Operational data, so a register rather than a fourth carousel: live
        games stack vertically on hairlines and the header's ALL -> remains the
        escape to the full view. Every value is the same feed field as before —
        nothing added, nothing dropped, the list is simply not scrolled sideways.
      */}
      <ul className="border-t border-white/[0.08]">
        {games.map((game) => {
          const away = abbr(game.awayTeam, 'AWY');
          const home = abbr(game.homeTeam, 'HOM');
          const awayScore = game.score?.away ?? 0;
          const homeScore = game.score?.home ?? 0;
          const leadHome = homeScore > awayScore;
          const leadAway = awayScore > homeScore;

          return (
            <li key={game.gamePk} className="border-b border-white/[0.08]">
              <button
                type="button"
                onClick={() => onRoute('live_games')}
                className="flex min-h-[52px] w-full items-center gap-4 px-4 py-2.5 text-left transition-colors active:bg-white/[0.03]"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`truncate font-mono text-[12px] font-bold ${leadAway ? 'text-white' : 'text-white/40'}`}>{away}</span>
                    <span className={`shrink-0 font-mono text-[15px] font-bold tabular-nums ${leadAway ? 'text-white' : 'text-white/40'}`}>{awayScore}</span>
                  </span>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`truncate font-mono text-[12px] font-bold ${leadHome ? 'text-white' : 'text-white/40'}`}>{home}</span>
                    <span className={`shrink-0 font-mono text-[15px] font-bold tabular-nums ${leadHome ? 'text-white' : 'text-white/40'}`}>{homeScore}</span>
                  </span>
                </span>

                <span className="flex w-[84px] shrink-0 items-center justify-end gap-1.5 font-mono text-[9px] uppercase tracking-wider text-ve-red">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-ve-red" aria-hidden="true" />
                  <span className="truncate">{game.inning != null ? `Inn ${game.inning}` : game.status || 'Live'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
