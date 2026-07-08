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

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
