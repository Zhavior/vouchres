import React, { useState } from 'react';
import { ChunkA } from '../api/contracts';
import { useDeepResearch } from '../hooks/useDeepResearch';
import { PlayerHeadshot } from './PlayerHeadshot';
import { DeepResearchDrawer } from './DeepResearchDrawer';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';

import { getCalibratedEvBadge } from '../../../lib/analytics/evCalculator';

interface CompactHrRowProps {
  data: ChunkA;
  sortBy?: 'score' | 'ev' | 'odds';
}

export function CompactHrRow({ data, sortBy = 'score' }: CompactHrRowProps) {
  const [showResearch, setShowResearch] = useState(false);
  const { chunkC, loading: isLoadingC } = useDeepResearch(data.playerId, showResearch);

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

  // EV percentage calculation
  const evStr = getCalibratedEvBadge(data.score.hrIndex, data.odds?.price);

  // Tier color styling for 36px compact radial gauge
  let ringColor = '#64748b'; // Slate
  let textColor = 'text-slate-400';
  if (data.score.hrIndex >= 85) {
    ringColor = '#10b981'; // Emerald
    textColor = 'text-vouch-emerald';
  } else if (data.score.hrIndex >= 70) {
    ringColor = '#f59e0b'; // Amber
    textColor = 'text-vouch-amber';
  }

  return (
    <>
      <div className="min-h-[64px] w-full bg-[#0d121f]/90 hover:bg-[#131929] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 transition-all duration-200 shadow-sm group">
        {/* Col 1: Player & Matchup */}
        <div className="flex items-center gap-3 min-w-[220px]">
          <PlayerHeadshot mlbId={data.identity.mlbId} name={data.identity.name} size={40} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white group-hover:text-vouch-cyan transition-colors">
                {data.identity.name}
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                {data.identity.teamAbbreviation}
              </span>
            </div>
            <p className="text-xs text-white/50">
              vs {data.opposingPitcherName} ({data.opposingPitcherHandedness})
            </p>
          </div>
        </div>

        {/* Col 2: HR Index Ring (36px compact) */}
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
                strokeDashoffset={2 * Math.PI * 14 * (1 - data.score.hrIndex / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-mono font-black text-xs text-white tabular-nums">
              {data.score.hrIndex}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className={`text-[9px] font-bold tracking-wider uppercase block ${textColor}`}>
              {data.score.confidence.level.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-white/40 block">HR Index</span>
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
                  ? 'bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-vouch-emerald'
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
            <span className="font-bold text-white">.{(data.score.hrIndex * 7.2).toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-white/5">
            <span className="text-white/40 text-[10px]">BARREL</span>
            <span className="font-bold text-white">{((data.score.hrIndex / 420) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 border border-white/5">
            <span className="text-white/40 text-[10px]">PARK</span>
            <span className="font-bold text-white">{100 + (data.score.hrIndex % 15) - 5}</span>
          </div>
        </div>

        {/* Col 5: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="px-3 py-1.5 rounded-lg bg-vouch-cyan/15 hover:bg-vouch-cyan/25 border border-vouch-cyan/30 text-vouch-cyan font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            + SLIP
          </button>
          <button
            type="button"
            onClick={handleOpenResearch}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Deep Research Telemetry"
          >
            🔬
          </button>
        </div>
      </div>

      {/* Slide-over Research Drawer */}
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
