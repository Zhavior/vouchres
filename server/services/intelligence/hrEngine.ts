/**
 * HR Target Engine + Sneaky HR Finder.
 * Ranks HR opportunity at the matchup level (the lineup facing a probable pitcher).
 * Individual-hitter resolution needs lineups/Statcast (placeholders marked limited).
 */
import { NormalizedGame, DataQuality } from "../mlb/mlbTypes";
import { buildVulnerablePitcherReport, VulnerablePitcherProfile } from "./pitcherVulnerabilityEngine";
import { clamp, seededInt, hrLabelFromScore, confidenceFromScore, HrLabel, ConfidenceBand } from "./scoring";

export interface HrTarget {
  targetId: string;
  team: string; // attacking team (the lineup)
  opponent: string;
  opposingPitcher: string;
  opposingPitcherId: number;
  hrScore: number; // 1-100
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

function targetFromVuln(v: VulnerablePitcherProfile): HrTarget {
  const key = `hr:${v.pitcherId}:${v.opponent}`;
  // Power upside of the attacking lineup is a placeholder; pitcher vulnerability is the real driver.
  const lineupPower = seededInt(key + ":power", 35, 85);
  const parkFactor = seededInt(key + ":park", 40, 80);
  const hrScore = clamp(Math.round(0.5 * v.vulnerabilityScore + 0.3 * lineupPower + 0.2 * parkFactor), 1, 100);
  const label = hrLabelFromScore(hrScore);

  const reasons = [
    `Faces ${v.pitcherName} (vulnerability ${v.vulnerabilityScore}/100)`,
    ...v.attackReasons.slice(0, 2),
  ];
  const riskWarnings = [
    "Lineup spots and weather not yet wired — matchup-level read only.",
    ...(label === "Lotto" || label === "Avoid" ? ["Low modeled HR equity — high variance."] : []),
  ];

  return {
    targetId: key,
    team: v.opponent, // the team batting against this pitcher
    opponent: v.team,
    opposingPitcher: v.pitcherName,
    opposingPitcherId: v.pitcherId,
    hrScore,
    tier: label,
    label,
    reasons,
    riskWarnings,
    confidence: confidenceFromScore(hrScore),
    judgeStatus: "Pending",
    dataQuality: "limited",
  };
}

/** Ranked HR matchup targets for the slate, strongest first. */
export function rankHrTargets(games: NormalizedGame[]): HrTarget[] {
  const vulns = buildVulnerablePitcherReport(games);
  return vulns.map(targetFromVuln).sort((a, b) => b.hrScore - a.hrScore);
}

/**
 * Sneaky HR finder: deliberately skips the most obvious top matchups and surfaces
 * mid-pack spots with a hidden value indicator. Always flagged higher risk.
 */
export function findSneakyHrTargets(games: NormalizedGame[], limit = 6): SneakyHrTarget[] {
  const all = rankHrTargets(games);
  // Skip the obvious top tier; look at the middle band for hidden value.
  const midBand = all.filter((t) => t.hrScore >= 45 && t.hrScore < 72);
  return midBand.slice(0, limit).map((t, i) => ({
    sneakyRank: i + 1,
    team: t.team,
    opponent: t.opponent,
    opposingPitcher: t.opposingPitcher,
    reason: `Under-the-radar spot vs ${t.opposingPitcher}: modeled hard-contact/HR tendency outpaces the market's attention on this game.`,
    risk: t.hrScore >= 55 ? "HIGH" : "EXTREME",
    confidence: t.confidence,
    whatCouldGoWrong: [
      "These are intentionally non-obvious — lower hit rate than headline plays.",
      "Needs lineup confirmation; a bottom-order bat lowers real HR equity.",
    ],
  }));
}
