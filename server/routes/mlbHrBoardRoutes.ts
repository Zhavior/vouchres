/**
 * HR Board Routes — Validated Pipeline
 *
 * Uses the new hrPipeline.ts which:
 *   - Fetches only today's teams (not all 30)
 *   - Builds a Today Player Pool (top 13 playable hitters per team)
 *   - Validates each candidate (15 checks including injury/lineup/team/game)
 *   - Scores only validated candidates
 *   - Returns dataConfidence + status + warnings on every candidate
 *
 * Endpoints:
 *   GET /api/mlb/hr-board/today        → Validated HR candidates + pool summary
 *   GET /api/mlb/hr-board/today/pool   → Today Player Pool summary
 *   GET /api/mlb/hr-board/today/debug  → Debug info (blocked reasons, counts, warnings)
 *   GET /api/mlb/hr-board/date/:date   → Same but for a specific date
 *   GET /api/mlb/hr-board/player/:id   → Single player detail
 */
import type { Express, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { boundedInt, optionalYmd, positiveInt, requiredYmd, upstreamUnavailable } from "../lib/requestValidators";
import { buildApiMeta } from "../lib/apiResponseMeta";
import {
  getCachedDeepHrBoard,
  getCachedValidatedHrBoard,
  getCachedValidatedHrCandidate,
} from "../services/hubs/hrBoardHub";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";
import { getLiveAtBat } from "../services/mlb/liveAtBatService";
import { LIVE_HUB_TTL_MS } from "../services/hubs/liveGameHub";
import { buildHrBoardApiPayload } from "../services/mlb/hrBoardResponse";
import { getMaterializedHrResearch } from "../services/mlb/hrResearchSnapshotService";
import type { RequestWithContext } from "../middleware/requestContext";
import { mlbReadLimiter } from "../middleware/rateLimit";

function parsePreviewLimit(raw: unknown): number {
  return boundedInt(raw, "previewLimit", 120, 10, 350);
}

function collectHrBoardWarnings(payload: { rows?: unknown }, result?: { lastGoodWarnings?: string[]; servedFromLastGood?: boolean }): string[] {
  const warnings = new Set<string>();

  if (result?.servedFromLastGood && Array.isArray(result.lastGoodWarnings)) {
    for (const warning of result.lastGoodWarnings) {
      if (typeof warning === "string" && warning.trim()) warnings.add(warning.trim());
    }
  }

  if (!Array.isArray(payload.rows)) return [...warnings];

  for (const row of payload.rows) {
    const rowWarnings = typeof row === "object" && row !== null && "warnings" in row
      ? (row as { warnings?: unknown }).warnings
      : undefined;
    if (!Array.isArray(rowWarnings)) continue;

    for (const warning of rowWarnings) {
      if (typeof warning === "string" && warning.trim()) warnings.add(warning.trim());
      if (warnings.size >= 10) return [...warnings];
    }
  }

  return [...warnings];
}

function buildHrBoardRouteMeta(
  payload: { dataQuality?: string; generatedAt?: string },
  result: { lastGoodWarnings?: string[]; servedFromLastGood?: boolean },
  payloadForWarnings: { rows?: unknown },
) {
  return buildApiMeta({
    source: result.servedFromLastGood ? "validated_hr_board_last_good" : "validated_hr_board_pipeline",
    dataQuality: payload.dataQuality === "projection_preview" ? "projection_preview" : "validated_hr_board",
    updatedAt: payload.generatedAt,
    generatedAt: payload.generatedAt,
    warnings: collectHrBoardWarnings(payloadForWarnings, result),
    cache: {
      strategy: result.servedFromLastGood ? "hr_board_last_good_snapshot" : "hr_board_hub_ttl",
      ttlMs: result.servedFromLastGood ? LAST_GOOD_TTL_MS : 900_000,
    },
  });
}

const LAST_GOOD_TTL_MS = Number(process.env.VALIDATED_HR_BOARD_LAST_GOOD_MS ?? 60 * 60_000);

export function registerHrBoardRoutes(app: Express): void {
  // Live home-run feed (real HR plays from today's games).
  app.get("/api/mlb/hr-feed/today", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    const feed = await getTodayHomeRuns();
    res.json(apiOkFlat(req, {
      count: feed.events.length,
      events: feed.events,
      generatedAt: new Date().toISOString(),
      warnings: feed.warnings,
    }));
  }));
  app.get("/api/mlb/hr-feed/date/:date", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = requiredYmd(req.params.date);
    const feed = await getTodayHomeRuns(date);
    res.json(apiOkFlat(req, {
      count: feed.events.length,
      events: feed.events,
      generatedAt: new Date().toISOString(),
      warnings: feed.warnings,
    }));
  }));

  // Live at-bat snapshot — pitch-by-pitch data for one game's current AB.
  app.get("/api/mlb/live-at-bat/:gamePk", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    const gamePk = positiveInt(req.params.gamePk, "gamePk");

    const snapshot = await getLiveAtBat(gamePk);
    if (!snapshot) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Game feed unavailable.",
      });
    }

