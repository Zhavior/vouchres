import React, { useMemo, useState } from "react";
import {
  Grid,
  Crosshair,
  Plus,
} from "lucide-react";
import type { HrWatchRow } from "../../../types/hrWatch";
import type { HrCardResult } from "../../Cards/HrPlayerCard";
import PlayerHeadshot from "../../../../../components/parlays/PlayerHeadshot";
import { openParlayAdd } from "../../../../../lib/parlays/parlayAddContract";
import { toHrParlayPickerPlayer } from "../../../utils/hrDecisionBrief";
import { PlayerHrTag } from "../../HrHitBadge";
import { oddsDisplay } from "../../../engine/signalScore";
import { AuroraMaxFallback } from "../../../../../components/aurora-max/AuroraMaxPrimitives";

interface Props {
  rows: HrWatchRow[];
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

type AxisMetric = "hitterPower" | "pitcherVulnerability" | "hrScore" | "recentForm" | "parkFactor" | "vouchScore";

const AXIS_OPTIONS: { id: AxisMetric; label: string }[] = [
  { id: "hitterPower", label: "Hitter Power (0-100)" },
  { id: "pitcherVulnerability", label: "Pitcher Vulnerability (0-100)" },
  { id: "hrScore", label: "Overall HR Score" },
  { id: "recentForm", label: "Recent Form Signal" },
  { id: "parkFactor", label: "Park Environment Factor" },
  { id: "vouchScore", label: "Community Vouch Score" },
];

function getMetricValue(row: HrWatchRow, metric: AxisMetric): number {
  switch (metric) {
    case "hitterPower":
      return row.hitterPower ?? row.hrScore ?? 50;
    case "pitcherVulnerability":
      return row.pitcherVulnerability ?? 50;
    case "hrScore":
      return row.hrScore ?? 50;
    case "recentForm":
      return row.recentForm ?? 50;
    case "parkFactor":
      return row.parkFactor ?? 50;
    case "vouchScore":
      return row.vouchScore ?? 50;
    default:
      return 50;
  }
}

export default function ProjectionMatrixView({ rows, getHrResult }: Props) {
  const [xAxisMetric, setXAxisMetric] = useState<AxisMetric>("pitcherVulnerability");
  const [yAxisMetric, setYAxisMetric] = useState<AxisMetric>("hitterPower");
  const [selectedQuadrant, setSelectedQuadrant] = useState<"all" | "q1" | "q2" | "q3" | "q4">("all");
  const [hoveredRow, setHoveredRow] = useState<HrWatchRow | null>(null);

  // Map rows to X, Y coordinates (0 - 100)
  const plotPoints = useMemo(() => {
    return rows.map((row) => {
      const x = Math.min(100, Math.max(0, getMetricValue(row, xAxisMetric)));
      const y = Math.min(100, Math.max(0, getMetricValue(row, yAxisMetric)));

      // Determine quadrant (threshold = 50)
      let quadrant: "q1" | "q2" | "q3" | "q4";
      if (x >= 50 && y >= 50) quadrant = "q1"; // Top Right: Elite Target
      else if (x < 50 && y >= 50) quadrant = "q2"; // Top Left: Sneaky Power
      else if (x >= 50 && y < 50) quadrant = "q3"; // Bottom Right: Pitcher Trap
      else quadrant = "q4"; // Bottom Left: Avoid

      return { row, x, y, quadrant };
    });
  }, [rows, xAxisMetric, yAxisMetric]);

  // Quadrant stats count
  const quadrantCounts = useMemo(() => {
    return {
      q1: plotPoints.filter((p) => p.quadrant === "q1").length,
      q2: plotPoints.filter((p) => p.quadrant === "q2").length,
      q3: plotPoints.filter((p) => p.quadrant === "q3").length,
      q4: plotPoints.filter((p) => p.quadrant === "q4").length,
    };
  }, [plotPoints]);

  const filteredPoints = useMemo(() => {
    if (selectedQuadrant === "all") return plotPoints;
    return plotPoints.filter((p) => p.quadrant === selectedQuadrant);
  }, [plotPoints, selectedQuadrant]);

  const handleAddToSlip = (row: HrWatchRow) => {
    openParlayAdd({
      player: toHrParlayPickerPlayer(row),
      propHint: {
        id: `hr-matrix-${row.stableId}`,
        market: "Home Runs",
        odds: row.bookOdds ?? null,
        spec: `${row.playerName} 1+ Home Run`,
        gamePk: row.gamePk ?? undefined,
        playerId: row.playerId ?? undefined,
      },
      initialFamily: "home_runs",
      isPitcher: false,
      source: "hr_intelligence",
      dataStatus: row.truthStatus === "official" ? "official" : "projected",
      reasoningSnapshot: row.reasons[0] ?? null,
      riskSnapshot: row.warnings[0] ?? null,
    });
  };

  if (rows.length === 0) {
    return (
      <AuroraMaxFallback title="No projection matrix data" detail="Waiting for slate player inputs. Missing axis values remain explicitly unavailable and are not synthesized." />
    );
  }

  return (
    <section className="hr-projection-matrix aurora-max-ranked-workspace space-y-4" data-workspace="matrix">
      {/* ── Matrix Controls Header ───────────────────────────────── */}
      <div className="aurora-max-panel flex flex-col gap-4 border p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="aurora-max-eyebrow inline-flex items-center gap-1.5 border px-3 py-1">
                <Crosshair className="h-3.5 w-3.5" />
                2D Projection Matrix
              </span>
              <span className="font-mono text-xs text-white/40">• Multi-Variable Matchup Mapping</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Hitter Power vs Matchup Vulnerability Matrix
            </h1>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              Plot all slate hitters across two orthogonal dimensions to isolate high-value home run targets in Quadrant 1.
            </p>
          </div>

          {/* Metric Selector Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-2 backdrop-blur-md">
              <span className="font-mono text-[10px] uppercase tracking-wider text-vouch-cyan pl-2">Y-Axis:</span>
              <select
                value={yAxisMetric}
                onChange={(e) => setYAxisMetric(e.target.value as AxisMetric)}
                className="rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 font-mono text-xs font-bold text-white outline-none focus:border-vouch-cyan"
              >
                {AXIS_OPTIONS.map((opt) => (
                  <option key={`y-${opt.id}`} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-2 backdrop-blur-md">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 pl-2">X-Axis:</span>
              <select
                value={xAxisMetric}
                onChange={(e) => setXAxisMetric(e.target.value as AxisMetric)}
                className="rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 font-mono text-xs font-bold text-white outline-none focus:border-vouch-cyan"
              >
                {AXIS_OPTIONS.map((opt) => (
                  <option key={`x-${opt.id}`} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quadrant Quick Filter Tabs */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => setSelectedQuadrant("all")}
            className={`col-span-2 sm:col-span-1 rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-all ${
              selectedQuadrant === "all"
                ? "border-vouch-cyan bg-vouch-cyan/20 text-vouch-cyan"
                : "border-white/10 bg-black/30 text-white/60 hover:text-white"
            }`}
          >
            All Hitters ({plotPoints.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("q1")}
            className={`rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-all ${
              selectedQuadrant === "q1"
                ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400/70 hover:text-emerald-300"
            }`}
          >
            🔥 Q1: Elite ({quadrantCounts.q1})
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("q2")}
            className={`rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-all ${
              selectedQuadrant === "q2"
                ? "border-vouch-cyan bg-vouch-cyan/20 text-vouch-cyan"
                : "border-vouch-cyan/20 bg-vouch-cyan/5 text-vouch-cyan/70 hover:text-vouch-cyan"
            }`}
          >
            ⚡ Q2: Sneaky ({quadrantCounts.q2})
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("q3")}
            className={`rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-all ${
              selectedQuadrant === "q3"
                ? "border-amber-400 bg-amber-400/20 text-amber-300"
                : "border-amber-500/20 bg-amber-500/5 text-amber-400/70 hover:text-amber-300"
            }`}
          >
            ⚠️ Q3: Traps ({quadrantCounts.q3})
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("q4")}
            className={`rounded-xl border px-3 py-2 font-mono text-xs font-bold transition-all ${
              selectedQuadrant === "q4"
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/10 bg-black/30 text-white/40 hover:text-white"
            }`}
          >
            ❄️ Q4: Low ({quadrantCounts.q4})
          </button>
        </div>
      </div>

