import { getGameMatchups, getLiveMatchupMatrix } from "../mlb/gameMatchupService";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../../lib/upstashRedis";

type SportKey = "mlb";

type TruthSnapshotOptions = {
  sport?: SportKey;
  date: string;
  live?: boolean;
};

export type MlbTruthSnapshot = {
  sport: "mlb";
  date: string;
  generatedAt: string;
  source: "sports-truth-hub";
  matchups: Awaited<ReturnType<typeof getGameMatchups>>;
  matchupMatrix: Awaited<ReturnType<typeof getLiveMatchupMatrix>>;
};

type LocalTruthCacheEntry = {
  expiresAt: number;
  snapshot: MlbTruthSnapshot;
};

const localTruthCache = new Map<string, LocalTruthCacheEntry>();

function getLocalTruthSnapshot(key: string): MlbTruthSnapshot | null {
  const entry = localTruthCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    localTruthCache.delete(key);
    return null;
  }

  return entry.snapshot;
}

function setLocalTruthSnapshot(key: string, snapshot: MlbTruthSnapshot, ttlSeconds: number): void {
  localTruthCache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    snapshot,
  });
}

/**
 * SportsTruthHub is the single builder for verified sports snapshots.
 *
 * Architecture rule:
 * - Pages read snapshots.
 * - GET routes read snapshots.
 * - This hub builds/refreshes the truth.
 *
 * Phase 1D keeps behavior conservative: it calls existing MLB services
 * without changing frontend contracts yet.
 */
export async function buildSportsTruthSnapshot(
  options: TruthSnapshotOptions
): Promise<MlbTruthSnapshot> {
  const sport = options.sport ?? "mlb";

  if (sport !== "mlb") {
    throw new Error(`Unsupported sport: ${sport}`);
  }

  const ttlSeconds = Number(process.env.SPORTS_TRUTH_HUB_REDIS_TTL_SECONDS ?? 60);
  const redisKey = `sports-truth:${sport}:today:${options.date}`;

  const localCached = getLocalTruthSnapshot(redisKey);
  if (localCached) {
    console.log(`[SPORTS_TRUTH_HUB] local hit sport=${sport} date=${options.date}`);
    return localCached;
  }

  if (isUpstashEnabled()) {
    try {
      const cached = await redisGetJson<MlbTruthSnapshot>(redisKey);
      if (cached) {
        console.log(`[SPORTS_TRUTH_HUB] redis hit sport=${sport} date=${options.date}`);
        return cached;
      }
    } catch (err: any) {
      console.warn("[SPORTS_TRUTH_HUB] redis read fallback:", err?.message);
    }
  }

  console.log(`[SPORTS_TRUTH_HUB] building snapshot sport=${sport} date=${options.date}`);

  const [matchups, matchupMatrix] = await Promise.all([
    getGameMatchups(options.date),
    getLiveMatchupMatrix(options.date),
  ]);

  const snapshot: MlbTruthSnapshot = {
    sport: "mlb",
    date: options.date,
    generatedAt: new Date().toISOString(),
    source: "sports-truth-hub",
    matchups,
    matchupMatrix,
  };

  if (isUpstashEnabled()) {
    try {
      await redisSetJson(redisKey, snapshot, ttlSeconds);
      console.log(`[SPORTS_TRUTH_HUB] redis set sport=${sport} date=${options.date} ttl=${ttlSeconds}s`);
    } catch (err: any) {
      console.warn("[SPORTS_TRUTH_HUB] redis write fallback:", err?.message);
    }
  }

  setLocalTruthSnapshot(redisKey, snapshot, ttlSeconds);
  console.log(`[SPORTS_TRUTH_HUB] local set sport=${sport} date=${options.date} ttl=${ttlSeconds}s`);

  return snapshot;
}
