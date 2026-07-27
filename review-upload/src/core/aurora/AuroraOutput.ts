export type AuroraOutputStatus =
  "recommended" | "caution" | "insufficient-evidence" | "rejected";

export type AuroraReason = {
  code: string;
  title: string;
  explanation: string;
  evidenceIds: readonly string[];
  importance: number;
};

export type AuroraRisk = {
  code: string;
  title: string;
  explanation: string;
  severity: "low" | "medium" | "high" | "critical";
  evidenceIds?: readonly string[];
};

export type AuroraOutput<TRecommendation = unknown> = {
  decisionId: string;
  status: AuroraOutputStatus;
  recommendation?: TRecommendation;
  confidence: number;
  score: number;
  headline: string;
  explanation: string;
  reasons: readonly AuroraReason[];
  risks: readonly AuroraRisk[];
  generatedAt: string;
  modelVersion?: string;
  metadata?: Readonly<Record<string, unknown>>;
};
