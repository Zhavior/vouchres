export interface EngineEvidence {
  evidence: {
    title: string;
    value: string;
    weight: number;
  }[];

  risks: {
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[];
}
