import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import type { ChunkA } from "../../api/contracts";
import { PlayerHeadshot } from "../PlayerHeadshot";
import { logoByTeamName } from "../../../../lib/teamLogos";
import { openParlayAdd } from "../../../../lib/parlays/parlayAddContract";
import {
  AuroraMaxControl,
  AuroraMaxFallback,
  AuroraMaxPanel,
} from "../../../../components/aurora-max/AuroraMaxPrimitives";

interface Props {
  data: ChunkA[];
}

type ExtremeMetric =
  | "hrScore"
  | "modelProb"
  | "impliedProb"
  | "parkFactor"
  | "barrelRate"
  | "confidence";

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
  row: ChunkA;
  value: number;
}

function formatScore(value: number): string {
  return Math.round(value).toString();
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDecimal(value: number): string {
  return value.toFixed(1);
}

const EXTREME_DEFINITIONS: ExtremeDefinition[] = [
  {
    id: "highest-hr-score",
    eyebrow: "Peak opportunity",
    title: "Highest HR score",
    description: "The strongest overall home-run profile currently available on the board.",
    metric: "hrScore",
    direction: "highest",
    format: formatScore,
    symbol: "🔥",
    tone: "emerald",
  },
  {
    id: "highest-model-prob",
    eyebrow: "Model favorite",
    title: "Peak Model Probability",
    description: "The player our model assigns the highest absolute chance of hitting a home run.",
    metric: "modelProb",
    direction: "highest",
    format: formatPercent,
    symbol: "⚡",
    tone: "cyan",
  },
  {
    id: "highest-implied-prob",
    eyebrow: "Market favorite",
    title: "Highest Implied Prob",
    description: "The player the betting market thinks is most likely to hit a home run.",
    metric: "impliedProb",
    direction: "highest",
    format: formatPercent,
    symbol: "🎯",
    tone: "rose",
  },
  {
    id: "best-park",
    eyebrow: "Environment edge",
    title: "Best park factor",
    description: "The most favorable run environment represented in the current workspace.",
    metric: "parkFactor",
    direction: "highest",
    format: formatScore,
    symbol: "🏟",
    tone: "cyan",
  },
  {
    id: "best-barrel",
    eyebrow: "Power contact",
    title: "Highest Barrel Rate",
    description: "The player with the highest rate of barreled balls this season.",
    metric: "barrelRate",
    direction: "highest",
    format: formatDecimal,
    symbol: "📈",
    tone: "emerald",
  },
  {
    id: "highest-confidence",
    eyebrow: "Data certainty",
    title: "Highest confidence",
    description: "The matchup backed by the strongest available data-confidence reading.",
    metric: "confidence",
    direction: "highest",
    format: formatPercent,
    symbol: "◆",
    tone: "cyan",
  },
  {
    id: "lowest-confidence",
    eyebrow: "Volatility watch",
    title: "Lowest confidence",
    description: "The matchup requiring the most caution because its supporting data is least certain.",
    metric: "confidence",
    direction: "lowest",
    format: formatPercent,
    symbol: "⚠",
    tone: "amber",
  },
  {
    id: "lowest-hr-score",
    eyebrow: "Fade pressure",
    title: "Lowest HR score",
    description: "The weakest overall home-run profile currently represented in this view.",
    metric: "hrScore",
    direction: "lowest",
    format: formatScore,
    symbol: "↓",
    tone: "rose",
  },
];

const TONE_CLASSES = {
  cyan: {
    border: "border-emerald-400/20 hover:border-emerald-300/45",
    glow: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
    label: "text-emerald-300",
    value: "text-emerald-100",
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

function metricValue(row: ChunkA, metric: ExtremeMetric): number | null {
  switch (metric) {
    case "hrScore":
      return row.score.hrIndex;
    case "modelProb":
      return row.score.modelProbability ?? null;
    case "impliedProb":
      return row.odds?.impliedProbability ?? null;
    case "parkFactor":
      return row.statcastSummary?.parkFactor ?? null;
    case "barrelRate":
      return row.statcastSummary?.barrelRate ?? null;
    case "confidence":
      return row.score.confidence.score ?? null;
    default:
      return null;
  }
}

function findExtreme(data: ChunkA[], definition: ExtremeDefinition): ExtremeResult | null {
  let selectedRow: ChunkA | null = null;
  let selectedValue: number | null = null;

  for (const row of data) {
    const value = metricValue(row, definition.metric);
    if (value === null) continue;

    if (selectedValue === null) {
      selectedRow = row;
      selectedValue = value;
      continue;
    }

    const shouldReplace = definition.direction === "highest" ? value > selectedValue : value < selectedValue;

    if (shouldReplace) {
      selectedRow = row;
      selectedValue = value;
    }
  }

  if (!selectedRow || selectedValue === null) return null;

  return { definition, row: selectedRow, value: selectedValue };
}

function SummaryMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <AuroraMaxPanel className="min-w-0 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 truncate text-xs text-zinc-400">{detail}</p>
    </AuroraMaxPanel>
  );
}

function ExtremeCard({ result }: { result: ExtremeResult }) {
  const { definition, row, value } = result;
  const tone = TONE_CLASSES[definition.tone];
  const teamLogoUrl = logoByTeamName(row.identity.teamAbbreviation);

  const confidence = isFiniteNumber(row.score.confidence.score) ? row.score.confidence.score * 100 : null;

  const handleAddLeg = () => {
    openParlayAdd({
      player: {
        id: row.playerId,
        name: row.identity.name,
        team: row.identity.teamAbbreviation,
        position: "",
        propositions: [],
      },
      propHint: {
        id: `hr-extreme-${row.playerId}`,
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

  return (
    <AuroraMaxPanel as="article" className={["group relative overflow-hidden p-5", "transition duration-300 hover:-translate-y-0.5", tone.border].join(" ")}>
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={["inline-flex h-10 w-10 items-center justify-center rounded-2xl", "text-lg ring-1", tone.glow].join(" ")} aria-hidden="true">
              {definition.symbol}
            </div>
            <p className={["mt-4 text-[10px] font-bold uppercase tracking-[0.24em]", tone.label].join(" ")}>{definition.eyebrow}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Signal</p>
            <p className={["mt-1 text-3xl font-black tracking-[-0.04em]", tone.value].join(" ")}>{definition.format(value)}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3.5">
          <PlayerHeadshot name={row.identity.name} mlbId={row.identity.mlbId} size={40} />
          <div>
            <h3 className="text-xs font-semibold text-zinc-400">{definition.title}</h3>
            <div className="flex items-center gap-2">
              <h4 className="text-xl font-black tracking-tight text-white group-hover:text-vouch-cyan transition-colors">{row.identity.name}</h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {teamLogoUrl && <img src={teamLogoUrl} alt="" className="h-3.5 w-3.5 object-contain" />}
              <span className="font-mono text-xs text-white/60">{row.identity.teamAbbreviation} vs {row.opponentTeamId}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-zinc-400">{definition.description}</p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Matchup</p>
            <p className="mt-1 truncate text-xs font-semibold text-zinc-200">{row.identity.teamAbbreviation} vs {row.opponentTeamId}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Pitcher</p>
            <p className="mt-1 truncate text-xs font-semibold text-zinc-200">{row.opposingPitcherName || "Pending"}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Confidence</p>
            <p className="mt-1 text-xs font-semibold text-emerald-200">{confidence === null ? "Pending" : `${Math.round(confidence)}%`}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Tier</p>
            <p className="mt-1 truncate text-xs font-semibold text-amber-200 capitalize">{row.score.confidence.level.replace('_', ' ')}</p>
          </div>
        </div>

        {row.score.confidence.reasons && row.score.confidence.reasons.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Why it stands out</p>
            <div className="mt-3 space-y-2">
              {row.score.confidence.reasons.slice(0, 3).map((reason) => (
                <div key={reason} className="flex items-start gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.055] px-3 py-2">
                  <span className="mt-0.5 text-xs font-black text-emerald-300" aria-hidden="true">✓</span>
                  <span className="text-xs leading-5 text-emerald-100/85">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Truth status: <strong className="text-emerald-300">{row.lineupStatus === 'confirmed_starter' ? 'Official' : 'Projected'}</strong>
          </span>
          <AuroraMaxControl tone="primary" onClick={handleAddLeg} className="gap-1.5 px-3 py-1">
            <Plus className="h-3.5 w-3.5" />
            Add Leg
          </AuroraMaxControl>
        </div>
      </div>
    </AuroraMaxPanel>
  );
}

export function ChunkAMatchupExtremes({ data }: Props) {
  const extremes = useMemo(() => EXTREME_DEFINITIONS.map((definition) => findExtreme(data, definition)).filter((result): result is ExtremeResult => result !== null), [data]);

  const highConfidenceCount = useMemo(() => data.filter((row) => isFiniteNumber(row.score.confidence.score) && row.score.confidence.score! >= 0.8).length, [data]);

  const highestConfidence = useMemo(() => {
    const values = data.map((row) => isFiniteNumber(row.score.confidence.score) ? row.score.confidence.score! * 100 : null).filter((value): value is number => value !== null);
    return values.length > 0 ? Math.max(...values) : null;
  }, [data]);

  const strongestOpportunity = extremes.find((result) => result.definition.id === "highest-hr-score");
  const strongestModel = extremes.find((result) => result.definition.id === "highest-model-prob");
  const highestRisk = extremes.find((result) => result.definition.id === "lowest-confidence");

  if (data.length === 0) {
    return <AuroraMaxFallback title="No matchup extremes available" detail="Extremes appear only after supported slate metrics arrive. Missing measurements remain unavailable rather than being ranked as zero." />;
  }

  return (
    <section className="hr-matchup-extremes aurora-max-ranked-workspace space-y-4" data-workspace="extremes">
      <AuroraMaxPanel className="relative overflow-hidden p-4 sm:p-6">
        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="aurora-max-eyebrow">Slate intelligence terminal</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Today&apos;s matchup extremes</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">Surface the slate&apos;s strongest opportunities, highest confidence signals, environmental advantages, and most important volatility warnings without comparing every player manually.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
              Live slate intelligence
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric label="Players scanned" value={data.length.toString()} detail="Active candidates" />
            <SummaryMetric label="Extreme signals" value={extremes.length.toString()} detail="Slate-defining reads" />
            <SummaryMetric label="High confidence" value={highConfidenceCount.toString()} detail={highestConfidence === null ? "Confidence pending" : `Peak ${Math.round(highestConfidence)}%`} />
          </div>
        </div>
      </AuroraMaxPanel>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {extremes.map((result) => (
          <ExtremeCard key={result.definition.id} result={result} />
        ))}
      </div>

      <AuroraMaxPanel className="relative overflow-hidden p-6 sm:p-8">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Today&apos;s read</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">The slate in one decision brief</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-300">
            {strongestOpportunity ? `${strongestOpportunity.row.identity.name} owns the strongest overall home-run profile at ${strongestOpportunity.definition.format(strongestOpportunity.value)}.` : "The current slate does not contain a complete top HR-score signal."}{" "}
            {strongestModel ? `${strongestModel.row.identity.name} carries the highest model probability among available candidates.` : "Model probability comparisons remain incomplete."}{" "}
            {highestRisk ? `${highestRisk.row.identity.name} requires the most caution because the supporting confidence signal is the weakest on the board.` : "No material low-confidence outlier is currently available."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryMetric label="Best opportunity" value={strongestOpportunity?.row.identity.name ?? "Pending"} detail={strongestOpportunity ? `HR score ${strongestOpportunity.definition.format(strongestOpportunity.value)}` : "Awaiting complete data"} />
            <SummaryMetric label="Model leader" value={strongestModel?.row.identity.name ?? "Pending"} detail={strongestModel ? `Prob ${strongestModel.definition.format(strongestModel.value)}` : "Awaiting complete data"} />
            <SummaryMetric label="Highest caution" value={highestRisk?.row.identity.name ?? "None"} detail={highestRisk ? `Confidence ${highestRisk.definition.format(highestRisk.value)}` : "No low-confidence outlier"} />
          </div>
        </div>
      </AuroraMaxPanel>
    </section>
  );
}
