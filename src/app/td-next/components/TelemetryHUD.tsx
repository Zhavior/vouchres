import React from 'react';
import { Activity, Radio, Target, Zap, Flame, CloudSnow } from 'lucide-react';
import type { SlateTelemetryMetrics } from '../../../types/touchdown';

interface TelemetryHUDProps {
  telemetry: SlateTelemetryMetrics;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  telemetry,
  onRefresh,
  isSyncing = false,
}) => {
  return (
    <div className="w-full border-b border-white/10 bg-[#08090D] px-4 py-2.5 font-mono">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:gap-3">
        {/* Metric 1: Slate Volume */}
        <div className="flex items-center gap-2.5 rounded border border-white/10 bg-black/40 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Target className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              SLATE VOLUME
            </div>
            <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{telemetry.totalGames} GAMES</span>
              <span className="text-[9.5px] font-normal text-zinc-400">({telemetry.totalTdVolume} TD Vol)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Live RZ Alerts */}
        <div className={`flex items-center gap-2.5 rounded border px-3 py-2 transition-all ${
          telemetry.liveRedZoneAlerts > 0
            ? 'border-rose-500/40 bg-rose-950/30 text-white shadow-[0_0_12px_rgba(244,63,94,0.15)]'
            : 'border-white/10 bg-black/40 text-zinc-400'
        }`}>
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border ${
            telemetry.liveRedZoneAlerts > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-white/5 text-zinc-500 border-white/10'
          }`}>
            <Radio className={`h-3.5 w-3.5 ${telemetry.liveRedZoneAlerts > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              LIVE RZ ALERTS
            </div>
            <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
              {telemetry.liveRedZoneAlerts > 0 ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-rose-300 font-bold">{telemetry.liveRedZoneAlerts} ACTIVE</span>
                </>
              ) : (
                <span className="text-zinc-400">0 ACTIVE</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Avg RedZone Efficiency */}
        <div className="flex items-center gap-2.5 rounded border border-white/10 bg-black/40 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              AVG REDZONE EFF
            </div>
            <div className="text-xs font-black tracking-tight text-amber-300">
              {telemetry.avgRedZoneEff.toFixed(1)}% <span className="text-[9px] font-normal text-zinc-500">TD RATE</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Max Mismatch */}
        <div className="flex items-center gap-2.5 rounded border border-white/10 bg-black/40 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Flame className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              MAX MISMATCH
            </div>
            <div className="text-xs font-black tracking-tight text-emerald-400 truncate">
              {telemetry.maxMismatchMatchup.label}{' '}
              <span className="text-[9.5px] font-normal text-zinc-400">(+{telemetry.maxMismatchMatchup.divergence}%)</span>
            </div>
          </div>
        </div>

        {/* Metric 5: System Alpha */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 rounded border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-400/80">
              SYSTEM ALPHA
            </div>
            <div className="text-xs font-black tracking-tight text-cyan-300 flex items-center gap-1.5">
              <span>{telemetry.systemAlpha.toFixed(1)} TDPI</span>
              <span className="inline-block px-1 rounded bg-cyan-400/20 text-[8.5px] text-cyan-200 border border-cyan-400/30">
                EDGE HIGH
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
