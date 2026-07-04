type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

const DEFAULT_TIMEOUT_MS = Number(process.env.SPORTS_HTTP_TIMEOUT_MS ?? 8_000);
const DEFAULT_RETRIES = Number(process.env.SPORTS_HTTP_RETRIES ?? 1);

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

export async function sportsFetchJson<T>(
  url: string,
  options: {
    cacheKey?: string;
    ttlMs?: number;
    timeoutMs?: number;
    retries?: number;
    debugLabel?: string;
  } = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? 0;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const key = options.cacheKey ?? url;
  const label = options.debugLabel ?? "sportsHttp";

  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const request = (async () => {
    let lastError: unknown;

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

        const data = (await res.json()) as T;

        if (ttlMs > 0) {
          cache.set(key, { value: data, expiresAt: Date.now() + ttlMs });
        }

        if (process.env.DEBUG_SPORTS_HTTP === "true") {
          console.log(`[${label}] complete ${Date.now() - started}ms`);
        }

        return data;
      } catch (err) {
        lastError = err;
        if (attempt >= retries) break;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`${label} request failed`);
  })();

  inFlight.set(key, request);

  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
}
