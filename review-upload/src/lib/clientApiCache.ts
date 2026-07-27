type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cachedJsonFetch<T>(
  url: string,
  options: RequestInit = {},
  ttlMs = 30000
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

  const request = fetch(url, options)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} for ${url}`);
      }

      const data = (await res.json()) as T;
      cache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}
