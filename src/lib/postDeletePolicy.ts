/** Parlay feed posts can be deleted only within this window after creation. */
export const PARLAY_POST_DELETE_WINDOW_MS = 30 * 60 * 1000;

export function isParlayFeedPost(post: { postType?: string }): boolean {
  return post.postType === 'PARLAY';
}

export function canDeleteFeedPost(
  post: { postType?: string; timestamp?: string },
  now: Date = new Date(),
): boolean {
  if (!isParlayFeedPost(post)) return true;
  if (!post.timestamp) return false;
  const created = new Date(post.timestamp);
  if (Number.isNaN(created.getTime())) return false;
  return now.getTime() - created.getTime() < PARLAY_POST_DELETE_WINDOW_MS;
}

export function parlayPostDeleteLockedReason(): string {
  return 'Locked in your history after 30 minutes';
}

export function parlayPostDeleteRemainingMs(
  post: { timestamp?: string },
  now: Date = new Date(),
): number {
  if (!post.timestamp) return 0;
  const created = new Date(post.timestamp);
  if (Number.isNaN(created.getTime())) return 0;
  return Math.max(0, PARLAY_POST_DELETE_WINDOW_MS - (now.getTime() - created.getTime()));
}
