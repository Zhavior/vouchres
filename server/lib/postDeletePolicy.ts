/** Parlay feed posts can be deleted only within this window after creation. */
export const PARLAY_POST_DELETE_WINDOW_MS = 30 * 60 * 1000;

export function canDeleteParlayPost(createdAt: string | Date, now: Date = new Date()): boolean {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return now.getTime() - created.getTime() < PARLAY_POST_DELETE_WINDOW_MS;
}

export const PARLAY_POST_LOCKED_MESSAGE = 'Locked in your history after 30 minutes';
