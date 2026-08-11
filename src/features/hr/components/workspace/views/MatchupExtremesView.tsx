import React, { useMemo } from "react";

import type { HrWatchRow } from "../../../types/hrWatch";
import type { HrCardResult } from "../../Cards/HrPlayerCard";

interface Props {
  rows: HrWatchRow[];
  getHrResult?: (playerId: string | number | null) => HrCardResult;
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
  symbol: string;
  tone: "cyan" | "emerald" | "amber" | "rose";
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
    symbol: "🔥",
    tone: "emerald",
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
    symbol: "⚡",
    tone: "cyan",
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
    symbol: "🎯",
    tone: "rose",
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
    symbol: "🏟",
    tone: "cyan",
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
    symbol: "📈",
    tone: "emerald",
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
    symbol: "◆",
    tone: "cyan",
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
    symbol: "⚠",
    tone: "amber",
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
    symbol: "↓",
    tone: "rose",
  },
];

const TONE_CLASSES = {
  cyan: {
    border: "border-cyan-400/20 hover:border-cyan-300/45",
    glow: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
    label: "text-cyan-300",
    value: "text-cyan-100",
  },
  emerald: {
    border: "border-emerald-400/20 hover:border-emerald-300/45",
    glow: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
    label: "text-emerald-300",
    value: "text-emerald-100",
  },
  amber: {
    border: "border-amber-400/20 hover:border-amber-300/45",
    glow: "bg-amber-400/10 text-amber-200 ring-amber-300/20",
    label: "text-amber-300",
    value: "text-amber-100",
  },
  rose: {
    border: "border-rose-400/20 hover:border-rose-300/45",
    glow: "bg-rose-400/10 text-rose-200 ring-rose-300/20",
    label: "text-rose-300",
    value: "text-rose-100",
  },
} as const;

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizePercent(value: number): number {
  return Math.abs(value) <= 1 ? value * 100 : value;
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

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 truncate text-2xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-zinc-400">{detail}</p>
    </div>
  );
}

import PlayerHeadshot from "../../../../../components/parlays/PlayerHeadshot";
import { logoByTeamName } from "../../../../../lib/teamLogos";
import { openParlayAdd } from "../../../../../lib/parlays/parlayAddContract";
import { toHrParlayPickerPlayer } from "../../../utils/hrDecisionBrief";
import { PlayerHrTag } from "../../HrHitBadge";
import { Plus } from "lucide-react";

