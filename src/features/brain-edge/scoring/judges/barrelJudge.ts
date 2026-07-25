import type { Judge } from "./types";

const clamp = (n: number) =>
  Math.max(0, Math.min(100, Math.round(n)));

export const barrelJudge: Judge = (context) => {
  const score = clamp(context.hitterPower);

  return {
    id: "barrel",
    title: "Barrel Judge",
    score,
    confidence: 90,
    summary:
      score >= 85
        ? "Elite quality of contact."
        : score >= 70
        ? "Strong power profile."
        : "Average power profile.",
    evidence: [
      {
        label: "Hitter Power",
        value: context.hitterPower,
      },
    ],
  };
};
