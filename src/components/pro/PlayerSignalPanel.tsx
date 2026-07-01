/**
 * PlayerSignalPanel.tsx — Player deep-dive panel with signal graphs.
 *
 * Wraps HrSignalGraphs in a player-header shell. Used by:
 *   - Player Edge Lab (Pro drawer)
 *   - Player Research Hub (when expanded)
 *
 * Accepts NormalizedPlayerPayload — no raw backend types, no fetching.
 * Shows VerifiedGraphEmptyState if payload is null.
 */

import React from 'react';
import { Flame, AlertTriangle, MapPin } from 'lucide-react';
import type { NormalizedPlayerPayload } from '../../adapters/normalized';
import { ACCENT, withAlpha } from '../../theme/colors';
import { HrSignalGraphs } from './HrSignalGraphs';
import { VerifiedGraphEmptyState } from './VerifiedGraphEmptyState';

export interface PlayerSignalPanelProps {
  /** Normalized player payload (from adaptPlayerPayload) */
  payload: NormalizedPlayerPayload | null;
  /** Optional onAddLeg handler (for parlay integration) */
  onAddLeg?: () => void;
  className?: string;
}

export const PlayerSignalPanel: React.FC<PlayerSignalPanelProps> = React.memo(function PlayerSignalPanel({
  payload,
  onAddLeg,
  className = '',
}) {
  if (!payload) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        title="Player data unavailable"
        detail="No player payload was provided. Cannot render signal panel."
        className={className}
      />
    );
  }

  const { player } = payload;
  const strongEdge = (player.hrEdge ?? 0) >= 75;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Player header */}
      <div className="ve-card flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-start">
        {player.headshot && (
          <div className="relative flex-shrink-0 self-start">
            <img
              src={player.headshot}
              alt={player.playerName ?? 'Player'}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel))] object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-base font-black text-[hsl(var(--ve-text-primary))]">
            <span className="truncate">{player.playerName ?? 'Unknown Player'}</span>
            {strongEdge && <Flame className="h-4 w-4 flex-shrink-0 text-[hsl(var(--ve-accent-gold))]" />}
          </h3>
          <p className="truncate font-mono text-[11px] text-[hsl(var(--ve-text-muted))]">
            {player.team ?? 'UNK'} vs {player.opponent ?? 'UNK'}
            {player.opponentPitcherName && ` · ${player.opponentPitcherName}`}
          </p>
          {player.venue && (
            <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-[hsl(var(--ve-text-muted))]">
              <MapPin className="h-3 w-3" />
              {player.venue}
            </p>
          )}
        </div>

        {/* Right: edge score + risk */}
        <div className="flex flex-col items-end gap-1">
          {player.hrEdge !== null && (
            <span
              className="font-mono text-lg font-black"
              style={{ color: ACCENT.final }}
            >
              {Math.round(player.hrEdge)}
            </span>
          )}
          {player.riskLabel && (
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider"
              style={{
                color: ACCENT.emerald,
                borderColor: withAlpha(ACCENT.emerald, 0.28),
                background: withAlpha(ACCENT.emerald, 0.08),
              }}
            >
              {player.riskLabel}
            </span>
          )}
        </div>
      </div>

      {/* Warnings (if any) */}
      {player.warnings && player.warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-[hsl(var(--ve-accent-gold)/0.28)] bg-[hsl(var(--ve-accent-gold)/0.06)] p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--ve-accent-gold))]" />
          <div className="space-y-1">
            {player.warnings.slice(0, 3).map((w, i) => (
              <p key={i} className="text-[11px] leading-snug text-[hsl(var(--ve-text-secondary))]">
                {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Signal graphs */}
      <HrSignalGraphs payload={payload} />

      {/* Optional action */}
      {onAddLeg && (
        <button
          onClick={onAddLeg}
          className="ve-button-primary w-full rounded-xl py-2 font-mono text-[11px] font-bold uppercase tracking-wider"
        >
          + Add to Parlay
        </button>
      )}
    </div>
  );
});

export default PlayerSignalPanel;
