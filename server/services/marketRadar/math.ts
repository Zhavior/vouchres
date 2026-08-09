import type { NormalizedOdds, OddsFormat } from "./types";

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, places = 4): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function normalizeOddsPrice(price: number, format: OddsFormat): NormalizedOdds {
  finite(price, "price");

  let decimal: number;
  let american: number;
  if (format === "american") {
    if (price === 0 || Math.abs(price) < 100) {
      throw new RangeError("American odds must be <= -100 or >= 100.");
    }
    american = price;
    decimal = price > 0 ? 1 + (price / 100) : 1 + (100 / Math.abs(price));
  } else {
    if (price <= 1) throw new RangeError("Decimal odds must be greater than 1.");
    decimal = price;
    american = price >= 2 ? (price - 1) * 100 : -100 / (price - 1);
  }

  return {
    american: Math.round(american),
    decimal: round(decimal),
    impliedProbability: round(1 / decimal, 6),
  };
}

export type PitcherKProjectionInput = {
  pitcherCswPercent: number;
  opponentWhiffPercent: number;
  projectedBattersFaced: number;
  leagueAverageWhiffPercent?: number;
};

export function projectPitcherStrikeouts(input: PitcherKProjectionInput): number {
  const csw = clamp(finite(input.pitcherCswPercent, "pitcherCswPercent"), 0, 1);
  const opponentWhiff = clamp(finite(input.opponentWhiffPercent, "opponentWhiffPercent"), 0, 1);
  const battersFaced = Math.max(0, finite(input.projectedBattersFaced, "projectedBattersFaced"));
  const leagueWhiff = finite(input.leagueAverageWhiffPercent ?? 0.22, "leagueAverageWhiffPercent");
  if (leagueWhiff <= 0) throw new RangeError("leagueAverageWhiffPercent must be greater than zero.");
  return round((csw * 1.35) * (opponentWhiff / leagueWhiff) * battersFaced, 2);
}

export function calculatePitcherKDelta(projection: number, line: number): number {
  return round(finite(projection, "projection") - finite(line, "line"), 2);
}

export type HrSusceptibilityInput = {
  pitcherFlyBallPercent: number;
  pitcherBarrelAllowedPercent: number;
  parkFactorHr: number;
};

export function calculateHrSusceptibility(input: HrSusceptibilityInput): number {
  const score =
    clamp(finite(input.pitcherFlyBallPercent, "pitcherFlyBallPercent"), 0, 100) * 0.4
    + clamp(finite(input.pitcherBarrelAllowedPercent, "pitcherBarrelAllowedPercent"), 0, 100) * 0.4
    + clamp(finite(input.parkFactorHr, "parkFactorHr"), 0, 200) * 0.2;
  return round(score, 2);
}

export type SbTimingMismatchInput = {
  runnerSprintSpeedFtSec: number;
  catcherPopTime: number;
};

/** Positive seconds favor the runner; zero means the defensive clock exactly matches. */
export function calculateSbTimingMismatch(input: SbTimingMismatchInput): number {
  const sprintSpeed = Math.max(0, finite(input.runnerSprintSpeedFtSec, "runnerSprintSpeedFtSec"));
  const pop = Math.max(0, finite(input.catcherPopTime, "catcherPopTime"));
  return round(pop - (sprintSpeed / 14.2), 3);
}

export function pitcherKStatus(delta: number): "TARGET OVER" | "TARGET UNDER" | "NO EDGE / MONITOR" {
  if (finite(delta, "delta") >= 1.2) return "TARGET OVER";
  if (delta <= -1.2) return "TARGET UNDER";
  return "NO EDGE / MONITOR";
}

export function isHighHrSusceptibility(score: number, barrelAllowedPercent: number): boolean {
  return finite(score, "score") > 65 && finite(barrelAllowedPercent, "barrelAllowedPercent") >= 9.5;
}

export function isHighSbEdge(timeAdvantageSeconds: number): boolean {
  return finite(timeAdvantageSeconds, "timeAdvantageSeconds") >= 0.18;
}

export type SortableMarketEdge = {
  edgeScore: number;
  confidence?: number;
  modelValue?: number;
  id?: string;
};

/** Stable, non-mutating ranking by absolute model-market displacement. */
export function sortMarketEdges<T extends SortableMarketEdge>(edges: readonly T[]): T[] {
  return edges
    .map((edge, index) => ({ edge, index }))
    .sort((a, b) => {
      const scoreDelta = Math.abs(finite(b.edge.edgeScore, "edgeScore")) - Math.abs(finite(a.edge.edgeScore, "edgeScore"));
      if (scoreDelta !== 0) return scoreDelta;
      const confidenceDelta = (b.edge.confidence ?? 0) - (a.edge.confidence ?? 0);
      if (confidenceDelta !== 0) return confidenceDelta;
      const modelDelta = (b.edge.modelValue ?? 0) - (a.edge.modelValue ?? 0);
      return modelDelta || a.index - b.index;
    })
    .map(({ edge }) => edge);
}
