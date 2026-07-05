/**
 * StatPredictionBoard — "Today's Top Picks" prediction summary panel
 * Shows top 5 per tier, edge leaderboard, confidence bars
 */

import React from 'react';
import type { StatPlayerRow, StatType, StatTier } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';

interface Props {
  rows:     StatPlayerRow[];
  statType: StatType;
  onSelect: (row: StatPlayerRow) => void;
}

const TIER_META: Record<StatTier, { icon: string; token: string }> = {
  elite:   { icon: '★', token: '--ve-accent-gold' },
  strong:  { icon: '▲', token: '--ve-accent-cyan' },
  watch:   { icon: '◆', token: '--ve-accent-pink' },
  sleeper: { icon: '●', token: '--ve-text-muted' },
  fade:    { icon: '▼', token: '--ve-danger' },
};

function MiniRow({
  row, statType, rank, onSelect,
}: {
  row: StatPlayerRow;
  statType: StatType;
  rank: number;
  onSelect: (r: StatPlayerRow) => void;
}) {
  const config    = STAT_CONFIG[statType];
  const meta      = TIER_META[row.tier];
  const tierLabel = config.tierLabels[row.tier];
  const token     = `--${config.token}`;
  const edgePos   = (row.edgePct ?? 0) > 0;

  return (
    <button
      onClick={() => onSelect(row)}
      className={[
        'group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left',
        'bg-[hsl(var(--ve-surface)/0.5)] border border-[hsl(var(--ve-border)/0.4)]',
        'hover:border-[hsl(var(--ve-accent-cyan)/0.35)] hover:bg-[hsl(var(--ve-surface-raised)/0.5)]',
        'transition-all duration-[var(--ve-duration-fast)]',
      ].join(' ')}
      aria-label={`${row.playerName}, rank ${rank}, score ${row.statScore}`}
    >
      {/* Rank */}
      <span className="text-[11px] font-mono text-[hsl(var(--ve-text-muted))] w-5 text-center shrink-0">
        {rank}
      </span>

      {/* Score */}
      <div
        className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold border"
        style={{
          borderColor: `hsl(var(${token}))`,
          background:  `hsl(var(${token})/0.12)`,
          color:       `hsl(var(${token}))`,
        }}
        aria-label={`Score: ${row.statScore}`}
      >
        {row.statScore}
      </div>

      {/* Name + team */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-[hsl(var(--ve-text-primary))] truncate">
            {row.playerName}
          </span>
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5"
            style={{
              color:      `hsl(var(${meta.token}))`,
              background: `hsl(var(${meta.token})/0.15)`,
            }}
          >
            <span aria-hidden="true">{meta.icon}</span> {tierLabel}
          </span>
        </div>
        <div className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
          {row.team} vs {row.opponent}
          {row.lineupSpot ? ` · #${row.lineupSpot}` : ''}
        </div>
      </div>

      {/* Edge */}
      {row.edgePct != null && (
        <span
          className="text-xs font-bold shrink-0"
          style={{ color: `hsl(var(${edgePos ? '--ve-success' : '--ve-danger'}))` }}
        >
          {edgePos ? '+' : ''}{row.edgePct}%
        </span>
      )}
    </button>
  );
}

export const StatPredictionBoard: React.FC<Props> = ({ rows, statType, onSelect }) => {
  const config   = STAT_CONFIG[statType];
  const token    = `--${config.token}`;

  // Top picks: elite first, then strong, up to 8 total
  const topPicks = [
    ...rows.filter(r => r.tier === 'elite'),
    ...rows.filter(r => r.tier === 'strong'),
  ].slice(0, 8);

  // Top edge plays (best positive edge)
  const topEdge = [...rows]
    .filter(r => (r.edgePct ?? 0) > 0)
    .sort((a, b) => (b.edgePct ?? 0) - (a.edgePct ?? 0))
    .slice(0, 5);

  // Sleeper radar
  const sleepers = rows.filter(r => r.tier === 'sleeper').slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Players',  value: rows.length,                              token: '--ve-text-primary' },
          { label: config.tierLabels.elite + 's', value: rows.filter(r => r.tier === 'elite').length, token: `--${config.token}` },
          { label: 'Positive Edge',  value: rows.filter(r => (r.edgePct ?? 0) > 0).length, token: '--ve-success' },
          { label: 'Sleepers',       value: rows.filter(r => r.tier === 'sleeper').length, token: '--ve-text-muted' },
        ].map(item => (
          <div
            key={item.label}
            className="flex flex-col gap-0.5 p-3 rounded-xl bg-[hsl(var(--ve-surface))] border border-[hsl(var(--ve-border)/0.5)]"
          >
            <span className="text-[10px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">{item.label}</span>
            <span className="text-2xl font-extrabold" style={{ color: `hsl(var(${item.token}))` }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Top picks */}
      <section aria-label="Top picks">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3 flex items-center gap-2">
          <span style={{ color: `hsl(var(${token}))` }}>{config.icon}</span>
          Top Picks Today
        </h2>
        {topPicks.length === 0 ? (
          <p className="text-xs text-[hsl(var(--ve-text-muted))]">No elite/strong players today.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {topPicks.map((row, i) => (
              <MiniRow key={row.stableId} row={row} statType={statType} rank={i + 1} onSelect={onSelect} />
            ))}
          </div>
        )}
      </section>

      {/* Edge plays */}
      {topEdge.length > 0 && (
        <section aria-label="Edge plays">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3 flex items-center gap-2">
            <span className="text-[hsl(var(--ve-success))]">⚡</span>
            Best Edge vs Market
          </h2>
          <div className="flex flex-col gap-2">
            {topEdge.map((row, i) => (
              <MiniRow key={row.stableId} row={row} statType={statType} rank={i + 1} onSelect={onSelect} />
            ))}
          </div>
        </section>
      )}

      {/* Sleeper radar */}
      {sleepers.length > 0 && (
        <section aria-label="Sleeper radar">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3 flex items-center gap-2">
            <span className="text-[hsl(var(--ve-accent-pink))]">◉</span>
            Sleeper Radar
          </h2>
          <div className="flex flex-col gap-2">
            {sleepers.map((row, i) => (
              <MiniRow key={row.stableId} row={row} statType={statType} rank={i + 1} onSelect={onSelect} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
