import React, { useMemo } from "react";

import type { HrWatchRow } from "../../../types/hrWatch";

interface Props {
  rows: HrWatchRow[];
}

interface MetricDefinition {
  key:
    | "hrScore"
    | "hitterPower"
    | "pitcherVulnerability"
    | "parkFactor"
    | "recentForm"
    | "dataConfidence";
  label: string;
  shortLabel: string;
}

const METRICS: MetricDefinition[] = [
  {
    key: "hrScore",
    label: "HR Score",
    shortLabel: "HR",
  },
  {
    key: "hitterPower",
    label: "Hitter Power",
    shortLabel: "Power",
  },
  {
    key: "pitcherVulnerability",
    label: "Pitcher Vulnerability",
    shortLabel: "Pitcher",
  },
  {
    key: "parkFactor",
    label: "Park Factor",
    shortLabel: "Park",
  },
  {
    key: "recentForm",
    label: "Recent Form",
    shortLabel: "Form",
  },
  {
    key: "dataConfidence",
    label: "Data Confidence",
    shortLabel: "Trust",
  },
];

function clampScore(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getMetricValue(
  row: HrWatchRow,
  key: MetricDefinition["key"],
): number | null {
  return clampScore(row[key]);
}

function getCellTone(value: number | null): string {
  if (value === null) {
    return "border-white/[0.06] bg-white/[0.025] text-white/35";
  }

  if (value >= 85) {
    return "border-emerald-300/25 bg-emerald-400/[0.12] text-emerald-100";
  }

  if (value >= 72) {
    return "border-cyan-300/20 bg-cyan-400/[0.10] text-cyan-100";
  }

  if (value >= 58) {
    return "border-amber-300/20 bg-amber-400/[0.09] text-amber-100";
  }

  return "border-rose-300/15 bg-rose-400/[0.08] text-rose-100";
}

function getTierTone(tier: HrWatchRow["riskTier"]): string {
  switch (tier) {
    case "Elite":
      return "border-emerald-300/25 bg-emerald-400/[0.12] text-emerald-100";
    case "Core":
      return "border-cyan-300/25 bg-cyan-400/[0.10] text-cyan-100";
    case "Watch":
      return "border-amber-300/25 bg-amber-400/[0.10] text-amber-100";
    case "Deep":
      return "border-violet-300/20 bg-violet-400/[0.08] text-violet-100";
    case "Blocked":
      return "border-rose-300/20 bg-rose-400/[0.08] text-rose-100";
  }
}

function getTruthLabel(status: HrWatchRow["truthStatus"]): string {
  switch (status) {
    case "official":
      return "Official";
    case "projected":
      return "Projected";
    case "blocked":
      return "Blocked";
    case "unknown":
      return "Unknown";
  }
}

function formatProbability(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

function PlayerIdentity({ row }: { row: HrWatchRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        {row.headshotUrl ? (
          <img
            src={row.headshotUrl}
            alt=""
            className="h-full w-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-black text-white/45">
            {row.playerName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-white">
            {row.playerName}
          </span>

          {row.rank !== null ? (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              #{row.rank}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-white/45">
          <span className="truncate">{row.team || "Team pending"}</span>
          <span aria-hidden="true">•</span>
          <span className="truncate">
            {row.opponent ? `vs ${row.opponent}` : "Opponent pending"}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  return (
    <div
      className={`flex h-14 min-w-[76px] items-center justify-center rounded-xl border px-3 text-center ${getCellTone(
        value,
      )}`}
      title={label}
    >
      <span className="text-lg font-black tabular-nums">
        {value === null ? "—" : value}
      </span>
    </div>
  );
}

export default function ProjectionMatrixView({ rows }: Props) {
  const rankedRows = useMemo(
    () =>
      [...rows]
        .filter((row) => row.truthStatus !== "blocked")
        .sort((a, b) => {
          const scoreDifference = b.hrScore - a.hrScore;

          if (scoreDifference !== 0) {
            return scoreDifference;
          }

          return (b.dataConfidence ?? -1) - (a.dataConfidence ?? -1);
        }),
    [rows],
  );

  const summary = useMemo(() => {
    const elite = rankedRows.filter((row) => row.riskTier === "Elite").length;
    const core = rankedRows.filter((row) => row.riskTier === "Core").length;
    const official = rankedRows.filter(
      (row) => row.truthStatus === "official",
    ).length;

    const averageScore =
      rankedRows.length > 0
        ? Math.round(
            rankedRows.reduce((total, row) => total + row.hrScore, 0) /
              rankedRows.length,
          )
        : null;

    return {
      elite,
      core,
      official,
      averageScore,
    };
  }, [rankedRows]);

  if (rankedRows.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#080b10] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg text-white/45">
          ×
        </div>

        <h2 className="mt-5 text-xl font-black tracking-tight text-white">
          No projection matrix available
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
          Verified player projections will appear here when the current slate
          provides eligible HR candidates.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-3xl border border-white/10 bg-[#080b10] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="relative px-5 py-6 sm:px-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_38%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_32%)]" />

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/65">
                  Slate intelligence
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
                  Projection Matrix
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  Compare every active HR target across power, matchup,
                  environment, form, and source confidence.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Elite
                  </div>
                  <div className="mt-1 text-xl font-black text-emerald-200">
                    {summary.elite}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Core
                  </div>
                  <div className="mt-1 text-xl font-black text-cyan-200">
                    {summary.core}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Official
                  </div>
                  <div className="mt-1 text-xl font-black text-white">
                    {summary.official}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Avg HR
                  </div>
                  <div className="mt-1 text-xl font-black text-amber-100">
                    {summary.averageScore ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#080b10] shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[minmax(270px,1.35fr)_repeat(6,minmax(76px,0.48fr))_minmax(170px,0.72fr)] gap-3 border-b border-white/[0.07] bg-white/[0.025] px-5 py-3">
              <div className="self-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Player
              </div>

              {METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="self-center text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35"
                  title={metric.label}
                >
                  {metric.shortLabel}
                </div>
              ))}

              <div className="self-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Projection
              </div>
            </div>

            <div className="divide-y divide-white/[0.055]">
              {rankedRows.map((row) => (
                <article
                  key={row.stableId}
                  className="grid grid-cols-[minmax(270px,1.35fr)_repeat(6,minmax(76px,0.48fr))_minmax(170px,0.72fr)] gap-3 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.025]"
                >
                  <PlayerIdentity row={row} />

                  {METRICS.map((metric) => (
                    <MetricCell
                      key={metric.key}
                      value={getMetricValue(row, metric.key)}
                      label={metric.label}
                    />
                  ))}

                  <div className="flex min-w-0 flex-col justify-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getTierTone(
                          row.riskTier,
                        )}`}
                      >
                        {row.riskTier}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
                        {getTruthLabel(row.truthStatus)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-white/45">
                        {row.oddsLabel || "Odds unavailable"}
                      </span>

                      <span className="shrink-0 font-bold tabular-nums text-white/80">
                        {formatProbability(row.hrProbability)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-white/[0.07] bg-white/[0.02] px-5 py-4 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Scores use the current normalized HR board payload. Missing inputs
            remain unscored.
          </span>

          <span className="font-semibold text-white/50">
            {rankedRows.length} active target
            {rankedRows.length === 1 ? "" : "s"}
          </span>
        </footer>
      </div>
    </section>
  );
}
