// server/services/hr-v2/cache/boundedCache.ts

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheOptions {
  maxSize: number;
  defaultTtlMs: number;
  scope: string; // e.g., 'weather', 'mlb-stats'
}

export class BoundedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;
  public readonly scope: string;

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize;
    this.defaultTtlMs = options.defaultTtlMs;
    this.scope = options.scope;
  }

  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public set(key: string, value: T, customTtlMs?: number): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictStaleOrOldest();
    }

    const ttl = customTtlMs ?? this.defaultTtlMs;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  private evictStaleOrOldest(): void {
    const now = Date.now();
    let oldestKey: string | null = null;
    let oldestExpiresAt = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        // If we found and deleted a stale entry, we've made room
        return;
      }
      if (entry.expiresAt < oldestExpiresAt) {
        oldestExpiresAt = entry.expiresAt;
        oldestKey = key;
      }
    }

    // If no stale entries, evict the one expiring soonest
    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }
}
