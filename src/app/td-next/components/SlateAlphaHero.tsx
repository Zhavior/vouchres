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
    <div className="relative overflow-hidden border-2 border-amber-400 bg-black p-4 sm:p-5 font-mono shadow-[0_0_25px_rgba(251,191,36,0.15)] hr-next-card">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-amber-400 animate-pulse" />
          <span className="px-2 py-0.5 border border-amber-400/50 bg-amber-950/50 text-[9px] font-black uppercase tracking-widest text-amber-300">
            SLATE ALPHA MARQUEE DOSSIER
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 border border-white/10 bg-zinc-950 text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
            #1 CONVICTION MODEL
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLiveThreat && (
            <span className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[9px] font-black text-emerald-300 animate-pulse uppercase tracking-widest">
              <Radio className="h-3 w-3 text-emerald-400" />
              LIVE RZ THREAT (MIN {player.redZoneYardLine ?? 6}yd)
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 hidden md:inline">
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
              className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden border-2 border-amber-400/60 bg-zinc-950"
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
                <div className="flex h-full w-full items-center justify-center font-bold text-zinc-500">
                  {player.team}
                </div>
              )}
            </div>
            {player.jerseyNumber && (
              <span className="absolute -bottom-1 -right-1 rounded bg-black px-1.5 py-0.5 text-[9px] font-bold text-zinc-300 border border-white/20">
                {player.jerseyNumber}
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                {player.name}
              </h2>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
                {player.position} · {player.team}
              </span>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" />
                CONFIRMED
              </span>
            </div>

            <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
              <span>vs <strong className="text-white">{player.opponent}</strong></span>
              <span className="text-zinc-600">•</span>
              <span className="text-rose-400 font-bold">
                Def RZ Rank: #{player.oppRzDefRank} ({player.oppRzTdPercentAllowed}% Conceded)
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{player.gameSpread}</span>
            </p>
          </div>
        </div>

        {/* Center Telemetry Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/50 p-3 rounded-lg border border-white/10 shrink-0">
          <div className="space-y-0.5">
            <div className="text-[9px] text-zinc-500 uppercase">TDPI Rating</div>
            <div className="text-base font-black text-cyan-300 font-mono flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              {player.tdpiScore.toFixed(1)}
            </div>
            <div className="text-[8.5px] text-emerald-400 font-bold">ELITE CONVICTION</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[9px] text-zinc-500 uppercase">RZ Touch Share</div>
            <div className="text-base font-black text-white font-mono">
              {player.rzTouchShare.toFixed(1)}%
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, player.rzTouchShare)}%` }}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[9px] text-zinc-500 uppercase">Inside-5 Carries</div>
            <div className="text-base font-black text-white font-mono">
              {player.inside5Carries ?? 10} <span className="text-[10px] font-normal text-zinc-400">TOUCHES</span>
            </div>
            <div className="text-[8.5px] text-zinc-400">#1 on Slate Volume</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[9px] text-zinc-500 uppercase">Model Edge</div>
            <div className="text-base font-black text-emerald-400 font-mono">
              +{player.modelEdgePercent.toFixed(1)}%
            </div>
            <div className="text-[8.5px] text-zinc-400 font-mono">Odds: {player.marketOdds}</div>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-row lg:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onAddToSlip(player)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded border-2 border-cyan-400 bg-cyan-400 text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            + SLIP
          </button>

          <button
            type="button"
            onClick={() => onOpenDossier(player)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-white/20 bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider hover:border-white/40 hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            DOSSIER
          </button>

          <div className="hidden lg:flex items-center justify-center gap-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
            <Sparkles className="h-2.5 w-2.5" />
            AI VOUCH: {player.aiVouchScore ?? 94}
          </div>
        </div>
      </div>
    </div>
  );
};
