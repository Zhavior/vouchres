import {
  CircuitOpenError,
  getMlbStatsCircuitBreaker,
  isMlbStatsUrl,
} from "./circuitBreaker";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type SportsFetchOptions = {
  cacheKey?: string;
  ttlMs?: number;
  staleIfErrorMs?: number;
  timeoutMs?: number;
  retries?: number;
  debugLabel?: string;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
const stats = {
  requests: 0,
  cacheHits: 0,
  inflightReuses: 0,
  upstreamSuccesses: 0,
  upstreamFailures: 0,
  staleIfErrorHits: 0,
};

const DEFAULT_TIMEOUT_MS = Number(process.env.SPORTS_HTTP_TIMEOUT_MS ?? 8_000);
const DEFAULT_RETRIES = Number(process.env.SPORTS_HTTP_RETRIES ?? 1);
const MAX_CACHE_ENTRIES = Number(process.env.SPORTS_HTTP_MAX_CACHE_ENTRIES ?? 1_000);

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  while (cache.size > MAX_CACHE_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestExpiresAt = Number.POSITIVE_INFINITY;

    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < oldestExpiresAt) {
        oldestKey = key;
        oldestExpiresAt = entry.expiresAt;
      }
    }

    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

async function sportsFetch<T>(
  url: string,
  parse: (res: Response) => Promise<T>,
  options: SportsFetchOptions = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? 0;
  const staleIfErrorMs = options.staleIfErrorMs ?? 0;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const key = options.cacheKey ?? url;
  const label = options.debugLabel ?? "sportsHttp";

  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    stats.cacheHits++;
    return cached.value;
  }

  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) {
    stats.inflightReuses++;
    return existing;
  }

  const mlbBreaker = isMlbStatsUrl(url) ? getMlbStatsCircuitBreaker() : null;

  const request = (async () => {
    let lastError: unknown;
    stats.requests++;

    if (mlbBreaker && !mlbBreaker.canExecute()) {
      throw new CircuitOpenError(
        "mlb_stats_api",
        `MLB Stats API circuit open — refusing upstream call for ${redactUrl(url)}`
      );
    }

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const started = Date.now();

        if (process.env.DEBUG_SPORTS_HTTP === "true") {
          console.log(`[${label}] request ${redactUrl(url)} attempt=${attempt + 1}`);
        }

        const res = await fetchWithTimeout(url, timeoutMs);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} for ${redactUrl(url)}`);
        }

        const data = await parse(res);

        if (ttlMs > 0) {
          cache.set(key, { value: data, expiresAt: Date.now() + ttlMs });
          pruneCache();
        }

        if (process.env.DEBUG_SPORTS_HTTP === "true") {
          console.log(`[${label}] complete ${Date.now() - started}ms`);
        }

        mlbBreaker?.recordSuccess();
        stats.upstreamSuccesses++;
        return data;
      } catch (err) {
        lastError = err;
        if (!(err instanceof CircuitOpenError)) {
          mlbBreaker?.recordFailure();
        }
        if (attempt >= retries) break;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`${label} request failed`);
  })();

  inFlight.set(key, request);

  try {
    return await request;
  } catch (err) {
    const stale = cache.get(key) as CacheEntry<T> | undefined;
    const staleAgeMs = stale ? Date.now() - stale.expiresAt : Number.POSITIVE_INFINITY;

    if (stale && staleIfErrorMs > 0 && staleAgeMs <= staleIfErrorMs) {
      console.warn(`[${label}] stale-if-error ${redactUrl(url)} ageMs=${Math.max(0, staleAgeMs)}`);
      stats.staleIfErrorHits++;
      return stale.value;
    }

    if (err instanceof CircuitOpenError && stale) {
      console.warn(`[${label}] circuit-open stale fallback ${redactUrl(url)} ageMs=${Math.max(0, staleAgeMs)}`);
      stats.staleIfErrorHits++;
      return stale.value;
    }

    stats.upstreamFailures++;
    throw err;
  } finally {
    inFlight.delete(key);
  }
}

export async function sportsFetchJson<T>(url: string, options: SportsFetchOptions = {}): Promise<T> {
  return sportsFetch<T>(url, (res) => res.json() as Promise<T>, options);
}

export async function sportsFetchText(url: string, options: SportsFetchOptions = {}): Promise<string> {
  return sportsFetch<string>(url, (res) => res.text(), options);
}

export function getSportsHttpStats() {
  return {
    ...stats,
    cacheSize: cache.size,
    maxCacheEntries: MAX_CACHE_ENTRIES,
    inflight: inFlight.size,
  };
}
