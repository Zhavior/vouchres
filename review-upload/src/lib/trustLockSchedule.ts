/** Trust ledger commit window — must match server TRUST_LOCK_WINDOW_MS. */
export const TRUST_LOCK_MINUTES = 5;
export const TRUST_LOCK_WARN_MINUTES = 1;

export const TRUST_LOCK_WINDOW_MS = TRUST_LOCK_MINUTES * 60_000;
export const TRUST_LOCK_WARN_MS = (TRUST_LOCK_MINUTES - TRUST_LOCK_WARN_MINUTES) * 60_000;

export type TrustAudience = "private" | "public" | "subscriber";

export function trustLockAtFromCommitted(committedAt: string): Date {
  return new Date(new Date(committedAt).getTime() + TRUST_LOCK_WINDOW_MS);
}

export function trustLockWarnAtFromCommitted(committedAt: string): Date {
  return new Date(new Date(committedAt).getTime() + TRUST_LOCK_WARN_MS);
}

export function trustLockCountdownLabel(trustLockAt: string | null | undefined, now = new Date()): string {
  if (!trustLockAt) return "";
  const ms = new Date(trustLockAt).getTime() - now.getTime();
  if (ms <= 0) return "Locking now…";
  const mins = Math.ceil(ms / 60_000);
  return mins === 1 ? "Locks in 1 minute" : `Locks in ${mins} minutes`;
}

export function classifyParlayHistoryTab(input: {
  trustAudience?: TrustAudience | null;
  visibility?: string | null;
  committedAt?: string | null;
  feedLockedAt?: string | null;
  lockedAt?: string | null;
}): TrustAudience | "draft" {
  const locked = Boolean(input.feedLockedAt ?? input.lockedAt);
  const committed = Boolean(input.committedAt);
  const audience = (input.trustAudience ?? input.visibility ?? "private").toLowerCase() as TrustAudience;

  if (!committed && !locked) return "draft";
  if (!locked) return "private";
  if (audience === "subscriber") return "subscriber";
  if (audience === "public") return "public";
  return "private";
}
