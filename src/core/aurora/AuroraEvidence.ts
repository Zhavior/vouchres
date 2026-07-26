export type AuroraEvidenceDirection = "supports" | "opposes" | "neutral";

export type AuroraEvidence<TValue = unknown> = {
  id: string;
  decisionId: string;
  label: string;
  summary: string;
  value?: TValue;
  direction: AuroraEvidenceDirection;
  weight: number;
  confidence: number;
  metadata?: Readonly<Record<string, unknown>>;
};

export type AuroraEvidenceInput<TValue = unknown> = Omit<
  AuroraEvidence<TValue>,
  "weight" | "confidence"
> & {
  weight?: number;
  confidence?: number;
};

const clamp01 = (value: number): number =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export const createAuroraEvidence = <TValue>(
  input: AuroraEvidenceInput<TValue>,
): AuroraEvidence<TValue> => ({
  ...input,
  weight: clamp01(input.weight ?? 1),
  confidence: clamp01(input.confidence ?? 1),
});

export const getEvidenceContribution = (evidence: AuroraEvidence): number => {
  const direction =
    evidence.direction === "supports"
      ? 1
      : evidence.direction === "opposes"
        ? -1
        : 0;

  return direction * evidence.weight * evidence.confidence;
};
