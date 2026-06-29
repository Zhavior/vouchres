/** AI learning-note generator — Gemini-backed with deterministic fallback. */
import { generateText } from "./geminiClient";
import { SAFE_SYSTEM_INSTRUCTION, buildLearningNotePrompt } from "./aiPromptBuilder";
import { learningNoteFallback } from "./aiFallbacks";

export interface LearningNoteInput {
  pickId: string;
  result: "win" | "loss" | "push";
  originalLogic: string;
  whatActuallyHappened?: string;
}

export async function generateLearningNote(input: LearningNoteInput): Promise<{ note: string; source: string }> {
  const result = await generateText({
    cacheKey: `learn:${input.pickId}:${input.result}`,
    prompt: buildLearningNotePrompt({
      result: input.result,
      originalLogic: input.originalLogic,
      whatActuallyHappened: input.whatActuallyHappened ?? "Final result recorded.",
    }),
    systemInstruction: SAFE_SYSTEM_INSTRUCTION,
    fallback: learningNoteFallback(input.result, input.originalLogic),
  });
  return { note: result.text, source: result.status };
}
