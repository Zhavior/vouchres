/** Risk Judge — variance, parlay risk, correlation, missing data, lineup uncertainty. */
import { PickCandidate, SubJudgeResult } from "./judgeTypes";
import { clamp } from "../intelligence/scoring";

export function judgeRisk(pick: PickCandidate): SubJudgeResult {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 70; // start neutral-good, subtract for risk

  if (pick.isParlay) {
    const legs = pick.legs ?? 2;
    score -= (legs - 1) * 9;
    flags.push(`${legs}-leg parlay: each leg multiplies failure points`);
    if (legs >= 4) flags.push("4+ legs is high variance by construction");
  }

  if (/hr|home run/i.test(pick.market)) {
    score -= 8;
    notes.push("HR markets carry high game-to-game variance");
  }

  if (pick.dataQuality === "limited") {
    score -= 12;
    flags.push("Missing lineup/weather/Statcast inputs");
  }

  if ((pick.riskWarnings?.length ?? 0) > 0) {
    notes.push(`${pick.riskWarnings!.length} risk warning(s) attached`);
  }

  score = clamp(Math.round(score), 1, 100);
  notes.unshift(`Risk-adjusted score ${score}/100 (higher = safer)`);
  return { judge: "RiskJudge", score, notes, flags };
}
