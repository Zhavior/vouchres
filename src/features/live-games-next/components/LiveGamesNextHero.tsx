import React from 'react';
import { ArrowRight, Flame, Plus } from 'lucide-react';
import type { GameMatchup, HrWatch } from '../../../types/matchup';
import { LiveGamesNextStatusBadge } from './LiveGamesNextStatusBadge';

export interface LiveGamesNextHeroProps {
  game: GameMatchup;
  onOpenMatchup: (gamePk: number) => void;
  onAddLeg: (w: HrWatch) => void;
}

/** Featured scoreboard for the active game — Cupertino Pro material plate. */
export const LiveGamesNextHero = React.memo(function LiveGamesNextHero({ game, onOpenMatchup, onAddLeg }: LiveGamesNextHeroProps) {
  const showScore = game.isLive || game.isFinal;
  const topSignals = game.topHrWatch.slice(0, 3);

  return (
    <section
      data-testid={`live-next-hero-${game.gamePk}`}
      className={`w-full border p-5 sm:p-6 font-mono transition-colors duration-200 ${
        game.isLive
          ? 'border-ve-red/25 bg-ve-red/[0.04]'
          : 'border-white/[0.08] bg-white/[0.015]'
      }`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <span className={game.isLive ? 'lg-live-dot' : 'lg-live-dot lg-live-dot--emerald'} />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
            VOUCHEDGE // {game.isLive ? 'ACTIVE MATCHUP' : 'FEATURED MATCHUP'}
          </h2>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-[10px] text-white/40 hidden sm:inline">{game.venue}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <LiveGamesNextStatusBadge m={game} />
          <button
            type="button"
            onClick={() => onOpenMatchup(game.gamePk)}
            className="lg-cta inline-flex h-8 items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
          >
            Open dossier <ArrowRight className="h-3 w-3" />
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
              className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 object-contain"
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <strong className="truncate text-base sm:text-xl font-bold text-white block uppercase tracking-tight">
              {game.away.abbreviation}
            </strong>
            <span className="truncate text-[10px] uppercase text-white/40 block">
              {game.away.name}
            </span>
          </div>
        </div>

        {/* Big Center Score */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl sm:text-6xl font-bold tabular-nums leading-none text-white font-sans tracking-tighter">
            {showScore ? game.score.away : '–'}{' '}
            <span className="text-white/20 font-light">:</span>{' '}
            {showScore ? game.score.home : '–'}
          </div>
          <span
            className={`px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider border ${
              game.isLive
                ? 'border-ve-red/25 bg-ve-red/10 text-ve-red'
                : game.isFinal
                  ? 'border-white/[0.08] bg-white/[0.04] text-white/40'
                  : 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald'
            }`}
          >
            {game.isFinal ? 'Final · official' : game.isLive ? 'Live in-game' : 'Pre-game scheduled'}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4 text-right">
          <div className="min-w-0">
            <strong className="truncate text-base sm:text-xl font-bold text-white block uppercase tracking-tight">
              {game.home.abbreviation}
            </strong>
            <span className="truncate text-[10px] uppercase text-white/40 block">
              {game.home.name}
            </span>
          </div>
          {game.home.logo && (
            <img
              src={game.home.logo}
              alt=""
              className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 object-contain"
              loading="lazy"
            />
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/40">
        <span>VENUE: <strong className="font-medium text-white/70">{game.venue}</strong></span>
        <span>STATUS: <strong className="font-medium text-white/70">{game.status.toUpperCase()}</strong></span>
      </div>

      {/* High-confidence HR signals deck */}
      {topSignals.length > 0 && (
        <div className="mt-4 border-t border-white/[0.06] pt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-ve-emerald">
              <Flame className="h-3.5 w-3.5 text-ve-amber" /> HR evidence signals ({game.topHrWatch.length})
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/30">Statcast vulnerability detected</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {topSignals.map((w) => (
              <div
                key={`${w.playerId}-${w.playerName}`}
                className="flex items-center justify-between gap-2 border border-white/[0.08] bg-white/[0.03] p-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {w.headshot ? (
                    <img src={w.headshot} alt="" className="h-8 w-8 shrink-0 object-cover border border-white/[0.08] bg-white/[0.04]" loading="lazy" />
                  ) : (
                    <div className="h-8 w-8 shrink-0 bg-white/[0.06] flex items-center justify-center text-[10px] text-white/40 font-medium">
                      HR
                    </div>
                  )}
                  <div className="min-w-0">
                    <strong className="truncate text-xs font-semibold text-white block">{w.playerName}</strong>
                    <span className="truncate text-[9px] text-white/40 block">
                      {w.teamAbbr} vs {w.opposingPitcher} · <span className="text-ve-cyan font-medium">{Math.round(w.hrEdge)} HRPI</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddLeg(w)}
                  title={`Add ${w.playerName} Anytime HR to slip`}
                  className="px-2 py-1 border border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald text-[9px] font-medium uppercase tracking-wider hover:bg-ve-emerald/20 hover:border-ve-emerald/40 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  <Plus className="h-3 w-3" /> Slip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
