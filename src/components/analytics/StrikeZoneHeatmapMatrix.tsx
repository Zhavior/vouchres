import { useState, useMemo } from "react";
import { Flame, Target } from "lucide-react";

export interface StrikeZoneHeatmapProps {
  hitterName: string;
  pitcherName: string;
  pitcherThrows?: "R" | "L" | string;
  hitterHand?: "R" | "L" | string;
  /** Hitter ISO/Slugging by 9 strike zone quadrants (1-9) */
  hitterZonePower?: Record<number, number>;
  /** Pitcher HR/SLG vulnerability by 9 strike zone quadrants (1-9) */
  pitcherZoneVulnerability?: Record<number, number>;
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

export default function StrikeZoneHeatmapMatrix({
  hitterName,
  pitcherName,
  pitcherThrows = "R",
  hitterHand = "R",
  hitterZonePower = DEFAULT_HITTER_ZONE_POWER,
  pitcherZoneVulnerability = DEFAULT_PITCHER_ZONE_VULNERABILITY,
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

  return (
    <div className={`rounded-xl border border-white/10 bg-[#080e0e]/90 p-3.5 backdrop-blur-xl shadow-xl space-y-3 font-mono ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Target className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white truncate">
              Strike Zone Collision
            </h4>
            <span className="text-[9px] text-white/40 block truncate">
              {hitterName} ({hitterHand}HB) vs {pitcherName} ({pitcherThrows}HP)
            </span>
          </div>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-0.5 rounded-lg bg-black/60 p-0.5 border border-white/10 shrink-0">
          {[
            { id: "collision", label: "Collision" },
            { id: "hitter", label: "Hitter" },
            { id: "pitcher", label: "Pitcher" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id as HeatmapMode)}
              className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all ${
                mode === m.id
                  ? "bg-[var(--aurora-max-emerald)] text-black shadow-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Centered 3x3 Strike Zone */}
      <div className="flex flex-col items-center justify-center pt-1">
        <div className="relative">
          <div className="grid grid-cols-3 gap-1.5 w-44 h-44 p-2 rounded-xl bg-[#040808] border border-white/20 shadow-inner">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((zone) => {
              const hPower = hitterZonePower[zone] ?? 0.450;
              const pVuln = pitcherZoneVulnerability[zone] ?? 0.450;
              const isCollision = hPower >= 0.580 && pVuln >= 0.580;

              const valToDisplay = mode === "hitter" ? hPower : mode === "pitcher" ? pVuln : (hPower + pVuln) / 2;
              let bgStyle = "bg-white/[0.03]";
              let textColor = "text-white/40";
              let borderStyle = "border-white/5";

              if (mode === "collision") {
                if (isCollision) {
                  bgStyle = "bg-gradient-to-br from-rose-500/35 via-rose-500/20 to-amber-500/20";
                  textColor = "text-rose-300 font-bold";
                  borderStyle = "border-rose-400/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]";
                } else if (valToDisplay >= 0.520) {
                  bgStyle = "bg-amber-500/15";
                  textColor = "text-amber-300 font-semibold";
                  borderStyle = "border-amber-400/25";
                }
              } else if (mode === "hitter") {
                if (hPower >= 0.600) {
                  bgStyle = "bg-[var(--aurora-max-emerald)]/25";
                  textColor = "text-[var(--aurora-max-emerald)] font-bold";
                  borderStyle = "border-[var(--aurora-max-emerald)]/40";
                } else if (hPower >= 0.500) {
                  bgStyle = "bg-[var(--aurora-max-emerald)]/10";
                  textColor = "text-[var(--aurora-max-emerald)]/80";
                }
              } else {
                if (pVuln >= 0.600) {
                  bgStyle = "bg-rose-500/25";
                  textColor = "text-rose-300 font-bold";
                  borderStyle = "border-rose-400/40";
                } else if (pVuln >= 0.500) {
                  bgStyle = "bg-rose-500/10";
                  textColor = "text-rose-400/80";
                }
              }

              return (
                <div
                  key={zone}
                  className={`flex flex-col items-center justify-center rounded-lg border p-1 transition-all ${bgStyle} ${borderStyle}`}
                >
                  <span className="text-[7.5px] text-white/30 leading-none">Z{zone}</span>
                  <span className={`text-[10.5px] tabular-nums leading-tight ${textColor}`}>
                    {valToDisplay.toFixed(3).replace(/^0/, "")}
                  </span>
                  {mode === "collision" && isCollision && (
                    <Flame className="w-2.5 h-2.5 text-rose-400 mt-0.5 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Home Plate Pentagram shape indicator at bottom */}
          <div className="w-8 h-2.5 mx-auto mt-1.5 bg-white/20 rounded-b-sm border border-white/10 opacity-60" title="Home Plate" />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between w-full mt-2.5 px-2 text-[9px] text-white/40 border-t border-white/5 pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" /> Target Hotspot ({collisionAnalysis.hotspots.length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--aurora-max-emerald)] shadow-[0_0_6px_rgba(0,217,160,0.6)]" /> Power Zone
          </span>
        </div>
      </div>
    </div>
  );
}
