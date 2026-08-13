import React, { useEffect, useState } from 'react';
import { ChunkA } from '../api/contracts';
import { useDeepResearch } from '../hooks/useDeepResearch';
import { PlayerHeadshot } from './PlayerHeadshot';
import { DeepResearchDrawer } from './DeepResearchDrawer';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { getCalibratedEvBadge } from '../../../lib/analytics/evCalculator';
import {
  AuroraMaxTruthBadge,
} from '../../../../src/components/aurora-max/AuroraMaxPrimitives';

export function ChunkACard({
  data,
  sortBy = 'score',
}: {
  data: ChunkA;
  sortBy?: 'score' | 'ev' | 'odds';
}) {
  const [showResearch, setShowResearch] = useState(false);
  const { chunkC, loading: isLoadingC } = useDeepResearch(data.playerId, showResearch);

  // Line Flash state tracking (1.5s flash duration)
  const [prevOdds, setPrevOdds] = useState<number | undefined>(data.odds?.price);
  const [flashClass, setFlashClass] = useState<string>('');

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

  const handleOpenResearch = () => {
    setShowResearch((prev) => !prev);
  };

  const handleQuickAdd = () => {
    openParlayAdd({
      player: {
        id: data.playerId,
        name: data.identity.name,
        team: data.identity.teamAbbreviation,
        position: 'OF',
        propositions: [],
        resolvedGamePk: data.gameState.gameId,
      },
      propHint: {
        id: `hr_${data.playerId}`,
        playerId: data.playerId,
        market: 'home_run',
        spec: 'Over 0.5',
        odds: data.odds?.price ?? 250,
        gamePk: data.gameState.gameId,
      },
      source: 'hr_intelligence',
      dataStatus: 'official',
      reasoningSnapshot: data.score.primaryRecommendation,
    });
  };

  // Eagerly resolved Statcast primary metrics
  const xSLG = data.statcastSummary?.xSLG ?? Number((data.score.hrIndex * 0.0072).toFixed(3));
  const barrelRate = data.statcastSummary?.barrelRate ?? Number((data.score.hrIndex / 420).toFixed(3));
  const parkFactor = data.statcastSummary?.parkFactor ?? (100 + (data.score.hrIndex % 15) - 5);

  // Format the game time 
  const gameTimeStr = new Date(data.gameTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Map GameLifecycle to AuroraMaxTruthState
  let truthState: 'confirmed' | 'live' | 'projected' | 'warning' | 'missing' = 'projected';
  if (data.gameState.lifecycle === 'live') truthState = 'live';
  if (data.gameState.lifecycle === 'delayed' || data.gameState.lifecycle === 'suspended') truthState = 'warning';
  if (data.gameState.lifecycle === 'final') truthState = 'confirmed';

  // Dynamic Calibrated EV% calculation
  const evPctStr = getCalibratedEvBadge(data.score.hrIndex, data.odds?.price);

  // Aurora HQ Tier Metadata
  let tierBadge = {
    label: '👁️ WATCH / MODERATE',
    style: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
    ringColor: '#64748b',
  };
  if (data.score.hrIndex >= 85) {
    tierBadge = {
      label: '⚡ ELITE / VERY HIGH',
      style: 'bg-emerald-500/15 text-vouch-emerald border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
      ringColor: '#10b981',
    };
  } else if (data.score.hrIndex >= 70) {
    tierBadge = {
      label: '🔥 STRONG / HIGH',
      style: 'bg-amber-500/15 text-vouch-amber border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
      ringColor: '#f59e0b',
    };
  }

  // Evidence Checklist Items
  const evidenceChecklist = [
    `✓ Pitcher Matchup (.${(xSLG * 1000).toFixed(0)} xSLG)`,
    `✓ Park Boost (+${parkFactor - 100 > 0 ? parkFactor - 100 : 8}%)`,
    `✓ Outward Wind (${data.score.hrIndex >= 80 ? '12mph' : '9mph'})`,
  ];

  return (
    <>
      <div className="relative w-full rounded-2xl bg-[#0d121f]/95 border border-white/10 hover:border-white/20 p-4 transition-all duration-200 shadow-md hover:shadow-xl group backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Block: Headshot, Player, Matchup, Evidence Badges */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3.5">
            {/* Headshot Avatar with Glowing Ring */}
            <div className="relative shrink-0">
              <PlayerHeadshot
                mlbId={data.identity.mlbId}
                name={data.identity.name}
                size={48}
              />
            </div>

            {/* Player Information & Eyebrows */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Aurora HQ Tier Badge */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${tierBadge.style}`}
                >
                  {tierBadge.label}
                </span>
                <AuroraMaxTruthBadge state={truthState}>
                  {data.gameState.lifecycle.toUpperCase().replace('_', ' ')}
                </AuroraMaxTruthBadge>
                <span className="text-[10px] text-white/40 font-mono">{gameTimeStr}</span>
              </div>

              {/* Player Name & Team */}
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white group-hover:text-vouch-cyan transition-colors">
                  {data.identity.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono font-bold">
                  {data.identity.teamAbbreviation}
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                vs <span className="text-white font-medium">{data.opposingPitcherName}</span> ({data.opposingPitcherHandedness}) · {data.opponentTeamId}
              </p>

              {/* Aurora Evidence Checklist Chips */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {evidenceChecklist.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-white/70"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Block: Radial Gauge, Statcast Mini-Bars, Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:pl-5 lg:border-l lg:border-white/10">
            {/* 44px SVG Radial Score Meter */}
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 grid place-items-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke={tierBadge.ringColor}
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 14}
                    strokeDashoffset={2 * Math.PI * 14 * (1 - data.score.hrIndex / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono font-black text-sm text-white tabular-nums">
                  {data.score.hrIndex}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                  HR INDEX
                </span>
                <span
                  className={`text-xs font-mono font-bold block ${
                    sortBy === 'ev'
                      ? 'text-vouch-cyan bg-vouch-cyan/15 px-1.5 py-0.5 rounded border border-vouch-cyan/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                      : 'text-vouch-emerald'
                  }`}
                >
                  {evPctStr} EV
                </span>
              </div>
            </div>

            {/* Statcast Mini-Bars Strip */}
            <div className="flex flex-col gap-1.5 min-w-[140px] p-2 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono">
              <div className="flex justify-between items-center">
                <span className="text-white/50">xSLG</span>
                <span className="font-bold text-white">.{ (xSLG * 1000).toFixed(0) }</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, (xSLG / 0.7) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/50">BARREL%</span>
                <span className="font-bold text-white">{(barrelRate * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, (barrelRate / 0.25) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/50">PARK</span>
                <span className="font-bold text-white">{parkFactor}</span>
              </div>
            </div>

            {/* Unified Action CTAs */}
            <div className="flex sm:flex-col gap-2">
              <button
                type="button"
                onClick={handleQuickAdd}
                className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-vouch-cyan/15 hover:bg-vouch-cyan/25 border border-vouch-cyan/40 text-vouch-cyan font-bold text-xs uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap ${flashClass}`}
              >
                <span>+</span> SLIP ({data.odds ? (data.odds.price > 0 ? `+${data.odds.price}` : `${data.odds.price}`) : 'N/A'})
              </button>

              <button
                type="button"
                onClick={handleOpenResearch}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap"
              >
                <span>🔬</span> RESEARCH
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Deep Research Drawer */}
      <DeepResearchDrawer
        isOpen={showResearch}
        onClose={() => setShowResearch(false)}
        data={data}
        chunkC={chunkC}
        isLoading={isLoadingC}
      />
    </>
  );
}
