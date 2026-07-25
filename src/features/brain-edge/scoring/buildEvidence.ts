import type { JudgeResult } from "./judges/types";

export interface EvidenceItem {
  judge: string;
  score: number;
  confidence: number;
  summary: string;
  evidence: {
    label: string;
    value: string | number;
  }[];
}

export function buildEvidence(
  judges: JudgeResult[],
): EvidenceItem[] {
  return judges
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((judge) => ({
      judge: judge.title,
      score: judge.score,
      confidence: judge.confidence,
      summary: judge.summary,
      evidence: judge.evidence,
    }));
}
