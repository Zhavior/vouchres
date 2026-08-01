import React, { useMemo } from "react";

import type { HrWatchRow } from "../../../types/hrWatch";

interface Props {
  rows: HrWatchRow[];
}

type ExtremeMetric =
  | "hrScore"
  | "hitterPower"
  | "pitcherVulnerability"
  | "parkFactor"
  | "recentForm"
  | "vouchScore"
  | "dataConfidence";

interface ExtremeDefinition {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  metric: ExtremeMetric;
  direction: "highest" | "lowest";
  format: (value: number) => string;
}

interface ExtremeResult {
  definition: ExtremeDefinition;
  row: HrWatchRow;
  value: number;
}

const EXTREME_DEFINITIONS: ExtremeDefinition[] = [
  {
    id: "highest-hr-score",
    eyebrow: "Peak opportunity",
    title: "Highest HR score",
    description:
      "The strongest overall home-run profile currently available on the board.",
    metric: "hrScore",
    direction: "highest",
    format: formatScore,
  },
  {
    id: "strongest-power",
    eyebrow: "Power ceiling",
    title: "Strongest hitter power",
    description:
      "The hitter carrying the most favorable raw power signal in this slate.",
    metric: "hitterPower",
    direction: "highest",
    format: formatScore,
  },
  {
    id: "pitcher-exposure",
    eyebrow: "Pitcher pressure",
    title: "Most vulnerable pitcher",
    description:
      "The matchup with the highest pitcher-vulnerability reading among available rows.",
    metric: "pitcherVulnerability",
    direction: "highest",
    format: formatScore,
  },
  {
    id: "best-park",
    eyebrow: "Environment edge",
    title: "Best park factor",
    description:
      "The most favorable run environment represented in the current workspace.",
    metric: "parkFactor",
    direction: "highest",
    format: formatDecimal,
  },
  {
    id: "hottest-form",
    eyebrow: "Current form",
    title: "Hottest recent form",
    description:
      "The player arriving with the strongest recent-form signal on the board.",
    metric: "recentForm",
    direction: "highest",
    format: formatScore,
  },
  {
    id: "highest-confidence",
    eyebrow: "Data certainty",
    title: "Highest confidence",
    description:
      "The matchup backed by the strongest available data-confidence reading.",
    metric: "dataConfidence",
    direction: "highest",
    format: formatPercent,
  },
  {
    id: "lowest-confidence",
    eyebrow: "Volatility watch",
    title: "Lowest confidence",
    description:
      "The matchup requiring the most caution because its supporting data is least certain.",
    metric: "dataConfidence",
    direction: "lowest",
    format: formatPercent,
  },
  {
    id: "lowest-hr-score",
    eyebrow: "Fade pressure",
    title: "Lowest HR score",
    description:
      "The weakest overall home-run profile currently represented in this view.",
    metric: "hrScore",
    direction: "lowest",
    format: formatScore,
  },
];

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizePercent(value: number): number {
  if (Math.abs(value) <= 1) {
    return value * 100;
  }

  return value;
}

function formatScore(value: number): string {
  return Math.round(value).toString();
}

function formatPercent(value: number): string {
  return `${Math.round(normalizePercent(value))}%`;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function metricValue(
  row: HrWatchRow,
  metric: ExtremeMetric,
): number | null {
  const value = row[metric];

  return isFiniteNumber(value) ? value : null;
}

function findExtreme(
  rows: HrWatchRow[],
  definition: ExtremeDefinition,
): ExtremeResult | null {
  let selectedRow: HrWatchRow | null = null;
  let selectedValue: number | null = null;

  for (const row of rows) {
    const value = metricValue(row, definition.metric);

    if (value === null) {
      continue;
    }

    if (selectedValue === null) {
      selectedRow = row;
      selectedValue = value;
      continue;
    }

    const shouldReplace =
      definition.direction === "highest"
        ? value > selectedValue
        : value < selectedValue;

    if (shouldReplace) {
      selectedRow = row;
      selectedValue = value;
    }
  }

  if (!selectedRow || selectedValue === null) {
    return null;
  }

  return {
    definition,
    row: selectedRow,
    value: selectedValue,
  };
}

function readableLabel(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function ExtremeCard({ result }: { result: ExtremeResult }) {
  const { definition, row, value } = result;

  const confidence = isFiniteNumber(row.dataConfidence)
    ? clamp(normalizePercent(row.dataConfidence), 0, 100)
    : null;

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 shadow-sm transition-colors hover:border-cyan-500/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            {definition.eyebrow}
          </p>

          <h3 className="mt-2 text-lg font-bold text-white">
            {definition.title}
          </h3>

          <p className="mt-2 text-sm text-zinc-400">
            {definition.description}
          </p>
        </div>

        <div className="rounded-xl bg-cyan-500/10 px-3 py-2 text-right">
          <div className="text-xs uppercase tracking-wider text-cyan-300">
            Value
          </div>

          <div className="text-2xl font-black text-cyan-200">
            {definition.format(value)}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Player</span>
          <span className="font-semibold text-white">
            {row.playerName}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Matchup</span>
          <span className="text-zinc-200">
            {row.team} vs {row.opponent}
          </span>
        </div>

        {row.pitcherName && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Pitcher</span>
            <span className="text-zinc-200">
              {row.pitcherName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Truth</span>
          <span className="font-medium text-emerald-300">
            {readableLabel(String(row.truthStatus))}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Risk</span>
          <span className="font-medium text-amber-300">
            {readableLabel(String(row.riskTier))}
          </span>
        </div>

        {confidence !== null && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Confidence</span>
            <span className="font-semibold text-cyan-300">
              {Math.round(confidence)}%
            </span>
          </div>
        )}
      </div>

      {row.reasons.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Top Reasons
          </div>

          <div className="flex flex-wrap gap-2">
            {row.reasons.slice(0, 4).map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {row.warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Watch
          </div>

          <div className="mt-2 text-sm text-amber-100">
            {row.warnings[0]}
          </div>
        </div>
      )}
    </article>
  );
}


export default function MatchupExtremesView({ rows }: Props) {
  const extremes = useMemo(
    () =>
      EXTREME_DEFINITIONS.map((definition) =>
        findExtreme(rows, definition),
      ).filter(
        (result): result is ExtremeResult => result !== null,
      ),
    [rows],
  );

  if (rows.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/50 p-10 text-center">
        <h2 className="text-xl font-bold text-white">
          Matchup Extremes
        </h2>

        <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-400">
          No matchup intelligence is available for the current workspace.
          Once players are loaded, this view highlights the strongest and
          weakest signals across today's board.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400">
          Workspace Intelligence
        </p>

        <h1 className="text-3xl font-black tracking-tight text-white">
          Matchup Extremes
        </h1>

        <p className="max-w-3xl text-sm text-zinc-400">
          Scan today's strongest opportunities, highest-confidence plays,
          environmental advantages, and volatility signals without manually
          comparing every player.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {extremes.map((result) => (
          <ExtremeCard
            key={result.definition.id}
            result={result}
          />
        ))}
      </div>
    </section>
  );
}


/*
 * MATCHUP EXTREMES VIEW COMPLETE
 *
 * Next:
 *
 * mv /tmp/MatchupExtremesView.tsx \
 * src/features/hr/components/workspace/views/MatchupExtremesView.tsx
 *
 * npm run typecheck
 * npm run build
 * ./scripts/titan health
 */

