/**
 * Vouch Card Generator (Section 16)
 *
 * Generates beautiful card data for social posts and shares.
 *
 * Output formats:
 *   - shareText: plain text for Twitter (under 280 chars)
 *   - cardText: multi-line formatted for image card rendering
 *   - VouchCardData: structured for React rendering
 */

import { HrPrediction, VouchCardData, ParlayScanResult } from "./types";
import { DISCLAIMER } from "./constants";

export function generateVouchCard(prediction: HrPrediction): VouchCardData {
  const playerName = prediction.playerName;
  const team = prediction.team;
  const opponent = prediction.opponent;
  const score = prediction.hrScore.toFixed(0);
  const confidence = prediction.confidence.level;
  const tier = prediction.tier.label;
  const probability = (prediction.hrProbability * 100).toFixed(1);

  // Top 3 reasons (cleaned — no emoji prefix for card display)
  const topReasons = prediction.topReasons
    .map(r => r.replace(/^✅\s*/, ""))
    .slice(0, 3);

  // Top risk
  const topRisk = prediction.risks[0]?.replace(/^⚠️\s*/, "") ?? "HR outcomes are low-frequency";

  // Twitter-friendly share text (under 280 chars)
  const shareText = buildShareText(
    playerName, team, opponent, score, confidence, tier, probability, topReasons, topRisk
  );

  // Multi-line card text (for image rendering)
  const cardText = buildCardText(
    playerName, team, opponent, score, confidence, tier, probability, topReasons, topRisk
  );

  return {
    playerName,
    team,
    opponent,
    pickType: "HR",
    score: prediction.hrScore,
    confidence,
    tier,
    topReasons,
    risks: [topRisk],
    probability: prediction.hrProbability,
    disclaimer: DISCLAIMER,
    shareText,
    cardText,
  };
}

/**
 * Generate a vouch card for a parlay (different layout).
 */
export function generateParlayVouchCard(
  parlay: ParlayScanResult
): VouchCardData {
  const legNames = parlay.legs.map(l => l.prediction.playerName).join(" + ");
  const combinedPct = (parlay.combinedProbability * 100).toFixed(4);

  const topReasons = parlay.legs.slice(0, 3).map(l => {
    const p = l.prediction;
    return `${p.playerName}: ${p.hrScore.toFixed(0)}/100 (${p.tier.label})`;
  });

  const topRisk =
    parlay.riskTier === "Lottery"
      ? "Lottery-level combined probability"
      : parlay.correlationWarning?.split("—")[0].trim() ?? "Parlay math compounds quickly";

  const shareText = `VouchEdge ${parlay.legs.length}-Leg HR Parlay\n${legNames}\nCombined: ${combinedPct}%\nRisk: ${parlay.riskLabel}\n${DISCLAIMER}`;

  const cardText = [
    `VouchEdge ${parlay.legs.length}-Leg HR Parlay`,
    `${legNames}`,
    ``,
    `Combined Probability: ${combinedPct}%`,
    `Risk Tier: ${parlay.riskLabel}`,
    `Leg Quality: ${parlay.legQuality}`,
    ``,
    `Model Likes:`,
    ...topReasons.map(r => `✅ ${r}`),
    ``,
    `Risk:`,
    `⚠️ ${topRisk}`,
    ``,
    DISCLAIMER,
  ].join("\n");

  return {
    playerName: legNames,
    team: parlay.legs.map(l => l.prediction.team).join(" / "),
    opponent: parlay.legs.map(l => l.prediction.opponent).join(" / "),
    pickType: "Parlay",
    score: parlay.combinedScore,
    confidence: parlay.riskLabel,
    tier: parlay.riskTier,
    topReasons,
    risks: [topRisk],
    probability: parlay.combinedProbability,
    disclaimer: DISCLAIMER,
    shareText,
    cardText,
  };
}

function buildShareText(
  playerName: string,
  team: string,
  opponent: string,
  score: string,
  confidence: string,
  tier: string,
  probability: string,
  reasons: string[],
  risk: string
): string {
  // Aim for ~270 chars (leaves room for hashtags/URL)
  const lines = [
    `VouchEdge HR Target`,
    `${playerName} (${team} vs ${opponent})`,
    `Score: ${score}/100 | ${probability}% prob | ${confidence}`,
    `Tier: ${tier}`,
    ``,
    `✅ ${reasons[0] ?? "Favorable matchup"}`,
    `⚠️ ${risk}`,
    ``,
    DISCLAIMER,
  ];
  const text = lines.join("\n");
  if (text.length <= 280) return text;

  // Truncate reasons if too long
  const shortLines = [
    `VouchEdge HR Target`,
    `${playerName} (${team} vs ${opponent})`,
    `${score}/100 | ${probability}% | ${tier}`,
    `✅ ${reasons[0] ?? "Favorable matchup"}`,
    DISCLAIMER,
  ];
  return shortLines.join("\n").slice(0, 280);
}

function buildCardText(
  playerName: string,
  team: string,
  opponent: string,
  score: string,
  confidence: string,
  tier: string,
  probability: string,
  reasons: string[],
  risk: string
): string {
  return [
    `VouchEdge HR Target`,
    `${playerName}`,
    `${team} vs ${opponent}`,
    ``,
    `Score: ${score}/100`,
    `Probability: ${probability}%`,
    `Confidence: ${confidence}`,
    `Tier: ${tier}`,
    ``,
    `Model Likes:`,
    ...reasons.map(r => `✅ ${r}`),
    ``,
    `Risk:`,
    `⚠️ ${risk}`,
    ``,
    DISCLAIMER,
  ].join("\n");
}
