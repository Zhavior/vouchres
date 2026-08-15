import React, { memo, useCallback, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { ChunkA } from '../api/contracts';
import { PlayerHeadshot } from './PlayerHeadshot';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { getCalibratedEvBadge } from '../../../lib/analytics/evCalculator';
import { formatBoardMetric } from '../presentHrV10Metric';

export interface CompactHrRowProps {
  data: ChunkA;
  sortBy?: 'score' | 'ev' | 'odds';
  onOpenResearch?: (item: ChunkA) => void;
}

export const CompactHrRow = memo(function CompactHrRow({
  data,
  sortBy = 'score',
  onOpenResearch,
}: CompactHrRowProps) {
  const handleQuickAdd = useCallback(() => {
    openParlayAdd({
      player: {
        id: data.playerId,
        name: data.identity?.name || 'Unknown Hitter',
        team: data.identity?.teamAbbreviation || 'MLB',
        position: 'OF',
        propositions: [],
        resolvedGamePk: data.gameState?.gameId,
      },
      propHint: {
        id: `hr_${data.playerId}`,
        playerId: data.playerId,
        market: 'home_run',
        spec: 'Over 0.5',
        odds: data.odds?.price ?? 250,
        gamePk: data.gameState?.gameId,
      },
      source: 'hr_intelligence',
      dataStatus: 'official',
      reasoningSnapshot: data.score?.primaryRecommendation || 'HR Intel Pick',
    });
  }, [data]);

  const handleResearchClick = useCallback(() => {
    if (onOpenResearch) {
      onOpenResearch(data);
    }
  }, [data, onOpenResearch]);

  const hrIndex = data.score?.hrIndex ?? 0;

  // EV percentage calculation
  const evStr = useMemo(() => getCalibratedEvBadge(hrIndex, data.odds?.price), [hrIndex, data.odds?.price]);

  // Tier color styling for 36px compact radial gauge
  const { ringColor, textColor } = useMemo(() => {
    if (hrIndex >= 85) {
      return { ringColor: '#10b981', textColor: 'text-emerald-300' };
    }
    if (hrIndex >= 70) {
      return { ringColor: '#f59e0b', textColor: 'text-amber-300' };
    }
    return { ringColor: '#64748b', textColor: 'text-slate-400' };
  }, [hrIndex]);

  return (
    <div
      className="min-h-[64px] w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 transition-all duration-200 shadow-sm group backdrop-blur-md"
      style={{ contain: 'layout style paint' }}
    >
      {/* Col 1: Player & Matchup */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <PlayerHeadshot mlbId={data.identity?.mlbId} name={data.identity?.name || 'Player'} size={40} />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
              {data.identity?.name || 'Unknown Hitter'}
            </h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70">
              {data.identity?.teamAbbreviation || 'MLB'}
            </span>
          </div>
          <p className="text-xs text-white/50">
            vs {data.opposingPitcherName || 'TBD'} ({data.opposingPitcherHandedness || 'R'})
          </p>
        </div>
      </div>

      {/* Col 2: HRPI Score Ring (36px compact) */}
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 grid place-items-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" fill="transparent" />
            <circle
              cx="18"
              cy="18"
              r="14"
              stroke={ringColor}
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 14}
              strokeDashoffset={2 * Math.PI * 14 * (1 - hrIndex / 100)}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute font-mono font-black text-xs text-white tabular-nums">
            {hrIndex}
          </span>
        </div>
        <div className="hidden sm:block">
          <span className={`text-[9px] font-bold tracking-wider uppercase block ${textColor}`}>
            {(data.score?.confidence?.level || 'MODERATE').replace('_', ' ')}
          </span>
          <span className="text-[10px] text-white/40 block">HRPI</span>
        </div>
      </div>

      {/* Col 3: Odds & EV Badge */}
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-bold">
          {data.odds ? (data.odds.price > 0 ? `+${data.odds.price}` : `${data.odds.price}`) : 'N/A'}
        </span>
        {data.odds && (
          <span
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              sortBy === 'ev'
                ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {evStr} EV
          </span>
        )}
      </div>

      {/* Col 4: Statcast Metrics */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-white/5">
          <span className="text-white/40 text-[10px]">xSLG</span>
          <span className="font-bold text-white">
            {formatBoardMetric(data.statcastSummary?.xSLG, (n) => `.${(n * 1000).toFixed(0)}`)}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-white/5">
          <span className="text-white/40 text-[10px]">BARREL</span>
          <span className="font-bold text-white">
            {formatBoardMetric(data.statcastSummary?.barrelRate, (n) => `${(n * 100).toFixed(1)}%`)}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-white/5">
          <span className="text-white/40 text-[10px]">PARK</span>
          <span className="font-bold text-white">
            {formatBoardMetric(data.statcastSummary?.parkFactor, (n) => String(n))}
          </span>
        </div>
      </div>

      {/* Col 5: Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleQuickAdd}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
        >
          + SLIP
        </button>
        <button
          type="button"
          onClick={handleResearchClick}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors"
          title="Deep Research Telemetry"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
