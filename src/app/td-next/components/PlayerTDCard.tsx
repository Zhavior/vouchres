import React from 'react';
import { Plus, ExternalLink, Sparkles, ShieldCheck, Radio, Zap, Target } from 'lucide-react';
import type { TouchdownPlayer } from '../../../types/touchdown';

interface PlayerTDCardProps {
  player: TouchdownPlayer;
  onOpenDossier: (player: TouchdownPlayer) => void;
  onAddToSlip: (player: TouchdownPlayer) => void;
}

export const PlayerTDCard: React.FC<PlayerTDCardProps> = ({
  player,
  onOpenDossier,
  onAddToSlip,
}) => {
  const isLiveThreat = player.isRedZoneActive;

  // Tier color themes exactly matching HR Next
  const tierConfig = {
    ELITE: {
      gaugeColor: 'bg-[#10B981]',
      accentText: 'text-[#10B981]',
      accentHex: '#10B981',
    },
    STRONG: {
      gaugeColor: 'bg-[#6EE7B7]',
      accentText: 'text-[#6EE7B7]',
      accentHex: '#6EE7B7',
    },
    VALUE: {
      gaugeColor: 'bg-[#F59E0B]',
      accentText: 'text-[#F59E0B]',
      accentHex: '#F59E0B',
    },
    SLEEPER: {
      gaugeColor: 'bg-[#A855F7]',
      accentText: 'text-[#A855F7]',
      accentHex: '#A855F7',
    },
  }[player.tier];

  return (
    <div
      className={`hr-next-card group relative w-full flex flex-col border-2 bg-transparent font-mono transition-all duration-200 p-3 ${
        isLiveThreat
          ? 'border-ve-emerald/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
          : 'border-white/[0.08] hover:border-white/40'
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 240px',
      }}
    >
      <div className="flex flex-col gap-2.5">
        {/* Main Hero Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
            {/* Player Headshot */}
            <button
              type="button"
              onClick={() => onOpenDossier(player)}
              aria-label={`Select ${player.name}`}
              className="relative h-[56px] w-[56px] shrink-0 cursor-pointer overflow-hidden border-2 border-white/20 bg-white/[0.02] transition-colors group-hover:border-white"
              style={{ aspectRatio: '1 / 1' }}
            >
              {player.headshotUrl ? (
                <img src={player.headshotUrl} alt={player.name} className="h-full w-full object-cover object-top" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/40 bg-white/[0.04]">
                  {player.team}
                </div>
              )}
            </button>

            {/* Player Info & Badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3
                  onClick={() => onOpenDossier(player)}
                  className={`font-mono text-sm sm:text-base font-bold leading-tight tracking-tight cursor-pointer hover:underline truncate uppercase ${
                    isLiveThreat ? 'text-ve-emerald' : 'text-white'
                  }`}
                >
                  {player.name}
                </h3>
                
                <span className="text-[10px] font-mono text-white/70 bg-white/[0.02] px-1.5 py-0.5 border border-white/[0.08] flex items-center gap-1">
                  {player.team}
                </span>

                {/* Tier Badge */}
                <span
                  className="border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase"
                  style={{ color: tierConfig.accentHex, borderColor: `${tierConfig.accentHex}60`, backgroundColor: `${tierConfig.accentHex}15` }}
                >
                  {player.tier}
                </span>

                {/* Inline Live RZ Badge replacing top banner */}
                {isLiveThreat && (
                  <span className="inline-flex items-center gap-1 border border-ve-emerald/50 bg-ve-emerald/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-ve-emerald animate-pulse">
                    <Radio className="w-3 h-3 text-ve-emerald" /> LIVE RZ
                  </span>
                )}
              </div>

              {/* Matchup Line */}
              <p className="mt-1 font-mono text-[11px] text-white/55 truncate flex items-center gap-1.5">
                <span className="text-white/40 uppercase">{player.position}</span>
                <span className="text-white/25">·</span>
                <span className="text-white font-bold">{player.isHome ? 'vs' : '@'} {player.opponent}</span>
                <span className="text-white/25">·</span>
                <span className="text-ve-cyan text-[10px] font-semibold uppercase">TTL {player.impliedTeamTotal.toFixed(1)}</span>
              </p>

              {/* Red Zone Touch Share mini-gauge */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-mono text-[9px] text-white/55 uppercase font-bold w-[70px]">RZ SHARE</span>
                <div className="flex-1 max-w-[100px] h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${tierConfig.gaugeColor}`}
                    style={{ width: `${Math.min(100, player.rzTouchShare)}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-white font-bold">{player.rzTouchShare.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Top Right: TDPI Score & Edge Badge */}
          <div className="flex shrink-0 flex-col items-end leading-none">
            <span className={`font-mono text-2xl font-bold tabular-nums font-sans ${tierConfig.accentText}`}>
              {player.tdpiScore.toFixed(1)}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-semibold uppercase tracking-widest text-white/40">
              TDPI
            </span>
            <span className={`mt-1 text-[10px] font-mono font-bold tabular-nums ${player.modelEdgePercent > 0 ? 'text-ve-emerald' : 'text-white/40'}`}>
              {player.modelEdgePercent > 0 ? `+${player.modelEdgePercent.toFixed(1)}% EV` : `${player.modelEdgePercent.toFixed(1)}% EV`}
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Grid (Like HR Next Statcast) */}
      <div className="mt-2 grid grid-cols-4 gap-1.5 border-t border-white/10 pt-2 font-mono">
        <div className="border border-white/10 bg-white/[0.02] p-2">
          <span className="block text-[8px] font-semibold uppercase tracking-widest text-white/40">INSIDE-10</span>
          <strong className="mt-0.5 block text-xs font-bold text-white">
            {player.inside10Touches} Tch
          </strong>
        </div>
        <div className="border border-white/10 bg-white/[0.02] p-2">
          <span className="block text-[8px] font-semibold uppercase tracking-widest text-white/40">OPP RZ DEF</span>
          <strong className={`mt-0.5 block text-xs font-bold ${player.oppRzDefRank >= 23 ? 'text-ve-red' : 'text-white/70'}`}>
            #{player.oppRzDefRank}
          </strong>
        </div>
        <div className="border border-white/10 bg-white/[0.02] p-2">
          <span className="block text-[8px] font-semibold uppercase tracking-widest text-white/40">GL SNAP %</span>
          <strong className="mt-0.5 block text-xs font-bold text-white">
            {player.goalLineSnapPercent ?? 0}%
          </strong>
        </div>
        <div className="border border-white/10 bg-white/[0.02] p-2">
          <span className="block text-[8px] font-semibold uppercase tracking-widest text-white/40">RZ TARGETS</span>
          <strong className="mt-0.5 block text-xs font-bold text-white">
            {player.rzTargets ?? 0}
          </strong>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-auto pt-2.5 flex items-center justify-between gap-1.5">
        <span className="font-mono text-[9px] font-bold text-white/40">ODDS TBD</span>
        
        <div className="flex gap-1.5 items-center">
          <button
            type="button"
            onClick={() => onOpenDossier(player)}
            className="flex items-center gap-1 rounded border border-white/10 bg-transparent px-2 py-1 text-[10px] font-bold text-white/70 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            DOSSIER
          </button>
          
          <button
            type="button"
            onClick={() => onAddToSlip(player)}
            className="flex items-center gap-1 rounded border border-ve-amber/25 bg-ve-amber/10 px-2.5 py-1 text-[10px] font-bold text-ve-amber hover:bg-ve-amber/10 hover:text-black transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3 stroke-[3]" />
            + SLIP
          </button>
        </div>
      </div>
    </div>
  );
};
