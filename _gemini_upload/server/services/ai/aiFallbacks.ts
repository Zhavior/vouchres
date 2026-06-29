/**
 * Deterministic, zero-cost fallback text for every AI surface.
 * Used when GEMINI_API_KEY is absent or a call fails — so the product still feels
 * premium without spending. All wording is research-framed and safe.
 */
import { PickCandidate, JudgeVerdict } from "../judging/judgeTypes";

const SAFE_TAIL =
  "Probability-based research for entertainment — not betting advice. No guaranteed outcomes.";

export function pickExplanationFallback(pick: PickCandidate, verdict?: JudgeVerdict): string {
  const lines = [
    `### ${pick.player ?? pick.team ?? "Pick"} — ${pick.market}`,
    `> _Research mode. ${SAFE_TAIL}_`,
    "",
    `**Confidence:** ${verdict?.confidence ?? "Moderate"} · **Risk:** ${verdict?.riskLabel ?? "Balanced"}`,
    "",
    "#### Why it's on the board",
    ...(pick.reasons?.length ? pick.reasons.map((r) => `- ${r}`) : ["- Matchup-level lean from the modeled inputs."]),
    "",
    "#### What could go wrong",
    ...((verdict?.whatCouldGoWrong ?? pick.riskWarnings ?? ["Variance, lineups, and weather can all swing this."]).map(
      (r) => `- ${r}`
    )),
  ];
  return lines.join("\n");
}

export function dailyReportFallback(date: string, gameCount: number, topNote: string): string {
  return [
    `### ⚾ VouchEdge Daily MLB Intelligence — ${date}`,
    `> _Generated locally. ${SAFE_TAIL}_`,
    "",
    `**${gameCount} games on the slate.**`,
    "",
    topNote || "Vulnerable-pitcher and HR matchup models are live; lineup/weather inputs are pending.",
    "",
    "Open the Vulnerable Pitchers, HR Targets, and Run Environment reports for the full breakdown.",
  ].join("\n");
}

export function learningNoteFallback(result: string, originalLogic: string): string {
  return [
    `**Result:** ${result}`,
    `**Original logic:** ${originalLogic}`,
    result.toLowerCase() === "win"
      ? "**Why it worked:** the modeled edge aligned with the outcome — but a single result doesn't confirm the model."
      : result.toLowerCase() === "loss"
      ? "**Why it missed:** variance and/or unmodeled inputs (lineups, weather, bullpen) outweighed the lean."
      : "**Push:** outcome landed on the line; treat as neutral signal.",
    "**Future adjustment:** keep sample size in mind; wire lineup + Statcast inputs to tighten the read.",
  ].join("\n");
}
