export type AuroraVerdict =
  | "elite"
  | "strong"
  | "watch"
  | "avoid";

export interface AuroraEvidence {
  id: string;
  title: string;
  description: string;
  weight: number;
}

export interface AuroraRisk {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface AuroraSource {
  id: string;
  label: string;
  value?: string;
}

export interface AuroraAnalysis {
  version: string;
  generatedAt: string;

  sport: string;
  market: string;

  playerId?: string;
  playerName?: string;

  verdict: AuroraVerdict;

  auroraScore: number;
  confidence: number;

  evidence: AuroraEvidence[];
  risks: AuroraRisk[];

  recommendation: string;
  summary: string;
  explanation: string;

  sources: AuroraSource[];
}
