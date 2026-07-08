import { randomUUID } from "node:crypto";
import { AppError } from "../errors/AppError";
import { isUpstashEnabled, redisDel, redisGet, redisSet, sleep } from "./upstashRedis";

export type DistributedLockOptions = {
  /** Lock TTL — auto-releases if the holder crashes. */
  ttlSeconds?: number;
  /** Max time to wait for another holder to finish. */
  waitMs?: number;
  pollMs?: number;
};

const DEFAULT_TTL_SECONDS = 600;
const DEFAULT_WAIT_MS = 30_000;
const DEFAULT_POLL_MS = 500;

const memoryWaiters = new Map<string, Promise<void>>();

/**
 * Runs `fn` while holding a cluster-wide lock (Upstash SET NX) or a process-local
 * mutex when Redis is disabled. Safe for idempotent jobs like pending-pick grading.
 */
export async function runWithDistributedLock<T>(
  lockName: string,
  fn: () => Promise<T>,
  options: DistributedLockOptions = {},
): Promise<T> {
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const waitMs = options.waitMs ?? DEFAULT_WAIT_MS;
  const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
  const key = `lock:${lockName}`;

  if (!isUpstashEnabled()) {
    return runWithMemoryLock(lockName, fn);
  }

  const token = randomUUID();
  const deadline = Date.now() + waitMs;

  while (true) {
    const acquired = await redisSet(key, token, { nx: true, exSeconds: ttlSeconds });
    if (acquired) {
      try {
        return await fn();
      } finally {
        try {
          const current = await redisGet(key);
          if (current === token) {
            await redisDel(key);
          }
        } catch (error) {
          console.warn(`[distributed-lock] release-failed ${lockName}`, (error as Error)?.message);
        }
      }
    }

    if (Date.now() >= deadline) {
      throw new AppError({
        status: 409,
        code: "conflict",
        message: "Another operation is already in progress.",
        details: { lock: lockName },
        expose: true,
      });
    }

    await sleep(pollMs);
  }
}

async function runWithMemoryLock<T>(lockName: string, fn: () => Promise<T>): Promise<T> {
  while (memoryWaiters.has(lockName)) {
    await memoryWaiters.get(lockName);
  }

  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  memoryWaiters.set(lockName, gate);

  try {
    return await fn();
  } finally {
    memoryWaiters.delete(lockName);
    release();
  }
}
