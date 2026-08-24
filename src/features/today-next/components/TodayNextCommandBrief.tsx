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

const TONE: Record<TodayDecision['tone'], { accent: string; border: string; chip: string; chipText: string; shadow: string }> = {
  emerald: {
    accent: 'text-ve-emerald',
    border: 'border-ve-emerald/20',
    chip: 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald',
    chipText: 'text-ve-emerald',
    shadow: 'shadow-[3px_3px_0px_0px_#31B583]',
  },
  cyan: {
    accent: 'text-ve-cyan',
    border: 'border-ve-cyan/20',
    chip: 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan',
    chipText: 'text-ve-cyan',
    shadow: 'shadow-[3px_3px_0px_0px_#4FB8DC]',
  },
  amber: {
    accent: 'text-ve-amber',
    border: 'border-ve-amber/20',
    chip: 'border-ve-amber/25 bg-ve-amber/10 text-ve-amber',
    chipText: 'text-ve-amber',
    shadow: 'shadow-[3px_3px_0px_0px_#D99C4A]',
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
      className="border-y border-white/[0.08] bg-[#0A0A0A] px-6 py-8 space-y-5 rounded-none lg:px-8 lg:py-10"
      aria-labelledby="today-next-brief-title"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        {/* Left Column: Stage Badge, Title, Description, Primary CTA */}
        <div className="min-w-0 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-[0.2em] text-ve-emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-ve-emerald" />
              STAGE 01: PRE-PITCH THESIS
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-medium uppercase tracking-[0.2em] ${tone.chipText}`}
            >
              <ShieldCheck className="h-3 w-3" />
              {decision.statusLabel}
            </span>
          </div>

          <h2
            id="today-next-brief-title"
            className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem] font-bold italic leading-[1.0] tracking-tighter text-white"
          >
            {decision.title}
          </h2>

          <p className="max-w-2xl font-sans text-sm sm:text-base font-light leading-relaxed text-white/55">
            {decision.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* Primary Action — Apple Machined Surface standard */}
            <button
              type="button"
              onClick={() => onRoute(decision.ctaSection || 'hr_board')}
              className="tn-cta inline-flex min-h-11 items-center gap-2.5 px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black bg-ve-cyan rounded-none hover:bg-white cursor-pointer"
            >
              <span>{decision.ctaLabel || 'Review HR Intelligence ->'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Secondary Action */}
            <button
              type="button"
              onClick={() => onRoute('research')}
              className="inline-flex items-center gap-2 border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-white/80 hover:bg-white/[0.10] hover:border-white/[0.20] rounded-none transition-colors cursor-pointer"
            >
              <Flame className="h-3.5 w-3.5 text-ve-cyan" />
              <span>PLAYER DOSSIERS</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Ticker or Pre-Game Lock Telemetry */}
        <div className="w-full">
          {liveGames.length > 0 ? (
            <div className="border border-white/[0.08] bg-[#0A0A0A] p-4 space-y-2.5 rounded-none shadow-md">
              {/* Header with Restrained Live Indicator */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ve-red animate-pulse" />
                  <span className="text-xs font-mono tracking-wider text-white/70 uppercase">Live Telemetry</span>
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase">{liveGames.length} IN PROGRESS</span>
              </div>

              <ul className="divide-y divide-white/[0.04] my-1">
                {liveGames.slice(0, 3).map((game) => (
                  <li
                    key={game.gamePk}
                    className="flex items-center justify-between gap-2 text-xs py-2"
                  >
                    <span className="truncate font-medium text-white/80">{teamLine(game)}</span>
                    <span className="shrink-0 tabular-nums text-ve-red font-mono text-xs font-medium">
                      {game.score ? `${game.score.away}-${game.score.home}` : '—'}
                      {game.inning != null ? ` · I${game.inning}` : ''}
                    </span>
                  </li>
                ))}
              </ul>

              {liveGames.length > 3 && (
                <p className="text-[9px] font-mono text-white/40 text-right">+{liveGames.length - 3} more live matchups</p>
              )}

              <button
                type="button"
                onClick={() => onRoute('live_games')}
                className="w-full mt-2 py-2 px-3 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.10] rounded-none text-xs font-mono text-white/80 tracking-wide transition-all min-h-[40px] cursor-pointer"
              >
                TRACK ALL LIVE GAMES →
              </button>
            </div>
          ) : firstPitch ? (
            <div className="border border-white/[0.08] bg-[#0A0A0A] p-4 space-y-3 rounded-none shadow-md">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/55">
                  <Timer className="h-3.5 w-3.5 text-ve-cyan" /> FIRST PITCH LOCK
                </span>
                <span className="text-[8px] font-mono text-ve-emerald border border-ve-emerald/20 px-1.5 py-0.5 rounded bg-ve-emerald/10">
                  PRE-GAME
                </span>
              </div>

              <div>
                <span className="text-[9px] text-white/40 uppercase tracking-wider block font-mono">COUNTDOWN TO LOCK:</span>
                <strong className="mt-1 block text-3xl sm:text-4xl font-black tabular-nums text-[#ffffff] font-mono">
                  {firstPitch.countdownMs != null ? formatCountdown(firstPitch.countdownMs) : 'STARTING SOON'}
                </strong>
              </div>

              {/* Collapsible Pre-Game Lock Banner */}
              <div className="border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-2 rounded-none">
                <button
                  type="button"
                  onClick={() => setLockBannerExpanded((v) => !v)}
                  className="flex w-full items-center justify-between text-[10px] font-medium text-white/70 uppercase tracking-wider cursor-pointer"
                  aria-expanded={lockBannerExpanded}
                >
                  <span className="flex items-center gap-1.5 text-ve-cyan">
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
                      <span className="text-white/40 text-[10px] uppercase">MATCHUP:</span>
                      <span className="font-medium text-white/80">{teamLine(firstPitch.game)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-[10px] uppercase">START TIME:</span>
                      <span className="text-white/70">{formatClock(firstPitch.game.gameDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-[10px] uppercase">VENUE:</span>
                      <span className="text-white/70 truncate max-w-[180px]">
                        {firstPitch.game.venue || 'Stadium Confirmed'}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-white/[0.06] text-[10px] text-white/55 space-y-0.5">
                      <p className="truncate">
                        <span className="text-white/40">AWAY ARM:</span> {awayPitcher}
                      </p>
                      <p className="truncate">
                        <span className="text-white/40">HOME ARM:</span> {homePitcher}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-center space-y-1.5 rounded-none">
              <p className="text-xs font-medium text-white/70 uppercase font-mono">NO PENDING FIRST PITCH</p>
              <p className="text-[10px] text-white/40 leading-relaxed font-sans">
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
