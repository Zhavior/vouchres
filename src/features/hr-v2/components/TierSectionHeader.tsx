import React from 'react';
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
  const avgOdds =
    validOdds.length > 0
      ? Math.round(
          validOdds.reduce((acc, i) => acc + (i.odds?.price ?? 0), 0) /
            validOdds.length
        )
      : 280;

  const validEv = items.filter((i) => i.odds);
  const avgEv =
    validEv.length > 0
      ? (
          validEv.reduce(
            (acc, i) =>
              acc +
              ((i.score.hrIndex / 100 - (i.odds?.impliedProbability ?? 0)) * 100),
            0
          ) / validEv.length
        ).toFixed(1)
      : '55.0';

  const tierMeta = {
    very_high: {
      title: 'VERY HIGH CONFIDENCE',
      scoreRange: '85+ HR Index',
      icon: '⚡',
      borderColor: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-vouch-emerald',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    high: {
      title: 'HIGH CONFIDENCE',
      scoreRange: '70–84 HR Index',
      icon: '🔥',
      borderColor: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-vouch-amber',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    moderate: {
      title: 'MODERATE / WATCHLIST',
      scoreRange: '<70 HR Index',
      icon: '👁️',
      borderColor: 'border-slate-600/40',
      badgeBg: 'bg-slate-700/20',
      badgeText: 'text-slate-300',
      glow: '',
    },
  }[tierName];

  return (
    <div
      className={`w-full flex items-center justify-between p-3.5 my-2 rounded-2xl bg-[#0e1424]/90 border ${tierMeta.borderColor} ${tierMeta.glow} transition-all duration-200 backdrop-blur-md select-none cursor-pointer hover:border-white/30`}
      onClick={onToggleCollapse}
    >
      {/* Tier Title & Range */}
      <div className="flex items-center gap-3">
        <span className="text-base">{tierMeta.icon}</span>
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
            {items.length} Props · Avg Odds: <span className="text-white font-bold">+{avgOdds}</span> · Avg EV: <span className="text-vouch-emerald font-bold">+{avgEv}%</span>
          </p>
        </div>
      </div>

      {/* Collapse/Expand Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase text-white/40 hidden sm:inline">
          {isCollapsed ? 'Expand Tier' : 'Collapse Tier'}
        </span>
        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white/70 hover:text-white transition-colors">
          {isCollapsed ? '▲' : '▼'}
        </div>
      </div>
    </div>
  );
}
