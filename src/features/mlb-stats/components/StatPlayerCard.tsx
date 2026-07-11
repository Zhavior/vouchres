/**
 * StatPlayerCard — grid card for Stat Intelligence Hub
 */

import React from 'react';
import type { StatPlayerRow, StatTier, StatType } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';

interface Props {
  row: StatPlayerRow;
  statType: StatType;
  onClick: (row: StatPlayerRow) => void;
}

const TIER_LABEL: Record<StatTier, string> = {
  elite: 'Elite',
  strong: 'Strong',
  watch: 'Watch',
  sleeper: 'Sleeper',
  fade: 'Fade',
};

export const StatPlayerCard: React.FC<Props> = ({ row, statType, onClick }) => {
  const config = STAT_CONFIG[statType];
  const tierLabel = config.tierLabels[row.tier] ?? TIER_LABEL[row.tier];
  const topDrivers = [...row.drivers].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 3);
  const intelligenceScore = row.intelligence?.score ?? row.statScore;
  const intelligenceConfidence = row.intelligence?.confidence ?? row.confidence;
  const intelligencePrediction = row.intelligence?.prediction ?? row.dfsProjection;
  const edgePositive = (row.edgePct ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={() => onClick(row)}
      className="ve-stat-player-card group relative flex w-full flex-col gap-2.5 rounded-xl border border-white/10 bg-[var(--ve-stat-panel)] p-3.5 text-left transition hover:border-white/20 hover:bg-[var(--ve-stat-panel-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
      aria-label={`${row.playerName}, score ${intelligenceScore}, tier ${tierLabel}`}
    >
      <div className="pointer-events-none absolute inset-y-3 left-0 w-0.5 rounded-full bg-white/25 group-hover:bg-white/40" aria-hidden="true" />

      <div className="flex items-start gap-3 pl-1">
        <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{row.playerName}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/45">
                {row.team} vs {row.opponent}
                {row.lineupSpot ? ` · #${row.lineupSpot}` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-lg font-black tabular-nums leading-none text-white">{intelligenceScore}</p>
              <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-widest text-white/40">{tierLabel}</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-white/50">
              {row.lineupStatus}
            </span>
            <span className="font-mono text-[9px] text-white/35">{intelligenceConfidence}% conf</span>
          </div>
        </div>
      </div>

      {row.pitcherName && row.pitcherName !== 'TBD' && (
        <p className="pl-1 font-mono text-[10px] uppercase tracking-wide text-white/35">vs {row.pitcherName}</p>
      )}

      <div className="flex flex-col gap-1.5 pl-1">
        {topDrivers.map((d) => (
          <div key={d.id} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate font-mono text-[9px] uppercase text-white/35">{d.label}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white/50" style={{ width: `${d.value ?? 0}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-[9px] text-white/45">{d.value ?? '–'}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-2 pl-1">
        {row.edgePct != null ? (
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wide text-white/35">Edge</p>
            <p className={`text-xs font-bold tabular-nums ${edgePositive ? 'text-emerald-300/90' : 'text-red-300/85'}`}>
              {edgePositive ? '+' : ''}{row.edgePct}%
            </p>
          </div>
        ) : <span />}
        {row.bookLine != null && (
          <div className="text-center">
            <p className="font-mono text-[8px] uppercase tracking-wide text-white/35">Line</p>
            <p className="text-xs font-semibold text-white/75">{row.bookLine}</p>
          </div>
        )}
        {row.dfsProjection != null && (
          <div className="text-right">
            <p className="font-mono text-[8px] uppercase tracking-wide text-white/35">DFS</p>
            <p className="text-xs font-bold text-white/80">{intelligencePrediction}</p>
          </div>
        )}
      </div>

      {row.warnings && row.warnings.length > 0 && (
        <p className="rounded-md border border-amber-500/20 bg-amber-500/8 px-2 py-1.5 pl-1 text-[10px] leading-relaxed text-amber-100/80">
          {row.warnings[0]}
        </p>
      )}
    </button>
  );
};
