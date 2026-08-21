import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Flame,
  Lock,
  Radio,
  ShieldCheck,
  Timer,
  Zap,
} from 'lucide-react';
import type { TodayDecision } from '../../../components/today/todayDecisionModel';
import { formatClock, formatCountdown, type TodayNextFirstPitch } from '../hooks/useTodayNextHome';
import type { ApiGame } from '../../../types/mlb';

interface TodayNextCommandBriefProps {
  decision: TodayDecision;
  firstPitch: TodayNextFirstPitch | null;
  liveGames: ApiGame[];
  onRoute: (section: string) => void;
}

const TONE: Record<TodayDecision['tone'], { accent: string; border: string; chip: string; shadow: string }> = {
  emerald: {
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
    chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    shadow: 'shadow-[3px_3px_0px_0px_#00FF87]',
  },
  cyan: {
    accent: 'text-sky-400',
    border: 'border-sky-500/20',
    chip: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
    shadow: 'shadow-[3px_3px_0px_0px_#00F0FF]',
  },
  amber: {
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
    chip: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    shadow: 'shadow-[3px_3px_0px_0px_#FBBF24]',
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
  const [lockBannerExpanded, setLockBannerExpanded] = useState(true);
  const tone = TONE[decision.tone];

  const awayPitcher = firstPitch?.game.probablePitchers?.away?.pitcherName || 'Probable Starter TBD';
  const homePitcher = firstPitch?.game.probablePitchers?.home?.pitcherName || 'Probable Starter TBD';

  return (
    <section
      className="border border-white/[0.08] bg-[#111113] p-6 font-mono space-y-4 rounded-xl shadow-2xl"
      aria-labelledby="today-next-brief-title"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left Column: Stage Badge, Title, Description, Primary CTA */}
        <div className="min-w-0 flex-1 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-emerald-400 rounded-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              STAGE 01: PRE-PITCH THESIS
            </span>
            <span
              className={`inline-flex items-center gap-1 border px-2.5 py-1 text-[9px] font-mono font-medium uppercase tracking-wider rounded-md ${tone.chip}`}
            >
              <ShieldCheck className="h-3 w-3" />
              {decision.statusLabel}
            </span>
          </div>

          <h2
            id="today-next-brief-title"
            className="text-balance text-xl sm:text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-white font-sans"
          >
            {decision.title}
          </h2>

          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-sans">
            {decision.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* Primary Action — Apple Machined Surface standard */}
            <button
              type="button"
              onClick={() => onRoute(decision.ctaSection || 'hr_board')}
              className="tn-cta inline-flex items-center gap-2.5 px-5 py-2.5 text-xs sm:text-sm font-semibold tracking-normal text-black bg-white rounded-lg hover:bg-zinc-200 cursor-pointer shadow-sm"
            >
              <span>{decision.ctaLabel || 'Review HR Intelligence ->'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Secondary Action */}
            <button
              type="button"
              onClick={() => onRoute('research')}
              className="inline-flex items-center gap-2 border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.10] hover:border-white/[0.20] rounded-lg transition-colors cursor-pointer"
            >
              <Flame className="h-3.5 w-3.5 text-sky-400" />
              <span>PLAYER DOSSIERS</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Ticker or Pre-Game Lock Telemetry */}
        <div className="w-full shrink-0 lg:w-[360px]">
          {liveGames.length > 0 ? (
            <div className="border border-white/[0.08] bg-[#111113] p-4 space-y-2.5 rounded-lg shadow-md">
              {/* Header with Restrained Live Indicator */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-xs font-mono tracking-wider text-zinc-300 uppercase">Live Telemetry</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{liveGames.length} IN PROGRESS</span>
              </div>

              <ul className="divide-y divide-white/[0.04] my-1">
                {liveGames.slice(0, 3).map((game) => (
                  <li
                    key={game.gamePk}
                    className="flex items-center justify-between gap-2 text-xs py-2"
                  >
                    <span className="truncate font-medium text-zinc-200">{teamLine(game)}</span>
                    <span className="shrink-0 tabular-nums text-rose-400 font-mono text-xs font-medium">
                      {game.score ? `${game.score.away}-${game.score.home}` : '—'}
                      {game.inning != null ? ` · I${game.inning}` : ''}
                    </span>
                  </li>
                ))}
              </ul>

              {liveGames.length > 3 && (
                <p className="text-[9px] font-mono text-zinc-500 text-right">+{liveGames.length - 3} more live matchups</p>
              )}

              <button
                type="button"
                onClick={() => onRoute('live_games')}
                className="w-full mt-2 py-2 px-3 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.10] rounded-lg text-xs font-mono text-zinc-200 tracking-wide transition-all min-h-[40px] cursor-pointer"
              >
                TRACK ALL LIVE GAMES →
              </button>
            </div>
          ) : firstPitch ? (
            <div className="border border-white/[0.08] bg-[#111113] p-4 space-y-3 rounded-lg shadow-md">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  <Timer className="h-3.5 w-3.5 text-sky-400" /> FIRST PITCH LOCK
                </span>
                <span className="text-[8px] font-mono text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-500/10">
                  PRE-GAME
                </span>
              </div>

              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">COUNTDOWN TO LOCK:</span>
                <strong className="mt-1 block text-3xl sm:text-4xl font-black tabular-nums text-[#F4F4F5] font-mono">
                  {firstPitch.countdownMs != null ? formatCountdown(firstPitch.countdownMs) : 'STARTING SOON'}
                </strong>
              </div>

              {/* Collapsible Pre-Game Lock Banner */}
              <div className="border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-2 rounded-md">
                <button
                  type="button"
                  onClick={() => setLockBannerExpanded((v) => !v)}
                  className="flex w-full items-center justify-between text-[10px] font-medium text-zinc-300 uppercase tracking-wider cursor-pointer"
                  aria-expanded={lockBannerExpanded}
                >
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <Lock className="h-3 w-3" /> MATCHUP LOCK TELEMETRY
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      lockBannerExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {lockBannerExpanded && (
                  <div className="pt-2 border-t border-white/[0.06] text-xs space-y-1.5 animate-in fade-in duration-150 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[10px] uppercase">MATCHUP:</span>
                      <span className="font-medium text-zinc-200">{teamLine(firstPitch.game)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[10px] uppercase">START TIME:</span>
                      <span className="text-zinc-300">{formatClock(firstPitch.game.gameDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[10px] uppercase">VENUE:</span>
                      <span className="text-zinc-300 truncate max-w-[180px]">
                        {firstPitch.game.venue || 'Stadium Confirmed'}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-white/[0.06] text-[10px] text-zinc-400 space-y-0.5">
                      <p className="truncate">
                        <span className="text-zinc-500">AWAY ARM:</span> {awayPitcher}
                      </p>
                      <p className="truncate">
                        <span className="text-zinc-500">HOME ARM:</span> {homePitcher}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-center space-y-1.5 rounded-lg">
              <p className="text-xs font-medium text-zinc-300 uppercase font-mono">NO PENDING FIRST PITCH</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                The slate has no scheduled MLB games currently pending first pitch.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default TodayNextCommandBrief;
