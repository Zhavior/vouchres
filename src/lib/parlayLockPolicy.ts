/** Client mirror of server/lib/parlayLockPolicy.ts */

import { inferLockReason, parlayLockedMessage, type ParlayLockReason } from "./parlayOsState";

export type { ParlayLockReason };

export const PARLAY_LOCKED_MESSAGE =
  "This parlay is locked. Edits and hiding are not allowed.";

export function isPickLocked(row: { locked_at?: string | null; feedLockedAt?: string | null } | null | undefined): boolean {
  return Boolean(row?.locked_at ?? row?.feedLockedAt);
}

export function pickLockReason(row: Record<string, unknown> | null | undefined): ParlayLockReason | null {
  return inferLockReason(row ?? {});
}

export function lockedParlayMessage(row: Record<string, unknown> | null | undefined): string {
  return parlayLockedMessage(pickLockReason(row));
}

export function formatFeedLockTimestamp(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
