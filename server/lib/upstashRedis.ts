/**
 * Optional Upstash Redis REST helper.
 * Safe-by-default: if env vars are missing or Redis fails, callers fall back.
 */

type RedisSetOptions = {
  exSeconds?: number;
  nx?: boolean;
};

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function isUpstashEnabled(): boolean {
  return Boolean(REST_URL && REST_TOKEN);
}

async function redisCommand<T = any>(command: unknown[]): Promise<T | null> {
  if (!REST_URL || !REST_TOKEN) return null;

  const res = await fetch(REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    throw new Error(`Upstash Redis ${res.status}`);
  }

  const data = await res.json();
  return data?.result ?? null;
}

export async function redisGet(key: string): Promise<string | null> {
  if (!isUpstashEnabled()) return null;
  return redisCommand<string>(["GET", key]);
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  if (!isUpstashEnabled()) return null;

  const raw = await redisCommand<string>(["GET", key]);
  if (!raw) return null;

  return JSON.parse(raw) as T;
}

export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!isUpstashEnabled()) return;

  await redisCommand(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
}

export async function redisSet(
  key: string,
  value: string,
  options: RedisSetOptions = {}
): Promise<boolean> {
  if (!isUpstashEnabled()) return false;

  const command: unknown[] = ["SET", key, value];

  if (options.exSeconds) command.push("EX", options.exSeconds);
  if (options.nx) command.push("NX");

  const result = await redisCommand<string>(command);
  return result === "OK";
}

export async function redisDel(key: string): Promise<void> {
  if (!isUpstashEnabled()) return;

  await redisCommand(["DEL", key]);
}

/** Lightweight connectivity probe for readiness/ops. Returns false when Redis is down. */
export async function redisPing(): Promise<boolean> {
  if (!isUpstashEnabled()) return false;
  try {
    const result = await redisCommand<string>(["PING"]);
    return result === "PONG" || result === "pong";
  } catch {
    return false;
  }
}

/**
 * Increment a counter and set TTL on first hit. Returns null when Redis is disabled.
 * Heals keys that lost their TTL (INCR succeeded but EXPIRE failed) so rate-limit
 * counters cannot stick forever and lock an IP/user out of the API.
 */
export async function redisIncr(key: string, ttlSeconds: number): Promise<number | null> {
  if (!isUpstashEnabled()) return null;

  const count = await redisCommand<number>(["INCR", key]);
  if (typeof count !== "number") return null;

  if (ttlSeconds > 0) {
    if (count === 1) {
      await redisCommand(["EXPIRE", key, ttlSeconds]);
    } else {
      const ttl = await redisCommand<number>(["TTL", key]);
      // -1 = no expiry, -2 = missing (shouldn't happen after INCR)
      if (typeof ttl === "number" && ttl < 0) {
        await redisCommand(["EXPIRE", key, ttlSeconds]);
      }
    }
  }

  return count;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