      {/* ── 2D Interactive Matrix Canvas ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-3 sm:p-6 backdrop-blur-xl">
        <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full min-h-[320px] sm:min-h-[420px] rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-950 to-black p-3 sm:p-4 select-none">
          {/* Quadrant Backdrops */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-30">
            {/* Top Left: Q2 */}
            <div className="border-b border-r border-vouch-cyan/30 bg-vouch-cyan/10 p-3">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-vouch-cyan">
                Q2: Sneaky Power / Tough Matchup
              </span>
            </div>
            {/* Top Right: Q1 */}
            <div className="border-b border-emerald-400/30 bg-emerald-400/10 p-3 text-right">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
                Q1: ELITE TARGETS (HIGH EV) 🔥
              </span>
            </div>
            {/* Bottom Left: Q4 */}
            <div className="border-r border-white/10 bg-white/[0.02] p-3 flex items-end">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-white/30">
                Q4: Low Value / Avoid
              </span>
            </div>
            {/* Bottom Right: Q3 */}
            <div className="bg-amber-400/5 p-3 flex items-end justify-end">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                Q3: Matchup Traps / Low Power ⚠️
              </span>
            </div>
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-white/20" />
            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/20" />
          </div>

          {/* Y Axis Label */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan">
            ▲ {AXIS_OPTIONS.find((a) => a.id === yAxisMetric)?.label}
          </div>

          {/* X Axis Label */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {AXIS_OPTIONS.find((a) => a.id === xAxisMetric)?.label} ►
          </div>

          {/* Plot Nodes */}
          <div className="absolute inset-8">
            {plotPoints.map(({ row, x, y, quadrant }, idx) => {
              const isSelected = selectedQuadrant === "all" || selectedQuadrant === quadrant;
              if (!isSelected) return null;

              const isQ1 = quadrant === "q1";
              const isHovered = hoveredRow?.stableId === row.stableId;

              return (
                <div
                  key={`node-${row.stableId}-${idx}`}
                  onMouseEnter={() => setHoveredRow(row)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handleAddToSlip(row)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                    isHovered ? "z-40 scale-125" : "z-20 hover:scale-110"
                  }`}
                  style={{
                    left: `${Math.min(95, Math.max(5, x))}%`,
                    bottom: `${Math.min(95, Math.max(5, y))}%`,
                  }}
                >
                  <div
                    className={`group relative flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg transition-all ${
                      isQ1
                        ? "border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                        : quadrant === "q2"
                        ? "border-vouch-cyan bg-cyan-950 text-vouch-cyan shadow-[0_0_12px_rgba(79,184,220,0.4)]"
                        : quadrant === "q3"
                        ? "border-amber-400 bg-amber-950 text-amber-300"
                        : "border-white/30 bg-zinc-900 text-white/70"
                    }`}
                  >
                    <span className="font-mono text-[10px] font-black">
                      {row.playerName.slice(0, 2).toUpperCase()}
                    </span>

                    {/* Popover Hover Card */}
                    {isHovered && (
                      <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-48 rounded-2xl border border-vouch-cyan/50 bg-black/95 p-3 shadow-2xl backdrop-blur-xl pointer-events-none">
                        <div className="flex items-center gap-2">
                          <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={28} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h5 className="truncate text-xs font-bold text-white">{row.playerName}</h5>
                              <PlayerHrTag
                                player={row}
                                hrResult={getHrResult?.(row.playerId) ?? null}
                                compact
                              />
                            </div>
                            <p className="text-[10px] text-white/50">{row.team} vs {row.opponent}</p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[9px]">
                          <div className="rounded bg-white/5 p-1 text-center">
                            <span className="text-white/40">Y-Val:</span> <strong className="text-vouch-cyan">{y}</strong>
                          </div>
                          <div className="rounded bg-white/5 p-1 text-center">
                            <span className="text-white/40">X-Val:</span> <strong className="text-emerald-400">{x}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Candidates List for Selected Quadrant ─────────────────── */}
      <div className="space-y-4">
        <h3 className="font-mono text-sm font-extrabold uppercase tracking-wider text-white">
          Quadrant Hitters Breakdown ({filteredPoints.length})
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPoints.map(({ row, x, y, quadrant }, idx) => (
            <div
              key={`card-${row.stableId}-${idx}`}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-4 transition duration-200 hover:border-vouch-cyan/40 hover:bg-black/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={36} />
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-vouch-cyan">
                      {row.team} vs {row.opponent}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-white">{row.playerName}</h4>
                      <PlayerHrTag
                        player={row}
                        hrResult={getHrResult?.(row.playerId) ?? null}
                        compact
                      />
                    </div>
                    <p className="text-[10px] text-white/50">vs {row.pitcherName || "Pitcher TBD"}</p>
                  </div>
                </div>

                {oddsDisplay(row) ? (
                  <span className="rounded-lg border border-vouch-cyan/30 bg-vouch-cyan/10 px-2 py-0.5 font-mono text-xs font-bold text-vouch-cyan">
                    {oddsDisplay(row)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                  <span className="text-[9px] uppercase text-white/40">HR Score</span>
                  <div className="font-bold text-white">{row.hrScore}</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                  <span className="text-[9px] uppercase text-vouch-cyan">Y-Metric</span>
                  <div className="font-bold text-vouch-cyan">{y}</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                  <span className="text-[9px] uppercase text-emerald-400">X-Metric</span>
                  <div className="font-bold text-emerald-400">{x}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                  Quad: <strong className="text-white">{quadrant.toUpperCase()}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleAddToSlip(row)}
                  className="flex items-center gap-1 rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 px-3 py-1 font-mono text-xs font-bold text-vouch-cyan transition hover:bg-vouch-cyan hover:text-black"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Leg
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
