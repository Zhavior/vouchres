import type { Judge } from "./types";

const clamp = (n: number) =>
  Math.max(0, Math.min(100, Math.round(n)));

export const formJudge: Judge = (context) => {
  const score = clamp(context.recentForm);

  return {
    id: "form",
    title: "Form Judge",
    score,
    confidence: 86,
    summary:
      score >= 85
        ? "Player is in elite recent form."
        : score >= 70
          ? "Strong recent form."
          : score >= 55
            ? "Average recent form."
            : "Player has been struggling recently.",
    evidence: [
      {
        label: "Recent Form",
        value: context.recentForm,
      },
    ],
  };
};
