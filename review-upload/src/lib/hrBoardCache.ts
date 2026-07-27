import { cacheControlToMs, parseCacheControl } from "./cacheControl";

/** Matches server HR board Cache-Control defaults. */
export const HR_BOARD_DEFAULT_CACHE = {
  maxAgeMs: 30_000,
  staleWhileRevalidateMs: 120_000,
  gcTimeMs: 150_000,
} as const;

let lastHrBoardCacheControl: ReturnType<typeof cacheControlToMs> | null = null;

export function recordHrBoardCacheControl(header: string | null | undefined): void {
  const parsed = cacheControlToMs(parseCacheControl(header));
  if (parsed.maxAgeMs == null && parsed.staleWhileRevalidateMs == null) return;
  lastHrBoardCacheControl = parsed;
}

export function getHrBoardCacheHints() {
  return lastHrBoardCacheControl;
}

export function resolveHrBoardQueryTiming() {
  const hints = getHrBoardCacheHints();
  const staleTime = hints?.maxAgeMs ?? HR_BOARD_DEFAULT_CACHE.maxAgeMs;
  const swrWindow = hints?.staleWhileRevalidateMs ?? HR_BOARD_DEFAULT_CACHE.staleWhileRevalidateMs;
  const gcTime = staleTime + swrWindow;

  return { staleTime, gcTime, refetchInterval: staleTime };
}
