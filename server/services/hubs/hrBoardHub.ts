import { buildHrBoardResponse } from "../mlb/hr-engine/buildHrBoardResponse";

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