function ExtremeCard({
  result,
  getHrResult,
}: {
  result: ExtremeResult;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}) {
  const { definition, row, value } = result;
  const tone = TONE_CLASSES[definition.tone];
  const teamLogoUrl = row.teamLogoUrl || logoByTeamName(row.team);

  const confidence = isFiniteNumber(row.dataConfidence)
    ? clamp(normalizePercent(row.dataConfidence), 0, 100)
    : null;

  const handleAddLeg = () => {
    openParlayAdd({
      player: toHrParlayPickerPlayer(row),
      propHint: {
        id: `hr-extreme-${row.stableId}`,
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

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-3xl border bg-zinc-950/75 p-5",
        "shadow-[0_20px_70px_-35px_rgba(0,0,0,0.95)]",
        "transition duration-300 hover:-translate-y-0.5",
        tone.border,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-70" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/[0.025] blur-3xl transition group-hover:bg-white/[0.05]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                "text-lg ring-1",
                tone.glow,
              ].join(" ")}
              aria-hidden="true"
            >
              {definition.symbol}
            </div>

            <p
              className={[
                "mt-4 text-[10px] font-bold uppercase tracking-[0.24em]",
                tone.label,
              ].join(" ")}
            >
              {definition.eyebrow}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Signal
            </p>
            <p
              className={[
                "mt-1 text-3xl font-black tracking-[-0.04em]",
                tone.value,
              ].join(" ")}
            >
              {definition.format(value)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3.5">
          <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={40} />
          <div>
            <h3 className="text-xs font-semibold text-zinc-400">
              {definition.title}
            </h3>
            <div className="flex items-center gap-2">
              <h4 className="text-xl font-black tracking-tight text-white group-hover:text-vouch-cyan transition-colors">
                {row.playerName}
              </h4>
              <PlayerHrTag player={row} hrResult={getHrResult?.(row.playerId) ?? null} />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {teamLogoUrl && <img src={teamLogoUrl} alt="" className="h-3.5 w-3.5 object-contain" />}
              <span className="font-mono text-xs text-white/60">{row.team} vs {row.opponent}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-zinc-400">
          {definition.description}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Matchup
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-zinc-200">
              {row.team} vs {row.opponent}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Pitcher
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-zinc-200">
              {row.pitcherName || "Pending"}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Confidence
            </p>
            <p className="mt-1 text-xs font-semibold text-cyan-200">
              {confidence === null ? "Pending" : `${Math.round(confidence)}%`}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Risk
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-amber-200">
              {readableLabel(String(row.riskTier))}
            </p>
          </div>
        </div>

        {row.reasons.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Why it stands out
            </p>

            <div className="mt-3 space-y-2">
              {row.reasons.slice(0, 3).map((reason) => (
                <div
                  key={reason}
                  className="flex items-start gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.055] px-3 py-2"
                >
                  <span
                    className="mt-0.5 text-xs font-black text-emerald-300"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-xs leading-5 text-emerald-100/85">
                    {reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {row.warnings.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.065] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Watch signal
            </p>
            <p className="mt-2 text-xs leading-5 text-amber-100/85">
              {row.warnings[0]}
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Truth status: <strong className="text-emerald-300">{readableLabel(String(row.truthStatus))}</strong>
          </span>
          <button
            type="button"
            onClick={handleAddLeg}
            className="flex items-center gap-1.5 rounded-xl border border-vouch-cyan/40 bg-vouch-cyan/10 px-3 py-1 font-mono text-xs font-bold text-vouch-cyan transition hover:bg-vouch-cyan hover:text-black"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Leg
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MatchupExtremesView({ rows, getHrResult }: Props) {
  const extremes = useMemo(
    () =>
      EXTREME_DEFINITIONS.map((definition) =>
        findExtreme(rows, definition),
      ).filter(
        (result): result is ExtremeResult => result !== null,
      ),
    [rows],
  );

  const highConfidenceCount = useMemo(
    () =>
      rows.filter((row) => {
        if (!isFiniteNumber(row.dataConfidence)) {
          return false;
        }

        return normalizePercent(row.dataConfidence) >= 80;
      }).length,
    [rows],
  );

  const warningCount = useMemo(
    () => rows.filter((row) => row.warnings.length > 0).length,
    [rows],
  );

  const highestConfidence = useMemo(() => {
    const values = rows
      .map((row) =>
        isFiniteNumber(row.dataConfidence)
          ? normalizePercent(row.dataConfidence)
          : null,
      )
      .filter((value): value is number => value !== null);

    return values.length > 0 ? Math.max(...values) : null;
  }, [rows]);

  const strongestOpportunity = extremes.find(
    (result) => result.definition.id === "highest-hr-score",
  );

  const strongestPower = extremes.find(
    (result) => result.definition.id === "strongest-power",
  );

  const highestRisk = extremes.find(
    (result) => result.definition.id === "lowest-confidence",
  );

  if (rows.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-dashed border-white/10 bg-zinc-950/60 p-10 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_45%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-400">
            Workspace intelligence
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Matchup Extremes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            No matchup intelligence is available for the current workspace.
            Once players are loaded, this view highlights the strongest and
            weakest signals across today&apos;s board.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400">
                Slate intelligence terminal
              </p>

              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Today&apos;s matchup extremes
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
                Surface the slate&apos;s strongest opportunities, highest
                confidence signals, environmental advantages, and most
                important volatility warnings without comparing every player
                manually.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
              Live slate intelligence
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric
              label="Players scanned"
              value={rows.length.toString()}
              detail="Active candidates"
            />
            <SummaryMetric
              label="Extreme signals"
              value={extremes.length.toString()}
              detail="Slate-defining reads"
            />
            <SummaryMetric
              label="High confidence"
              value={highConfidenceCount.toString()}
              detail={
                highestConfidence === null
                  ? "Confidence pending"
                  : `Peak ${Math.round(highestConfidence)}%`
              }
            />
            <SummaryMetric
              label="Watch alerts"
              value={warningCount.toString()}
              detail="Rows carrying warnings"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {extremes.map((result) => (
          <ExtremeCard key={result.definition.id} result={result} getHrResult={getHrResult} />
        ))}
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_45%)]" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Today&apos;s read
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            The slate in one decision brief
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-300">
            {strongestOpportunity
              ? `${strongestOpportunity.row.playerName} owns the strongest overall home-run profile at ${strongestOpportunity.definition.format(strongestOpportunity.value)}.`
              : "The current slate does not contain a complete top HR-score signal."}{" "}
            {strongestPower
              ? `${strongestPower.row.playerName} carries the highest raw power ceiling among available candidates.`
              : "Raw power comparisons remain incomplete."}{" "}
            {highestRisk
              ? `${highestRisk.row.playerName} requires the most caution because the supporting confidence signal is the weakest on the board.`
              : "No material low-confidence outlier is currently available."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryMetric
              label="Best opportunity"
              value={strongestOpportunity?.row.playerName ?? "Pending"}
              detail={
                strongestOpportunity
                  ? `HR score ${strongestOpportunity.definition.format(strongestOpportunity.value)}`
                  : "Awaiting complete data"
              }
            />

            <SummaryMetric
              label="Power leader"
              value={strongestPower?.row.playerName ?? "Pending"}
              detail={
                strongestPower
                  ? `Power ${strongestPower.definition.format(strongestPower.value)}`
                  : "Awaiting complete data"
              }
            />

            <SummaryMetric
              label="Highest caution"
              value={highestRisk?.row.playerName ?? "None"}
              detail={
                highestRisk
                  ? `Confidence ${highestRisk.definition.format(highestRisk.value)}`
                  : "No low-confidence outlier"
              }
            />
          </div>
        </div>
      </section>
    </section>
  );
}
