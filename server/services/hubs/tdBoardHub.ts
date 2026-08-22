import { isUpstashEnabled, redisGetJson, redisSetJson } from "../../lib/upstashRedis";
import {
  emptyTdBoardV2,
  type TdBoardV2Response,
  type TdBoardV2Snapshot,
} from "../nfl/contracts/tdBoardV2";
import { SportsDataIoTdBoardProvider } from "../nfl/providers/sportsDataIoProvider";
import { persistTdBoardV2Snapshot } from "../nfl/tdBoardSnapshotStore";

const HOT_TTL_MS = Number(process.env.TD_BOARD_V2_HOT_TTL_MS ?? 60_000);
const LAST_GOOD_MS = Number(process.env.TD_BOARD_V2_LAST_GOOD_MS ?? 30 * 60_000);
const REDIS_PREFIX = "td-board:v2";

type CacheEntry = { snapshot: TdBoardV2Snapshot; storedAt: number; expiresAt: number };

const provider = new SportsDataIoTdBoardProvider();
const localCache = new Map<string, CacheEntry>();
const activeBuilds = new Map<string, Promise<TdBoardV2Snapshot>>();
const localLastGood = new Map<string, CacheEntry>();

function encodeCursor(offset: number): string {
  return Buffer.from(`tdv2:${offset}`).toString("base64url");
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const match = /^tdv2:(\d+)$/.exec(decoded);
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

function redisKey(date: string, kind: "hot" | "last-good"): string {
  return `${REDIS_PREFIX}:${kind}:${date}`;
}

async function readRedisEntry(date: string, kind: "hot" | "last-good"): Promise<CacheEntry | null> {
  if (!isUpstashEnabled()) return null;
  try {
    return await redisGetJson<CacheEntry>(redisKey(date, kind));
  } catch (error) {
    console.warn(`[TD_BOARD_V2] redis ${kind} read failed`, (error as Error).message);
    return null;
  }
}

async function writeRedisEntry(date: string, kind: "hot" | "last-good", entry: CacheEntry): Promise<void> {
  if (!isUpstashEnabled()) return;
  try {
    const ttlMs = kind === "hot" ? HOT_TTL_MS : LAST_GOOD_MS;
    await redisSetJson(redisKey(date, kind), entry, Math.max(1, Math.floor(ttlMs / 1000)));
  } catch (error) {
    console.warn(`[TD_BOARD_V2] redis ${kind} write failed`, (error as Error).message);
  }
}

async function buildSnapshot(date: string): Promise<TdBoardV2Snapshot> {
  const snapshot = await provider.fetchBoard({ date });
  const storedAt = Date.now();
  const hotEntry = { snapshot, storedAt, expiresAt: storedAt + HOT_TTL_MS };
  localCache.set(date, hotEntry);
  void writeRedisEntry(date, "hot", hotEntry);

  if (snapshot.connection === "live" || snapshot.connection === "partial") {
    const lastGoodEntry = { snapshot, storedAt, expiresAt: storedAt + LAST_GOOD_MS };
    localLastGood.set(date, lastGoodEntry);
    void writeRedisEntry(date, "last-good", lastGoodEntry);
    void persistTdBoardV2Snapshot(date, snapshot).catch((error) => {
      console.warn("[TD_BOARD_V2] snapshot persistence failed", (error as Error).message);
    });
  }
  return snapshot;
}

async function getSnapshot(date: string): Promise<{ snapshot: TdBoardV2Snapshot; cache: TdBoardV2Response["diagnostics"]["cache"] }> {
  const local = localCache.get(date);
  if (local && local.expiresAt > Date.now()) return { snapshot: local.snapshot, cache: "l1" };

  const remote = await readRedisEntry(date, "hot");
  if (remote && remote.expiresAt > Date.now()) {
    localCache.set(date, remote);
    return { snapshot: remote.snapshot, cache: "l2" };
  }

  const active = activeBuilds.get(date);
  if (active) return { snapshot: await active, cache: "miss" };

  const build = buildSnapshot(date);
  activeBuilds.set(date, build);
  try {
    return { snapshot: await build, cache: "miss" };
  } catch (error) {
    const lastGood = localLastGood.get(date) ?? await readRedisEntry(date, "last-good");
    const age = lastGood ? Date.now() - lastGood.storedAt : Number.POSITIVE_INFINITY;
    if (lastGood && age <= LAST_GOOD_MS) {
      return {
        snapshot: {
          ...lastGood.snapshot,
          connection: "stale",
          warnings: [...lastGood.snapshot.warnings, "Serving a bounded last-good snapshot because the provider refresh failed."],
          servedFromLastGood: true,
          staleAgeMs: age,
        },
        cache: "last_good",
      };
    }
    return {
      snapshot: emptyTdBoardV2("unavailable", (error as Error).message, ["provider_refresh"]),
      cache: "none",
    };
  } finally {
    activeBuilds.delete(date);
  }
}

export async function getTdBoardV2(input: {
  date: string;
  cursor?: string;
  limit?: number;
}): Promise<TdBoardV2Response> {
  const startedAt = performance.now();
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 48)));
  const offset = decodeCursor(input.cursor);
  const { snapshot, cache } = await getSnapshot(input.date);
  const players = snapshot.players.slice(offset, offset + limit);
  const nextOffset = offset + players.length;

  return {
    ...snapshot,
    players,
    pageInfo: {
      limit,
      returned: players.length,
      total: snapshot.players.length,
      nextCursor: nextOffset < snapshot.players.length ? encodeCursor(nextOffset) : null,
    },
    diagnostics: {
      cache,
      durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
    },
  };
}

export function clearTdBoardV2Cache(): void {
  localCache.clear();
  localLastGood.clear();
  activeBuilds.clear();
}

export async function prewarmTdBoardV2(date?: string): Promise<void> {
  const slateDate = date ?? new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Halifax",
  }).format(new Date());
  await getTdBoardV2({ date: slateDate, limit: 48 });
}
