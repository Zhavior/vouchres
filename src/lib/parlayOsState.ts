/**
 * ParlayOS canonical record + outcome state — single vocabulary for Hub, feed, and trust UI.
 */

export type ParlayLockReason = "trust_ledger" | "feed_share";

export type ParlayRecordState =
  | "DRAFT"
  | "SAVED"
  | "COMMITTED"
  | "LOCKED"
  | "ANCHORED"
  | "ARCHIVED";

export type ParlayOutcomeState =
  | "PENDING"
  | "LIVE"
  | "READY_TO_GRADE"
  | "WON"
  | "LOST"
  | "VOID"
  | "PUSH";

export type ParlayProofState = "none" | "hash" | "anchored";

export interface ParlayOsInput {
  id?: string | null;
  committed_at?: string | null;
  committedAt?: string | null;
  trustCommittedAt?: string | null;
  locked_at?: string | null;
  feedLockedAt?: string | null;
  lock_reason?: string | null;
  lockReason?: string | null;
  proof_hash?: string | null;
  proofHash?: string | null;
  ots_stamped_at?: string | null;
  otsStampedAt?: string | null;
  status?: string | null;
  user_hidden_at?: string | null;
  userHiddenAt?: string | null;
}

export interface ParlayOsSnapshot {
  recordState: ParlayRecordState;
  outcomeState: ParlayOutcomeState;
  lockReason: ParlayLockReason | null;
  proofState: ParlayProofState;
  recordLabel: string;
  lockReasonLabel: string | null;
  proofLabel: string;
  outcomeLabel: string;
}

const RECORD_LABELS: Record<ParlayRecordState, string> = {
  DRAFT: "Draft",
  SAVED: "Saved",
  COMMITTED: "Commit window",
  LOCKED: "Locked",
  ANCHORED: "Anchored",
  ARCHIVED: "Archived",
};

const OUTCOME_LABELS: Record<ParlayOutcomeState, string> = {
  PENDING: "Pending",
  LIVE: "Live",
  READY_TO_GRADE: "Ready to grade",
  WON: "Won",
  LOST: "Lost",
  VOID: "Void",
  PUSH: "Push",
};

export function normalizeLockReason(value: unknown): ParlayLockReason | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "trust_ledger" || raw === "feed_share") return raw;
  return null;
}

export function inferLockReason(input: ParlayOsInput): ParlayLockReason | null {
  const explicit = normalizeLockReason(input.lock_reason ?? input.lockReason);
  if (explicit) return explicit;

  const lockedAt = input.locked_at ?? input.feedLockedAt;
  if (!lockedAt) return null;

  const committed = Boolean(input.committed_at ?? input.committedAt ?? input.trustCommittedAt);
  return committed ? "trust_ledger" : "feed_share";
}

export function resolveParlayRecordState(input: ParlayOsInput): ParlayRecordState {
  if (input.user_hidden_at ?? input.userHiddenAt) return "ARCHIVED";
  if (!input.id) return "DRAFT";

  const lockedAt = input.locked_at ?? input.feedLockedAt;
  const committed = Boolean(input.committed_at ?? input.committedAt ?? input.trustCommittedAt);
  const anchored = Boolean(input.ots_stamped_at ?? input.otsStampedAt);

  if (lockedAt && anchored) return "ANCHORED";
  if (lockedAt) return "LOCKED";
  if (committed) return "COMMITTED";
  return "SAVED";
}

export function resolveParlayOutcomeState(status?: string | null): ParlayOutcomeState {
  const raw = String(status ?? "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (raw.includes("won") || raw === "win") return "WON";
  if (raw.includes("lost") || raw === "loss") return "LOST";
  if (raw.includes("void")) return "VOID";
  if (raw.includes("push")) return "PUSH";
  if (raw.includes("ready") && raw.includes("grade")) return "READY_TO_GRADE";
  if (raw.includes("live") || raw.includes("in_progress") || raw.includes("active")) return "LIVE";
  return "PENDING";
}

export function resolveParlayProofState(input: ParlayOsInput): ParlayProofState {
  if (input.ots_stamped_at ?? input.otsStampedAt) return "anchored";
  if (input.proof_hash ?? input.proofHash) return "hash";
  return "none";
}

export function lockReasonLabel(reason: ParlayLockReason | null): string | null {
  if (reason === "trust_ledger") return "Trust ledger lock";
  if (reason === "feed_share") return "Feed share lock";
  return null;
}

export function parlayLockedMessage(reason: ParlayLockReason | null): string {
  if (reason === "trust_ledger") {
    return "This parlay is locked on your trust ledger. Edits and hiding are not allowed.";
  }
  if (reason === "feed_share") {
    return "This parlay is locked because it was shared to the feed. Edits and hiding are not allowed.";
  }
  return "This parlay is locked. Edits and hiding are not allowed.";
}

export function resolveParlayOsSnapshot(input: ParlayOsInput): ParlayOsSnapshot {
  const recordState = resolveParlayRecordState(input);
  const outcomeState = resolveParlayOutcomeState(input.status);
  const lockReason = inferLockReason(input);
  const proofState = resolveParlayProofState(input);

  const proofLabel =
    proofState === "anchored" ? "OTS anchored" :
    proofState === "hash" ? "Proof hash" :
    "No proof yet";

  return {
    recordState,
    outcomeState,
    lockReason,
    proofState,
    recordLabel: RECORD_LABELS[recordState],
    lockReasonLabel: lockReasonLabel(lockReason),
    proofLabel,
    outcomeLabel: OUTCOME_LABELS[outcomeState],
  };
}
