import React, { useMemo, useState } from "react";
import {
  Grid,
  Crosshair,
  Plus,
} from "lucide-react";
import type { ChunkA } from "../../api/contracts";
import { PlayerHeadshot } from "../PlayerHeadshot";
import { openParlayAdd } from "../../../../lib/parlays/parlayAddContract";
import {
  AuroraMaxControl,
  AuroraMaxFallback,
  AuroraMaxPanel,
} from "../../../../components/aurora-max/AuroraMaxPrimitives";

interface Props {
  data: ChunkA[];
}

type AxisMetric = "hrScore" | "modelProb" | "impliedProb" | "barrelRate" | "parkFactor";

const AXIS_OPTIONS: { id: AxisMetric; label: string }[] = [
  { id: "hrScore", label: "Overall HR Score (0-100)" },
  { id: "modelProb", label: "Model Probability (%)" },
  { id: "impliedProb", label: "Implied Market Prob (%)" },
  { id: "barrelRate", label: "Barrel Rate (%)" },
  { id: "parkFactor", label: "Park Environment Factor" },
];

function getMetricValue(row: ChunkA, metric: AxisMetric): number {
  switch (metric) {
    case "hrScore":
      return row.score.hrIndex ?? 50;
    case "modelProb":
      return (row.score.modelProbability ?? 0.1) * 100;
    case "impliedProb":
      return (row.odds?.impliedProbability ?? 0.1) * 100;
    case "barrelRate":
      return row.statcastSummary?.barrelRate ?? 10;
    case "parkFactor":
      return row.statcastSummary?.parkFactor ?? 100;
    default:
      return 50;
  }
}

