import { ArrowRight, Radio, Timer } from 'lucide-react';
import type { TodayDecision } from '../../../components/today/todayDecisionModel';
import { formatClock, formatCountdown, type TodayNextFirstPitch } from '../hooks/useTodayNextHome';
import type { ApiGame } from '../../../types/mlb';

interface TodayNextCommandBriefProps {
  decision: TodayDecision;
  firstPitch: TodayNextFirstPitch | null;
  liveGames: ApiGame[];
  onRoute: (section: string) => void;
}

const TONE: Record<TodayDecision['tone'], { accent: string; glow: string; chip: string }> = {
  emerald: {
    accent: 'text-[var(--aurora-max-emerald)]',
    glow: 'border-[var(--aurora-max-emerald)]/35 shadow-[0_0_40px_rgba(0,217,160,0.12)]',
    chip: 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]',
  },
  /*
   * The `cyan` tone name is the decision model's, not a colour instruction —
   * it is the "informational, not yet confirmed" tier. It renders in the muted
   * emerald so it stays distinct from the bright `emerald` (confirmed/live)
   * tone without reintroducing blue.
   */
  cyan: {
    accent: 'text-vouch-emerald',
    glow: 'border-vouch-emerald/30 shadow-[0_0_40px_rgba(49,181,131,0.12)]',
    chip: 'border-vouch-emerald/40 bg-vouch-emerald/10 text-vouch-emerald',
  },
  amber: {
    accent: 'text-amber-300',
    glow: 'border-amber-400/30 shadow-[0_0_40px_rgba(251,191,36,0.10)]',
    chip: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  },
};

function teamLine(game: ApiGame): string {
  const away = game.awayTeam?.abbreviation || game.awayTeam?.name || 'AWAY';
  const home = game.homeTeam?.abbreviation || game.homeTeam?.name || 'HOME';
  return `${away} @ ${home}`;
}

export function TodayNextCommandBrief({
  decision,
  firstPitch,
  liveGames,
  onRoute,
}: TodayNextCommandBriefProps) {
  const tone = TONE[decision.tone];

  return (
    <section
      className={`rounded-2xl border bg-ve-obsidian/95 p-5 sm:p-6 ${tone.glow}`}
      aria-labelledby="today-next-brief-title"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.18em] ${tone.chip}`}
          >
            {decision.statusLabel}
          </span>

          <h2
            id="today-next-brief-title"
            className="mt-3 text-balance text-xl font-black leading-tight tracking-tight text-white sm:text-2xl"
          >
            {decision.title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{decision.description}</p>

          <button
            type="button"
            onClick={() => onRoute(decision.ctaSection)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--aurora-max-emerald)]/45 bg-[var(--aurora-max-emerald)]/15 px-4 font-mono text-[11px] font-black uppercase tracking-wider text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/30"
          >
            {decision.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Clock column — live games take precedence over the countdown. */}
        <div className="w-full shrink-0 lg:w-[280px]">
          {liveGames.length > 0 ? (
            <div className="rounded-xl border border-rose-400/35 bg-rose-500/[0.07] p-4 font-mono">
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-rose-300">
                <Radio className="h-3 w-3 animate-pulse" /> Live now
              </span>
              <strong className="mt-1.5 block text-2xl font-black tabular-nums text-white">
                {liveGames.length} <span className="text-sm font-bold text-white/50">in progress</span>
              </strong>
              <ul className="mt-2.5 space-y-1">
                {liveGames.slice(0, 3).map((game) => (
                  <li key={game.gamePk} className="flex items-center justify-between gap-2 text-[10px] text-white/60">
                    <span className="truncate font-bold text-white/80">{teamLine(game)}</span>
                    <span className="shrink-0 tabular-nums text-rose-300">
                      {game.score ? `${game.score.away}-${game.score.home}` : '—'}
                      {game.inning != null ? ` · I${game.inning}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
              {liveGames.length > 3 && (
                <p className="mt-1.5 text-[10px] text-white/35">+{liveGames.length - 3} more live</p>
              )}
              <button
                type="button"
                onClick={() => onRoute('live_games')}
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] font-black uppercase tracking-wider text-white/70 transition hover:text-white"
              >
                Track live games
              </button>
            </div>
          ) : firstPitch ? (
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono">
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                <Timer className="h-3 w-3" /> First pitch
              </span>
              <strong className="mt-1.5 block text-3xl font-black tabular-nums text-[var(--aurora-max-emerald)] drop-shadow-[0_0_12px_rgba(0,217,160,0.35)]">
                {firstPitch.countdownMs != null ? formatCountdown(firstPitch.countdownMs) : 'Starting'}
              </strong>
              <p className="mt-2 truncate text-[11px] font-bold text-white">{teamLine(firstPitch.game)}</p>
              <p className="mt-0.5 truncate text-[10px] text-white/40">
                {formatClock(firstPitch.game.gameDate)} · {firstPitch.game.venue || 'Venue unavailable'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-center font-mono">
              <p className="text-[11px] font-bold text-white/50">No upcoming first pitch</p>
              <p className="mt-1 text-[10px] leading-4 text-white/30">
                Every scheduled game has started or finished.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
