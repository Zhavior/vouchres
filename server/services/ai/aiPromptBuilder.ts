/** Builds safe, research-framed prompts for Gemini. Enforces probability language. */
import { PickCandidate, JudgeVerdict } from "../judging/judgeTypes";

export const SAFE_SYSTEM_INSTRUCTION =
  "You are a VouchEdge MLB research analyst. Explain picks using probability and matchup-grade language. " +
  "Never guarantee outcomes. Never use the words lock, guaranteed, free money, can't lose, 100% winner, or insider. " +
  "Always include what could go wrong. Be concise, premium, and honest.";

export function buildPickExplanationPrompt(pick: PickCandidate, verdict?: JudgeVerdict): string {
  return [
    "Write a short, premium research explanation (Markdown) for this MLB pick.",
    `Pick: ${JSON.stringify(pick)}`,
    verdict ? `Judge verdict: ${JSON.stringify(verdict)}` : "",
    "Sections: a one-line confidence/risk summary, 'Why it's on the board' (bullets), and 'What could go wrong' (bullets).",
    "Use probability language. No guarantees.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDailyReportPrompt(summary: {
  date: string;
  gameCount: number;
  topVulnerable: string[];
  topHr: string[];
  topRunEnv: string[];
}): string {
  return [
    `Write a premium daily MLB intelligence brief for ${summary.date} in Markdown.`,
    `Games: ${summary.gameCount}.`,
    `Most vulnerable pitchers: ${summary.topVulnerable.join("; ")}.`,
    `Top HR matchups: ${summary.topHr.join("; ")}.`,
    `Highest run environments: ${summary.topRunEnv.join("; ")}.`,
    "Keep it research-framed, mention risk, and avoid any guarantee language.",
  ].join("\n");
}

export function buildLearningNotePrompt(note: {
  result: string;
  originalLogic: string;
  whatActuallyHappened: string;
}): string {
  return [
    "Write a brief, honest result-learning note (Markdown) for a graded MLB pick.",
    `Result: ${note.result}. Original logic: ${note.originalLogic}. What happened: ${note.whatActuallyHappened}.`,
    "Explain why it won/lost, whether the data was correct or misleading, and one future adjustment.",
    "No hype, no guarantees.",
  ].join("\n");
}
