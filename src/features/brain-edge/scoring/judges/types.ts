import type { NormalizedPlayerPayload } from "../../../../adapters/normalized";

export interface JudgeEvidence {
  label: string;
  value: string | number;
  comparison?: string;
}

export interface JudgeResult {
  id: string;
  title: string;
  score: number;
  confidence: number;
  summary: string;
  evidence: JudgeEvidence[];
}

export type Judge = (
  payload: NormalizedPlayerPayload
) => JudgeResult;
