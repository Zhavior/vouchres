import { isUpstashEnabled, redisGetJson, redisSetJson } from "../../lib/upstashRedis";
import { buildHrBoardResponse } from "../mlb/hr-engine/buildHrBoardResponse";
import { buildValidatedHrBoard } from "../mlb/hrPipeline";
import { buildHrBoard } from "../mlb/dailyHrBoardService";

const LAST_GOOD_WARNING = "Serving last good snapshot — upstream temporarily unavailable";
const LAST_GOOD_TTL_MS = Number(process.env.VALIDATED_HR_BOARD_LAST_GOOD_MS ?? 60 * 60_000);

type HrBoardSnapshot = Awaited<ReturnType<typeof buildHrBoardResponse>>;

type CacheEntry = {
  expiresAt: number;
  board: HrBoardSnapshot;
};

const localHrBoardCache = new Map<string, CacheEntry>();
const localHrBoardBuilds = new Map<string, Promise<HrBoardSnapshot>>();

function cacheKey(date?: string | null, previewLimit = 350): string {
  return `hr-board:${date ?? "today"}:preview:${previewLimit}`;
}

export async function getCachedHrBoardResponse(input: {
  date?: string | null;
  previewLimit?: number;
} = {}): Promise<HrBoardSnapshot> {
  const previewLimit = input.previewLimit ?? 350;
  const key = cacheKey(input.date, previewLimit);
  const ttlSeconds = Number(process.env.HR_BOARD_HUB_TTL_SECONDS ?? 900);

  const cached = localHrBoardCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[HR_BOARD_HUB] local hit key=${key}`);
    return cached.board;
  }

  if (cached) {
    localHrBoardCache.delete(key);
  }

  const activeBuild = localHrBoardBuilds.get(key);
  if (activeBuild) {
    console.log(`[HR_BOARD_HUB] awaiting local build key=${key}`);
    return activeBuild;
  }

  const buildPromise = (async () => {
    console.log(`[HR_BOARD_HUB] building key=${key}`);

    const board = await buildHrBoardResponse({
      date: input.date ?? undefined,
      previewLimit,
    });

    localHrBoardCache.set(key, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      board,
    });

    console.log(`[HR_BOARD_HUB] local set key=${key} ttl=${ttlSeconds}s`);
    return board;
  })();

  localHrBoardBuilds.set(key, buildPromise);

  try {
    return await buildPromise;
  } finally {
    localHrBoardBuilds.delete(key);
  }
}

type ValidatedHrBoardSnapshot = Awaited<ReturnType<typeof buildValidatedHrBoard>>;
type DeepHrBoardSnapshot = Awaited<ReturnType<typeof buildHrBoard>>;

type ValidatedCacheEntry = {
  expiresAt: number;
  board: ValidatedHrBoardSnapshot;
};

type DeepCacheEntry = {
  expiresAt: number;
  board: DeepHrBoardSnapshot;
};

const localValidatedHrBoardCache = new Map<string, ValidatedCacheEntry>();
const localValidatedHrBoardBuilds = new Map<string, Promise<ValidatedHrBoardSnapshot>>();
const lastGoodValidatedHrBoards = new Map<string, { board: ValidatedHrBoardSnapshot; storedAt: number }>();
const LAST_GOOD_REDIS_PREFIX = "validated-hr-board:last-good";

type LastGoodEntry = { board: ValidatedHrBoardSnapshot; storedAt: number };

export type ValidatedHrBoardResult = ValidatedHrBoardSnapshot & {
  servedFromLastGood?: boolean;
  lastGoodWarnings?: string[];
};

async function persistLastGoodToRedis(key: string, entry: LastGoodEntry): Promise<void> {
  if (!isUpstashEnabled()) return;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${key}`;
  const ttlSeconds = Math.max(1, Math.floor(LAST_GOOD_TTL_MS / 1000));
  try {
    await redisSetJson(redisKey, entry, ttlSeconds);
  } catch (error) {
    console.warn(
      `[HR_BOARD_HUB] redis last-good write failed key=${key}`,
      (error as Error)?.message,
    );
  }
}

