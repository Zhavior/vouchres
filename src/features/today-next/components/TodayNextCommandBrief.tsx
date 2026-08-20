import { ArrowRight, Radio, Timer, ShieldCheck, Lock } from 'lucide-react';
import type { TodayDecision } from '../../../components/today/todayDecisionModel';
import { formatClock, formatCountdown, type TodayNextFirstPitch } from '../hooks/useTodayNextHome';
import type { ApiGame } from '../../../types/mlb';

interface TodayNextCommandBriefProps {
  decision: TodayDecision;
  firstPitch: TodayNextFirstPitch | null;
  liveGames: ApiGame[];
  onRoute: (section: string) => void;
}

const TONE: Record<TodayDecision['tone'], { accent: string; border: string; chip: string }> = {
  emerald: {
    accent: 'text-emerald-400',
    border: 'border-emerald-400/50',
    chip: 'border-emerald-400/40 bg-emerald-950/40 text-emerald-300',
  },
  cyan: {
    accent: 'text-cyan-300',
    border: 'border-cyan-400/50',
    chip: 'border-cyan-400/40 bg-cyan-950/40 text-cyan-300',
  },
  amber: {
    accent: 'text-amber-300',
    border: 'border-amber-400/50',
    chip: 'border-amber-400/40 bg-amber-950/40 text-amber-300',
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
      className={`border-2 ${tone.border} bg-black p-5 sm:p-7 font-mono shadow-2xl space-y-4`}
      aria-labelledby="today-next-brief-title"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${tone.chip}`}
            >
              <ShieldCheck className="h-3 w-3" />
              {decision.statusLabel}
            </span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
              STAGE 01 // PRE-PITCH THESIS
            </span>
          </div>

          <h2
            id="today-next-brief-title"
            className="text-balance text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white font-sans"
          >
            {decision.title}
          </h2>

          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-300 font-sans">{decision.description}</p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onRoute(decision.ctaSection)}
              className="inline-flex items-center gap-2.5 border-2 border-white bg-white px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition hover:bg-zinc-200 cursor-pointer"
            >
              {decision.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Clock / Live Ticker Column */}
        <div className="w-full shrink-0 lg:w-[320px]">
          {liveGames.length > 0 ? (
            <div className="border-2 border-rose-500/50 bg-black p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-400">
                  <Radio className="h-3 w-3 animate-pulse" /> LIVE TELEMETRY
                </span>
                <span className="text-[8px] border border-rose-500/40 px-1 text-rose-300 uppercase">
                  {liveGames.length} IN PROGRESS
                </span>
              </div>
              <ul className="space-y-1.5">
                {liveGames.slice(0, 3).map((game) => (
                  <li key={game.gamePk} className="flex items-center justify-between gap-2 text-xs p-1.5 bg-zinc-950 border border-white/10">
                    <span className="truncate font-bold text-white">{teamLine(game)}</span>
                    <span className="shrink-0 tabular-nums text-rose-400 font-bold">
                      {game.score ? `${game.score.away}-${game.score.home}` : '—'}
                      {game.inning != null ? ` · I${game.inning}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
              {liveGames.length > 3 && (
                <p className="text-[9px] text-zinc-500 text-right">+{liveGames.length - 3} more live matchups</p>
              )}
              <button
                type="button"
                onClick={() => onRoute('live_games')}
                className="w-full border border-white/20 bg-zinc-900 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-200 transition hover:border-white hover:text-white cursor-pointer"
              >
                TRACK ALL LIVE GAMES →
              </button>
            </div>
          ) : firstPitch ? (
            <div className="border-2 border-white/20 bg-black p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                  <Timer className="h-3.5 w-3.5 text-cyan-300" /> FIRST PITCH LOCK
                </span>
                <span className="text-[8px] text-emerald-400 border border-emerald-400/40 px-1">PRE-GAME</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">COUNTDOWN TO FIRST PITCH:</span>
                <strong className="mt-1 block text-3xl sm:text-4xl font-black tabular-nums text-cyan-300">
                  {firstPitch.countdownMs != null ? formatCountdown(firstPitch.countdownMs) : 'STARTING SOON'}
                </strong>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs">
                <p className="truncate font-bold text-white">{teamLine(firstPitch.game)}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {formatClock(firstPitch.game.gameDate)} · {firstPitch.game.venue || 'Venue confirmed'}
                </p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/15 bg-black p-5 text-center space-y-1.5">
              <p className="text-xs font-bold text-zinc-300 uppercase">NO PENDING FIRST PITCH</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                All scheduled games have started or reached final verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

