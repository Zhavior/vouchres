import type { HrResearchResponse } from "../../../src/types/hrResearch";
import { safeParseHrResearchResponse } from "../../../src/schemas/hrResearchSchema";
import { TTLCache } from "../../lib/cache";
import {
  isUpstashEnabled,
  redisGetJson,
  redisSetJson,
} from "../../lib/upstashRedis";
import {
  buildHrResearchResponse,
  type BuildHrResearchInput,
} from "./hrResearchResponse";

type AnyRecord = Record<string, unknown>;

type ResearchSnapshotEntry = {
  research: HrResearchResponse;
  createdAt: string;
};

export type HrResearchSnapshotSource =
  | "memory"
  | "redis"
  | "fresh";

export type HrResearchSnapshotResult = {
  research: HrResearchResponse;
  source: HrResearchSnapshotSource;
};

const LOCAL_TTL_MS = Number(
  process.env.HR_RESEARCH_SNAPSHOT_TTL_MS ?? 5 * 60_000,
);

const REDIS_TTL_SECONDS = Number(
  process.env.HR_RESEARCH_SNAPSHOT_REDIS_TTL_SECONDS ?? 10 * 60,
);

const snapshotCache = new TTLCache<ResearchSnapshotEntry>(
  LOCAL_TTL_MS,
  "mlb:hrResearchSnapshot",
);

function finiteInteger(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(parsed) ? parsed : null;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function safeKeyPart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 160);
}

function researchSnapshotKey(
  candidate: AnyRecord,
  generatedAt?: string | null,
): string {
  const playerId = finiteInteger(candidate.playerId);

  if (!playerId || playerId <= 0) {
    throw new Error(
      "Cannot create HR research snapshot key without a valid playerId.",
    );
  }

  const pitcherId =
    finiteInteger(
      candidate.opponentPitcherId
        ?? candidate.pitcherId
        ?? candidate.probablePitcherId,
    ) ?? 0;

  const gamePk =
    finiteInteger(candidate.gamePk ?? candidate.gameId) ?? 0;

  const modelVersion = safeKeyPart(
    text(
      candidate.modelVersion ?? candidate.engineVersion,
      "unversioned",
    ),
  );

  const boardVersion = safeKeyPart(
    text(
      generatedAt ?? candidate.lastUpdated,
      "unknown-generation",
    ),
  );

  return [
    "hr-research-snapshot:v1",
    playerId,
    pitcherId,
    gamePk,
    modelVersion,
    boardVersion,
  ].join(":");
}

function redisKey(localKey: string): string {
  return `vouchedge:${localKey}`;
}

function validSnapshotEntry(
  value: unknown,
): ResearchSnapshotEntry | null {
  if (
    typeof value !== "object"
    || value === null
    || Array.isArray(value)
  ) {
    return null;
  }

  const entry = value as Partial<ResearchSnapshotEntry>;
  const parsed = safeParseHrResearchResponse(entry.research);

  if (!parsed.success) return null;

  return {
    research: parsed.data as HrResearchResponse,
    createdAt:
      typeof entry.createdAt === "string"
        ? entry.createdAt
        : new Date().toISOString(),
  };
}

async function readRedisSnapshot(
  key: string,
): Promise<ResearchSnapshotEntry | null> {
  if (!isUpstashEnabled()) return null;

  try {
    const remote = await redisGetJson<unknown>(redisKey(key));
    return validSnapshotEntry(remote);
  } catch (error) {
    console.warn(
      `[HR_RESEARCH_SNAPSHOT] redis read failed key=${key}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

async function persistRedisSnapshot(
  key: string,
  entry: ResearchSnapshotEntry,
): Promise<void> {
  if (!isUpstashEnabled()) return;

  try {
    await redisSetJson(
      redisKey(key),
      entry,
      Math.max(30, REDIS_TTL_SECONDS),
    );
  } catch (error) {
    console.warn(
      `[HR_RESEARCH_SNAPSHOT] redis write failed key=${key}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function getMaterializedHrResearch(
  input: BuildHrResearchInput,
): Promise<HrResearchSnapshotResult> {
  const key = researchSnapshotKey(
    input.candidate,
    input.generatedAt,
  );

  const local = snapshotCache.get(key);

  if (local) {
    console.log(
      `[HR_RESEARCH_SNAPSHOT] memory hit playerId=${local.research.player.id}`,
    );

    return {
      research: local.research,
      source: "memory",
    };
  }

  let producerSource: HrResearchSnapshotSource = "fresh";

  const entry = await snapshotCache.getOrSet(
    key,
    async () => {
      const remote = await readRedisSnapshot(key);

      if (remote) {
        producerSource = "redis";

        console.log(
          `[HR_RESEARCH_SNAPSHOT] redis hit playerId=${remote.research.player.id}`,
        );

        return remote;
      }

      const startedAt = Date.now();
      const research = await buildHrResearchResponse(input);

      const fresh: ResearchSnapshotEntry = {
        research,
        createdAt: new Date().toISOString(),
      };

      void persistRedisSnapshot(key, fresh);

      console.log(
        `[HR_RESEARCH_SNAPSHOT] materialized playerId=${research.player.id} durationMs=${Date.now() - startedAt}`,
      );

      return fresh;
    },
    LOCAL_TTL_MS,
  );

  return {
    research: entry.research,
    source: producerSource,
  };
}

export function getHrResearchSnapshotStats() {
  return snapshotCache.getStats();
}
