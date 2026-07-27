import type { Judge } from "./types";

const clamp = (n: number) =>
  Math.max(0, Math.min(100, Math.round(n)));

export const parkJudge: Judge = (context) => {
  const score = clamp(context.parkFactor);

  return {
    id: "park",
    title: "Park Judge",
    score,
    confidence: 84,
    summary:
      score >= 85
        ? "Excellent home run environment."
        : score >= 70
          ? "Positive hitting environment."
          : score >= 55
            ? "Neutral ballpark."
            : "Pitcher-friendly park.",
    evidence: [
      {
        label: "Park Factor",
        value: context.parkFactor,
      },
    ],
  };
};
