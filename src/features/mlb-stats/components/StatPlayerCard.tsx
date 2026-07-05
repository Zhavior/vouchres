/**
 * StatPlayerCard — Single player card for grid/card view
 *
 * Displays: score ring, tier badge, primary driver bars, market edge, DFS projection
 * All colors via CSS tokens.
 * Accessibility: aria-label on score value, tier shown as text+icon (not color-only)
 */

import React from 'react';
import type { StatPlayerRow, StatTier, StatType } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';

interface Props {
  row:      StatPlayerRow;
  statType: StatType;
  onClick:  (row: StatPlayerRow) => void;
}

const TIER_META: Record<StatTier, { icon: string; token: string }> = {
  elite:   { icon: '★', token: '--ve-accent-gold' },
  strong:  { icon: '▲', token: '--ve-accent-cyan' },
  watch:   { icon: '◆', token: '--ve-accent-pink' },
  sleeper: { icon: '●', token: '--ve-text-muted' },
  fade:    { icon: '▼', token: '--ve-danger' },
};

const LINEUP_STATUS_COLORS: Record<string, string> = {
  confirmed:   '--ve-success',
  projected:   '--ve-accent-cyan',
  questionable: '--ve-warning',
  out:          '--ve-danger',
  unknown:      '--ve-text-muted',
};

export const StatPlayerCard: React.FC<Props> = ({ row, statType, onClick }) => {
  const config  = STAT_CONFIG[statType];
  const meta    = TIER_META[row.tier];
  const tierLabel = config.tierLabels[row.tier];
  const token   = `--${config.token}`;
  const statusToken = LINEUP_STATUS_COLORS[row.lineupStatus] ?? '--ve-text-muted';

  // Top 3 drivers for the card bar chart
  const topDrivers = [...row.drivers]
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 3);

  const edgePositive = (row.edgePct ?? 0) > 0;

  return (
    <button
      onClick={() => onClick(row)}
      className={[
        'group relative flex flex-col gap-2 p-4 rounded-xl text-left w-full',
        'bg-[hsl(var(--ve-surface))] border border-[hsl(var(--ve-border)/0.5)]',
        'hover:border-[hsl(var(--ve-accent-cyan)/0.4)] hover:bg-[hsl(var(--ve-surface-raised)/0.7)]',
        'transition-all duration-[var(--ve-duration-fast)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ve-accent-cyan))]',
      ].join(' ')}
      aria-label={`${row.playerName}, score ${row.statScore}, tier ${tierLabel}`}
    >
      {/* Mock data badge */}
      {row.sourceMode === 'mock' && (
        <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--ve-bg-deep)/0.8)] text-[hsl(var(--ve-text-muted))] border border-[hsl(var(--ve-border)/0.3)] uppercase tracking-widest">
          MOCK
        </span>
      )}

      {/* Player info row */}
      <div className="flex items-start gap-3">
        {/* Score ring */}
        <div
          className="flex-none flex items-center justify-center w-12 h-12 rounded-full border-2 font-extrabold text-base"
          style={{
            borderColor: `hsl(var(${token}))`,
            background:  `hsl(var(${token})/0.12)`,
            color:       `hsl(var(${token}))`,
          }}
          aria-label={`Score: ${row.statScore}`}
        >
          {row.statScore}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + lineup status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-[hsl(var(--ve-text-primary))] truncate">
              {row.playerName}
            </span>
            <span
              className="text-[9px] font-semibold px-1 py-0.5 rounded uppercase tracking-wide"
              style={{
                color:      `hsl(var(${statusToken}))`,
                background: `hsl(var(${statusToken})/0.12)`,
              }}
            >
              {row.lineupStatus}
            </span>
          </div>

          {/* Team · Opp · Spot */}
          <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--ve-text-muted))] mt-0.5 flex-wrap">
            <span className="font-semibold text-[hsl(var(--ve-text-primary)/0.8)]">{row.team}</span>
            <span>vs {row.opponent}</span>
            {row.lineupSpot && <span>· #{row.lineupSpot}</span>}
            {row.pitcherName && row.pitcherName !== 'TBD' && (
              <span>· vs {row.pitcherName}</span>
            )}
          </div>

          {/* Tier badge */}
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
              style={{
                color:      `hsl(var(${meta.token}))`,
                background: `hsl(var(${meta.token})/0.15)`,
                border:     `1px solid hsl(var(${meta.token})/0.3)`,
              }}
            >
              <span aria-hidden="true">{meta.icon}</span>
              {tierLabel}
            </span>
            <span className="text-[10px] text-[hsl(var(--ve-text-muted))]">
              {row.confidence}% conf
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 driver bars */}
      <div className="flex flex-col gap-1.5 mt-1">
        {topDrivers.map(d => (
          <div key={d.id} className="flex items-center gap-2">
            <span className="text-[10px] text-[hsl(var(--ve-text-muted))] w-24 truncate shrink-0">
              <span aria-hidden="true">{d.icon} </span>
              {d.label}
            </span>
            <div
              className="flex-1 h-1 rounded-full overflow-hidden bg-[hsl(var(--ve-border)/0.3)]"
              role="meter"
              aria-label={`${d.label}: ${d.value ?? 'N/A'}`}
              aria-valuenow={d.value ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-[var(--ve-duration-normal)]"
                style={{
                  width:      `${d.value ?? 0}%`,
                  background: `hsl(var(${token})/0.7)`,
                }}
              />
            </div>
            <span className="text-[10px] font-mono w-6 text-right text-[hsl(var(--ve-text-muted))]">
              {d.value ?? '–'}
            </span>
          </div>
        ))}
      </div>

      {/* Market edge + DFS row */}
      <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-[hsl(var(--ve-border)/0.3)]">
        {/* Edge */}
        {row.edgePct != null ? (
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">Edge</span>
            <span
              className="text-xs font-bold"
              style={{ color: `hsl(var(${edgePositive ? '--ve-success' : '--ve-danger'}))` }}
            >
              {edgePositive ? '+' : ''}{row.edgePct}%
            </span>
          </div>
        ) : <div />}

        {/* Book line */}
        {row.bookLine != null && (
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">Line</span>
            <span className="text-xs font-semibold text-[hsl(var(--ve-text-primary))]">
              {row.bookLine}
            </span>
          </div>
        )}

        {/* DFS proj */}
        {row.dfsProjection != null && (
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">DFS Proj</span>
            <span className="text-xs font-bold text-[hsl(var(--ve-accent-gold))]">
              {row.dfsProjection}
            </span>
          </div>
        )}
      </div>

      {/* Warnings */}
      {row.warnings && row.warnings.length > 0 && (
        <div className="mt-1 flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-[hsl(var(--ve-warning)/0.1)] border border-[hsl(var(--ve-warning)/0.3)]">
          <span aria-hidden="true" className="text-[hsl(var(--ve-warning))] text-xs">⚠</span>
          <span className="text-[10px] text-[hsl(var(--ve-warning))]">{row.warnings[0]}</span>
        </div>
      )}
    </button>
  );
};
