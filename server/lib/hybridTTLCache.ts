import { TTLCache } from "./cache";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "./upstashRedis";

/**
 * L1 in-memory TTL cache with optional L2 Upstash Redis for cross-instance sharing.
 * Falls back to memory-only when Redis is disabled or errors.
 * Hot keys hit L1 first to avoid an Upstash RTT on every read.
 */
export class HybridTTLCache<T> {
  private readonly memory: TTLCache<T>;

  constructor(
    private readonly defaultTtlMs: number,
    private readonly name: string,
    private readonly redisKeyPrefix: string,
  ) {
    this.memory = new TTLCache<T>(defaultTtlMs, name);
  }

  async getOrSet(key: string, producer: () => Promise<T>, ttlMs?: number): Promise<T> {
    const effectiveTtlMs = ttlMs ?? this.defaultTtlMs;
    const redisKey = `${this.redisKeyPrefix}:${key}`;

    const local = this.memory.get(key);
    if (local !== undefined) {
      return local;
    }

    if (isUpstashEnabled()) {
      try {
        const remote = await redisGetJson<T>(redisKey);
        if (remote != null) {
          this.memory.set(key, remote, effectiveTtlMs);
          return remote;
        }
      } catch (error) {
        console.warn(`[cache:${this.name}] redis-read-failed ${redisKey}`, (error as Error)?.message);
      }
    }

    const value = await this.memory.getOrSet(key, producer, effectiveTtlMs);

    if (isUpstashEnabled()) {
      const ttlSeconds = Math.max(1, Math.floor(effectiveTtlMs / 1000));
      try {
        await redisSetJson(redisKey, value, ttlSeconds);
      } catch (error) {
        console.warn(`[cache:${this.name}] redis-write-failed ${redisKey}`, (error as Error)?.message);
      }
    }

    return value;
  }

  getStats() {
    return this.memory.getStats();
  }
}
