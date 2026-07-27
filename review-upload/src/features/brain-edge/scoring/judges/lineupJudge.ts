import type { Judge } from "./types";

const clamp = (n: number) =>
  Math.max(0, Math.min(100, Math.round(n)));

export const lineupJudge: Judge = (context) => {
  const score = clamp(context.lineupConfidence);

  return {
    id: "lineup",
    title: "Lineup Judge",
    score,
    confidence: 84,
    summary:
      score >= 85
        ? "Confirmed premium lineup position."
        : score >= 70
          ? "Strong projected lineup."
          : score >= 55
            ? "Average lineup security."
            : "Lineup position introduces risk.",
    evidence: [
      {
        label: "Lineup Confidence",
        value: context.lineupConfidence,
      },
    ],
  };
};
