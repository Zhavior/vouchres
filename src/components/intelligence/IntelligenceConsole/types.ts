export type IntelligenceTier =
  | "S"
  | "A"
  | "B"
  | "C"
  | "Watch";

export interface IntelligenceMetric {
  label: string;
  value: number | string;
  emphasis?: boolean;
}

export interface IntelligenceEvidence {
  id: string;
  title: string;
  description?: string;
  strength: "positive" | "neutral" | "negative";
}

export interface IntelligenceAnalysis {
  score: number;
  edge: number | null;
  confidence: number;

  tier: IntelligenceTier;

  opponent: string;
  pitcherName: string;

  metrics: IntelligenceMetric[];
  evidence: IntelligenceEvidence[];
}

export interface IntelligenceConsoleProps<TPlayer = unknown> {
  player: TPlayer;
  analysis: IntelligenceAnalysis;
}
