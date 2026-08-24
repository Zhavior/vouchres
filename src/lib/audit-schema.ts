export type AuditStatus = 'VERIFIED' | 'MISS' | 'PARTIAL_COVERAGE' | 'VOID';

export interface AuditReceipt {
  id: string;
  timestamp: string;
  player: string;
  matchup: string;
  hrpiAtLock: number;
  evidenceCoverage: number; // 0-100
  modelId: string;
  status: AuditStatus;
  hash: string;
  metrics: {
    ev: string;
    barrel: string;
    launchAngle: string;
  };
}
