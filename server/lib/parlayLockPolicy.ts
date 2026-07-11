/** Parlay/pick immutability after sharing to the public feed. */

export const PARLAY_LOCKED_MESSAGE =
  "This parlay is locked because it was shared to the feed. Edits and hiding are not allowed.";

export function isPickLocked(row: { locked_at?: string | null } | null | undefined): boolean {
  return Boolean(row?.locked_at);
}
