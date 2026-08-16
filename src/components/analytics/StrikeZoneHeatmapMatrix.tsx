import { useState, useMemo } from "react";
import { Flame, ShieldAlert, Target, Sparkles, Zap, ChevronRight } from "lucide-react";

export interface StrikeZoneHeatmapProps {
  hitterName: string;
  pitcherName: string;
  pitcherThrows?: "R" | "L" | string;
  hitterHand?: "R" | "L" | string;
  /** Hitter ISO/Slugging by 9 strike zone quadrants (1-9) */
  hitterZonePower?: Record<number, number>;
  /** Pitcher HR/SLG vulnerability by 9 strike zone quadrants (1-9) */
  pitcherZoneVulnerability?: Record<number, number>;
  /** Pitch distribution % (e.g. { fastball: 54, slider: 32, curveball: 14 }) */
  pitchArsenal?: Record<string, { usagePct: number; hitterSlg: number }>;
  className?: string;
}

type HeatmapMode = "collision" | "hitter" | "pitcher";

const DEFAULT_HITTER_ZONE_POWER: Record<number, number> = {
  1: 0.420, 2: 0.580, 3: 0.490,
  4: 0.510, 5: 0.720, 6: 0.610, // Center Heart = High SLG
  7: 0.380, 8: 0.650, 9: 0.410,
};

const DEFAULT_PITCHER_ZONE_VULNERABILITY: Record<number, number> = {
  1: 0.350, 2: 0.610, 3: 0.440,
  4: 0.480, 5: 0.690, 6: 0.530, // Center Heart = High Vulnerability
  7: 0.310, 8: 0.620, 9: 0.390,
};

const DEFAULT_PITCH_ARSENAL: Record<string, { usagePct: number; hitterSlg: number }> = {
  "4-Seam Fastball": { usagePct: 52, hitterSlg: 0.640 },
  "Slider": { usagePct: 30, hitterSlg: 0.480 },
  "Changeup": { usagePct: 18, hitterSlg: 0.590 },
};

