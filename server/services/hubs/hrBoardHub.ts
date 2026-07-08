import { buildHrBoardResponse } from "../mlb/hr-engine/buildHrBoardResponse";
import { buildValidatedHrBoard } from "../mlb/hrPipeline";
import { buildHrBoard } from "../mlb/dailyHrBoardService";

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
  const ttlSeconds = Number(process.env.HR_BOARD_HUB_TTL_SECONDS ?? 120);

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

const localDeepHrBoardCache = new Map<string, DeepCacheEntry>();
const localDeepHrBoardBuilds = new Map<string, Promise<DeepHrBoardSnapshot>>();

function validatedKey(date?: string | null): string {
  return `validated-hr-board:${date ?? "today"}`;
}

function deepKey(date?: string | null): string {
  return `deep-hr-board:${date ?? "today"}`;
}

export async function getCachedValidatedHrBoard(date?: string | null): Promise<ValidatedHrBoardSnapshot> {
  const key = validatedKey(date);
  const ttlSeconds = Number(process.env.VALIDATED_HR_BOARD_HUB_TTL_SECONDS ?? 120);

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

  const buildPromise = (async () => {
    console.log(`[HR_BOARD_HUB] validated building key=${key}`);
    const board = await buildValidatedHrBoard(date ?? undefined);

    localValidatedHrBoardCache.set(key, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      board,
    });

    console.log(`[HR_BOARD_HUB] validated local set key=${key} ttl=${ttlSeconds}s`);
    return board;
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
  const ttlSeconds = Number(process.env.DEEP_HR_BOARD_HUB_TTL_SECONDS ?? 300);

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

