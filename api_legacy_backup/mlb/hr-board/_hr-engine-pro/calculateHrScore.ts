import type { HrCandidate, HrEligibleHitter, HrRiskTier, HrScoreBreakdown } from "./hrEngineTypes.js";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const PARK_FACTORS: Record<string, number> = {
  "Rate Field": 121,
  "Guaranteed Rate Field": 121,
  "Great American Ball Park": 116,
  "Coors Field": 118,
  "Yankee Stadium": 112,
  "Citizens Bank Park": 110,
  "Fenway Park": 105,
  "Wrigley Field": 105,
  "Dodger Stadium": 104,
  "Camden Yards": 102,
  "Target Field": 102,
  "Minute Maid Park": 101,
  "Rogers Centre": 101,
  "Citi Field": 99,
  "T-Mobile Park": 94,
};

function positionPower(position: string) {
  const p = position.toLowerCase();

  if (p.includes("designated")) return 58;
  if (p.includes("first base")) return 56;
  if (p.includes("third base")) return 54;
  if (p.includes("outfield")) return 53;
  if (p.includes("catcher")) return 50;
  if (p.includes("shortstop")) return 48;
  if (p.includes("second base")) return 46;

  return 45;
}

function hitterPowerFromStats(hitter: HrEligibleHitter) {
  const stats = hitter.hitterStats;

  if (!stats) {
    return {
      score: positionPower(hitter.position),
      reasons: ["No season hitting stats available; using low-confidence position proxy."],
      smallSamplePenalty: 8,
      lowPowerCap: true,
    };
  }

  const atBats = stats.atBats ?? 0;
  const homeRuns = stats.homeRuns ?? 0;
  const slugging = stats.slugging ?? 0;
  const ops = stats.ops ?? 0;
  const hrRate = stats.hrRate ?? 0;
  const isoProxy = stats.isoProxy ?? 0;

  let score = 36;
  score += Math.min(22, homeRuns * 1.05);
  score += Math.min(14, hrRate * 420);
  score += Math.min(10, isoProxy * 55);
  score += Math.min(9, Math.max(0, slugging - 0.38) * 34);
  score += Math.min(5, Math.max(0, ops - 0.70) * 13);

  const reasons: string[] = [
    `${homeRuns} HR this season.`,
    `SLG ${slugging.toFixed(3)}, OPS ${ops.toFixed(3)}.`,
  ];

  let smallSamplePenalty = 0;
  if (atBats > 0 && atBats < 80) {
    smallSamplePenalty = 10;
    reasons.push("Small sample power penalty.");
  } else if (atBats >= 80 && atBats < 150) {
    smallSamplePenalty = 5;
    reasons.push("Moderate sample-size penalty.");
  }

  const lowPowerCap = homeRuns <= 3 && hrRate < 0.025 && isoProxy < 0.16;
  if (lowPowerCap) {
    reasons.push("Low season HR floor.");
  }

  return {
    score: clamp(Math.round(score), 35, 92),
    reasons,
    smallSamplePenalty,
    lowPowerCap,
  };
}

function pitcherVulnerability(hitter: HrEligibleHitter) {
  const stats = hitter.opponentPitcherStats;

  if (!hitter.opponentPitcherName || hitter.opponentPitcherName === "TBD") {
    return {
      score: 35,
      reasons: ["Opposing pitcher is TBD; pitcher vulnerability is low confidence."],
    };
  }

  if (!stats) {
    return {
      score: 52,
      reasons: ["Pitcher season stats unavailable; using neutral pitcher vulnerability."],
    };
  }

  const hr9 = stats.hr9 ?? 0;
  const k9 = stats.k9 ?? 0;
  const bb9 = stats.bb9 ?? 0;
  const whip = stats.whip ?? 0;
  const era = stats.era ?? 0;

  let score = 44;
  score += Math.min(22, hr9 * 10);
  score += Math.min(8, bb9 * 1.6);
  score += Math.min(6, Math.max(0, whip - 1.15) * 14);
  score += Math.min(6, Math.max(0, era - 3.75) * 2.5);

  if (k9 >= 10) score -= 7;
  else if (k9 >= 8.5) score -= 4;

  const reasons = [
    `Pitcher HR/9 ${hr9.toFixed(2)}.`,
    `Pitcher K/9 ${k9.toFixed(2)}, BB/9 ${bb9.toFixed(2)}.`,
  ];

  if (hr9 >= 1.2) reasons.push("Pitcher has elevated HR allowance.");
  if (k9 >= 9) reasons.push("Pitcher strikeout rate adds HR risk suppression.");

  return {
    score: clamp(Math.round(score), 30, 82),
    reasons,
  };
}

