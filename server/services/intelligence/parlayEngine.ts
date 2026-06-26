/**
 * Parlay Engine. Assembles 2-4 leg parlays from the day's HR targets and flags
 * them for Risk Judge review. Combined risk grows with leg count (honest math).
 */
import { NormalizedGame } from "../mlb/mlbTypes";
import { rankHrTargets, HrTarget } from "./hrEngine";
import { clamp, confidenceFromScore, ConfidenceBand } from "./scoring";

export interface ParlayLeg {
  selection: string;
  market: string;
  team: string;
  matchupNote: string;
  legScore: number;
}

export interface BuiltParlay {
  id: string;
  size: number;
  legs: ParlayLeg[];
  combinedScore: number; // 1-100
  combinedRisk: "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME";
  confidence: ConfidenceBand;
  correlationWarning: string;
  reviewRequired: true;
  whatCouldGoWrong: string[];
}

function legFromTarget(t: HrTarget): ParlayLeg {
  return {
    selection: `${t.team} HR vs ${t.opposingPitcher}`,
    market: "Anytime HR (team matchup)",
    team: t.team,
    matchupNote: t.reasons[0] ?? "",
    legScore: t.hrScore,
  };
}

function combinedRisk(size: number): BuiltParlay["combinedRisk"] {
  if (size <= 2) return "MODERATE";
  if (size === 3) return "ELEVATED";
  if (size === 4) return "HIGH";
  return "EXTREME";
}

export async function buildParlay(games: NormalizedGame[], size = 3): Promise<BuiltParlay> {
  const safeSize = clamp(size, 2, 4);
  const targets = (await rankHrTargets(games, new Map())).slice(0, safeSize);
  const legs = targets.map(legFromTarget);

  // Combined score decays with each leg (independent-event approximation).
  const avg = legs.reduce((s, l) => s + l.legScore, 0) / (legs.length || 1);
  const combinedScore = clamp(Math.round(avg * Math.pow(0.9, safeSize - 1)), 1, 100);

  // Same-team legs are correlated.
  const teams = new Set(legs.map((l) => l.team));
  const correlationWarning =
    teams.size < legs.length
      ? "Two or more legs share a team — correlated outcomes inflate both upside and downside. Not independent."
      : "No same-team stacking detected; legs are roughly independent.";

  return {
    id: `parlay:${safeSize}:${legs.map((l) => l.team).join("-")}`,
    size: safeSize,
    legs,
    combinedScore,
    combinedRisk: combinedRisk(safeSize),
    confidence: confidenceFromScore(combinedScore),
    correlationWarning,
    reviewRequired: true,
    whatCouldGoWrong: [
      "A single missed leg voids the whole slip.",
      "Each added leg lowers the realistic hit rate — by construction.",
      "Lineups/weather not yet wired; confirm before first pitch.",
    ],
  };
}
