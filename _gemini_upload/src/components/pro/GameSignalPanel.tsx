/**
 * GameSignalPanel.tsx — Game/slate deep-dive panel.
 *
 * Shows a game header (matchup, venue, environment tag) plus a compact
 * list of ranked players. Used by Team Matchup Lab and Live Game Lab.
 *
 * Accepts NormalizedGamePayload — no raw backend types, no fetching.
 * Shows VerifiedGraphEmptyState if payload is null or has no players.
 */

import React from 'react';
import { MapPin, CloudSun, Users } from 'lucide-react';
import type { NormalizedGamePayload, NormalizedPlayer } from '../../adapters/normalized';
import { ACCENT } from '../../theme/colors';
import { VerifiedGraphEmptyState } from './VerifiedGraphEmptyState';
import { isFiniteNumber } from '../ui/primitives';

export interface GameSignalPanelProps {
  /** Normalized game payload (from adaptGamePayload) */
  payload: NormalizedGamePayload | null;
  /** Optional player click handler */
  onPlayerClick?: (player: NormalizedPlayer) => void;
  /** Max players to show (default 10) */
  maxPlayers?: number;
  className?: string;
}

const ENV_COLOR: Record<string, string> = {
  'Hitter-Friendly': ACCENT.emerald,
  'Pitcher-Friendly': ACCENT.risk,
  Neutral: '#94a3b8',
  Unknown: '#64748b',
};

export const GameSignalPanel: React.FC<GameSignalPanelProps> = React.memo(function GameSignalPanel({
  payload,
  onPlayerClick,
  maxPlayers = 10,
  className = '',
}) {
  if (!payload) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        title="Game data unavailable"
        detail="No game payload was provided. Cannot render game signal panel."
        className={className}
      />
    );
  }

  const { game, players } = payload;

  if (!players || players.length === 0) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        title="No ranked players for this game"
        detail="The HR Engine did not return any ranked candidates for this game."
        className={className}
      />
    );
  }

  const envColor = ENV_COLOR[game.environmentTag ?? 'Unknown'] ?? '#64748b';
  const visiblePlayers = players.slice(0, maxPlayers);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Game header */}
      <div
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950 p-3 sm:p-4"
        style={{ borderColor: envColor + '33' }}
      >
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${envColor}66, transparent)` }}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-slate-100 sm:text-base">
              {game.matchup ?? 'Unknown matchup'}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-500">
              {game.venue && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {game.venue}
                </span>
              )}
              {game.weatherNote && (
                <span className="inline-flex items-center gap-1">
                  <CloudSun className="h-3 w-3" /> {game.weatherNote}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {players.length} hitters
              </span>
            </div>
          </div>
          {game.environmentTag && (
            <span
              className="flex-shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide"
              style={{ color: envColor, borderColor: envColor + '55', background: envColor + '15' }}
            >
              {game.environmentTag}
            </span>
          )}
        </div>
      </div>

      {/* Player list */}
      <div className="space-y-1.5">
        {visiblePlayers.map((player, idx) => {
          const edge = player.hrEdge ?? 0;
          const edgeColor =
            edge >= 75 ? '#818cf8' : edge >= 60 ? ACCENT.matchup : edge >= 45 ? ACCENT.lineup : '#64748b';

          return (
            <button
              key={`${player.playerId}-${idx}`}
              onClick={() => onPlayerClick?.(player)}
              className="group flex w-full items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 p-2.5 text-left transition-colors hover:border-slate-700/80 hover:bg-slate-900/40"
            >
              {/* Rank */}
              <span className="flex-shrink-0 font-mono text-[10px] font-black text-slate-600">
                #{idx + 1}
              </span>

              {/* Headshot */}
              {player.headshot && (
                <img
                  src={player.headshot}
                  alt={player.playerName ?? 'Player'}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 flex-shrink-0 rounded-lg border border-slate-700/60 bg-slate-900 object-cover"
                />
              )}

              {/* Name + team */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-200">
                  {player.playerName ?? 'Unknown Player'}
                </p>
                <p className="truncate font-mono text-[10px] text-slate-500">
                  {player.team ?? 'UNK'} vs {player.opponent ?? 'UNK'}
                </p>
              </div>

              {/* Edge score */}
              {player.hrEdge !== null && (
                <span
                  className="flex-shrink-0 font-mono text-sm font-black"
                  style={{ color: edgeColor }}
                >
                  {Math.round(player.hrEdge)}
                </span>
              )}

              {/* Grade badge */}
              {player.grade && (
                <span
                  className="flex-shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-black"
                  style={{ color: edgeColor, borderColor: edgeColor + '55', background: edgeColor + '18' }}
                >
                  {player.grade}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {players.length > maxPlayers && (
        <p className="text-center font-mono text-[10px] text-slate-600">
          Showing top {maxPlayers} of {players.length} ranked hitters
        </p>
      )}
    </div>
  );
});

export default GameSignalPanel;
