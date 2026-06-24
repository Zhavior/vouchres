/**
 * Run Environment Engine. Scores games likely to be higher-scoring using both
 * probable pitchers' vulnerability plus seeded park/weather placeholders.
 */
import { NormalizedGame, DataQuality } from "../mlb/mlbTypes";
import { buildPitcherVulnerability } from "./pitcherVulnerabilityEngine";
import { clamp, seededInt } from "./scoring";

export interface RunEnvironment {
  gamePk: number;
  matchup: string;
  runEnvironmentScore: number; // 1-100, higher = more runs likely
  tier: "LOW" | "MODERATE" | "HIGH" | "SHOOTOUT";
  reasons: string[];
  warnings: string[];
  suggestedAngles: string[];
  dataQuality: DataQuality;
}

function tier(score: number): RunEnvironment["tier"] {
  if (score >= 78) return "SHOOTOUT";
  if (score >= 62) return "HIGH";
  if (score >= 45) return "MODERATE";
  return "LOW";
}

export function scoreRunEnvironment(games: NormalizedGame[]): RunEnvironment[] {
  return games
    .map((g): RunEnvironment => {
      const away = g.probablePitchers.away
        ? buildPitcherVulnerability(g.probablePitchers.away, g.homeTeam.name, g.venue).vulnerabilityScore
        : 55;
      const home = g.probablePitchers.home
        ? buildPitcherVulnerability(g.probablePitchers.home, g.awayTeam.name, g.venue).vulnerabilityScore
        : 55;
      const park = seededInt(`park:${g.venue}`, 40, 85); // placeholder park factor
      const weather = seededInt(`wx:${g.gamePk}`, 40, 80); // placeholder wind/temp

      const score = clamp(Math.round(0.4 * ((away + home) / 2) + 0.35 * park + 0.25 * weather), 1, 100);
      const reasons: string[] = [];
      if ((away + home) / 2 >= 60) reasons.push("Both probables carry above-average vulnerability");
      if (park >= 65) reasons.push("Hitter-friendly park placeholder");
      if (weather >= 65) reasons.push("Favorable modeled weather/wind placeholder");
      if (reasons.length === 0) reasons.push("Neutral run environment");

      return {
        gamePk: g.gamePk,
        matchup: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
        runEnvironmentScore: score,
        tier: tier(score),
        reasons,
        warnings: ["Park/weather are placeholders until a weather provider is wired."],
        suggestedAngles:
          score >= 62
            ? ["Game total (over) lean", "Team total overs", "HR/total-bases stacking"]
            : ["Lower-scoring lean — consider unders or pitcher props"],
        dataQuality: "partial",
      };
    })
    .sort((a, b) => b.runEnvironmentScore - a.runEnvironmentScore);
}
