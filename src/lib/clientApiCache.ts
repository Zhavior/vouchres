type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Deadline for a cached fetch. This helper had no ceiling, so a stalled request
 * also parked every later caller behind its inflight promise — one hung request
 * became a permanently stuck cache key.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

export async function cachedJsonFetch<T>(
  url: string,
  options: RequestInit = {},
  ttlMs = 30000,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const key = url;
  const now = Date.now();

  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.data as T;
  }

  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // Compose the deadline with any signal the caller already passed in.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const callerSignal = options.signal ?? undefined;
  const onCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", onCallerAbort, { once: true });
  }

  const request = fetch(url, { ...options, signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} for ${url}`);
      }

      const data = (await res.json()) as T;
      cache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .catch((err) => {
      if (timedOut) {
        throw new Error(`Timed out after ${timeoutMs}ms for ${url}`);
      }
      throw err;
    })
    .finally(() => {
      clearTimeout(timer);
      callerSignal?.removeEventListener("abort", onCallerAbort);
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}
