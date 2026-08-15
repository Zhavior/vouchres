import React from 'react';
import { Zap, Flame, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { ChunkA } from '../api/contracts';

interface TierSectionHeaderProps {
  tierName: 'very_high' | 'high' | 'moderate';
  items: ChunkA[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function TierSectionHeader({
  tierName,
  items,
  isCollapsed,
  onToggleCollapse,
}: TierSectionHeaderProps) {
  // Compute sub-telemetry: average odds and average EV
  const validOdds = items.filter((i) => i.odds && i.odds.price > 0);
  const avgOddsLabel =
    validOdds.length > 0
      ? `+${Math.round(
          validOdds.reduce((acc, i) => acc + (i.odds?.price ?? 0), 0) /
            validOdds.length,
        )}`
      : 'UNKNOWN';

  const validEv = items.filter((i) => i.odds);
  const avgEvLabel =
    validEv.length > 0
      ? `+${(
          validEv.reduce(
            (acc, i) =>
              acc +
              (((i.score?.hrIndex ?? 0) / 100 - (i.odds?.impliedProbability ?? 0)) * 100),
            0,
          ) / validEv.length
        ).toFixed(1)}%`
      : 'UNKNOWN';

  const tierMeta = {
    very_high: {
      title: 'VERY HIGH CONFIDENCE',
      scoreRange: '85+ HRPI',
      icon: Zap,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-300 border border-emerald-500/30',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    },
    high: {
      title: 'HIGH CONFIDENCE',
      scoreRange: '70–84 HRPI',
      icon: Flame,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-300 border border-amber-500/30',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    },
    moderate: {
      title: 'MODERATE / WATCHLIST',
      scoreRange: '<70 HRPI',
      icon: Activity,
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      badgeBg: 'bg-cyan-500/10',
      badgeText: 'text-cyan-300 border border-cyan-500/20',
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },
  }[tierName];

  const IconComp = tierMeta.icon;

  return (
    <div
      className={`w-full flex items-center justify-between p-3.5 my-2.5 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border ${tierMeta.borderColor} ${tierMeta.glow} transition-all duration-300 select-none cursor-pointer hover:border-white/30 hover:bg-white/[0.04] shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]`}
      onClick={onToggleCollapse}
    >
      {/* Tier Title & Range */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/10 ${tierMeta.iconColor} shrink-0`}>
          <IconComp className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black tracking-wider uppercase text-white font-mono">
              {tierMeta.title}
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
            >
              {tierMeta.scoreRange}
            </span>
          </div>
          <p className="text-[11px] font-mono text-white/50 mt-0.5">
            {items.length} Props · Avg Odds: <span className="text-white font-bold">{avgOddsLabel}</span> · Avg EV: <span className="text-emerald-400 font-bold">{avgEvLabel}</span>
          </p>
        </div>
      </div>

      {/* Collapse/Expand Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase text-white/40 hidden sm:inline">
          {isCollapsed ? 'Expand Tier' : 'Collapse Tier'}
        </span>
        <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}
