export type AuroraTrustStatus =
  | 'confirmed'
  | 'projected'
  | 'limited'
  | 'blocked'
  | 'unavailable';

export interface AuroraTrustPresentation {
  status: AuroraTrustStatus;
  label: string;
  detail: string;
  source: string | null;
  updatedAt: string | null;
}

export interface AuroraEvidenceMetric {
  id: string;
  label: string;
  value: string | null;
  detail: string;
}

export interface AuroraDecisionPresentation {
  player: {
    name: string;
    team: string | null;
    opponent: string | null;
    pitcher: string | null;
    headshot: string | null;
  };
  answer: {
    eyebrow: string;
    title: string;
    summary: string;
    score: number | null;
    confidence: number | null;
    actionLabel: string;
  };
  reasons: string[];
  risks: string[];
  evidence: AuroraEvidenceMetric[];
  trust: AuroraTrustPresentation;
}
