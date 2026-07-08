/**
 * Simple in-memory TTL cache used across the VouchEdge backend so we never spam
 * the MLB API or Gemini. Single-process only (fine for this app); swap for Redis later.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  stale: number;
  sets: number;
  deletes: number;
  inflightReuses: number;
  producerRuns: number;
  producerFailures: number;
  staleFallbacks: number;
}

export class TTLCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private inflight = new Map<string, Promise<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    stale: 0,
    sets: 0,
    deletes: 0,
    inflightReuses: 0,
    producerRuns: 0,
    producerFailures: 0,
    staleFallbacks: 0,
  };

  constructor(private defaultTtlMs: number, private name = "ttlCache") {}

  private log(event: string, key: string, extra = ""): void {
    const debugCache = process.env.DEBUG_CACHE === "true";
    const noisyEvents = new Set(["hit", "miss", "stale", "inflight-reuse"]);

    // Normal cache activity is too noisy during HR/player research warmups.
    // Keep it available with DEBUG_CACHE=true, but do not flood regular dev logs.
    if (!debugCache && noisyEvents.has(event)) return;

    const suffix = extra ? ` ${extra}` : "";
    console.log(`[cache:${this.name}] ${event} ${key}${suffix}`);
  }

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) {
      this.stats.misses++;
      return undefined;
    }
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      this.stats.stale++;
      this.log("stale", key);
      return undefined;
    }
    this.stats.hits++;
    return hit.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
    this.stats.sets++;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
    this.inflight.delete(key);
    this.stats.deletes++;
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      stale: 0,
      sets: 0,
      deletes: 0,
      inflightReuses: 0,
      producerRuns: 0,
      producerFailures: 0,
      staleFallbacks: 0,
    };
  }

  getStats(): CacheStats & { size: number; inflight: number } {
    return {
      ...this.stats,
      size: this.store.size,
      inflight: this.inflight.size,
    };
  }

  /** Synchronous variant for pure computations (no async producer). */
  getOrSetSync(key: string, producer: () => T, ttlMs?: number): T {
    const cached = this.get(key);
    if (cached !== undefined) {
      this.log("hit", key);
      return cached;
    }
    this.log("miss", key);
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
    if (cached !== undefined) {
      this.log("hit", key);
      return cached;
    }

    const running = this.inflight.get(key);
    if (running) {
      this.stats.inflightReuses++;
      this.log("inflight-reuse", key);
      return running;
    }

    this.stats.producerRuns++;
    this.log("miss", key, "starting producer");
    const task = producer()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .catch((err) => {
        this.stats.producerFailures++;
        const stale = this.store.get(key);
        if (stale) {
          this.stats.staleFallbacks++;
          this.log("stale-fallback", key);
          return stale.value;
        }
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
  dailyReport: 10 * 60_000,
  aiExplanation: 24 * 60 * 60_000,
  trust: 10 * 60_000,
} as const;