async function loadLastGoodFromRedis(key: string): Promise<LastGoodEntry | null> {
  if (!isUpstashEnabled()) return null;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${key}`;
  try {
    const remote = await redisGetJson<LastGoodEntry>(redisKey);
    if (!remote?.board || typeof remote.storedAt !== "number") return null;

    const ageMs = Date.now() - remote.storedAt;
    if (ageMs > LAST_GOOD_TTL_MS) return null;

    lastGoodValidatedHrBoards.set(key, remote);
    console.log(`[HR_BOARD_HUB] redis last-good hit key=${key} ageMs=${ageMs}`);
    return remote;
  } catch (error) {
    console.warn(
      `[HR_BOARD_HUB] redis last-good read failed key=${key}`,
      (error as Error)?.message,
    );
    return null;
  }
}

function rememberLastGoodValidatedBoard(key: string, board: ValidatedHrBoardSnapshot): void {
  const entry: LastGoodEntry = { board, storedAt: Date.now() };
  lastGoodValidatedHrBoards.set(key, entry);
  void persistLastGoodToRedis(key, entry);
}

async function serveLastGoodValidatedBoard(key: string, cause: unknown): Promise<ValidatedHrBoardResult | null> {
  let lastGood = lastGoodValidatedHrBoards.get(key);
  if (!lastGood) {
    lastGood = (await loadLastGoodFromRedis(key)) ?? undefined;
  }
  if (!lastGood) return null;

  const ageMs = Date.now() - lastGood.storedAt;
  if (ageMs > LAST_GOOD_TTL_MS) return null;

  console.warn(
    `[HR_BOARD_HUB] serving last-good validated board key=${key} ageMs=${ageMs}:`,
    cause instanceof Error ? cause.message : String(cause),
  );

  const staleDataWarnings = Array.from(
    new Set([...(lastGood.board.debug?.staleDataWarnings ?? []), LAST_GOOD_WARNING]),
  );

  return {
    ...lastGood.board,
    servedFromLastGood: true,
    lastGoodWarnings: [LAST_GOOD_WARNING],
    debug: {
      ...lastGood.board.debug,
      staleDataWarnings,
      lastRefresh: lastGood.board.debug?.lastRefresh ?? new Date(lastGood.storedAt).toISOString(),
    },
  };
}

/** Test-only reset for hub caches and last-good snapshots. */
export function resetValidatedHrBoardHubForTests(): void {
  localValidatedHrBoardCache.clear();
  localValidatedHrBoardBuilds.clear();
  lastGoodValidatedHrBoards.clear();
}

/** Test-only: force a rebuild on next fetch while keeping last-good snapshots. */
export function expireValidatedHrBoardHubCacheForTests(): void {
  localValidatedHrBoardCache.clear();
}

const localDeepHrBoardCache = new Map<string, DeepCacheEntry>();
const localDeepHrBoardBuilds = new Map<string, Promise<DeepHrBoardSnapshot>>();

function validatedKey(date?: string | null): string {
  return `validated-hr-board:${date ?? "today"}`;
}

function deepKey(date?: string | null): string {
  return `deep-hr-board:${date ?? "today"}`;
}

export async function getCachedValidatedHrBoard(date?: string | null): Promise<ValidatedHrBoardResult> {
  const key = validatedKey(date);
  const ttlSeconds = Number(process.env.VALIDATED_HR_BOARD_HUB_TTL_SECONDS ?? 900);

  const cached = localValidatedHrBoardCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[HR_BOARD_HUB] validated local hit key=${key}`);
    return cached.board;
  }

  if (cached) {
    localValidatedHrBoardCache.delete(key);
  }

  const activeBuild = localValidatedHrBoardBuilds.get(key);
  if (activeBuild) {
    console.log(`[HR_BOARD_HUB] validated awaiting local build key=${key}`);
    return activeBuild;
  }

  const buildPromise = (async (): Promise<ValidatedHrBoardResult> => {
    console.log(`[HR_BOARD_HUB] validated building key=${key}`);
    try {
      const board = await buildValidatedHrBoard(date ?? undefined);

      rememberLastGoodValidatedBoard(key, board);
      localValidatedHrBoardCache.set(key, {
        expiresAt: Date.now() + ttlSeconds * 1000,
        board,
      });

      console.log(`[HR_BOARD_HUB] validated local set key=${key} ttl=${ttlSeconds}s`);
      return board;
    } catch (err) {
      const fallback = await serveLastGoodValidatedBoard(key, err);
      if (fallback) return fallback;
      throw err;
    }
  })();

  localValidatedHrBoardBuilds.set(key, buildPromise);

  try {
    return await buildPromise;
  } finally {
    localValidatedHrBoardBuilds.delete(key);
  }
}

export async function getCachedDeepHrBoard(date?: string | null): Promise<DeepHrBoardSnapshot> {
  const key = deepKey(date);
  const ttlSeconds = Number(process.env.DEEP_HR_BOARD_HUB_TTL_SECONDS ?? 1200);

  const cached = localDeepHrBoardCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[HR_BOARD_HUB] deep local hit key=${key}`);
    return cached.board;
  }

  if (cached) {
    localDeepHrBoardCache.delete(key);
  }

  const activeBuild = localDeepHrBoardBuilds.get(key);
  if (activeBuild) {
    console.log(`[HR_BOARD_HUB] deep awaiting local build key=${key}`);
    return activeBuild;
  }

  const buildPromise = (async () => {
    console.log(`[HR_BOARD_HUB] deep building key=${key}`);
    const board = await buildHrBoard(date ?? undefined);

    localDeepHrBoardCache.set(key, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      board,
    });

    console.log(`[HR_BOARD_HUB] deep local set key=${key} ttl=${ttlSeconds}s`);
    return board;
  })();

  localDeepHrBoardBuilds.set(key, buildPromise);

  try {
    return await buildPromise;
  } finally {
    localDeepHrBoardBuilds.delete(key);
  }
}

