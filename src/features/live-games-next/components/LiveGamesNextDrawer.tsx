import React from 'react';
import { X, Plus, Flame } from 'lucide-react';
import type { GameMatchup, HrWatch } from '../../../types/matchup';
import { LiveGamesNextStatusBadge } from './LiveGamesNextStatusBadge';
import { LiveGamesNextLineScore } from './LiveGamesNextLineScore';
import type { OfficialLineScore } from '../api/officialLineScore';

export interface LiveGamesNextDrawerProps {
  game: GameMatchup;
  onClose: () => void;
  onAddLeg: (w: HrWatch) => void;
  lineScore: OfficialLineScore | null;
  lineScoreLoading: boolean;
  lineScoreError: boolean;
}

/** Right-side matchup drawer — Cupertino Pro material, shared with Today Next. */
export function LiveGamesNextDrawer({
  game,
  onClose,
  onAddLeg,
  lineScore,
  lineScoreLoading,
  lineScoreError,
}: LiveGamesNextDrawerProps) {
  const showScore = game.isLive || game.isFinal;

  return (
    <div
      className="fixed inset-0 z-[120] flex justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`Matchup drawer ${game.away.abbreviation} at ${game.home.abbreviation}`}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-white/[0.08] bg-[#050505] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#050505]/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            {game.away.logo && <img src={game.away.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
            <strong className="truncate text-sm font-bold tracking-tight text-white uppercase">
              {game.away.abbreviation} <span className="text-white/30">@</span> {game.home.abbreviation}
            </strong>
            {game.home.logo && <img src={game.home.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LiveGamesNextStatusBadge m={game} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close matchup drawer"
              className="lg-control p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Live scoreboard */}
          <div className="border border-white/[0.08] bg-white/[0.015] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
                Live scoreboard
              </span>
              <span className="truncate text-[9px] text-white/30 uppercase">{game.venue}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2 py-1">
              <span className="truncate text-center text-sm font-bold text-white uppercase">{game.away.abbreviation}</span>
              <span className="text-center text-3xl font-bold tabular-nums tracking-tighter text-white font-sans">
                {showScore ? game.score.away : '–'} <span className="text-white/20 font-light">:</span> {showScore ? game.score.home : '–'}
              </span>
              <span className="truncate text-center text-sm font-bold text-white uppercase">{game.home.abbreviation}</span>
            </div>
            <p className="text-center text-[10px] uppercase tracking-wider text-white/40">{game.status.toUpperCase()}</p>
          </div>

          {/* Official line score */}
          <LiveGamesNextLineScore
            game={game}
            lineScore={lineScore}
            isLoading={lineScoreLoading}
            isError={lineScoreError}
            compact
          />

          {/* HR signals */}
          {game.topHrWatch.length > 0 && (
            <div className="border border-white/[0.08] bg-white/[0.015] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-ve-emerald">
                  <Flame className="h-3.5 w-3.5 text-ve-amber" /> HR signals ({game.topHrWatch.length})
                </span>
                <span className="text-[9px] text-white/30 uppercase tracking-wider">Props dispatch</span>
              </div>
              <ul className="space-y-2">
                {game.topHrWatch.map((w) => (
                  <li
                    key={`${w.playerId}-${w.playerName}`}
                    className="flex items-center justify-between gap-2 border border-white/[0.08] bg-white/[0.03] p-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {w.headshot ? (
                        <img src={w.headshot} alt="" className="h-8 w-8 object-cover border border-white/[0.08]" loading="lazy" />
                      ) : (
                        <div className="h-8 w-8 bg-white/[0.06] flex items-center justify-center text-[9px] text-white/40 font-medium">HR</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <strong className="truncate text-xs font-semibold text-white block">{w.playerName}</strong>
                        <span className="truncate text-[9px] text-white/40 block">
                          {w.teamAbbr} vs {w.opposingPitcher} · <strong className="font-medium text-ve-cyan">{Math.round(w.hrEdge)} HRPI</strong>
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
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Honesty line */}
          <div className="border border-white/[0.06] bg-white/[0.015] p-3 text-[10px] leading-relaxed text-white/40">
            <span className="text-white/55 font-medium uppercase tracking-wider block mb-0.5">Deterministic data integrity</span>
            Scores, status, per-inning runs, and HR signals come from the official MLB live feed and the verified HR
            board. No synthesized values or interpolated scores.
          </div>
        </div>
      </div>
    </div>
  );
}

