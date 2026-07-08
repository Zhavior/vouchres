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
import type { Express, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { boundedInt, optionalYmd, positiveInt, requiredYmd, upstreamUnavailable } from "../lib/requestValidators";
import { buildApiMeta } from "../lib/apiResponseMeta";
import { getCachedValidatedHrBoard, getCachedDeepHrBoard } from "../services/hubs/hrBoardHub";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";
import { getLiveAtBat } from "../services/mlb/liveAtBatService";
import { buildHrBoardApiPayload } from "../services/mlb/hrBoardResponse";

function parsePreviewLimit(raw: unknown): number {
  return boundedInt(raw, "previewLimit", 350, 10, 350);
}

function collectHrBoardWarnings(payload: { rows?: unknown }): string[] {
  if (!Array.isArray(payload.rows)) return [];

  const warnings = new Set<string>();
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

export function registerHrBoardRoutes(app: Express): void {
  // Live home-run feed (real HR plays from today's games).
  app.get("/api/mlb/hr-feed/today", asyncHandler(async (_req: Request, res: Response) => {
    const events = await getTodayHomeRuns();
    res.json({ count: events.length, events, generatedAt: new Date().toISOString() });
  }));
  app.get("/api/mlb/hr-feed/date/:date", asyncHandler(async (req: Request, res: Response) => {
    const date = requiredYmd(req.params.date);
    const events = await getTodayHomeRuns(date);
    res.json({ count: events.length, events, generatedAt: new Date().toISOString() });
  }));

  // Live at-bat snapshot — pitch-by-pitch data for one game's current AB.
  app.get("/api/mlb/live-at-bat/:gamePk", asyncHandler(async (req: Request, res: Response) => {
    const gamePk = positiveInt(req.params.gamePk, "gamePk");

    const snapshot = await getLiveAtBat(gamePk);
    if (!snapshot) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Game feed unavailable.",
      });
    }

    res.json({
      success: true,
      data: snapshot,
      meta: buildApiMeta({
        source: "mlb_statsapi_live_feed",
        dataQuality: "official_mlb_live_feed",
        updatedAt: snapshot.updatedAt,
        warnings: snapshot.play ? [] : ["No current at-bat play is available for this game."],
        cache: { strategy: "ttl_cache_with_last_good_snapshot", ttlMs: 12_000 },
      }),
    });
  }));

  /* ============ MAIN: Validated HR Board ============ */
  app.get("/api/mlb/hr-board/today", asyncHandler(async (req: Request, res: Response) => {
    try {
      const previewLimit = parsePreviewLimit(req.query.previewLimit);
      const result = await getCachedValidatedHrBoard();
      const payload = buildHrBoardApiPayload(result, previewLimit);
      res.json({
        ...payload,
        meta: buildApiMeta({
          source: "validated_hr_board_pipeline",
          dataQuality: payload.dataQuality === "projection_preview" ? "projection_preview" : "validated_hr_board",
          updatedAt: payload.generatedAt,
          generatedAt: payload.generatedAt,
          warnings: collectHrBoardWarnings(payload),
          cache: { strategy: "hr_board_hub_ttl", ttlMs: 120_000 },
        }),
      });
    } catch (err: any) {
      console.error("[hr-board/today] validated pipeline failed:", err.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("HR board unavailable.", err);
    }
  }));

  /* ============ Today Player Pool ============ */
  app.get("/api/mlb/hr-board/today/pool", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const result = await getCachedValidatedHrBoard();
      res.json(result.pool);
    } catch (err: any) {
      console.error("[hr-board/today/pool] failed:", err?.message);
      throw upstreamUnavailable("Pool unavailable.", err);
    }
  }));

  /* ============ Debug endpoint ============ */
  app.get("/api/mlb/hr-board/today/debug", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const result = await getCachedValidatedHrBoard();
      res.json(result.debug);
    } catch (err: any) {
      console.error("[hr-board/today/debug] failed:", err?.message);
      throw upstreamUnavailable("Debug unavailable.", err);
    }
  }));

  /* ============ Deep endpoint (old full board — slow, use sparingly) ============ */
  app.get("/api/mlb/hr-board/today/deep", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const result = await Promise.race([
        getCachedDeepHrBoard(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Deep board timed out after 20s")), 20000)
        ),
      ]);
      res.json(result);
    } catch (err: any) {
      console.error("[hr-board/today/deep] failed:", err?.message);
      throw upstreamUnavailable("Deep HR board unavailable. Use /api/mlb/hr-board/today for the fast validated board.", err);
    }
  }));

  app.get("/api/mlb/hr-board/date/:date", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = requiredYmd(req.params.date);
      const previewLimit = parsePreviewLimit(req.query.previewLimit);
      const result = await getCachedValidatedHrBoard(date);
      const payload = buildHrBoardApiPayload(result, previewLimit);
      res.json({
        ...payload,
        meta: buildApiMeta({
          source: "validated_hr_board_pipeline",
          dataQuality: payload.dataQuality === "projection_preview" ? "projection_preview" : "validated_hr_board",
          updatedAt: payload.generatedAt,
          generatedAt: payload.generatedAt,
          warnings: collectHrBoardWarnings(payload),
          cache: { strategy: "hr_board_hub_ttl", ttlMs: 120_000 },
        }),
      });
    } catch (err: any) {
      console.error("[hr-board/date] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("HR board unavailable.", err);
    }
  }));

  app.get("/api/mlb/hr-board/player/:playerId", asyncHandler(async (req: Request, res: Response) => {
    try {
      const playerId = positiveInt(req.params.playerId, "playerId");
      const date = optionalYmd(req.query.date);
      const result = await getCachedValidatedHrBoard(date);
      const candidate = result.candidates.find(
        (c) => String(c.playerId) === String(playerId)
      );
      if (!candidate) {
        throw new AppError({
          status: 404,
          code: "not_found",
          message: "Player not found in validated candidates.",
        });
      }
      res.json({ player: candidate });
    } catch (err: any) {
      console.error("[hr-board/player] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Player lookup unavailable.", err);
    }
  }));
}
