/**
 * HR Target Engine + Sneaky HR Finder.
 * Ranks HR opportunity at the matchup level (the lineup facing a probable pitcher).
 * Uses real pitcher vulnerability (HR/9, ERA, BB/K) and sourced park factors.
 * Individual hitter resolution (lineup order, form) is in hrEdgeEngine/dailyHrBoardService.
 */
import { NormalizedGame, DataQuality } from "../mlb/mlbTypes";
import { buildVulnerablePitcherReport, VulnerablePitcherProfile } from "./pitcherVulnerabilityEngine";
import { PitcherSeasonStats } from "../mlb/statsClient";
import { getParkFactor } from "../mlb/parkFactors";
import { clamp, hrLabelFromScore, confidenceFromScore, HrLabel, ConfidenceBand } from "./scoring";

export interface HrTarget {
  targetId: string;
  team: string;
  opponent: string;
  opposingPitcher: string;
  opposingPitcherId: number;
  hrScore: number;
  tier: HrLabel;
  label: HrLabel;
  reasons: string[];
  riskWarnings: string[];
  confidence: ConfidenceBand;
  judgeStatus: "Pending" | "Approved" | "Needs more data";
  dataQuality: DataQuality;
}

export interface SneakyHrTarget {
  sneakyRank: number;
  team: string;
  opponent: string;
  opposingPitcher: string;
  reason: string;
  risk: "HIGH" | "EXTREME";
  confidence: ConfidenceBand;
  whatCouldGoWrong: string[];
}

function targetFromVuln(v: VulnerablePitcherProfile, venue: string): HrTarget {
  const { factor: parkFactor, source: parkSource } = getParkFactor(venue);
  const parkC = clamp(((parkFactor - 88) / 33) * 100, 0, 100);

  // Pitcher vulnerability is the real driver; park adds secondary adjustment.
  // No lineup-level power data at this layer — that lives in hrEdgeEngine.
  const hrScore = clamp(Math.round(0.70 * v.vulnerabilityScore + 0.30 * parkC), 1, 100);
  const label = hrLabelFromScore(hrScore);

  const reasons = [
    `${v.pitcherName} vulnerability ${v.vulnerabilityScore}/100 (${v.dataQuality === "limited" ? "no stat data" : "real HR/9 + ERA"})`,
    ...v.attackReasons.slice(0, 2),
    `${venue} park factor ${parkFactor} (${parkSource === "table" ? "sourced" : "neutral"})`,
  ];

  return {
    targetId: `hr:${v.pitcherId}:${v.opponent}`,
    team: v.opponent,
    opponent: v.team,
    opposingPitcher: v.pitcherName,
    opposingPitcherId: v.pitcherId,
    hrScore,
    tier: label,
    label,
    reasons,
    riskWarnings: [
      "Matchup-level score only — individual hitter lineup spots are in the HR Board.",
      ...(label === "Lotto" || label === "Avoid" ? ["Low modeled HR equity — high variance."] : []),
    ],
    confidence: confidenceFromScore(hrScore),
    judgeStatus: v.dataQuality === "limited" ? "Needs more data" : "Pending",
    dataQuality: v.dataQuality,
  };
}

/** Ranked HR matchup targets for the slate, strongest first. */
export async function rankHrTargets(
  games: NormalizedGame[],
  pitcherStatsMap: Map<number, PitcherSeasonStats | null> = new Map()
): Promise<HrTarget[]> {
  const vulns = await buildVulnerablePitcherReport(games, pitcherStatsMap);
  // Build a venue map: pitcherId → game venue
  const venueMap = new Map<number, string>();
  for (const g of games) {
    if (g.probablePitchers.away) venueMap.set(g.probablePitchers.away.pitcherId, g.venue);
    if (g.probablePitchers.home) venueMap.set(g.probablePitchers.home.pitcherId, g.venue);
  }
  return vulns
    .map((v) => targetFromVuln(v, venueMap.get(v.pitcherId) ?? ""))
    .sort((a, b) => b.hrScore - a.hrScore);
}

/** Sneaky HR: mid-pack matchups with hidden value. Always flagged higher risk. */
export async function findSneakyHrTargets(
  games: NormalizedGame[],
  pitcherStatsMap: Map<number, PitcherSeasonStats | null> = new Map(),
  limit = 6
): Promise<SneakyHrTarget[]> {
  const all = await rankHrTargets(games, pitcherStatsMap);
  return all
    .filter((t) => t.hrScore >= 45 && t.hrScore < 72)
    .slice(0, limit)
    .map((t, i) => ({
      sneakyRank: i + 1,
      team: t.team,
      opponent: t.opponent,
      opposingPitcher: t.opposingPitcher,
      reason: `Under-the-radar spot vs ${t.opposingPitcher}: HR/9 + park factor lean outpaces public attention on this game.`,
      risk: t.hrScore >= 55 ? "HIGH" : "EXTREME",
      confidence: t.confidence,
      whatCouldGoWrong: [
        "Intentionally non-obvious — lower hit rate than headline plays.",
        "Needs lineup confirmation; bottom-order bats lower real HR equity.",
      ],
    }));
}
