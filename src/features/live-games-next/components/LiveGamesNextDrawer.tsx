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
  /** Official MLB line score for this game, null when the feed has none. */
  lineScore: OfficialLineScore | null;
  lineScoreLoading: boolean;
  lineScoreError: boolean;
}

/** Right-side matchup drawer — terminal chrome, real feed data only. */
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
      className="fixed inset-0 z-[120] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Matchup drawer ${game.away.abbreviation} at ${game.home.abbreviation}`}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-white/10 bg-ve-obsidian font-mono shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-ve-obsidian/95 px-4 py-3 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            {game.away.logo && <img src={game.away.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
            <span className="truncate text-sm font-black text-white">
              {game.away.abbreviation} <span className="text-white/30">@</span> {game.home.abbreviation}
            </span>
            {game.home.logo && <img src={game.home.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LiveGamesNextStatusBadge m={game} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close matchup drawer"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {/* Live scoreboard */}
          <div className="rounded-xl border border-white/10 bg-ve-obsidian/95 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--aurora-max-emerald)]">Live Scoreboard</p>
            <div className="mt-2 grid grid-cols-3 items-center gap-2">
              <span className="truncate text-center text-xs font-black text-white">{game.away.abbreviation}</span>
              <span className="text-center text-2xl font-black tabular-nums text-white">
                {showScore ? game.score.away : '–'} <span className="text-white/25">:</span> {showScore ? game.score.home : '–'}
              </span>
              <span className="truncate text-center text-xs font-black text-white">{game.home.abbreviation}</span>
            </div>
            <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-white/40">{game.venue} · {game.status}</p>
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
            <div className="rounded-xl border border-white/10 bg-ve-obsidian/95 p-3">
              <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-white/40">
                <Flame className="h-3 w-3 text-amber-400" /> Active HR Signals ({game.topHrWatch.length})
              </p>
              <ul className="mt-2 space-y-2">
                {game.topHrWatch.map((w) => (
                  <li
                    key={`${w.playerId}-${w.playerName}`}
                    className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 px-2.5 py-2"
                  >
                    {w.headshot && <img src={w.headshot} alt="" className="h-8 w-8 rounded-full object-cover" loading="lazy" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{w.playerName}</p>
                      <p className="truncate text-[9px] text-white/40">
                        {w.teamAbbr} vs {w.opposingPitcher} · edge {Math.round(w.hrEdge)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddLeg(w)}
                      title={`Add ${w.playerName} Anytime HR to slip`}
                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2 text-[9px] font-black uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/25"
                    >
                      <Plus className="h-3 w-3" /> Slip
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Honesty line — per-inning data is the published feed, not a model */}
          <p className="text-[10px] leading-relaxed text-white/30">
            Scores, status, per-inning runs, and HR signals come from the official MLB live feed and the verified HR
            board. Nothing on this panel is synthesized — an inning the feed has not published stays blank.
          </p>
        </div>
      </div>
    </div>
  );
}
