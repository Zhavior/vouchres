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
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ve-cyan/10 text-ve-cyan border border-ve-cyan/20">
            <Target className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              SLATE VOLUME
            </div>
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{telemetry.totalGames} GAMES</span>
              <span className="text-[9.5px] font-normal text-white/55">({telemetry.totalTdVolume} TD Vol)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Live RZ Alerts */}
        <div className={`flex items-center gap-2.5 rounded border px-3 py-2 transition-all ${
          telemetry.liveRedZoneAlerts > 0
            ? 'border-ve-red/40 bg-ve-red/10 text-white shadow-[0_0_12px_rgba(244,63,94,0.15)]'
            : 'border-white/10 bg-black/40 text-white/55'
        }`}>
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border ${
            telemetry.liveRedZoneAlerts > 0
              ? 'bg-ve-red/20 text-ve-red border-ve-red/30'
              : 'bg-white/5 text-white/40 border-white/10'
          }`}>
            <Radio className={`h-3.5 w-3.5 ${telemetry.liveRedZoneAlerts > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              LIVE RZ ALERTS
            </div>
            <div className="text-xs font-bold tracking-tight flex items-center gap-1.5">
              {telemetry.liveRedZoneAlerts > 0 ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ve-red/10 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-ve-red/10"></span>
                  </span>
                  <span className="text-ve-red font-bold">{telemetry.liveRedZoneAlerts} ACTIVE</span>
                </>
              ) : (
                <span className="text-white/55">0 ACTIVE</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Avg RedZone Efficiency */}
        <div className="flex items-center gap-2.5 rounded border border-white/10 bg-black/40 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ve-amber/10 text-ve-amber border border-ve-amber/20">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              AVG REDZONE EFF
            </div>
            <div className="text-xs font-bold tracking-tight text-ve-amber">
              {telemetry.avgRedZoneEff.toFixed(1)}% <span className="text-[9px] font-normal text-white/40">TD RATE</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Max Mismatch */}
        <div className="flex items-center gap-2.5 rounded border border-white/10 bg-black/40 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ve-emerald/10 text-ve-emerald border border-ve-emerald/20">
            <Flame className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">
              MAX MISMATCH
            </div>
            <div className="text-xs font-bold tracking-tight text-ve-emerald truncate">
              {telemetry.maxMismatchMatchup.label}{' '}
              <span className="text-[9.5px] font-normal text-white/55">(+{telemetry.maxMismatchMatchup.divergence}%)</span>
            </div>
          </div>
        </div>

        {/* Metric 5: System Alpha */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 rounded border border-ve-cyan/30 bg-ve-cyan/10 px-3 py-2 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ve-cyan/20 text-ve-cyan border border-ve-cyan/40">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-ve-cyan/80">
              SYSTEM ALPHA
            </div>
            <div className="text-xs font-bold tracking-tight text-ve-cyan flex items-center gap-1.5">
              <span>{telemetry.systemAlpha.toFixed(1)} TDPI</span>
              <span className="inline-block px-1 rounded bg-ve-cyan/20 text-[8.5px] text-ve-cyan border border-ve-cyan/30">
                EDGE HIGH
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