function normalizeMetric(value: number, metric: AxisMetric, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export function ChunkAProjectionMatrix({ data }: Props) {
  const [xAxisMetric, setXAxisMetric] = useState<AxisMetric>("impliedProb");
  const [yAxisMetric, setYAxisMetric] = useState<AxisMetric>("modelProb");
  const [selectedQuadrant, setSelectedQuadrant] = useState<"all" | "q1" | "q2" | "q3" | "q4">("all");
  const [hoveredRow, setHoveredRow] = useState<ChunkA | null>(null);

  const plotPoints = useMemo(() => {
    // Find min and max for current metrics to normalize them to 0-100 space
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    data.forEach(row => {
      const vx = getMetricValue(row, xAxisMetric);
      const vy = getMetricValue(row, yAxisMetric);
      if (vx < minX) minX = vx;
      if (vx > maxX) maxX = vx;
      if (vy < minY) minY = vy;
      if (vy > maxY) maxY = vy;
    });

    return data.map((row) => {
      const rawX = getMetricValue(row, xAxisMetric);
      const rawY = getMetricValue(row, yAxisMetric);
      
      const x = normalizeMetric(rawX, xAxisMetric, minX, maxX);
      const y = normalizeMetric(rawY, yAxisMetric, minY, maxY);

      let quadrant: "q1" | "q2" | "q3" | "q4";
      if (x >= 50 && y >= 50) quadrant = "q1"; // Top Right
      else if (x < 50 && y >= 50) quadrant = "q2"; // Top Left
      else if (x >= 50 && y < 50) quadrant = "q3"; // Bottom Right
      else quadrant = "q4"; // Bottom Left

      return { row, x, y, rawX, rawY, quadrant };
    });
  }, [data, xAxisMetric, yAxisMetric]);

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

  const handleAddToSlip = (row: ChunkA) => {
    openParlayAdd({
      player: {
        id: row.playerId,
        name: row.identity.name,
        team: row.identity.teamAbbreviation,
        position: "",
        propositions: [],
      },
      propHint: {
        id: `hr-matrix-${row.playerId}`,
        market: "Home Runs",
        odds: row.odds?.price ?? null,
        spec: `${row.identity.name} 1+ Home Run`,
        gamePk: row.gameState.gameId,
        playerId: row.playerId,
      },
      initialFamily: "home_runs",
      isPitcher: false,
      source: "hr_intelligence",
      dataStatus: row.lineupStatus === "confirmed_starter" ? "official" : "projected",
    });
  };

  if (data.length === 0) {
    return (
      <AuroraMaxFallback title="No projection matrix data" detail="Waiting for slate player inputs. Missing axis values remain explicitly unavailable and are not synthesized." />
    );
  }

  return (
    <section className="hr-projection-matrix aurora-max-ranked-workspace space-y-4" data-workspace="matrix">
      <AuroraMaxPanel className="flex flex-col gap-4 p-4 sm:p-6">
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
              Projection Matrix
            </h1>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              Plot all slate hitters across two orthogonal dimensions to isolate high-value home run targets in Quadrant 1.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="aurora-max-panel flex items-center gap-2 p-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-vouch-cyan pl-2">Y-Axis:</span>
              <select
                value={yAxisMetric}
                onChange={(e) => setYAxisMetric(e.target.value as AxisMetric)}
                className="aurora-max-control px-3 py-1.5 font-mono text-xs font-bold normal-case tracking-normal"
              >
                {AXIS_OPTIONS.map((opt) => (
                  <option key={`y-${opt.id}`} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="aurora-max-panel flex items-center gap-2 p-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 pl-2">X-Axis:</span>
              <select
                value={xAxisMetric}
                onChange={(e) => setXAxisMetric(e.target.value as AxisMetric)}
                className="aurora-max-control px-3 py-1.5 font-mono text-xs font-bold normal-case tracking-normal"
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <AuroraMaxControl
            type="button"
            tone={selectedQuadrant === "all" ? "primary" : "neutral"}
            aria-pressed={selectedQuadrant === "all"}
            onClick={() => setSelectedQuadrant("all")}
            className="col-span-2 px-3 py-2 text-xs sm:col-span-1"
          >
            All Hitters ({plotPoints.length})
          </AuroraMaxControl>

          <AuroraMaxControl
            type="button"
            aria-pressed={selectedQuadrant === "q1"}
            onClick={() => setSelectedQuadrant("q1")}
            className={
              selectedQuadrant === "q1"
                ? "border-emerald-400/70 px-3 py-2 text-xs text-emerald-300"
                : "border-emerald-500/25 px-3 py-2 text-xs text-emerald-400/70 hover:text-emerald-300"
            }
          >
            🔥 Q1: Elite ({quadrantCounts.q1})
          </AuroraMaxControl>

          <AuroraMaxControl
            type="button"
            tone={selectedQuadrant === "q2" ? "primary" : "neutral"}
            aria-pressed={selectedQuadrant === "q2"}
            onClick={() => setSelectedQuadrant("q2")}
            className="px-3 py-2 text-xs"
          >
            ⚡ Q2: High Y, Low X ({quadrantCounts.q2})
          </AuroraMaxControl>

          <AuroraMaxControl
            type="button"
            aria-pressed={selectedQuadrant === "q3"}
            onClick={() => setSelectedQuadrant("q3")}
            className={
              selectedQuadrant === "q3"
                ? "border-amber-400/70 px-3 py-2 text-xs text-amber-300"
                : "border-amber-500/25 px-3 py-2 text-xs text-amber-400/70 hover:text-amber-300"
            }
          >
            ⚠️ Q3: High X, Low Y ({quadrantCounts.q3})
          </AuroraMaxControl>

          <AuroraMaxControl
            type="button"
            aria-pressed={selectedQuadrant === "q4"}
            onClick={() => setSelectedQuadrant("q4")}
            className={
              selectedQuadrant === "q4"
                ? "border-white/40 px-3 py-2 text-xs text-white"
                : "px-3 py-2 text-xs text-white/50 hover:text-white"
            }
          >
            ❄️ Q4: Low ({quadrantCounts.q4})
          </AuroraMaxControl>
        </div>
      </AuroraMaxPanel>

      <AuroraMaxPanel className="relative overflow-hidden p-3 sm:p-6">
        <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full min-h-[320px] sm:min-h-[420px] rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-950 to-black p-3 sm:p-4 select-none">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-30">
            <div className="border-b border-r border-vouch-cyan/30 bg-vouch-cyan/10 p-3">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-vouch-cyan">
                Q2: High Y / Low X
              </span>
            </div>
            <div className="border-b border-emerald-400/30 bg-emerald-400/10 p-3 text-right">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
                Q1: ELITE TARGETS 🔥
              </span>
            </div>
            <div className="border-r border-white/10 bg-white/[0.02] p-3 flex items-end">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-white/30">
                Q4: Low Value / Avoid
              </span>
            </div>
            <div className="bg-amber-400/5 p-3 flex items-end justify-end">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                Q3: High X / Low Y ⚠️
              </span>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-white/20" />
            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/20" />
          </div>

          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan">
            ▲ {AXIS_OPTIONS.find((a) => a.id === yAxisMetric)?.label}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {AXIS_OPTIONS.find((a) => a.id === xAxisMetric)?.label} ►
          </div>

          <div className="absolute inset-8">
            {plotPoints.map(({ row, x, y, rawX, rawY, quadrant }, idx) => {
              const isSelected = selectedQuadrant === "all" || selectedQuadrant === quadrant;
              if (!isSelected) return null;

              const isQ1 = quadrant === "q1";
              const isHovered = hoveredRow?.playerId === row.playerId;

              return (
                <div
                  key={`node-${row.playerId}`}
                  onMouseEnter={() => setHoveredRow(row)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handleAddToSlip(row)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                    isHovered ? "z-40 scale-125" : "z-20 hover:scale-110"
                  }`}
                  style={{
                    left: `${Math.min(100, Math.max(0, x))}%`,
                    bottom: `${Math.min(100, Math.max(0, y))}%`,
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
                      {row.identity.name.slice(0, 2).toUpperCase()}
                    </span>

                    {isHovered && (
                      <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-48 rounded-2xl border border-vouch-cyan/50 bg-black/95 p-3 shadow-2xl backdrop-blur-xl pointer-events-none">
                        <div className="flex items-center gap-2">
                          <PlayerHeadshot name={row.identity.name} mlbId={row.identity.mlbId} size={28} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h5 className="truncate text-xs font-bold text-white">{row.identity.name}</h5>
                            </div>
                            <p className="text-[10px] text-white/50">{row.identity.teamAbbreviation} vs {row.opponentTeamId}</p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[9px]">
                          <div className="rounded bg-white/5 p-1 text-center">
                            <span className="text-white/40">Y-Val:</span> <strong className="text-vouch-cyan">{rawY.toFixed(1)}</strong>
                          </div>
                          <div className="rounded bg-white/5 p-1 text-center">
                            <span className="text-white/40">X-Val:</span> <strong className="text-emerald-400">{rawX.toFixed(1)}</strong>
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
      </AuroraMaxPanel>

      <div className="space-y-4">
        <h3 className="font-mono text-sm font-extrabold uppercase tracking-wider text-white">
          Quadrant Hitters Breakdown ({filteredPoints.length})
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPoints.map(({ row, rawX, rawY, quadrant }, idx) => (
            <AuroraMaxPanel
              key={`card-${row.playerId}`}
              className="flex flex-col justify-between p-4 transition duration-200 hover:border-vouch-cyan/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlayerHeadshot name={row.identity.name} mlbId={row.identity.mlbId} size={36} />
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-vouch-cyan">
                      {row.identity.teamAbbreviation} vs {row.opponentTeamId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-white">{row.identity.name}</h4>
                    </div>
                    <p className="text-[10px] text-white/50">vs {row.opposingPitcherName || "Pitcher TBD"}</p>
                  </div>
                </div>

                {row.odds?.price ? (
                  <span className="rounded-lg border border-vouch-cyan/30 bg-vouch-cyan/10 px-2 py-0.5 font-mono text-xs font-bold text-vouch-cyan">
                    {row.odds.price > 0 ? '+' : ''}{row.odds.price}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                  <span className="text-[9px] uppercase text-white/40">HR Score</span>
                  <div className="font-bold text-white">{row.score.hrIndex}</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                  <span className="text-[9px] uppercase text-vouch-cyan">Y-Metric</span>
                  <div className="font-bold text-vouch-cyan">{rawY.toFixed(1)}</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                  <span className="text-[9px] uppercase text-emerald-400">X-Metric</span>
                  <div className="font-bold text-emerald-400">{rawX.toFixed(1)}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                  Quad: <strong className="text-white">{quadrant.toUpperCase()}</strong>
                </span>
                <AuroraMaxControl
                  tone="primary"
                  onClick={() => handleAddToSlip(row)}
                  className="gap-1 px-3 py-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Leg
                </AuroraMaxControl>
              </div>
            </AuroraMaxPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
