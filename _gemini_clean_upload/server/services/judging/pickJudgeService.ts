/** Pick Judge — scores matchup strength, data quality, form, market logic, confidence. */
import { PickCandidate, SubJudgeResult } from "./judgeTypes";
import { clamp } from "../intelligence/scoring";

export function judgePickQuality(pick: PickCandidate): SubJudgeResult {
  const base = pick.score ?? 50;
  const notes: string[] = [];
  const flags: string[] = [];

  let score = base;

  // Data quality moves the needle.
  if (pick.dataQuality === "full") score += 6;
  else if (pick.dataQuality === "limited") {
    score -= 10;
    flags.push("Limited data backing this pick");
  }

  // Reasoning depth.
  const reasonCount = pick.reasons?.length ?? 0;
  if (reasonCount >= 2) {
    score += 4;
    notes.push("Multiple matchup reasons cited");
  } else {
    flags.push("Thin reasoning — only one or zero supporting factors");
  }

  // Market logic sanity: HR/lotto markets are inherently lower hit-rate.
  if (/hr|home run|lotto/i.test(pick.market)) {
    notes.push("HR-type market: high payout, naturally lower hit rate");
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Matchup/quality base score ${score}/100`);
  return { judge: "PickJudge", score, notes, flags };
}
