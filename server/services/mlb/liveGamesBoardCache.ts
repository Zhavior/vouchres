/**
 * Response-level SWR cache for /api/mlb/live board payloads.
 * Coalesces concurrent rebuilds and serves stale up to SWR window during refresh.
 */
import type { LiveGamesResponse } from "./liveGamesService";
import { LIVE_HUB_SWR_MS, LIVE_HUB_TTL_MS } from "../hubs/liveGameHub";

type BoardCacheEntry = {
  payload: LiveGamesResponse;
  expiresAt: number;
};

const boardCache = new Map<string, BoardCacheEntry>();
const boardBuilds = new Map<string, Promise<LiveGamesResponse>>();

export function resetLiveGamesBoardCacheForTests(): void {
  boardCache.clear();
  boardBuilds.clear();
}

export async function getCachedLiveGamesBoard(
  cacheKey: string,
  producer: () => Promise<LiveGamesResponse>,
): Promise<LiveGamesResponse> {
  const now = Date.now();
  const cached = boardCache.get(cacheKey);

  if (cached) {
    const ageMs = now - new Date(cached.payload.updatedAt).getTime();
    if (cached.expiresAt > now) {
      return cached.payload;
    }
    if (ageMs < LIVE_HUB_SWR_MS) {
      if (!boardBuilds.has(cacheKey)) {
        const refresh = producer()
          .then((payload) => {
            boardCache.set(cacheKey, {
              payload,
              expiresAt: Date.now() + LIVE_HUB_TTL_MS,
            });
            return payload;
          })
          .finally(() => {
            boardBuilds.delete(cacheKey);
          });
        boardBuilds.set(cacheKey, refresh);
      }
      return cached.payload;
    }
    boardCache.delete(cacheKey);
  }

  const active = boardBuilds.get(cacheKey);
  if (active) return active;

  const build = producer()
    .then((payload) => {
      boardCache.set(cacheKey, {
        payload,
        expiresAt: Date.now() + LIVE_HUB_TTL_MS,
      });
      return payload;
    })
    .finally(() => {
      boardBuilds.delete(cacheKey);
    });

  boardBuilds.set(cacheKey, build);
  return build;
}
