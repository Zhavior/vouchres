import React from 'react';
import { X, Plus, Flame, ShieldCheck } from 'lucide-react';
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

/** Right-side matchup drawer — Cyber-Engineering HUD terminal. */
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
      className="fixed inset-0 z-[120] flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`Matchup drawer ${game.away.abbreviation} at ${game.home.abbreviation}`}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l-2 border-white/20 bg-black font-mono shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/15 bg-zinc-950 px-5 py-3.5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            {game.away.logo && <img src={game.away.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
            <strong className="truncate text-sm font-black text-white uppercase">
              {game.away.abbreviation} <span className="text-zinc-500">@</span> {game.home.abbreviation}
            </strong>
            {game.home.logo && <img src={game.home.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LiveGamesNextStatusBadge m={game} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close matchup drawer"
              className="p-1 border border-white/20 text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Live scoreboard */}
          <div className="border-2 border-white/15 bg-black p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300">
                LIVE SCOREBOARD
              </span>
              <span className="text-[8px] text-zinc-500 uppercase">{game.venue}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2 py-1">
              <span className="truncate text-center text-sm font-black text-white uppercase">{game.away.abbreviation}</span>
              <span className="text-center text-3xl font-black tabular-nums text-white font-sans">
                {showScore ? game.score.away : '–'} <span className="text-zinc-600">:</span> {showScore ? game.score.home : '–'}
              </span>
              <span className="truncate text-center text-sm font-black text-white uppercase">{game.home.abbreviation}</span>
            </div>
            <p className="text-center text-[10px] uppercase tracking-wider text-zinc-400">{game.status.toUpperCase()}</p>
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
            <div className="border-2 border-white/15 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  <Flame className="h-3.5 w-3.5 text-amber-400" /> ACTIVE HR SIGNALS ({game.topHrWatch.length})
                </span>
                <span className="text-[8px] text-zinc-500 uppercase">PROPS DISPATCH</span>
              </div>
              <ul className="space-y-2">
                {game.topHrWatch.map((w) => (
                  <li
                    key={`${w.playerId}-${w.playerName}`}
                    className="flex items-center justify-between gap-2 border border-white/10 bg-zinc-950 p-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {w.headshot ? (
                        <img src={w.headshot} alt="" className="h-8 w-8 object-cover border border-white/10" loading="lazy" />
                      ) : (
                        <div className="h-8 w-8 bg-zinc-800 flex items-center justify-center text-[9px] text-zinc-400 font-bold">HR</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <strong className="truncate text-xs font-bold text-white block">{w.playerName}</strong>
                        <span className="truncate text-[9px] text-zinc-400 block">
                          {w.teamAbbr} vs {w.opposingPitcher} · <strong className="text-cyan-300">{Math.round(w.hrEdge)} HRPI</strong>
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
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Honesty line */}
          <div className="border border-white/10 bg-zinc-950 p-3 text-[10px] leading-relaxed text-zinc-500">
            <span className="text-zinc-400 font-bold block mb-0.5">DETERMINISTIC DATA INTEGRITY:</span>
            Scores, status, per-inning runs, and HR signals come from the official MLB live feed and the verified HR
            board. No synthesized values or interpolated scores.
          </div>
        </div>
      </div>
    </div>
  );
}

