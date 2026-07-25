import type { Judge } from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const matchupJudge: Judge = (context) => {
  const score = clamp(context.pitcherVulnerability);

  return {
    id: "matchup",
    title: "Matchup Judge",
    score,
    confidence: 88,
    summary:
      score >= 85
        ? "Excellent pitcher matchup."
        : score >= 70
          ? "Favorable matchup."
          : score >= 55
            ? "Neutral matchup."
            : "Difficult matchup.",
    evidence: [
      {
        label: "Pitcher Vulnerability",
        value: context.pitcherVulnerability,
      },
    ],
  };
};
