/** Client mirror of server/lib/parlayLockPolicy.ts */

export const PARLAY_LOCKED_MESSAGE =
  "This parlay is locked because it was shared to the feed. Edits and hiding are not allowed.";

export function isPickLocked(row: { locked_at?: string | null; feedLockedAt?: string | null } | null | undefined): boolean {
  return Boolean(row?.locked_at ?? row?.feedLockedAt);
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
