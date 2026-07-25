import type { BrainContext } from "../brainContext";

export type JudgeId =
  | "barrel"
  | "matchup"
  | "park"
  | "weather"
  | "form"
  | "lineup";

export interface JudgeEvidence {
  label: string;
  value: string | number;
  comparison?: string;
}

export interface JudgeResult {
  id: JudgeId;
  title: string;
  score: number;
  confidence: number;
  summary: string;
  evidence: JudgeEvidence[];
}

export type Judge = (
  context: BrainContext
) => JudgeResult;
