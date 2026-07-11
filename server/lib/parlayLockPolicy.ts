/** Parlay/pick immutability after trust ledger or feed share lock. */

import { inferLockReason, parlayLockedMessage, type ParlayLockReason } from "./parlayOsState";

export type { ParlayLockReason };

export const PARLAY_LOCKED_MESSAGE =
  "This parlay is locked. Edits and hiding are not allowed.";

export function isPickLocked(row: { locked_at?: string | null } | null | undefined): boolean {
  return Boolean(row?.locked_at);
}

export function pickLockReason(row: Record<string, unknown> | null | undefined): ParlayLockReason | null {
  return inferLockReason(row ?? {});
}

export function lockedParlayMessage(row: Record<string, unknown> | null | undefined): string {
  return parlayLockedMessage(pickLockReason(row));
}
