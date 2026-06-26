/**
 * Trust Judge — transparency, safe wording, publishability — plus the panel
 * orchestrator that combines all four judges into a single verdict.
 */
import {
  PickCandidate,
  SubJudgeResult,
  JudgeVerdict,
  ApprovalStatus,
  RiskLabel,
} from "./judgeTypes";
import { clamp } from "../intelligence/scoring";
import { judgePickQuality } from "./pickJudgeService";
import { judgeRisk } from "./riskJudgeService";
import { judgeBias } from "./biasJudgeService";

export function judgeTrust(pick: PickCandidate): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 75;

  const hasExplanation = (pick.reasons?.length ?? 0) > 0;
  if (hasExplanation) {
    score += 8;
    notes.push("Transparent explanation present");
  } else {
    score -= 12;
    flags.push("No explanation — fails transparency bar");
  }

  if ((pick.riskWarnings?.length ?? 0) > 0) {
    score += 6;
    notes.push("Risk is disclosed to the user");
  } else {
    flags.push("No risk disclosure attached");
  }

  if (pick.dataQuality === "limited") {
    score -= 6;
    notes.push("Limited data — should be published with a caveat, not as a strong play");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Trust/publishability score ${score}/100`);
  return { judge: "TrustJudge", score, notes, flags };
}

function approval(finalScore: number, riskSafety: number, dataLimited: boolean): ApprovalStatus {
  if (dataLimited && finalScore < 60) return "Needs more data";
  if (finalScore >= 72 && riskSafety >= 55) return "Approved";
  if (finalScore >= 52) return "Playable but risky";
  return "Avoid";
}

function riskLabel(pick: PickCandidate, riskSafety: number): RiskLabel {
  if (pick.isParlay && (pick.legs ?? 2) >= 4) return "Lotto";
  if (/sneaky/i.test(pick.selection ?? "") || /sneaky/i.test((pick.reasons ?? []).join(" "))) return "Sneaky";
  if (riskSafety >= 72) return "Safe";
  if (riskSafety >= 58) return "Balanced";
  if (riskSafety >= 44) return "Risky";
  return "Lotto";
}

/** Run all four judges and synthesize the final, frontend-ready verdict. */
export function runJudgePanel(pick: PickCandidate): JudgeVerdict {
  const quality = judgePickQuality(pick);
  const risk = judgeRisk(pick);
  const bias = judgeBias(pick);
  const trust = judgeTrust(pick);

  const finalScore = clamp(
    Math.round(0.34 * quality.score + 0.26 * risk.score + 0.2 * bias.score + 0.2 * trust.score),
    1,
    100
  );

  const dataLimited = pick.dataQuality === "limited";
  // Hype/overconfident wording is a hard trust failure — it caps approval regardless of score.
  const hypeFlag = bias.flags.find((f) => /hype\/overconfident wording/i.test(f));
  let approvalStatus = approval(finalScore, risk.score, dataLimited);
  if (hypeFlag) approvalStatus = "Avoid";
  const label = riskLabel(pick, risk.score);

  // Surface the hype flag first so the user sees the safety issue immediately.
  const allFlags = [
    ...(hypeFlag ? [hypeFlag] : []),
    ...quality.flags,
    ...risk.flags,
    ...bias.flags.filter((f) => f !== hypeFlag),
    ...trust.flags,
  ];
  const missingData: string[] = [];
  if (dataLimited) missingData.push("Lineups, Statcast, weather not yet wired for this pick");
  if (quality.flags.some((f) => /data/i.test(f))) missingData.push("Low data backing");

  const parlayAllowed = pick.isParlay ? risk.score >= 50 && (pick.legs ?? 2) <= 3 : true;

  const saferAlternative =
    hypeFlag
      ? "Rewrite without guarantee/hype wording and add real supporting data before publishing."
      : approvalStatus === "Avoid" || label === "Lotto"
      ? "Consider a lower-variance market (e.g. total bases or team total) instead of the HR/parlay line."
      : null;

  return {
    finalScore,
    approvalStatus,
    riskLabel: label,
    confidence: finalScore >= 75 ? "Strong" : finalScore >= 58 ? "Moderate" : "Speculative",
    judgeNotes: [
      ...quality.notes.slice(0, 1),
      ...risk.notes.slice(0, 1),
      ...bias.notes.slice(0, 1),
      ...trust.notes.slice(0, 1),
    ],
    whatCouldGoWrong: [
      ...(pick.riskWarnings ?? []),
      ...allFlags.slice(0, 3),
    ],
    missingData,
    parlayAllowed,
    saferAlternative,
  };
}
