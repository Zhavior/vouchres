import React from 'react';
import { Sparkles, Plus, ExternalLink, ShieldCheck, Flame, Radio, Zap } from 'lucide-react';
import type { TouchdownPlayer } from '../../../types/touchdown';

interface SlateAlphaHeroProps {
  player: TouchdownPlayer | null;
  onOpenDossier: (player: TouchdownPlayer) => void;
  onAddToSlip: (player: TouchdownPlayer) => void;
}

export const SlateAlphaHero: React.FC<SlateAlphaHeroProps> = ({
  player,
  onOpenDossier,
  onAddToSlip,
}) => {
  if (!player) return null;

  const isLiveThreat = player.isRedZoneActive;

  return (
    <div className="relative overflow-hidden border-2 border-ve-amber/25 bg-transparent p-4 sm:p-5 font-mono shadow-[0_0_25px_rgba(251,191,36,0.15)] hr-next-card">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-ve-amber/10 animate-pulse" />
          <span className="px-2 py-0.5 border border-ve-amber/50 bg-ve-amber/10 text-[9px] font-semibold uppercase tracking-widest text-ve-amber">
            SLATE ALPHA MARQUEE DOSSIER
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 border border-white/10 bg-white/[0.02] text-[9px] font-bold text-white/70 uppercase tracking-widest">
            #1 CONVICTION MODEL
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLiveThreat && (
            <span className="flex items-center gap-1.5 border border-ve-emerald/30 bg-ve-emerald/10 px-2 py-0.5 text-[9px] font-bold text-ve-emerald animate-pulse uppercase tracking-widest">
              <Radio className="h-3 w-3 text-ve-emerald" />
              LIVE RZ THREAT (MIN {player.redZoneYardLine ?? 6}yd)
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 hidden md:inline">
            Implied Total: <strong className="text-white">{player.impliedTeamTotal.toFixed(1)} PTS</strong>
          </span>
        </div>
      </div>

      {/* Main Hero Card Body */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
        {/* Left Player Info & Headshot */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden border-2 border-ve-amber/60 bg-white/[0.02]"
              style={{ aspectRatio: '1 / 1' }}
            >
              {player.headshotUrl ? (
                <img
                  src={player.headshotUrl}
                  alt={player.name}
                  className="h-full w-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-white/40">
                  {player.team}
                </div>
              )}
            </div>
            {player.jerseyNumber && (
              <span className="absolute -bottom-1 -right-1 rounded bg-transparent px-1.5 py-0.5 text-[9px] font-bold text-white/70 border border-white/20">
                {player.jerseyNumber}
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
                {player.name}
              </h2>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70">
                {player.position} · {player.team}
              </span>
              <span className="rounded bg-ve-emerald/10 border border-ve-emerald/30 px-1.5 py-0.5 text-[9px] font-bold text-ve-emerald flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" />
                CONFIRMED
              </span>
            </div>

            <p className="text-xs text-white/55 flex items-center gap-2 flex-wrap">
              <span>vs <strong className="text-white">{player.opponent}</strong></span>
              <span className="text-white/25">•</span>
              <span className="text-ve-red font-bold">
                Def RZ Rank: #{player.oppRzDefRank} ({player.oppRzTdPercentAllowed}% Conceded)
              </span>
              <span className="text-white/25">•</span>
              <span className="text-white/55">{player.gameSpread}</span>
            </p>
          </div>
        </div>

        {/* Center Telemetry Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/50 p-3 border border-white/10 shrink-0">
          <div className="space-y-0.5">
            <div className="text-[9px] text-white/40 uppercase">TDPI Rating</div>
            <div className="text-base font-bold text-ve-cyan font-mono flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-ve-cyan" />
              {player.tdpiScore.toFixed(1)}
            </div>
            <div className="text-[8.5px] text-ve-emerald font-bold">ELITE CONVICTION</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[9px] text-white/40 uppercase">RZ Touch Share</div>
            <div className="text-base font-bold text-white font-mono">
              {player.rzTouchShare.toFixed(1)}%
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-ve-cyan/10 rounded-full"
                style={{ width: `${Math.min(100, player.rzTouchShare)}%` }}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[9px] text-white/40 uppercase">Inside-5 Carries</div>
            <div className="text-base font-bold text-white font-mono">
              {player.inside5Carries ?? 10} <span className="text-[10px] font-normal text-white/55">TOUCHES</span>
            </div>
            <div className="text-[8.5px] text-white/55">#1 on Slate Volume</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[9px] text-white/40 uppercase">Model Edge</div>
            <div className="text-base font-bold text-ve-emerald font-mono">
              +{player.modelEdgePercent.toFixed(1)}%
            </div>
            <div className="text-[8.5px] text-white/55 font-mono">Odds: {player.marketOdds}</div>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-row lg:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onAddToSlip(player)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded border-2 border-ve-cyan/25 bg-ve-cyan/10 text-black font-bold text-xs uppercase tracking-wider hover:bg-ve-cyan/10 transition-all shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            + SLIP
          </button>

          <button
            type="button"
            onClick={() => onOpenDossier(player)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-white/20 bg-white/[0.04] text-white font-bold text-xs uppercase tracking-wider hover:border-white/40 hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            DOSSIER
          </button>

          <div className="hidden lg:flex items-center justify-center gap-1 px-2 py-1 rounded bg-ve-emerald/10 border border-ve-emerald/30 text-[9px] font-bold text-ve-emerald">
            <Sparkles className="h-2.5 w-2.5" />
            AI VOUCH: {player.aiVouchScore ?? 94}
          </div>
        </div>
      </div>
    </div>
  );
};
