import React from 'react';
import { ArrowRight, Flame, Plus, Radio } from 'lucide-react';
import type { GameMatchup, HrWatch } from '../../../types/matchup';
import { LiveGamesNextStatusBadge } from './LiveGamesNextStatusBadge';

export interface LiveGamesNextHeroProps {
  game: GameMatchup;
  onOpenMatchup: (gamePk: number) => void;
  onAddLeg: (w: HrWatch) => void;
}

/** Featured scoreboard for the active game — HR Next hero-card language. */
export const LiveGamesNextHero = React.memo(function LiveGamesNextHero({ game, onOpenMatchup, onAddLeg }: LiveGamesNextHeroProps) {
  const showScore = game.isLive || game.isFinal;
  const topSignals = game.topHrWatch.slice(0, 3);

  return (
    <section
      data-testid={`live-next-hero-${game.gamePk}`}
      className={`w-full rounded-2xl border p-4 font-mono shadow-xl transition-all duration-300 ${
        game.isLive
          ? 'border-rose-500/50 bg-ve-obsidian/95 ring-1 ring-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.12)]'
          : game.isFinal
            ? 'border-white/5 bg-ve-obsidian/70'
            : 'border-white/10 bg-ve-obsidian/95 hover:border-[var(--aurora-max-emerald)]/40 hover:bg-ve-graphite'
      }`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-[var(--aurora-max-emerald)]">
          <Radio className="h-3 w-3" /> Current Game
        </p>
        <div className="flex items-center gap-2">
          <LiveGamesNextStatusBadge m={game} />
          <button
            type="button"
            onClick={() => onOpenMatchup(game.gamePk)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/15 px-3 text-[10px] font-black uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/30"
          >
            Open Matchup <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="mt-3 grid grid-cols-3 items-center gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {game.away.logo && <img src={game.away.logo} alt="" className="h-10 w-10 shrink-0 object-contain" loading="lazy" />}
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{game.away.abbreviation}</p>
            <p className="truncate text-[9px] uppercase text-white/35">{game.away.name}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-4xl font-black tabular-nums leading-none text-white sm:text-5xl">
            {showScore ? game.score.away : '–'} <span className="text-white/25">:</span> {showScore ? game.score.home : '–'}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
            {game.isFinal ? 'Final Score' : game.isLive ? 'Live In-Game Score' : 'Pregame Matchup'}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{game.home.abbreviation}</p>
            <p className="truncate text-[9px] uppercase text-white/35">{game.home.name}</p>
          </div>
          {game.home.logo && <img src={game.home.logo} alt="" className="h-10 w-10 shrink-0 object-contain" loading="lazy" />}
        </div>
      </div>

      <p className="mt-2 truncate text-center text-[10px] uppercase tracking-wider text-white/40">
        {game.venue} · {game.status}
      </p>

      {/* HR signal spotlight */}
      {topSignals.length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-white/40">
            <Flame className="h-3 w-3 text-amber-400" /> High-Confidence HR Signals ({game.topHrWatch.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topSignals.map((w) => (
              <div
                key={`${w.playerId}-${w.playerName}`}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5"
              >
                {w.headshot && <img src={w.headshot} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" />}
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-white">{w.playerName}</p>
                  <p className="truncate text-[9px] text-white/40">
                    {w.teamAbbr} vs {w.opposingPitcher} · {Math.round(w.hrEdge)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddLeg(w)}
                  title={`Add ${w.playerName} Anytime HR to slip`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/25"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
