import type { AuroraAnalysis } from "./types";

export function generateSummary(
  analysis: Pick<
    AuroraAnalysis,
    "playerName" | "verdict" | "confidence"
  >,
): string {
  const player = analysis.playerName ?? "This player";

  return `${player} is rated ${analysis.verdict.toUpperCase()} with ${analysis.confidence}% confidence based on Aurora's current evidence and risk evaluation.`;
}
