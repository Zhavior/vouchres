export type ConfidenceTier = 'ELITE' | 'STRONG' | 'VALUE' | 'SLEEPER';
export type AuditStatus = 'VERIFIED' | 'FLAGGED_MISSING_COVERAGE' | 'PENDING';
export type CoverageFlag = 'VERIFIED' | 'MISSING' | 'OPTIMAL' | 'ELEVATED' | 'CRITICAL';

export interface BatterRecord {
  id: string;
  name: string;
  team: string;
  opponent: string;
  pitcher: string;
  pitcherHand: 'RHP' | 'LHP';
  venue: string;
  hrpi: number; // Home Run Probability Index (0 - 100)
  avgExitVelo: number; // mph
  barrelPct: number; // percentage
  pitchVuln: number; // vulnerability index (0 - 100)
  parkBoostPct: number; // percentage boost
  isoVsPitchType: number;
  launchAngleMedian: number; // degrees
  impliedOdds: string; // e.g. +310
  modelOdds: string; // e.g. +225
  edgePct: number; // e.g. +8.4%
  tier: ConfidenceTier;
  auditStatus: AuditStatus;
  weatherCoverage: CoverageFlag;
  bullpenFatigue: CoverageFlag;
  umpireProfile: {
    name: string;
    hrBoost: number;
    kRateDiff: number;
    szExpansion: number;
  };
  sha256Hash: string;
  lockTimestamp: string;
  verifiedOutcome?: 'HR_CONFIRMED' | 'NO_HR' | 'IN_PLAY';
}

/**
 * One audited evidence layer behind a candidate. `status` is deliberately not a
 * boolean: a layer can be legitimately absent (indoor venue zeroes the
 * atmospheric vector) without that counting as a failure.
 */
export interface EvidenceItem {
  id: string;
  layer: string;
  source: string;
  status: 'verified' | 'missing';
  detail: string;
  timestamp: string;
}

/** A batter on the HR board, with the evidence stack that produced its HRPI. */
export interface PlayerCandidate {
  id: string;
  name: string;
  pos: string;
  team: string;
  opp: string;
  hand: string;
  pitcherOpp: string;
  pitcherHand: string;
  avgEv: number;
  barrelPct: number;
  hardHitPct: number;
  pitchVuln: number;
  parkBoost: number;
  hrpi: number;
  projHrPct: number;
  auditScore: number;
  evidenceItems: EvidenceItem[];
}

export interface StadiumGeoMetric {
  id: string;
  name: string;
  team: string;
  city: string;
  lat: number;
  lng: number;
  elevationFeet: number;
  tempF: number;
  windMph: number;
  windDirection: string;
  airDensityIndex: number; // kg/m^3 baseline standard 1.225
  hrMultiplier: number;
  roofStatus: 'OPEN' | 'RETRACTABLE_CLOSED' | 'DOME';
  status: 'ACTIVE_SLATE' | 'STANDBY';
}

export interface AuditBlock {
  blockId: number;
  merkleRoot: string;
  timestamp: string;
  slateBattersAudited: number;
  edgesDetected: number;
  coverageRatio: string;
  signature: string;
  status: 'LOCKED' | 'VALIDATING';
}
