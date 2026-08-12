import type { BatterProfileV2, ComponentResult, GameContextV2 } from "../types";
import { clamp01, normalizeRange, safeNumber } from "../shared/normalize";

function getLineupSpotScore(lineupSpot: number | null | undefined): number {
  const spot = Math.max(1, Math.min(9, safeNumber(lineupSpot, 9)));
  return clamp01(1 - (spot - 1) / 8);
}

function getFourPlusPaLikelihood(projectedPa: number | null | undefined): number {
  return clamp01(normalizeRange(projectedPa, 3, 5, 0.25));
}

export function calculateOVS(batter: BatterProfileV2, game: GameContextV2): ComponentResult {
  const projectedPa = safeNumber(batter.projectedPlateAppearances, 0);
  const starterProbability = clamp01(safeNumber(batter.starterProbability, 0));
  const lineupSpotScore = getLineupSpotScore(batter.projectedLineupSpot);
  const fourPlusPaLikelihood = getFourPlusPaLikelihood(projectedPa);

  const teamImpliedTotal =
    batter.team === game.homeTeam ? game.impliedTeamTotals.home : game.impliedTeamTotals.away;

  const paScore = normalizeRange(projectedPa, 3, 5.5, 0);
  // MLB does not publish sportsbook implied totals. Missing market context is
  // neutral in shadow mode and is still recorded as a missing input below.
  const teamTotalScore = teamImpliedTotal == null
    ? 0.5
    : normalizeRange(teamImpliedTotal, 3, 6.5, 0.25);

  const rawOvs =
    paScore * 0.35 +
    lineupSpotScore * 0.2 +
    starterProbability * 0.15 +
    teamTotalScore * 0.15 +
    fourPlusPaLikelihood * 0.15;

  const notes = [
    `Projected_PA_Score=${paScore.toFixed(4)}`,
    `Lineup_Spot_Score=${lineupSpotScore.toFixed(4)}`,
    `Starter_Probability=${starterProbability.toFixed(4)}`,
    `Team_Implied_Total_Score=${teamTotalScore.toFixed(4)}`,
    `FourPlus_PA_Likelihood=${fourPlusPaLikelihood.toFixed(4)}`,
    `Raw_OVS=${rawOvs.toFixed(4)}`,
  ];

  const missingOpportunityInputs = [
    batter.projectedPlateAppearances == null && "projected plate appearances",
    batter.projectedLineupSpot == null && "projected lineup spot",
    batter.starterProbability == null && "starter probability",
    (teamImpliedTotal == null || !Number.isFinite(teamImpliedTotal)) && "team implied total",
  ].filter(Boolean) as string[];

  if (missingOpportunityInputs.length > 0) {
    notes.push(`OVS_PARTIAL: opportunity data unavailable: ${missingOpportunityInputs.join(", ")}.`);
  }

  return {
    value: clamp01(rawOvs),
    notes,
  };
}
