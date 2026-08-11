import type { HrEligibleHitter } from "../hrEngineTypes";

export type LegacyV2Capability = {
  eligible: false;
  reason: string;
  missing: string[];
};

export function assessLegacyV2Capability(hitter: HrEligibleHitter): LegacyV2Capability {
  const missing: string[] = [];

  if (!hitter.playerId || !hitter.playerName?.trim()) {
    missing.push("batter identity");
  }

  if (!hitter.gameId?.trim() || !hitter.gamePk) {
    missing.push("game identity");
  }

  if (!hitter.opponentPitcherId || !hitter.opponentPitcherName?.trim()) {
    missing.push("opposing pitcher identity");
  }

  if (!hitter.hitterStats) {
    missing.push("season hitter statistics");
  }

  if (!hitter.opponentPitcherStats) {
    missing.push("season pitcher statistics");
  }

  missing.push(
    "Statcast season metrics",
    "30-day Statcast metrics",
    "14-day batted-ball log",
    "pitch-type batter skill",
    "pitch mix and pitcher quality metrics",
    "bullpen availability and quality",
    "directional weather inputs",
    "market odds",
  );

  return {
    eligible: false,
    reason: "Legacy HR board data is insufficient for a truthful v2 probability request.",
    missing,
  };
}
