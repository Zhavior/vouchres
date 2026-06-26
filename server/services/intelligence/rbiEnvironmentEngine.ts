/**
 * RBI Environment Engine.
 * Identifies games/teams with RBI upside using real pitcher vulnerability
 * and sourced park factors. On-base/traffic data unavailable — labeled clearly.
 */
import { NormalizedGame, DataQuality } from "../mlb/mlbTypes";
import { buildVulnerablePitcherReport } from "./pitcherVulnerabilityEngine";
import { PitcherSeasonStats } from "../mlb/statsClient";
import { getParkFactor } from "../mlb/parkFactors";
import { clamp, confidenceFromScore, ConfidenceBand } from "./scoring";

export interface RbiTarget {
  team: string;
  opponent: string;
  opposingPitcher: string;
  rbiScore: number;
  confidence: ConfidenceBand;
  reasons: string[];
  riskWarnings: string[];
  teamStackNote: string;
  dataQuality: DataQuality;
}

export interface RbiEnvironmentReport {
  rbiTargets: RbiTarget[];
  gameRbiEnvironment: { matchup: string; score: number }[];
  teamStackNotes: string[];
}

export async function rankRbiTargets(
  games: NormalizedGame[],
  pitcherStatsMap: Map<number, PitcherSeasonStats | null> = new Map()
): Promise<RbiEnvironmentReport> {
  const vulns = await buildVulnerablePitcherReport(games, pitcherStatsMap);

  // Build venue map for park factors
  const venueMap = new Map<number, string>();
  for (const g of games) {
    if (g.probablePitchers.away) venueMap.set(g.probablePitchers.away.pitcherId, g.venue);
    if (g.probablePitchers.home) venueMap.set(g.probablePitchers.home.pitcherId, g.venue);
  }

  const rbiTargets: RbiTarget[] = vulns.map((v) => {
    const venue = venueMap.get(v.pitcherId) ?? "";
    const { factor: parkFactor, source: parkSource } = getParkFactor(venue);
    const parkC = clamp(((parkFactor - 88) / 33) * 100, 0, 100);

    // RBI proxy: pitcher vulnerability + park factor. On-base/traffic data unavailable.
    const score = clamp(Math.round(0.70 * v.vulnerabilityScore + 0.30 * parkC), 1, 100);

    return {
      team: v.opponent,
      opponent: v.team,
      opposingPitcher: v.pitcherName,
      rbiScore: score,
      confidence: confidenceFromScore(score),
      reasons: [
        `${v.pitcherName} vulnerability ${v.vulnerabilityScore}/100 (${v.dataQuality === "limited" ? "no stat data" : "real HR/9 + ERA"})`,
        ...v.attackReasons.slice(0, 1),
        `${venue ? venue : "Venue"} park factor ${parkFactor} (${parkSource === "table" ? "sourced" : "neutral"})`,
      ],
      riskWarnings: [
        "On-base rate and lineup order unavailable — RBI depends heavily on batting slot.",
        "Weather not factored.",
      ],
      teamStackNote:
        score >= 65
          ? `Middle-order ${v.opponent} bats are the stack-of-interest vs ${v.pitcherName}.`
          : `Thin stack value for ${v.opponent} here.`,
      dataQuality: v.dataQuality,
    };
  });

  rbiTargets.sort((a, b) => b.rbiScore - a.rbiScore);

  return {
    rbiTargets,
    gameRbiEnvironment: games.map((g) => {
      const apV = g.probablePitchers.away
        ? vulns.find((v) => v.pitcherId === g.probablePitchers.away!.pitcherId)?.vulnerabilityScore ?? 50 : 50;
      const hpV = g.probablePitchers.home
        ? vulns.find((v) => v.pitcherId === g.probablePitchers.home!.pitcherId)?.vulnerabilityScore ?? 50 : 50;
      return {
        matchup: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
        score: Math.round((apV + hpV) / 2),
      };
    }),
    teamStackNotes: rbiTargets.slice(0, 3).map((t) => t.teamStackNote),
  };
}
