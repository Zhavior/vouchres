import React, { useMemo } from 'react';
import { Activity, Flame, ShieldAlert, Sparkles, TrendingUp, Wind } from 'lucide-react';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';

export interface HrMaxTelemetryStripProps {
  rows: HrMaxDeskRow[];
  confirmedCount: number;
  totalCount: number;
  onSelectPlayer?: (id: string) => void;
}

export const HrMaxTelemetryStrip = React.memo(function HrMaxTelemetryStrip({
  rows,
  confirmedCount,
  totalCount,
  onSelectPlayer,
}: HrMaxTelemetryStripProps) {
  // Top +EV Pick
  const topEvRow = useMemo(() => {
    const valid = rows.filter((r) => r.evEdge != null && r.evEdge > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => ((cur.evEdge ?? 0) > (best.evEdge ?? 0) ? cur : best), valid[0]);
  }, [rows]);

  // Top HRPI Candidate
  const topHrpiRow = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((best, cur) => (cur.score > best.score ? cur : best), rows[0]);
  }, [rows]);

  // Highest Park Environment
  const topParkRow = useMemo(() => {
    const valid = rows.filter((r) => r.raw.parkIndex != null || r.raw.parkFactor != null);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => {
      const curVal = cur.raw.parkIndex ?? cur.raw.parkFactor ?? 0;
      const bestVal = best.raw.parkIndex ?? best.raw.parkFactor ?? 0;
      return curVal > bestVal ? cur : best;
    }, valid[0]);
  }, [rows]);

  // Tier Counts & Percentages
  const tierDistribution = useMemo(() => {
    if (rows.length === 0) return { elite: 0, strong: 0, watch: 0, sleepers: 0, total: 0 };
    const elite = rows.filter((r) => r.score >= 80).length;
    const strong = rows.filter((r) => r.score >= 70 && r.score < 80).length;
    const watch = rows.filter((r) => r.score >= 60 && r.score < 70).length;
    const sleepers = rows.filter((r) => r.score < 60).length;
    const total = rows.length;
    return {
      elite,
      strong,
      watch,
      sleepers,
      total,
      elitePct: total > 0 ? (elite / total) * 100 : 0,
      strongPct: total > 0 ? (strong / total) * 100 : 0,
      watchPct: total > 0 ? (watch / total) * 100 : 0,
      sleepersPct: total > 0 ? (sleepers / total) * 100 : 0,
    };
  }, [rows]);

  if (rows.length === 0) return null;

  return (
    <div className="relative overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md px-3 py-2.5 font-mono text-xs shadow-inner">
      {/* Background Matrix Scanning Line */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--aurora-max-emerald)]/[0.03] to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Slate Pulse & Confirmed Lineups Beacon */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${confirmedCount > 0 ? 'bg-[var(--aurora-max-emerald)]' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${confirmedCount > 0 ? 'bg-[var(--aurora-max-emerald)]' : 'bg-amber-400'}`} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Slate Telemetry:
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[10px] text-white">
            <span className="text-[var(--aurora-max-emerald)] font-bold tabular-nums">{confirmedCount}</span>
            <span className="text-white/40">/</span>
            <span className="tabular-nums text-white/70">{totalCount}</span>
            <span className="text-white/40 text-[9px] uppercase">Confirmed</span>
          </span>
        </div>

        {/* Center: Highlights (Top +EV & Park Factor) */}
        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          {topEvRow && (
            <button
              type="button"
              onClick={() => onSelectPlayer?.(topEvRow.id)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-left hover:bg-emerald-500/20 transition-colors"
            >
              <TrendingUp className="h-3 w-3 text-[var(--aurora-max-emerald)] shrink-0" />
              <span className="text-white/60">Top +EV:</span>
              <span className="font-bold text-white hover:underline">{topEvRow.playerName}</span>
              <span className="font-bold text-[var(--aurora-max-emerald)] tabular-nums">
                +{topEvRow.evEdge}%
              </span>
              {topEvRow.bookOddsLabel && (
                <span className="text-white/40 tabular-nums">({topEvRow.bookOddsLabel})</span>
              )}
            </button>
          )}

          {topParkRow && (
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <Wind className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="text-white/60">Venue Boost:</span>
              <span className="font-bold text-white truncate max-w-[120px]">{topParkRow.venue || topParkRow.matchupLabel}</span>
              <span className="font-bold text-emerald-300 tabular-nums">
                {topParkRow.raw.parkIndex ? `${topParkRow.raw.parkIndex} Index` : `${topParkRow.raw.parkFactor} Score`}
              </span>
            </div>
          )}
        </div>

        {/* Right: 4-Tier Distribution Segment Bar */}
        <div className="flex items-center gap-2 min-w-[140px] sm:min-w-[180px]">
          <span className="text-[9px] uppercase tracking-wider text-white/40 hidden sm:inline">
            Density:
          </span>
          <div className="flex-1 flex h-2 rounded overflow-hidden bg-white/5 border border-white/10" title={`Elite: ${tierDistribution.elite}, Strong: ${tierDistribution.strong}, Watch: ${tierDistribution.watch}, Sleepers: ${tierDistribution.sleepers}`}>
            <div style={{ width: `${tierDistribution.elitePct}%` }} className="bg-[var(--aurora-max-emerald)]" />
            <div style={{ width: `${tierDistribution.strongPct}%` }} className="bg-emerald-400" />
            <div style={{ width: `${tierDistribution.watchPct}%` }} className="bg-[#a8d8b6]" />
            <div style={{ width: `${tierDistribution.sleepersPct}%` }} className="bg-amber-400" />
          </div>
          <span className="text-[9px] tabular-nums font-bold text-white/60">
            {tierDistribution.total}
          </span>
        </div>
      </div>
    </div>
  );
});
