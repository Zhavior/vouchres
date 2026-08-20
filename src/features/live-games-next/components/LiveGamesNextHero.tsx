import React from 'react';
import { ArrowRight, Flame, Plus, Radio, ShieldCheck } from 'lucide-react';
import type { GameMatchup, HrWatch } from '../../../types/matchup';
import { LiveGamesNextStatusBadge } from './LiveGamesNextStatusBadge';

export interface LiveGamesNextHeroProps {
  game: GameMatchup;
  onOpenMatchup: (gamePk: number) => void;
  onAddLeg: (w: HrWatch) => void;
}

/** Featured scoreboard for the active game — Cyber-Engineering HUD language. */
export const LiveGamesNextHero = React.memo(function LiveGamesNextHero({ game, onOpenMatchup, onAddLeg }: LiveGamesNextHeroProps) {
  const showScore = game.isLive || game.isFinal;
  const topSignals = game.topHrWatch.slice(0, 3);

  return (
    <section
      data-testid={`live-next-hero-${game.gamePk}`}
      className={`w-full border-2 p-5 sm:p-6 font-mono shadow-2xl transition-all duration-300 ${
        game.isLive
          ? 'border-rose-500 bg-black shadow-[0_0_35px_rgba(244,63,94,0.22)]'
          : game.isFinal
            ? 'border-white/15 bg-black'
            : 'border-white/20 bg-black hover:border-cyan-400/80'
      }`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 ${game.isLive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
          <h2 className="text-xs font-black uppercase tracking-widest text-white">
            VOUCHEDGE // {game.isLive ? 'ACTIVE MATCHUP SWEAT' : 'FEATURED SLATE MATCHUP'}
          </h2>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-[10px] text-zinc-400 hidden sm:inline">{game.venue}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <LiveGamesNextStatusBadge m={game} />
          <button
            type="button"
            onClick={() => onOpenMatchup(game.gamePk)}
            className="inline-flex h-8 items-center gap-1.5 border border-white bg-white text-black px-3 text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            OPEN DOSSIER <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="mt-5 grid grid-cols-3 items-center gap-3 py-2">
        {/* Away Team */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {game.away.logo && (
            <img
              src={game.away.logo}
              alt=""
              className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 object-contain drop-shadow-md"
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <strong className="truncate text-base sm:text-xl font-black text-white block uppercase">
              {game.away.abbreviation}
            </strong>
            <span className="truncate text-[10px] uppercase text-zinc-400 block font-bold">
              {game.away.name}
            </span>
          </div>
        </div>

        {/* Big Center Score */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-4xl sm:text-6xl font-black tabular-nums leading-none text-white font-sans tracking-tight">
            {showScore ? game.score.away : '–'}{' '}
            <span className="text-zinc-600 font-light">:</span>{' '}
            {showScore ? game.score.home : '–'}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300 border border-cyan-400/30 px-2 py-0.5 bg-cyan-950/40">
            {game.isFinal ? 'FINAL OFFICIAL' : game.isLive ? '● LIVE IN-GAME SENSOR' : 'PRE-GAME SCHEDULED'}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4 text-right">
          <div className="min-w-0">
            <strong className="truncate text-base sm:text-xl font-black text-white block uppercase">
              {game.home.abbreviation}
            </strong>
            <span className="truncate text-[10px] uppercase text-zinc-400 block font-bold">
              {game.home.name}
            </span>
          </div>
          {game.home.logo && (
            <img
              src={game.home.logo}
              alt=""
              className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 object-contain drop-shadow-md"
              loading="lazy"
            />
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[10px] text-zinc-400">
        <span>VENUE: <strong className="text-white">{game.venue}</strong></span>
        <span>STATUS: <strong className="text-white">{game.status.toUpperCase()}</strong></span>
      </div>

      {/* High-confidence HR signals deck */}
      {topSignals.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
              <Flame className="h-3.5 w-3.5 text-amber-400" /> ACTIVE HR EVIDENCE SIGNALS ({game.topHrWatch.length})
            </span>
            <span className="text-[9px] text-zinc-500">STATCAST VULNERABILITY DETECTED</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {topSignals.map((w) => (
              <div
                key={`${w.playerId}-${w.playerName}`}
                className="flex items-center justify-between gap-2 border border-white/15 bg-zinc-950 p-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {w.headshot ? (
                    <img src={w.headshot} alt="" className="h-8 w-8 shrink-0 object-cover border border-white/15 bg-black" loading="lazy" />
                  ) : (
                    <div className="h-8 w-8 shrink-0 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                      HR
                    </div>
                  )}
                  <div className="min-w-0">
                    <strong className="truncate text-xs font-bold text-white block">{w.playerName}</strong>
                    <span className="truncate text-[9px] text-zinc-400 block">
                      {w.teamAbbr} vs {w.opposingPitcher} · <span className="text-cyan-300 font-bold">{Math.round(w.hrEdge)} HRPI</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddLeg(w)}
                  title={`Add ${w.playerName} Anytime HR to slip`}
                  className="px-2 py-1 border border-emerald-400 bg-emerald-400 text-black text-[9px] font-black uppercase tracking-wider hover:bg-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  <Plus className="h-3 w-3" /> SLIP
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});

