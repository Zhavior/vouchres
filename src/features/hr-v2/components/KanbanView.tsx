import React, { useState, memo, useMemo, useCallback } from 'react';
import { Zap, Flame, Activity, Sparkles } from 'lucide-react';
import { ChunkA } from '../api/contracts';
import { useDeepResearch } from '../hooks/useDeepResearch';
import { PlayerHeadshot } from './PlayerHeadshot';
import { DeepResearchDrawer } from './DeepResearchDrawer';
import { openParlayAdd } from '../../../lib/parlays/parlayAddContract';
import { getCalibratedEvBadge } from '../../../lib/analytics/evCalculator';
import { TIER_VERY_HIGH_MIN, TIER_HIGH_MIN, TIER_MODERATE_MIN } from '../constants';
import { formatBoardMetric } from '../presentHrV10Metric';
import { useProgressiveRender } from '../../../hooks/useProgressiveRender';

interface KanbanViewProps {
  items: ChunkA[];
}

interface KanbanCardProps {
  data: ChunkA;
  onOpenResearch?: (item: ChunkA) => void;
}

const KanbanCard = memo(function KanbanCard({ data, onOpenResearch }: KanbanCardProps) {
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
        market: 'home_runs',
        spec: 'Over 0.5',
        odds: data.odds?.price ?? 250,
        playerId: data.playerId,
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
  const evPctStr = useMemo(() => getCalibratedEvBadge(hrIndex, data.odds?.price), [hrIndex, data.odds?.price]);

  return (
    <div
      className="flex flex-col gap-2.5 p-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-200 shadow-sm hover:shadow-lg group"
      style={{ contain: 'layout style paint' }}
    >
      {/* Row 1: Player & Score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PlayerHeadshot
            mlbId={data.identity?.mlbId}
            name={data.identity?.name || 'Player'}
            size={36}
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
              {data.identity?.name || 'Unknown Hitter'}
            </h4>
            <p className="text-[10px] font-mono text-white/50 truncate">
              {data.identity?.teamAbbreviation || 'MLB'} vs {data.opponentTeamId || 'OPP'}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-black font-mono text-cyan-300 block">
            {hrIndex}
          </span>
          <span className="text-[9px] font-mono text-white/40 block">HRPI</span>
        </div>
      </div>

      {/* Row 2: Pitcher & Odds */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-black/30 px-2 py-1 rounded-lg border border-white/5">
        <span className="text-white/60 truncate max-w-[120px]">
          vs {data.opposingPitcherName || 'TBD'} ({data.opposingPitcherHandedness || 'R'})
        </span>
        <span className="font-bold text-white shrink-0">
          {data.odds?.price ? `+${data.odds.price}` : '---'}
        </span>
      </div>

      {/* Row 3: Statcast Micro-metrics */}
      <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
        <div>
          <span className="text-white/40 block">xSLG</span>
          <span className="text-white font-bold">{formatBoardMetric(data.statcastSummary?.xSLG, (n) => n.toFixed(3))}</span>
        </div>
        <div>
          <span className="text-white/40 block">BRL%</span>
          <span className="text-white font-bold">{formatBoardMetric(data.statcastSummary?.barrelRate, (n) => `${(n * 100).toFixed(1)}%`)}</span>
        </div>
        <div>
          <span className="text-white/40 block">PARK</span>
          <span className="text-white font-bold">{data.statcastSummary?.parkFactor ?? '---'}</span>
        </div>
      </div>

      {/* Row 4: EV & Actions */}
      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/5">
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          {evPctStr} EV
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResearchClick}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-mono font-bold transition-colors"
          >
            Intel
          </button>
          <button
            type="button"
            onClick={handleQuickAdd}
            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold transition-all shadow-sm active:scale-95"
          >
            + Slip
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * KanbanColumnFeed — Progressively loads cards inside each column
 * to guarantee instant initial frame render under 16ms even with 100+ cards.
 */
const KanbanColumnFeed = memo(function KanbanColumnFeed({
  items,
  onOpenResearch,
}: {
  items: ChunkA[];
  onOpenResearch?: (item: ChunkA) => void;
}) {
  const [visibleItems, sentinelRef] = useProgressiveRender(items, 40, 30);
  const displayItems = items.length <= 40 ? items : visibleItems;

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-xs font-mono text-white/30 border border-dashed border-white/5 rounded-xl">
        No props in this tier
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {displayItems.map((item) => (
        <KanbanCard key={item.playerId} data={item} onOpenResearch={onOpenResearch} />
      ))}
      {items.length > 40 && <div ref={sentinelRef} aria-hidden="true" />}
    </div>
  );
});

export const KanbanView = memo(function KanbanView({ items }: KanbanViewProps) {
  const [activeResearchPlayer, setActiveResearchPlayer] = useState<ChunkA | null>(null);

  // Hoisted deep research hook at KanbanView root
  const { chunkC, loading: isLoadingC } = useDeepResearch(
    activeResearchPlayer?.playerId || '',
    Boolean(activeResearchPlayer)
  );

  const handleOpenResearch = useCallback((item: ChunkA) => {
    setActiveResearchPlayer(item);
  }, []);

  const handleCloseResearch = useCallback(() => {
    setActiveResearchPlayer(null);
  }, []);

  const columns = useMemo(
    () => [
      {
        id: 'elite',
        title: 'ELITE / VERY HIGH',
        icon: Zap,
        range: `${TIER_VERY_HIGH_MIN}+ HRPI`,
        glow: 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        headerBg: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
        items: items.filter((i) => (i.score?.hrIndex ?? 0) >= TIER_VERY_HIGH_MIN),
      },
      {
        id: 'strong',
        title: 'STRONG / HIGH',
        icon: Flame,
        range: `${TIER_HIGH_MIN}–${TIER_VERY_HIGH_MIN - 1} HRPI`,
        glow: 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        headerBg: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
        items: items.filter(
          (i) =>
            (i.score?.hrIndex ?? 0) >= TIER_HIGH_MIN &&
            (i.score?.hrIndex ?? 0) < TIER_VERY_HIGH_MIN
        ),
      },
      {
        id: 'watch',
        title: 'WATCH / MODERATE',
        icon: Activity,
        range: `${TIER_MODERATE_MIN}–${TIER_HIGH_MIN - 1} HRPI`,
        glow: 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
        headerBg: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
        items: items.filter(
          (i) =>
            (i.score?.hrIndex ?? 0) >= TIER_MODERATE_MIN &&
            (i.score?.hrIndex ?? 0) < TIER_HIGH_MIN
        ),
      },
      {
        id: 'sleepers',
        title: 'SLEEPERS / VALUE',
        icon: Sparkles,
        range: `<${TIER_MODERATE_MIN} HRPI`,
        glow: 'border-slate-700/40 shadow-[0_0_15px_rgba(100,116,139,0.1)]',
        headerBg: 'bg-slate-800/40 text-slate-300 border border-slate-700/30',
        items: items.filter((i) => (i.score?.hrIndex ?? 0) < TIER_MODERATE_MIN),
      },
    ],
    [items]
  );

  return (
    <div
      className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-8 overflow-x-auto"
      style={{ contain: 'layout style' }}
    >
      {columns.map((col) => {
        const validOdds = col.items.filter((i) => i.odds && i.odds.price > 0);
        const avgOddsLabel =
          validOdds.length > 0
            ? `+${Math.round(validOdds.reduce((acc, i) => acc + (i.odds?.price ?? 0), 0) / validOdds.length)}`
            : 'UNKNOWN';
        const IconComp = col.icon;

        return (
          <div
            key={col.id}
            className={`flex flex-col rounded-2xl bg-white/[0.02] backdrop-blur-2xl border ${col.glow} p-3.5 min-w-[260px] max-h-[calc(100vh-280px)] min-h-[500px] shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]`}
          >
            {/* Column Summary Header */}
            <div className={`p-3 rounded-xl mb-3 ${col.headerBg}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono font-black text-xs uppercase tracking-wider">{col.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold border border-white/10">
                  {col.items.length}
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/60">
                Avg Odds: <strong className="text-white">{avgOddsLabel}</strong> · Range: {col.range}
              </p>
            </div>

            {/* Progressive Scrollable Column Cards Feed */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              <KanbanColumnFeed items={col.items} onOpenResearch={handleOpenResearch} />
            </div>
          </div>
        );
      })}

      {/* Single Hoisted Deep Research Drawer */}
      {activeResearchPlayer && (
        <DeepResearchDrawer
          isOpen={Boolean(activeResearchPlayer)}
          onClose={handleCloseResearch}
          data={activeResearchPlayer}
          chunkC={chunkC}
          isLoading={isLoadingC}
        />
      )}
    </div>
  );
});