res.json(apiOkFlat(req, {
  ...snapshot,
  meta: buildApiMeta({
    source: "live_game_hub",
    dataQuality: "official_mlb_live_feed",
    updatedAt: snapshot.updatedAt,
    warnings: snapshot.play ? [] : ["No current at-bat play is available for this game."],
    cache: {
      strategy: "live_game_hub_swr",
      ttlMs: LIVE_HUB_TTL_MS,
      asOf: snapshot.updatedAt,
    },
  }),
}));
  }));

  /* ============ MAIN: Validated HR Board ============ */
  app.get("/api/mlb/hr-board/today", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const previewLimit = parsePreviewLimit(req.query.previewLimit);
      const result = await getCachedValidatedHrBoard();
      const payload = buildHrBoardApiPayload(result, previewLimit);
      res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
      res.json(apiOkFlat(req, {
        ...payload,
        meta: buildHrBoardRouteMeta(payload, result, payload),
      }));
    } catch (err: any) {
      console.error("[hr-board/today] validated pipeline failed:", err.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("HR board unavailable.", err);
    }
  }));

  /* ============ Today Player Pool ============ */
  app.get("/api/mlb/hr-board/today/pool", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const result = await getCachedValidatedHrBoard();
      res.json(apiOkFlat(req, result.pool as unknown as Record<string, unknown>));
    } catch (err: any) {
      console.error("[hr-board/today/pool] failed:", err?.message);
      throw upstreamUnavailable("Pool unavailable.", err);
    }
  }));

  /* ============ Debug endpoint ============ */
  app.get("/api/mlb/hr-board/today/debug", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const result = await getCachedValidatedHrBoard();
      res.json(apiOkFlat(req, result.debug as unknown as Record<string, unknown>));
    } catch (err: any) {
      console.error("[hr-board/today/debug] failed:", err?.message);
      throw upstreamUnavailable("Debug unavailable.", err);
    }
  }));

  /* ============ Deep endpoint — research-only; NEVER a confirmed-candidate source ============ */
  app.get("/api/mlb/hr-board/today/deep", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const result = await Promise.race([
        getCachedDeepHrBoard(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Deep board timed out after 20s")), 20000)
        ),
      ]);
      // Wall-off: deep board cannot silently become confirmed. Use /today for candidates[].
      res.json(apiOkFlat(req, {
        ...(result as unknown as Record<string, unknown>),
        candidates: [],
        confirmedCandidates: [],
        projectedOnly: true,
        isConfirmedBoard: false,
        confirmedSource: "/api/mlb/hr-board/today",
        dataQuality: "projection_preview",
        warning:
          "Deep board is research-only. Official confirmed candidates come only from GET /api/mlb/hr-board/today (validated pipeline). Official lineup not posted yet rows stay preview.",
      }));
    } catch (err: any) {
      console.error("[hr-board/today/deep] failed:", err?.message);
      throw upstreamUnavailable("Deep HR board unavailable. Use /api/mlb/hr-board/today for the fast validated board.", err);
    }
  }));

  app.get("/api/mlb/hr-board/date/:date", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const date = requiredYmd(req.params.date);
      const previewLimit = parsePreviewLimit(req.query.previewLimit);
      const result = await getCachedValidatedHrBoard(date);
      const payload = buildHrBoardApiPayload(result, previewLimit);
      res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
      res.json(apiOkFlat(req, {
        ...payload,
        meta: buildHrBoardRouteMeta(payload, result, payload),
      }));
    } catch (err: any) {
      console.error("[hr-board/date] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("HR board unavailable.", err);
    }
  }));

  app.get("/api/mlb/hr-board/player/:playerId", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const playerId = positiveInt(req.params.playerId, "playerId");
      const date = optionalYmd(req.query.date);
      const candidateResult = await getCachedValidatedHrCandidate(playerId, date);
      const candidate = candidateResult.candidate;

      if (!candidate) {
        throw new AppError({
          status: 404,
          code: "not_found",
          message: "Player not found in validated or projected HR candidates.",
        });
      }

      const researchSnapshot = await getMaterializedHrResearch({
        candidate: candidate as unknown as Record<string, unknown>,
        generatedAt: candidateResult.generatedAt,
      });
      const research = researchSnapshot.research;

      res.setHeader(
        "Cache-Control",
        "private, max-age=60, stale-while-revalidate=300",
      );

      res.json(apiOkFlat(req, {
        player: candidate,
        research,
        meta: {
          candidateSource: candidateResult.source,
          researchSource: researchSnapshot.source,
        },
      }));
    } catch (err: any) {
      console.error("[hr-board/player] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Player research unavailable.", err);
    }
  }));
}
