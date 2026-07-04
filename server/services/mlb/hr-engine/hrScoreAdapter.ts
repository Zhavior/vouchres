export type HrScoreLike = {
  hrScore?: unknown;
  hrEdge?: unknown;
  finalScore?: unknown;
  score?: unknown;
  batterScore?: unknown;
};

export function toFiniteScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function clampHrScore(value: unknown): number | null {
  const score = toFiniteScore(value);
  if (score == null) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function resolveCanonicalHrScore(input: HrScoreLike): number | null {
  return (
    clampHrScore(input.hrScore) ??
    clampHrScore(input.hrEdge) ??
    clampHrScore(input.finalScore) ??
    clampHrScore(input.score) ??
    clampHrScore(input.batterScore)
  );
}

export function withCanonicalHrScore<T extends HrScoreLike>(candidate: T): T & {
  hrScore: number | null;
  hrEdge: number;
} {
  const hrScore = resolveCanonicalHrScore(candidate);
  const compatibilityScore = hrScore ?? 0;

  return {
    ...candidate,
    hrScore,
    // Compatibility alias. Keep until all frontend consumers migrate to hrScore.
    hrEdge: compatibilityScore,
  };
}
