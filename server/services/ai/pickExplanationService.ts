/** Pick explanation service — Gemini-backed with deterministic fallback. */
import { PickCandidate, JudgeVerdict } from "../judging/judgeTypes";
import { runJudgePanel } from "../judging/trustJudgeService";
import { generateText } from "./geminiClient";
import { SAFE_SYSTEM_INSTRUCTION, buildPickExplanationPrompt } from "./aiPromptBuilder";
import { pickExplanationFallback } from "./aiFallbacks";

export interface PickExplanation {
  explanation: string;
  confidenceReason: string;
  riskWarning: string;
  judgeSummary: string;
  verdict: JudgeVerdict;
  source: "live" | "cached" | "fallback" | "no-key";
}

export async function explainPick(pick: PickCandidate): Promise<PickExplanation> {
  const verdict = runJudgePanel(pick);
  const key = `explain:${pick.pickId ?? pick.selection ?? pick.market}:${pick.player ?? pick.team ?? ""}`;
  const result = await generateText({
    cacheKey: key,
    prompt: buildPickExplanationPrompt(pick, verdict),
    systemInstruction: SAFE_SYSTEM_INSTRUCTION,
    fallback: pickExplanationFallback(pick, verdict),
  });

  return {
    explanation: result.text,
    confidenceReason: `Confidence ${verdict.confidence} — final judge score ${verdict.finalScore}/100.`,
    riskWarning: verdict.whatCouldGoWrong[0] ?? "Standard MLB variance applies.",
    judgeSummary: `${verdict.approvalStatus} · Risk: ${verdict.riskLabel}`,
    verdict,
    source: result.status,
  };
}
