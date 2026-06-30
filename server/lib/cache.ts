/**
 * Simple in-memory TTL cache used across the VouchEdge backend so we never spam
 * the MLB API or Gemini. Single-process only (fine for this app); swap for Redis later.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private inflight = new Map<string, Promise<T>>();
  constructor(private defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Synchronous variant for pure computations (no async producer). */
  getOrSetSync(key: string, producer: () => T, ttlMs?: number): T {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = producer();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Return the cached value or run `producer`, cache its result, and return it.
   * Also de-dupes concurrent async calls so expensive producers only run once per key.
   * If the producer throws and a stale value exists, the stale value is returned.
   */
  async getOrSet(key: string, producer: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const running = this.inflight.get(key);
    if (running) return running;

    const task = producer()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .catch((err) => {
        const stale = this.store.get(key);
        if (stale) return stale.value;
        throw err;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, task);
    return task;
  }
}

/** Run at most `limit` concurrent async tasks over `items`. */
export async function limitConcurrency<T, I>(
  items: I[],
  limit: number,
  fn: (item: I, index: number) => Promise<T>
): Promise<T[]> {
  const results: T[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Recommended TTLs (ms) per the VouchEdge caching policy. */
export const TTL = {
  schedule: 5 * 60_000,
  liveFeed: 45_000,
  dailyReport: 20 * 60_000,
  aiExplanation: 24 * 60 * 60_000,
  trust: 10 * 60_000,
} as const;
