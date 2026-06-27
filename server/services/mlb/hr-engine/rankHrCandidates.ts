import type { HrCandidate } from "./hrEngineTypes";

export function rankHrCandidates(candidates: HrCandidate[], previewLimit = 50) {
  const safeLimit = Math.max(10, Math.min(350, previewLimit));

  const ranked = [...candidates].sort((a, b) => {
    if (b.hrScore !== a.hrScore) return b.hrScore - a.hrScore;
    if (b.dataConfidence !== a.dataConfidence) return b.dataConfidence - a.dataConfidence;
    return a.playerName.localeCompare(b.playerName);
  });

  return {
    ranked,
    projectedCandidates: ranked.slice(0, safeLimit),
    previewLimit: safeLimit,
  };
}
