/**
 * RBI Environment Engine. Identifies games/teams with RBI upside by combining the
 * opposing pitcher's vulnerability with seeded run-environment placeholders.
 */
import { NormalizedGame, DataQuality } from "../mlb/mlbTypes";
import { buildVulnerablePitcherReport } from "./pitcherVulnerabilityEngine";
import { clamp, seededInt, confidenceFromScore, ConfidenceBand } from "./scoring";

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

export function rankRbiTargets(games: NormalizedGame[]): RbiEnvironmentReport {
  const vulns = buildVulnerablePitcherReport(games);

  const rbiTargets: RbiTarget[] = vulns.map((v) => {
    const key = `rbi:${v.pitcherId}:${v.opponent}`;
    const teamRunEnv = seededInt(key + ":runenv", 35, 85); // placeholder team run environment
    const traffic = seededInt(key + ":traffic", 30, 80); // placeholder on-base ahead of RBI bats
    const score = clamp(Math.round(0.45 * v.vulnerabilityScore + 0.3 * teamRunEnv + 0.25 * traffic), 1, 100);
    return {
      team: v.opponent,
      opponent: v.team,
      opposingPitcher: v.pitcherName,
      rbiScore: score,
      confidence: confidenceFromScore(score),
      reasons: [
        `Opposing starter ${v.pitcherName} grades vulnerable (${v.vulnerabilityScore}/100)`,
        teamRunEnv >= 60 ? "Above-average modeled team run environment" : "Neutral team run environment",
      ],
      riskWarnings: [
        "Lineup order and on-base-ahead are placeholders — RBI depends heavily on batting slot.",
      ],
      teamStackNote:
        score >= 65
          ? `Middle-order ${v.opponent} bats are the stack-of-interest vs ${v.pitcherName}.`
          : `Thin stack value for ${v.opponent} here.`,
      dataQuality: "limited",
    };
  });

  rbiTargets.sort((a, b) => b.rbiScore - a.rbiScore);

  return {
    rbiTargets,
    gameRbiEnvironment: games.map((g) => ({
      matchup: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
      score: seededInt(`rbienv:${g.gamePk}`, 40, 80),
    })),
    teamStackNotes: rbiTargets.slice(0, 4).map((t) => t.teamStackNote),
  };
}
