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

export type AuroraEvidenceInput<TValue = unknown> = AuroraEvidence<TValue>;

const clamp01 = (value: number): number =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export const createAuroraEvidence = <TValue>(
  input: AuroraEvidenceInput<TValue>,
): AuroraEvidence<TValue> => ({
  ...input,
  weight: clamp01(input.weight),
  confidence: clamp01(input.confidence),
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
