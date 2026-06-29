/**
 * Run Environment Engine.
 * Scores each game's likely run total using real pitcher vulnerability (HR/9, ERA, BB/K)
 * and sourced park HR factors. Weather is unavailable — set to 0, not invented.
 */
import { NormalizedGame, DataQuality } from "../mlb/mlbTypes";
import { buildPitcherVulnerability } from "./pitcherVulnerabilityEngine";
import { PitcherSeasonStats } from "../mlb/statsClient";
import { getParkFactor } from "../mlb/parkFactors";
import { clamp } from "./scoring";

export interface RunEnvironment {
  gamePk: number;
  matchup: string;
  runEnvironmentScore: number;
  tier: "LOW" | "MODERATE" | "HIGH" | "SHOOTOUT";
  reasons: string[];
  warnings: string[];
  suggestedAngles: string[];
  dataQuality: DataQuality;
}

function envTier(score: number): RunEnvironment["tier"] {
  if (score >= 78) return "SHOOTOUT";
  if (score >= 62) return "HIGH";
  if (score >= 45) return "MODERATE";
  return "LOW";
}

export function scoreRunEnvironment(
  games: NormalizedGame[],
  pitcherStatsMap: Map<number, PitcherSeasonStats | null> = new Map()
): RunEnvironment[] {
  return games
    .map((g): RunEnvironment => {
      const awayStats = g.probablePitchers.away ? pitcherStatsMap.get(g.probablePitchers.away.pitcherId) ?? null : null;
      const homeStats = g.probablePitchers.home ? pitcherStatsMap.get(g.probablePitchers.home.pitcherId) ?? null : null;

      const awayVuln = g.probablePitchers.away
        ? buildPitcherVulnerability(g.probablePitchers.away, g.homeTeam.name, g.venue, awayStats).vulnerabilityScore : 50;
      const homeVuln = g.probablePitchers.home
        ? buildPitcherVulnerability(g.probablePitchers.home, g.awayTeam.name, g.venue, homeStats).vulnerabilityScore : 50;

      const { factor: parkFactor, source: parkSource } = getParkFactor(g.venue);
      const parkC = clamp(((parkFactor - 88) / 33) * 100, 0, 100);
      const score = clamp(Math.round(0.55 * ((awayVuln + homeVuln) / 2) + 0.45 * parkC), 1, 100);

      const reasons: string[] = [];
      const avgVuln = (awayVuln + homeVuln) / 2;
      if (avgVuln >= 60)
        reasons.push(`Both probables grade vulnerable: ${g.probablePitchers.away?.pitcherName ?? "?"} (${awayVuln}) / ${g.probablePitchers.home?.pitcherName ?? "?"} (${homeVuln})`);
      else if (awayVuln >= 65 || homeVuln >= 65)
        reasons.push(`One vulnerable arm: ${awayVuln >= homeVuln ? g.probablePitchers.away?.pitcherName : g.probablePitchers.home?.pitcherName} (${Math.max(awayVuln, homeVuln)}/100)`);
      else
        reasons.push("Both probables grade low-vulnerability — pitcher-favored today.");
      reasons.push(`${g.venue} park factor ${parkFactor} (${parkSource === "table" ? "sourced" : "neutral — not in table"})`);

      const hasStats = awayStats !== null || homeStats !== null;
      return {
        gamePk: g.gamePk,
        matchup: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
        runEnvironmentScore: score,
        tier: envTier(score),
        reasons,
        warnings: [
          "Weather and wind unavailable — not factored.",
          ...(!hasStats ? ["Pitcher stats unavailable — vulnerability neutral."] : []),
        ],
        suggestedAngles: score >= 62
          ? ["Game total (over) lean", "Team total overs", "HR/total-bases stacking"]
          : ["Lower-scoring lean — unders or pitcher strikeout props"],
        dataQuality: hasStats ? "partial" : "limited",
      };
    })
    .sort((a, b) => b.runEnvironmentScore - a.runEnvironmentScore);
}
