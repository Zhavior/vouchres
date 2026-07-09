export const FEED_BATCH_SIZE = 8;

export function nextVisiblePostCount(
  current: number,
  total: number,
  batchSize = FEED_BATCH_SIZE,
): number {
  return Math.min(current + batchSize, total);
}

export function shouldPrefetchServerFeedPage(input: {
  visiblePostCount: number;
  loadedPostCount: number;
  hasMoreServer: boolean;
  isFetchingServer: boolean;
  batchSize?: number;
}): boolean {
  const batchSize = input.batchSize ?? FEED_BATCH_SIZE;
  const nearEnd = input.visiblePostCount >= Math.max(0, input.loadedPostCount - batchSize);
  return nearEnd && input.hasMoreServer && !input.isFetchingServer;
}
