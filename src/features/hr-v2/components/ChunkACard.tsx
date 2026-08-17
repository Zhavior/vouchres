import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { ChunkA } from '../api/contracts';
import { PlayerHeadshot } from './PlayerHeadshot';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { getCalibratedEvBadge } from '../../../lib/analytics/evCalculator';
import {
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import { formatBoardMetric, formatGameClock } from '../presentHrV10Metric';
import { useDeepResearch } from '../hooks/useDeepResearch';
import { DeepResearchPanel } from './DeepResearchPanel';

export interface ChunkACardProps {
  data: ChunkA;
  sortBy?: 'score' | 'ev' | 'odds';
  onOpenResearch?: (item: ChunkA) => void;
}

export const ChunkACard = memo(function ChunkACard({
  data,
  sortBy = 'score',
  onOpenResearch,
}: ChunkACardProps) {
  // Line Flash state tracking (1.5s flash duration)
  const [prevOdds, setPrevOdds] = useState<number | undefined>(data.odds?.price);
  const [flashClass, setFlashClass] = useState<string>('');

  // Inline Deep Research State
  const [isExpanded, setIsExpanded] = useState(false);
  const { chunkC, loading: isLoadingC } = useDeepResearch(data.playerId, isExpanded);

  useEffect(() => {
    if (data.odds?.price !== undefined && prevOdds !== undefined && data.odds.price !== prevOdds) {
      const isLengthened = data.odds.price > prevOdds;
      setFlashClass(
        isLengthened
          ? 'bg-emerald-500/30 border-emerald-500/70 text-emerald-300'
          : 'bg-rose-500/30 border-rose-500/70 text-rose-300'
      );
      const timer = setTimeout(() => setFlashClass(''), 1500);
      setPrevOdds(data.odds.price);
      return () => clearTimeout(timer);
    }
    setPrevOdds(data.odds?.price);
  }, [data.odds?.price, prevOdds]);

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
    setIsExpanded((prev) => !prev);
  }, []);

  const xSLG = data.statcastSummary?.xSLG;
  const barrelRate = data.statcastSummary?.barrelRate;
  const parkFactor = data.statcastSummary?.parkFactor;
  const gameTimeStr = useMemo(() => formatGameClock(data.gameTime), [data.gameTime]);

  let truthState: 'confirmed' | 'live' | 'projected' | 'warning' | 'missing' = 'missing';
  if (data.lineupStatus === 'confirmed_starter') truthState = 'confirmed';
  else if (data.lineupStatus === 'roster') truthState = 'projected';
  if (data.gameState?.lifecycle === 'live') truthState = 'live';
  if (data.gameState?.lifecycle === 'delayed' || data.gameState?.lifecycle === 'suspended') truthState = 'warning';
  if (data.gameState?.lifecycle === 'final') truthState = 'confirmed';

  const hrIndex = data.score?.hrIndex ?? 0;
  const evPctStr = useMemo(() => getCalibratedEvBadge(hrIndex, data.odds?.price), [hrIndex, data.odds?.price]);

  // Aurora HQ Tier Metadata
  const tierBadge = useMemo(() => {
    if (hrIndex >= 85) {
      return {
        label: 'ELITE / VERY HIGH',
        style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        ringColor: '#10b981',
      };
    }
    if (hrIndex >= 70) {
      return {
        label: 'STRONG / HIGH',
        style: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        ringColor: '#f59e0b',
      };
    }
    return {
      label: 'WATCH / MODERATE',
      style: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
      ringColor: '#64748b',
    };
  }, [hrIndex]);

  const evidenceChecklist = useMemo(
    () => (data.score?.confidence?.reasons ?? []).slice(0, 3),
    [data.score?.confidence?.reasons]
  );

  return (
    <div
      className="relative w-full rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 p-4 transition-all duration-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_0_rgba(16,185,129,0.12)] group"
      style={{ contain: 'layout style paint' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Block: Headshot, Player, Matchup, Evidence Badges */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3.5">
          {/* Headshot Avatar with Glowing Ring */}
          <div className="relative shrink-0">
            <PlayerHeadshot
              mlbId={data.identity?.mlbId}
              name={data.identity?.name || 'Player'}
              size={48}
            />
          </div>

          {/* Player Information & Eyebrows */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Aurora HQ Tier Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${tierBadge.style}`}
              >
                {tierBadge.label}
              </span>

              {/* Lineup Truth State Badge */}
              <AuroraMaxTruthBadge state={truthState}>
                {data.lineupStatus === 'confirmed_starter'
                  ? `BATTER #${data.lineupSlot ?? 1} · CONFIRMED`
                  : 'ROSTER BASELINE'}
              </AuroraMaxTruthBadge>
            </div>

            {/* Player Name, Team & Matchup */}
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              {data.identity?.name || 'Unknown Hitter'}
              <span className="text-xs font-mono font-normal text-white/50">
                ({data.identity?.teamAbbreviation || 'MLB'}) vs {data.opponentTeamId || 'OPP'}
              </span>
            </h3>

            {/* Pitcher Matchup & Handedness Subtitle */}
            <p className="text-xs text-white/70 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>
                vs{' '}
                <strong className="text-white">
                  {data.opposingPitcherName || 'TBD Pitcher'}
                </strong>
              </span>
              {data.opposingPitcherHandedness && (
                <span className="px-1 rounded bg-white/5 text-[10px] text-white/60 border border-white/10">
                  {data.opposingPitcherHandedness}HP
                </span>
              )}
              <span>·</span>
              <span className="text-white/50">{gameTimeStr}</span>
            </p>

            {/* Evidence Checklist Mini-Pills */}
            {evidenceChecklist.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {evidenceChecklist.map((reason, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-[10px] font-mono text-white/60"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right Blocks: Statcast Metrics + Telemetry Gauge & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 lg:gap-6 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
          {/* Statcast Trio Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                xSLG
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-white mt-0.5 block">
                {formatBoardMetric(xSLG, (n) => n.toFixed(3))}
              </span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Barrel%
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-white mt-0.5 block">
                {formatBoardMetric(barrelRate, (n) => `${(n * 100).toFixed(1)}%`)}
              </span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Park Factor
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-white mt-0.5 block">
                {formatBoardMetric(parkFactor, (n) => `${n}`)}
              </span>
            </div>
          </div>

          {/* Aurora HQ Probability Gauge & Live Odds Flash */}
          <div className="flex items-center gap-3.5">
            {/* Circular Gauge */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    strokeDasharray={`${hrIndex}, 100`}
                    stroke={tierBadge.ringColor}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-black font-mono text-white">
                  {hrIndex}
                </span>
              </div>
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
                HRPI
              </span>
            </div>

            {/* Dynamic Live Odds & Calibrated EV Block with 1.5s Flash Pulse */}
            <div className="flex flex-col items-end min-w-[70px]">
              <span
                className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg border transition-all duration-300 ${
                  flashClass
                    ? flashClass
                    : 'bg-white/5 border-white/10 text-white'
                }`}
                title={data.odds?.price ? `Price: +${data.odds.price}` : 'Odds UNKNOWN'}
              >
                {data.odds?.price ? `+${data.odds.price}` : '---'}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 mt-1">
                {evPctStr} EV
              </span>
            </div>
          </div>

          {/* Quick Action Button & Deep Research Drawer Toggle */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            {/* Quick Add to Slip Action */}
            <button
              type="button"
              onClick={handleQuickAdd}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan hover:bg-vouch-cyan/30 font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <span>+</span> SLIP
            </button>

            {/* Deep Research Open Action */}
            <button
              type="button"
              onClick={handleResearchClick}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap ${
                isExpanded
                  ? 'bg-vouch-cyan/20 border-vouch-cyan/40 text-vouch-cyan hover:bg-vouch-cyan/30'
                  : 'bg-white/5 hover:bg-white/15 border-white/10 text-white/80 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> {isExpanded ? 'CLOSE' : 'RESEARCH'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Deep Research Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <DeepResearchPanel
            data={data}
            chunkC={chunkC}
            isLoading={isLoadingC}
          />
        </div>
      )}
    </div>
  );
});