function riskTier(score: number): HrRiskTier {
  if (score >= 80) return "Strong";
  if (score >= 72) return "Playable";
  if (score >= 64) return "Sneaky";
  return "Longshot";
}

export function calculateHrScore(hitter: HrEligibleHitter): HrCandidate {
  const rawPark = PARK_FACTORS[hitter.venue] ?? 100;

  const hitterPower = hitterPowerFromStats(hitter);
  const pitcherRisk = pitcherVulnerability(hitter);
  const recentForm = hitter.recentForm;
  const recentPowerScore = recentForm?.recentPowerScore ?? 50;

  const breakdown: HrScoreBreakdown = {
    hitterPower: hitterPower.score,
    pitcherVulnerability: pitcherRisk.score,
    parkFactor: clamp(rawPark, 85, 125),
    recentForm: recentPowerScore,
    lineupConfidence: hitter.lineupStatus === "confirmed" ? 85 : 48,
    riskPenalty: (hitter.opponentPitcherName ? 0 : 12) + hitterPower.smallSamplePenalty,
    finalScore: 0,
  };

  const finalScore = Math.round(
    breakdown.hitterPower * 0.58 +
      breakdown.pitcherVulnerability * 0.18 +
      (breakdown.parkFactor - 100) * 0.16 +
      breakdown.recentForm * 0.08 +
      breakdown.lineupConfidence * 0.05 -
      breakdown.riskPenalty
  );

  let hrScore = clamp(finalScore, 35, 88);

  if (hitterPower.lowPowerCap) {
    hrScore = Math.min(hrScore, 59);
  }
  breakdown.finalScore = hrScore;

  const warnings = [
    "Official lineup not posted yet. Do not treat as confirmed.",
    "HR Engine Pro v2 initial scoring is active. Hitter season/recent Statcast weighting comes next.",
  ];

  if (!hitter.opponentPitcherName) {
    warnings.push("Opposing pitcher missing. Candidate should be treated as watchlist only.");
  }

  const reasons: string[] = [
    `Active MLB roster hitter for ${hitter.team}.`,
    `Projected matchup vs ${hitter.opponentPitcherName ?? "TBD"}.`,
    `Park factor ${rawPark} at ${hitter.venue}.`,
    ...hitterPower.reasons,
    ...pitcherRisk.reasons,
  ];

  if (recentForm) {
    reasons.push(
      `Recent 15-game form: ${recentForm.homeRuns} HR, ${recentForm.extraBaseHits} XBH, ${recentForm.slugging.toFixed(3)} SLG.`
    );

    if (recentForm.recentPowerScore >= 60) {
      reasons.push("Recent power boost.");
    }

    if (recentForm.gamesChecked < 15 || recentForm.atBats < 45) {
      reasons.push("Recent small sample penalty.");
    }
  }

  return {
    playerId: hitter.playerId,
    playerName: hitter.playerName,

    team: hitter.team,
    teamId: hitter.teamId,
    opponent: hitter.opponent,
    opponentTeam: hitter.opponent,
    opponentTeamId: hitter.opponentTeamId,

    gamePk: hitter.gamePk,
    gameId: hitter.gameId,
    venue: hitter.venue,

    opponentPitcherName: hitter.opponentPitcherName,
    opponentPitcherId: hitter.opponentPitcherId,

    lineupStatus: hitter.lineupStatus,
    dataQuality: "projection_preview",
    dataConfidence: hitter.opponentPitcherName ? 70 : 50,

    hrScore,
    riskTier: riskTier(hrScore),
    scoreBreakdown: breakdown,
    recentForm,
    reasons,

    warnings,

    status: "preview",
  };
}
