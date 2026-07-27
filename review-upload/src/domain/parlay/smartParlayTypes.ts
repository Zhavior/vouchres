import type { ClientIdentityAssessment } from "../../lib/parlayIdentity";

export type SmartParlayStatus =
  | "pending"
  | "live"
  | "upcoming"
  | "won"
  | "lost"
  | "push"
  | "void"
  | "cancelled";

export interface SmartParlayLeg {
  id: string;
  playerName: string;
  marketLabel: string;
  selection: string;
  teamLabel?: string;
  gameLabel?: string;
  oddsLabel: string;
  headshotUrl: string | null;
  status: SmartParlayStatus;
  statusLabel: string;
  resultLabel: string;
  sport: string;
  gamePk?: string;
  gameId?: string;
  playerId?: string | number | null;
  marketCode?: string | null;
  statTarget?: number | string | null;
  comparator?: string | null;
  eventKey?: string | null;
  actual?: number | null;
  identityComplete: boolean;
  progress?: { label: string; current: number; target: number } | null;
}

export interface SmartParlaySlip {
  id: string;
  sourceId: string;
  publicId: string;
  title: string;
  status: SmartParlayStatus;
  statusLabel: string;
  summary: string;
  oddsLabel: string;
  legCount: number;
  legs: SmartParlayLeg[];
  trustCommittedAt?: string | null;
  trustLockAt?: string | null;
  feedLockedAt?: string | null;
  trustAudience?: "private" | "public" | "subscriber" | null;
  lockReason?: "trust_ledger" | "feed_share" | null;
  backendPickId?: string | null;
  backendSyncState?: string | null;
  createdAt?: string | null;
  isLiveLike: boolean;
  identity: ClientIdentityAssessment;
  slipProgress?: { label: string; current: number; target: number } | null;
  proofPickId: string | null;
}
