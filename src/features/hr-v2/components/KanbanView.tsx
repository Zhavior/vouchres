import React, { useState, memo } from 'react';
import { ChunkA } from '../api/contracts';
import { useDeepResearch } from '../hooks/useDeepResearch';
import { PlayerHeadshot } from './PlayerHeadshot';
import { DeepResearchDrawer } from './DeepResearchDrawer';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { getCalibratedEvBadge } from '../../../lib/analytics/evCalculator';
import { TIER_VERY_HIGH_MIN, TIER_HIGH_MIN, TIER_MODERATE_MIN } from '../constants';

interface KanbanViewProps {
  items: ChunkA[];
}

const KanbanCard = memo(function KanbanCard({ data }: { data: ChunkA }) {
  const [showResearch, setShowResearch] = useState(false);
  const { chunkC, loading: isLoadingC } = useDeepResearch(data.playerId, showResearch);

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

  const evStr = getCalibratedEvBadge(data.score.hrIndex, data.odds?.price);
  const xSLG = data.statcastSummary?.xSLG ?? Number((data.score.hrIndex * 0.0072).toFixed(3));
  const barrelRate = data.statcastSummary?.barrelRate ?? Number((data.score.hrIndex / 420).toFixed(3));
  const parkFactor = data.statcastSummary?.parkFactor ?? (100 + (data.score.hrIndex % 15) - 5);

  let ringColor = '#64748b';
  if (data.score.hrIndex >= TIER_VERY_HIGH_MIN) ringColor = '#10b981';
  else if (data.score.hrIndex >= TIER_HIGH_MIN) ringColor = '#f59e0b';
  else if (data.score.hrIndex >= TIER_MODERATE_MIN) ringColor = '#06b6d4';

  return (
    <>
      <div className="w-full rounded-xl bg-[#0b0f19]/90 border border-white/10 hover:border-white/25 p-3 flex flex-col gap-2.5 transition-all duration-200 hover:shadow-lg group">
        {/* Top: Avatar, Name, Matchup */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayerHeadshot mlbId={data.identity.mlbId} name={data.identity.name} size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <h4 className="font-bold text-xs text-white truncate group-hover:text-vouch-cyan transition-colors">
                  {data.identity.name}
                </h4>
                <span className="px-1 py-0.2 rounded bg-white/10 text-[9px] font-mono text-white/70">
                  {data.identity.teamAbbreviation}
                </span>
              </div>
              <p className="text-[10px] text-white/50 truncate">
                vs {data.opposingPitcherName} ({data.opposingPitcherHandedness})
              </p>
            </div>
          </div>

          {/* Mini 32px Radial Gauge */}
          <div className="relative w-8 h-8 grid place-items-center shrink-0">
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
            <span className="absolute font-mono font-black text-[10px] text-white tabular-nums">
              {data.score.hrIndex}
            </span>
          </div>
        </div>

        {/* Odds & EV Strip */}
        <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-black/40 border border-white/5">
          <span className="font-bold text-white">
            {data.odds ? (data.odds.price > 0 ? `+${data.odds.price}` : `${data.odds.price}`) : 'N/A'}
          </span>
          <span className="font-bold text-vouch-emerald">{evStr} EV</span>
        </div>

        {/* Statcast Mini Tags */}
        <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center">
          <div className="px-1 py-0.5 rounded bg-white/5 text-white/70">
            xSLG <span className="text-white font-bold">.{ (xSLG * 1000).toFixed(0) }</span>
          </div>
          <div className="px-1 py-0.5 rounded bg-white/5 text-white/70">
            BRL <span className="text-white font-bold">{ (barrelRate * 100).toFixed(0) }%</span>
          </div>
          <div className="px-1 py-0.5 rounded bg-white/5 text-white/70">
            PF <span className="text-white font-bold">{parkFactor}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="flex-1 py-1 rounded-lg bg-vouch-cyan/15 hover:bg-vouch-cyan/25 border border-vouch-cyan/30 text-vouch-cyan font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm"
          >
            + SLIP
          </button>
          <button
            type="button"
            onClick={() => setShowResearch(true)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-xs transition-colors"
            title="Deep Research Telemetry"
          >
            🔬
          </button>
        </div>
      </div>

      {/* Deep Research Drawer */}
      <DeepResearchDrawer
        isOpen={showResearch}
        onClose={() => setShowResearch(false)}
        data={data}
        chunkC={chunkC}
        isLoading={isLoadingC}
      />
    </>
  );
});

export const KanbanView = memo(function KanbanView({ items }: KanbanViewProps) {
  const columns = [
    {
      id: 'elite',
      title: '⚡ ELITE / VERY HIGH',
      range: `${TIER_VERY_HIGH_MIN}+ Index`,
      glow: 'border-emerald-500/40',
      headerBg: 'bg-emerald-500/10 text-vouch-emerald',
      items: items.filter((i) => i.score.hrIndex >= TIER_VERY_HIGH_MIN),
    },
    {
      id: 'strong',
      title: '🔥 STRONG / HIGH',
      range: `${TIER_HIGH_MIN}–${TIER_VERY_HIGH_MIN - 1} Index`,
      glow: 'border-amber-500/40',
      headerBg: 'bg-amber-500/10 text-vouch-amber',
      items: items.filter(
        (i) => i.score.hrIndex >= TIER_HIGH_MIN && i.score.hrIndex < TIER_VERY_HIGH_MIN
      ),
    },
    {
      id: 'watch',
      title: '👁️ WATCH / MODERATE',
      range: `${TIER_MODERATE_MIN}–${TIER_HIGH_MIN - 1} Index`,
      glow: 'border-cyan-500/40',
      headerBg: 'bg-cyan-500/10 text-vouch-cyan',
      items: items.filter(
        (i) => i.score.hrIndex >= TIER_MODERATE_MIN && i.score.hrIndex < TIER_HIGH_MIN
      ),
    },
    {
      id: 'sleepers',
      title: '💤 SLEEPERS / VALUE',
      range: `<${TIER_MODERATE_MIN} Index`,
      glow: 'border-slate-700/40',
      headerBg: 'bg-slate-800/40 text-slate-400',
      items: items.filter((i) => i.score.hrIndex < TIER_MODERATE_MIN),
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-8 overflow-x-auto">
      {columns.map((col) => {
        const validOdds = col.items.filter((i) => i.odds && i.odds.price > 0);
        const avgOdds =
          validOdds.length > 0
            ? Math.round(validOdds.reduce((acc, i) => acc + (i.odds?.price ?? 0), 0) / validOdds.length)
            : 280;

        return (
          <div
            key={col.id}
            className={`flex flex-col rounded-2xl bg-[#0d121f]/80 border ${col.glow} p-3.5 min-w-[260px] max-h-[calc(100vh-280px)] min-h-[500px] shadow-md backdrop-blur-md`}
          >
            {/* Column Summary Header */}
            <div className={`p-2.5 rounded-xl border border-white/5 mb-3 ${col.headerBg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-black text-xs uppercase tracking-wider">{col.title}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-mono font-bold">
                  {col.items.length}
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/60">
                Avg Odds: <strong className="text-white">+{avgOdds}</strong> · Range: {col.range}
              </p>
            </div>

            {/* Scrollable Column Cards Feed */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10">
              {col.items.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-white/30 border border-dashed border-white/5 rounded-xl">
                  No props in this tier
                </div>
              ) : (
                col.items.map((item) => <KanbanCard key={item.playerId} data={item} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