function getPitchBadge(pitchName: string) {
  const lower = pitchName.toLowerCase();
  if (lower.includes('4-seam') || lower.includes('fastball')) return { tag: '4FB', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
  if (lower.includes('sinker') || lower.includes('2-seam')) return { tag: 'SI', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
  if (lower.includes('slider') || lower.includes('sweeper')) return { tag: 'SL', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
  if (lower.includes('change') || lower.includes('split')) return { tag: 'CH', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  if (lower.includes('curve') || lower.includes('knuckle')) return { tag: 'CB', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  if (lower.includes('cutter')) return { tag: 'FC', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  return { tag: 'PITCH', color: 'bg-white/10 text-white/70 border-white/20' };
}

export default function StrikeZoneHeatmapMatrix({
  hitterName,
  pitcherName,
  pitcherThrows = "R",
  hitterHand = "R",
  hitterZonePower = DEFAULT_HITTER_ZONE_POWER,
  pitcherZoneVulnerability = DEFAULT_PITCHER_ZONE_VULNERABILITY,
  pitchArsenal = DEFAULT_PITCH_ARSENAL,
  className = "",
}: StrikeZoneHeatmapProps) {
  const [mode, setMode] = useState<HeatmapMode>("collision");

  // Calculate Collision Hotspots (where BOTH hitter power > .580 AND pitcher vulnerability > .580)
  const collisionAnalysis = useMemo(() => {
    const hotspots: number[] = [];
    for (let zone = 1; zone <= 9; zone++) {
      const hPower = hitterZonePower[zone] ?? 0.450;
      const pVuln = pitcherZoneVulnerability[zone] ?? 0.450;
      if (hPower >= 0.580 && pVuln >= 0.580) {
        hotspots.push(zone);
      }
    }
    return {
      hotspots,
      hasCollision: hotspots.length > 0,
    };
  }, [hitterZonePower, pitcherZoneVulnerability]);

  // Primary Pitch Synergy
  const primaryPitch = useMemo(() => {
    const entries = Object.entries(pitchArsenal);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1].usagePct - a[1].usagePct);
    const top = entries[0];
    const isHighSynergy = top[1].hitterSlg >= 0.550;
    return {
      name: top[0],
      usage: top[1].usagePct,
      slg: top[1].hitterSlg,
      isHighSynergy,
    };
  }, [pitchArsenal]);

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#080e0e]/95 p-4 backdrop-blur-xl shadow-2xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-black font-mono uppercase tracking-wider text-white">
                Strike Zone Collision Matrix
              </h4>
              {collisionAnalysis.hasCollision && (
                <span className="flex items-center gap-1 text-[9px] font-black font-mono px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
                  <Flame className="w-3 h-3 text-rose-400" /> {collisionAnalysis.hotspots.length} COLLISION HOTSPOT{collisionAnalysis.hotspots.length > 1 ? 'S' : ''}
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/50 font-mono mt-0.5">
              {hitterName} ({hitterHand}HB) vs {pitcherName} ({pitcherThrows}HP)
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex rounded-lg bg-black/60 p-1 border border-white/10 self-start sm:self-auto shrink-0">
          {[
            { id: "collision", label: "Collision" },
            { id: "hitter", label: "Hitter Power" },
            { id: "pitcher", label: "Pitcher Vulnerability" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id as HeatmapMode)}
              className={`px-2.5 py-1 text-[9.5px] font-bold font-mono uppercase rounded-md transition-all ${
                mode === m.id
                  ? "bg-[var(--aurora-max-emerald)] text-black font-black shadow-[0_0_10px_rgba(0,217,160,0.3)]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid + Arsenal Breakdown Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* 3x3 Strike Zone Grid */}
        <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/50 border border-white/10 shadow-inner">
          <span className="text-[9px] font-mono font-bold text-white/40 uppercase mb-2.5 tracking-wider">
            Catcher's Perspective Strike Zone
          </span>

          <div className="grid grid-cols-3 gap-1.5 w-48 h-48 p-2 rounded-xl bg-[#040808] border-2 border-white/20 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((zone) => {
              const hPower = hitterZonePower[zone] ?? 0.450;
              const pVuln = pitcherZoneVulnerability[zone] ?? 0.450;
              const isCollision = hPower >= 0.580 && pVuln >= 0.580;

              const valToDisplay = mode === "hitter" ? hPower : mode === "pitcher" ? pVuln : (hPower + pVuln) / 2;
              let bgStyle = "bg-white/[0.03]";
              let textColor = "text-white/50";
              let borderStyle = "border-white/5";

              if (mode === "collision") {
                if (isCollision) {
                  bgStyle = "bg-gradient-to-br from-rose-500/30 via-rose-500/20 to-amber-500/25";
                  textColor = "text-rose-300 font-black";
                  borderStyle = "border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.4)]";
                } else if (valToDisplay >= 0.520) {
                  bgStyle = "bg-amber-500/15";
                  textColor = "text-amber-300 font-bold";
                  borderStyle = "border-amber-400/30";
                }
              } else if (mode === "hitter") {
                if (hPower >= 0.600) {
                  bgStyle = "bg-[var(--aurora-max-emerald)]/30";
                  textColor = "text-[var(--aurora-max-emerald)] font-black";
                  borderStyle = "border-[var(--aurora-max-emerald)]/50 shadow-[0_0_10px_rgba(0,217,160,0.3)]";
                } else if (hPower >= 0.500) {
                  bgStyle = "bg-[var(--aurora-max-emerald)]/15";
                  textColor = "text-[var(--aurora-max-emerald)]/90";
                }
              } else {
                if (pVuln >= 0.600) {
                  bgStyle = "bg-rose-500/30";
                  textColor = "text-rose-300 font-black";
                  borderStyle = "border-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
                } else if (pVuln >= 0.500) {
                  bgStyle = "bg-rose-500/15";
                  textColor = "text-rose-400";
                }
              }

              return (
                <div
                  key={zone}
                  className={`flex flex-col items-center justify-center rounded-lg border p-1 transition-all ${bgStyle} ${borderStyle}`}
                >
                  <span className="text-[8px] font-mono text-white/30">Z{zone}</span>
                  <span className={`text-[11px] font-mono tabular-nums ${textColor}`}>
                    {valToDisplay.toFixed(3).replace(/^0/, "")}
                  </span>
                  {mode === "collision" && isCollision && (
                    <Flame className="w-3 h-3 text-rose-400 mt-0.5 animate-bounce" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 text-[9px] font-mono text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" /> Collision
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--aurora-max-emerald)] shadow-[0_0_6px_rgba(0,217,160,0.8)]" /> Power Zone
            </span>
          </div>
        </div>

        {/* Pitch-Type Arsenal Synergy Column */}
        <div className="space-y-3">
          {/* Primary Pitch Synergy Card */}
          {primaryPitch && (
            <div className={`p-3 rounded-xl border transition-all ${
              primaryPitch.isHighSynergy 
                ? "bg-gradient-to-r from-[rgba(0,217,160,0.15)] to-transparent border-[var(--aurora-max-emerald)]/40 shadow-[0_0_15px_rgba(0,217,160,0.1)]" 
                : "bg-black/40 border-white/10"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Primary Pitch Synergy</span>
                {primaryPitch.isHighSynergy && (
                  <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded-full bg-[var(--aurora-max-emerald)] text-black shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> HIGH MATCHUP FIT
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-xs font-black font-mono text-white flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${getPitchBadge(primaryPitch.name).color}`}>
                    {getPitchBadge(primaryPitch.name).tag}
                  </span>
                  {primaryPitch.name} <span className="text-[10px] font-normal text-white/40">({primaryPitch.usage}%)</span>
                </p>
                <p className="text-xs font-black font-mono text-[var(--aurora-max-emerald)]">
                  .{Math.round(primaryPitch.slg * 1000)} xSLG
                </p>
              </div>
            </div>
          )}

          {/* Pitch Arsenal Distribution List */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
              Pitch Type Arsenal vs Hitter Slugging
            </span>
            {Object.entries(pitchArsenal).map(([pitchName, data]) => {
              const isMatchupAdv = data.hitterSlg >= 0.550;
              const badge = getPitchBadge(pitchName);
              return (
                <div key={pitchName} className="p-2.5 rounded-xl border border-white/5 bg-black/40 hover:border-white/15 transition-all space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${badge.color}`}>
                        {badge.tag}
                      </span>
                      <span className="text-white font-bold">{pitchName}</span>
                      <span className="text-[10px] text-white/40">({data.usagePct}%)</span>
                    </div>
                    <span className={`font-mono font-black ${isMatchupAdv ? "text-[var(--aurora-max-emerald)]" : "text-white/60"}`}>
                      .{Math.round(data.hitterSlg * 1000)} xSLG
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden flex gap-0.5">
                    <div
                      className="h-full bg-vouch-cyan rounded-full"
                      style={{ width: `${data.usagePct}%` }}
                      title={`Pitcher Usage: ${data.usagePct}%`}
                    />
                    <div
                      className={`h-full rounded-full ${isMatchupAdv ? "bg-[var(--aurora-max-emerald)]" : "bg-white/30"}`}
                      style={{ width: `${Math.min((data.hitterSlg / 0.8) * 100, 100)}%` }}
                      title={`Hitter xSLG: ${data.hitterSlg}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
