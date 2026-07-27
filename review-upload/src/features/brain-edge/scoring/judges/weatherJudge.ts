import type { Judge } from "./types";

const clamp = (n: number) =>
  Math.max(0, Math.min(100, Math.round(n)));

export const weatherJudge: Judge = (context) => {
  const score = clamp(
    Number(context.payload.matchup?.weatherBoost ?? 50),
  );

  return {
    id: "weather",
    title: "Weather Judge",
    score,
    confidence: 82,
    summary:
      score >= 85
        ? "Excellent weather conditions."
        : score >= 70
          ? "Favorable weather."
          : score >= 55
            ? "Neutral weather."
            : "Poor weather conditions.",
    evidence: [
      {
        label: "Weather Boost",
        value: context.payload.matchup?.weatherBoost ?? "N/A",
      },
    ],
  };
};
