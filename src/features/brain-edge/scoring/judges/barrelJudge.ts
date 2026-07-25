import type { Judge } from "./types";

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

export const barrelJudge: Judge = (payload) => {
  const hitterPower = payload.scoreBreakdown?.hitterPower ?? 0;
  const recentPower = payload.recentForm?.recentPowerScore ?? 0;
  const hrRate = payload.recentForm?.recentHrRate ?? 0;

  const score = clamp(
    Math.round(
      hitterPower * 0.60 +
      recentPower * 0.30 +
      hrRate * 100 * 0.10
    )
  );

  return {
    id: "barrel",
    title: "Barrel Judge",
    score,
    confidence: payload.player.dataConfidence ?? 80,
    summary:
      score >= 90
        ? "Elite power profile."
        : score >= 75
        ? "Strong power profile."
        : score >= 60
        ? "Above-average power."
        : "Average power profile.",
    evidence: [
      {
        label: "Hitter Power",
        value: hitterPower,
      },
      {
        label: "Recent Power",
        value: recentPower,
      },
      {
        label: "Recent HR Rate",
        value: hrRate,
      },
    ],
  };
};
