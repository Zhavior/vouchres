import { Router } from "express";
import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import { AuthedRequest, getSupabaseAdmin, requireAuth, requireStaff } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { generationLimiter, gradingLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { assertCronAuthorized } from "../lib/cronAuth";
import { AppError } from "../errors/AppError";
import { boolQuery, boundedInt, optionalYmd, upstreamUnavailable } from "../lib/requestValidators";
import { getGrader, settleParlay, type GameData, type GradableLeg, type LegOutcome } from "../services/grading/sportGraders";
import { gradePendingPicks } from "../services/grading/gradingService";
import { previewLiveHrParlayMatches } from "../services/grading/liveHrParlayService";
import { applyLiveHrParlayMatches } from "../services/grading/liveHrParlayWriteService";
import { getFeedComposerOptions, type ComposerOptionsResponse, type PlayerOption } from "../services/feed/composerOptionsService";
import {
  getParlayHandler,
  hideParlayHandler,
  listLegacyParlaysHandler,
  listMyParlaysHandler,
  saveMeParlayHandler,
  updateParlayHandler,
} from "../controllers/parlayController";
import {
  ListParlaysQuerySchema,
  ParlayIdParamsSchema,
  GradeParlaySchema,
  type GradeParlayInput,
  SaveMeParlaySchema,
  UpdateParlaySchema,
} from "../validators/parlaySchemas";

/**
 * Parlay routes — multi-leg pick creation with transactional integrity.
 *
 *   POST /api/parlays              — create a parlay with N legs
 *   GET  /api/parlays/:id          — get parlay with legs
 *   GET  /api/parlays?user_id=X    — list user's parlays
 *
 * Why a separate endpoint:
 *   - A parlay is a pick (leg_type='parlay') PLUS N rows in pick_legs.
 *   - Creating them in two separate calls (POST /picks, then POST /legs)
 *     risks orphans if the second call fails.
 *   - This endpoint wraps both inserts in a Supabase transaction.
 *
 * Free-tier quota: 2 parlays/day (parlays are higher-variance, so the
 * limit is lower than the 3-pick/day limit for singles).
 */
export const parlayRoutes = Router();

const AI_PARLAY_SOURCE = "ai_parlay_engine";
type AiParlayLegInput = {
  event_id?: string;
  eventId?: string;
  gamePk?: string;
  gameId?: string;
  market?: string;
  marketCode?: string;
  selection?: string;
  playerName?: string;
  playerId?: string | number;
  odds_decimal?: number | null;
  oddsDecimal?: number | null;
  odds?: number | string | null;
  team?: string;
  teamAbbr?: string;
  gameStartTime?: string;
  teamId?: string | number | null;
  statTarget?: string | number | null;
  comparator?: string | null;
  externalProvider?: string | null;
};

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function ymdFromValue(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
}

function isAiPickRow(row: any): boolean {
  return row?.source === "ai_pick" || /source=AI|aiGenerated=true|aiSignature=/i.test(String(row?.explanation ?? ""));
}

function enrichParlayRow(row: any, legs: any[]) {
  return {
    ...row,
    legs,
    title: row.title ?? String(row.explanation ?? row.market ?? "Saved Parlay").split("\n")[0],
    riskTier: row.risk_tier ?? "MEDIUM",
    source: isAiPickRow(row) ? "AI" : (row.source ?? "manual"),
    ai_generated: isAiPickRow(row),
    game_date: row.game_date ?? ymdFromValue(row.created_at),
  };
}

function aiLegFromPlayer(player: PlayerOption, game: ComposerOptionsResponse["games"][number], market = "HR"): AiParlayLegInput {
  return {
    event_id: game.gameId,
    gamePk: game.gameId,
    market,
    marketCode: market,
    selection: `${player.name} 1+ HR`,
    playerName: player.name,
    playerId: player.id,
    odds_decimal: null,
    teamAbbr: player.teamAbbr,
    gameStartTime: game.startTime ?? undefined,
  };
}

function buildGeneratedAiParlays(options: ComposerOptionsResponse) {
  const warnings = [...options.warnings];
  const starterCandidates = options.games.flatMap((game) => {
    const players = [...game.awayTeam.players, ...game.homeTeam.players]
      .filter((player) => player.isStarter && player.position !== "P")
      .sort((a, b) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99))
      .slice(0, 2);
    return players.map((player) => ({ player, game }));
  });

  if (options.games.length === 0) warnings.push("no games today");
  if (starterCandidates.length < 2) warnings.push("not enough confirmed starters for AI parlays");

  const recipes = [
    { legCount: 2, riskTier: "LOW", confidence: 62, label: "Safer" },
    { legCount: 3, riskTier: "MEDIUM", confidence: 48, label: "Balanced" },
    { legCount: 4, riskTier: "HIGH", confidence: 34, label: "Longshot" },
  ];

  const parlays = recipes.flatMap((recipe, recipeIndex) => {
    const picks = starterCandidates.slice(recipeIndex, recipeIndex + recipe.legCount);
    if (picks.length < recipe.legCount) return [];
    const legs = picks.map(({ player, game }) => aiLegFromPlayer(player, game));
    return [{
      id: `ai-${options.date}-${recipe.legCount}-${stableHash(legs)}`,
      title: `AI ${recipe.label} ${recipe.legCount}-Leg HR Parlay`,
      legs,
      riskTier: recipe.riskTier,
      confidence: recipe.confidence,
      source: "AI",
      status: "pending",
      created_at: new Date().toISOString(),
      game_date: options.date,
      warnings: legs.some((leg) => leg.odds_decimal == null) ? ["missing odds"] : [],
    }];
  });

  return { parlays, warnings: [...new Set(warnings)] };
}

/* ============================================================
   POST /api/parlays/ai-generate
   Backend AI parlay generation from MLB composer options.
   ============================================================ */
parlayRoutes.post("/parlays/ai-generate", requireAuth, generationLimiter, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const start = Date.now();
  const date = ymdFromValue(req.body?.date) ?? todayYmd();
  const options = await getFeedComposerOptions({ sport: "MLB", date }).catch((err) => {
    console.error("[parlays/ai-generate] failed", (err as Error)?.message);
    throw upstreamUnavailable("AI parlay generation unavailable.", err);
  });
  const result = buildGeneratedAiParlays(options);
  console.log(`[parlays/ai-generate] date=${date} parlays=${result.parlays.length} warnings=${result.warnings.length} ${Date.now() - start}ms`);
  return res.json({
    ok: true,
    parlays: result.parlays,
    warnings: result.warnings,
    generatedAt: new Date().toISOString(),
    source: AI_PARLAY_SOURCE,
  });
}));

/* ============================================================
   POST /api/parlays/grade  — stateless grading (no auth, no DB)
   Grades legs live against the sport's data feed (MLB now; NBA/NFL
   return 'pending' until their graders exist). Used by the client to
   settle locally-stored parlays and reflect outcomes in Results.
   Body: { legs: [{ sport, gamePk, market, selection, threshold?, oddsDecimal? }], stakeUnits? }
   ============================================================ */
parlayRoutes.post(
  "/parlays/grade",
  gradingLimiter,
  validate({ body: GradeParlaySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { legs, stakeUnits } = req.body as GradeParlayInput;
    const normalizedLegs = legs as GradableLeg[];

    // Fetch each unique (sport+game) once.
    const gameCache = new Map<string, GameData | null>();
    for (const leg of normalizedLegs) {
      const key = `${leg.sport}:${leg.gamePk}`;
      if (!gameCache.has(key)) {
        gameCache.set(key, await getGrader(leg.sport).fetchGame(leg.gamePk));
      }
    }

    // Evaluate each leg.
    const gradedLegs = normalizedLegs.map((leg) => {
      const key = `${leg.sport}:${leg.gamePk}`;
      const game = gameCache.get(key) ?? null;
      let outcome: LegOutcome;
      if (!game) {
        outcome = { status: "pending", note: "game data unavailable" };
      } else if (!game.final) {
        outcome = { status: "pending", note: "game not final" };
      } else {
        outcome = getGrader(leg.sport).evaluateLeg(leg, game);
      }
      return {
        sport: leg.sport,
        gamePk: leg.gamePk,
        market: leg.market,
        selection: leg.selection,
        oddsDecimal: leg.oddsDecimal ?? null,
        status: outcome.status,
        actual: outcome.actual ?? null,
        note: outcome.note ?? null,
      };
    });

    const parlay = settleParlay(
      gradedLegs.map((leg) => ({
        outcome: { status: leg.status, actual: leg.actual ?? undefined },
        oddsDecimal: leg.oddsDecimal ?? undefined,
      })),
      stakeUnits
    );

    return res.json({
      ok: true,
      legs: gradedLegs,
      parlay,
      gradedAt: new Date().toISOString(),
    });
  })
);

/* ============================================================
   POST /api/parlays/grade-due  — DB-backed manual/worker auto-grader
   Finds pending picks/parlays from the last 2 days, grades any whose games
   are now Final via MLB linescore, writes results to Supabase.
   This mutates DB state, so it must never run from a GET/read request.
   ============================================================ */

parlayRoutes.post("/parlays/live-hr-sync", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const rawDate = (req.body as { date?: string } | undefined)?.date ?? req.query.date;
  const date = optionalYmd(rawDate);
  const repair = await repairLegacyParlayIdentityForSync({
    dryRun: false,
    limit: 100,
    externalProvider: "live_hr_sync_repair",
  });
  const result = await applyLiveHrParlayMatches(date);

  return res.json({
    ok: true,
    mode: "live_hr_sync",
    date: date ?? null,
    repair,
    ...result,
  });
}));

parlayRoutes.post("/parlays/live-hr-preview", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const rawDate = (req.body as { date?: string } | undefined)?.date ?? req.query.date;
  const date = optionalYmd(rawDate);
  const matches = await previewLiveHrParlayMatches(date);

  return res.json({
    ok: true,
    mode: "preview_only",
    date: date ?? null,
    matchCount: matches.length,
    matches,
  });
}));

parlayRoutes.get("/cron/parlays/live-hr-sync", asyncHandler(async (req: Request, res: Response) => {
  assertCronAuthorized(req);

  const date = optionalYmd(req.query.date);
  const repair = await repairLegacyParlayIdentityForSync({
    dryRun: false,
    limit: 100,
    externalProvider: "cron_live_hr_sync_repair",
  });
  const result = await applyLiveHrParlayMatches(date);

  return res.json({
    ok: true,
    mode: "cron_live_hr_sync",
    date: date ?? null,
    repair,
    ...result,
    checkedAt: new Date().toISOString(),
  });
}));

parlayRoutes.get("/cron/parlays/grade-due", asyncHandler(async (req: RequestWithContext, res: Response) => {
  assertCronAuthorized(req);

  const days = boundedInt(req.query.days, "days", 2, 1, 7);
  const result = await gradePendingPicks({ days });
  const { graded, skipped, summary } = result;

  const settled = graded.filter((row) => row.status !== "graded_error");
  const pending = skipped.filter((row) => row.error?.includes("not final") || row.error?.includes("isComplete=false"));
  const errors = skipped.filter((row) => !row.error?.includes("not final") && !row.error?.includes("isComplete=false"));
  const requestId = req.requestId ?? "unknown";

  console.log("[parlays/grade-due]", JSON.stringify({
    requestId,
    mode: "cron_grade_due",
    days,
    gradedParlays: settled.length,
    gradedLegs: graded.length,
    pendingLegs: pending.length,
    errorCount: errors.length,
  }));

  return res.json({
    ok: true,
    mode: "cron_grade_due",
    gradedParlays: settled.length,
    gradedLegs: graded.length,
    pendingLegs: pending.length,
    summary,
    warnings: summary.warnings,
    errors: errors.map((row) => ({ pick_id: row.pick_id, error: row.error })),
    checkedAt: new Date().toISOString(),
  });
}));

/* Staff-only: systemwide grading mutates every user's pending picks. Cron uses /cron/*. */
parlayRoutes.post("/parlays/grade-due", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const rawDays = (req.body as { days?: number | string } | undefined)?.days ?? req.query.days;
  const days = boundedInt(rawDays, "days", 2, 1, 7);
  const result = await gradePendingPicks({ days });
  const { graded, skipped, summary } = result;

  const settled = graded.filter((row) => row.status !== "graded_error");
  const pending = skipped.filter((row) => row.error?.includes("not final") || row.error?.includes("isComplete=false"));
  const errors = skipped.filter((row) => !row.error?.includes("not final") && !row.error?.includes("isComplete=false"));
  const requestId = (req as AuthedRequest & RequestWithContext).requestId ?? "unknown";

  console.log("[parlays/grade-due]", JSON.stringify({
    requestId,
    mode: "grade_due",
    days,
    userId: req.user?.id ?? null,
    gradedParlays: settled.length,
    gradedLegs: graded.length,
    pendingLegs: pending.length,
    errorCount: errors.length,
  }));

  // Best-effort audit trail. Swallow if grading_logs (migration 0004) is absent.
  try {
    const logRows = [
      ...settled.map((row) => ({ pick_id: row.pick_id, status: row.status, reason: "graded", source: "grade-due" })),
      ...pending.map((row) => ({ pick_id: row.pick_id, status: "pending", reason: "pending_not_final", source: "grade-due" })),
      ...errors.map((row) => ({ pick_id: row.pick_id, status: "graded_error", reason: row.error ?? "error", source: "grade-due" })),
    ];
    if (logRows.length > 0) {
      const supabaseAdmin = await getSupabaseAdmin();
      const { error: logErr } = await supabaseAdmin.from("grading_logs").insert(logRows);
      if (logErr && !["42P01", "PGRST205"].includes(logErr.code)) {
        console.warn("[parlays/grade-due] grading_logs write failed", JSON.stringify({
          requestId,
          code: logErr.code,
          message: logErr.message,
        }));
      }
    }
  } catch (logErr: any) {
    // table missing or transient — never block grading on the audit log
    console.warn("[parlays/grade-due] grading_logs unavailable", JSON.stringify({
      requestId,
      code: logErr?.code ?? null,
      message: logErr instanceof Error ? logErr.message : String(logErr),
    }));
  }

  return res.json({
    ok: true,
    mode: "grade_due",
    gradedParlays: settled.length,
    gradedLegs: graded.length,
    pendingLegs: pending.length,
    summary,
    warnings: summary.warnings,
    errors: errors.map((row) => ({ pick_id: row.pick_id, error: row.error })),
    checkedAt: new Date().toISOString(),
  });
}));

async function countRows(query: any): Promise<number> {
  const { count, error } = await query;
  if (error) {
    console.warn("[parlays/integrity] count failed", error.code, error.message);
    return -1;
  }
  return typeof count === "number" ? count : 0;
}

/**
 * GET /api/cron/parlays/integrity
 *
 * Nose scanner for the parlay grading architecture.
 * Counts weak/stale rows that can break exact-field grading.
 */
parlayRoutes.get("/cron/parlays/integrity", asyncHandler(async (req: Request, res: Response) => {
  assertCronAuthorized(req);
  const supabaseAdmin = await getSupabaseAdmin();

    const [
      missingEventKey,
      missingGameId,
      missingMarketCode,
      missingComparator,
      missingStatTarget,
      missingPlayerId,
      pendingLegs,
      cachedResults,
      weakHrTextLegs,
    ] = await Promise.all([
      countRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("event_key", null)),
      countRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("game_id", null)),
      countRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("market_code", null)),
      countRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("comparator", null)),
      countRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("stat_target", null)),
      countRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("player_id", null)),
      countRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).eq("status", "pending")),
      countRows(supabaseAdmin.from("graded_leg_results").select("*", { count: "exact", head: true })),
      countRows(
        supabaseAdmin
          .from("pick_legs")
          .select("*", { count: "exact", head: true })
          .or("market.ilike.%hr%,selection.ilike.%home run%,selection.ilike.%homer%")
          .is("market_code", null)
      ),
    ]);

    const issues = {
      missingEventKey,
      missingGameId,
      missingMarketCode,
      missingComparator,
      missingStatTarget,
      missingPlayerId,
      weakHrTextLegs,
      pendingLegs,
    };

    const blockingIssueCount = Object.entries(issues)
      .filter(([key]) => key !== "pendingLegs")
      .reduce((sum, [, value]) => sum + Math.max(0, Number(value || 0)), 0);

  return res.json({
    ok: blockingIssueCount === 0,
    scanner: "parlay_integrity_nose",
    checkedAt: new Date().toISOString(),
    issues,
    cache: {
      gradedLegResults: cachedResults,
    },
    advice:
      blockingIssueCount === 0
        ? "Parlay grading identity looks clean."
        : "Some legs are missing exact grading identity. New saves should use /api/parlays/save only; old rows may need repair/backfill.",
  });
}));

/**
 * POST /api/parlays
 *
 * Legacy route disabled.
 * Canonical parlay saves must use POST /api/parlays/save so every leg persists
 * the full grading identity: game_id, player_id, market_code, event_key,
 * stat_target, comparator, and external_provider.
 */
parlayRoutes.post("/parlays", requireAuth, asyncHandler(async (_req: AuthedRequest, res: Response) => {
  throw new AppError({
    status: 410,
    code: "gone",
    message: "Use POST /api/parlays/save for canonical parlay saves.",
    details: { legacy: "legacy_parlay_route_disabled" },
  });
}));



function repairComparatorKey(comparator: string | null): "GTE" | "LTE" | "EQ" | null {
  if (comparator === ">=") return "GTE";
  if (comparator === "<=") return "LTE";
  if (comparator === "=" || comparator === "==") return "EQ";
  return null;
}

function repairCleanKey(value: unknown, fallback = ""): string {
  return String(value ?? fallback).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function repairPlayerIdFromSelection(selection: unknown): string {
  const text = String(selection ?? "");
  const metaMatch = text.match(/\|\|meta:\s*(\{.*\})\s*$/);
  if (!metaMatch) return "";

  try {
    const meta = JSON.parse(metaMatch[1]);
    return String(meta.p || meta.playerId || meta.player_id || "").trim();
  } catch {
    return "";
  }
}

function repairGameIdFromRow(row: any): string {
  const candidates = [
    row.game_id,
    row.event_id,
    row.picks?.event_id,
    row.picks?.metadata?.game_id,
    row.picks?.metadata?.gameId,
    row.picks?.metadata?.gamePk,
  ];

  for (const candidate of candidates) {
    const raw = String(candidate ?? "").trim();
    if (/^\d{5,}$/.test(raw)) return raw;
  }

  return "";
}

function repairMarketCode(row: any): string | null {
  const raw = String(row.market_code || row.market || row.selection || "").trim().toUpperCase();
  const compact = raw.replace(/[^A-Z0-9]/g, "");

  if (!raw) return null;

  if (
    raw.includes("HOME RUN") ||
    raw.includes("HOMER") ||
    raw.includes("ANYTIME HR") ||
    raw.includes("1+ HR") ||
    raw.includes("TO HIT 1+ HOME RUN") ||
    raw === "HR" ||
    compact.includes("ANYTIMEHR") ||
    compact.includes("HOME RUN".replace(/[^A-Z0-9]/g, "")) ||
    compact.includes("HOMERUN")
  ) {
    return "ANYTIME_HR";
  }

  return String(row.market_code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") || null;
}

function repairStatTarget(row: any, marketCode: string | null): number | null {
  const raw = row.stat_target ?? row.threshold ?? row.target ?? row.line ?? null;
  const parsed = Number(raw);

  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (marketCode === "ANYTIME_HR") return 1;

  return null;
}

/**
 * POST /api/cron/parlays/repair-identity?dryRun=true&limit=50
 *
 * Legacy Parlay Repair Pipeline:
 * - scans old pick_legs with missing canonical grading identity
 * - repairs only rows with enough safe identity
 * - skips unsafe rows with reasons
 * - keeps the job capped so serverless functions do not run forever
 */
async function repairLegacyParlayIdentityForSync(options: {
  dryRun?: boolean;
  limit?: number;
  externalProvider?: string;
} = {}) {
  const dryRun = options.dryRun ?? true;
  const limit = Math.min(Math.max(Number(options.limit ?? 50), 1), 250);
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: rows, error } = await supabaseAdmin
    .from("pick_legs")
    .select("id,pick_id,leg_index,sport,game_id,event_id,team_id,player_id,market,selection,market_code,stat_target,comparator,event_key,popularity_key,external_provider,status,picks(event_id,metadata)")
    .or("event_key.is.null,market_code.is.null,stat_target.is.null,comparator.is.null")
    .limit(limit);

  if (error) {
    throw error;
  }

  let repairedCount = 0;
  let skippedCount = 0;

  for (const row of rows ?? []) {
    const sport = repairCleanKey(row.sport || "MLB", "MLB") || "MLB";
    const gameId = repairGameIdFromRow(row);
    const teamId = repairCleanKey(row.team_id || "TEAM", "TEAM") || "TEAM";
    const playerId = repairCleanKey(row.player_id || repairPlayerIdFromSelection(row.selection));
    const marketCode = repairMarketCode(row);
    const statTarget = repairStatTarget(row, marketCode);
    const comparator = String(row.comparator || (statTarget != null ? ">=" : "")).trim() || null;
    const comparatorKey = repairComparatorKey(comparator);

    if (!gameId || !playerId || !marketCode || statTarget == null || !comparatorKey) {
      skippedCount += 1;
      continue;
    }

    const eventKey = [sport, gameId, teamId, playerId, marketCode, statTarget, comparatorKey].join("_");
    const popularityKey = [sport, playerId, marketCode, statTarget, comparatorKey].join("_");

    const patch = {
      sport,
      game_id: gameId,
      team_id: teamId,
      player_id: playerId,
      market_code: marketCode,
      stat_target: statTarget,
      comparator,
      event_key: eventKey,
      popularity_key: popularityKey,
      external_provider: row.external_provider || options.externalProvider || "repair_identity",
    };

    if (!dryRun) {
      const { error: updateError } = await supabaseAdmin
        .from("pick_legs")
        .update(patch)
        .eq("id", row.id);

      if (updateError) {
        skippedCount += 1;
        continue;
      }
    }

    repairedCount += 1;
  }

  return {
    dryRun,
    scanned: rows?.length ?? 0,
    repairedCount,
    skippedCount,
  };
}


parlayRoutes.post("/cron/parlays/repair-identity", asyncHandler(async (req: Request, res: Response) => {
  assertCronAuthorized(req);

  const dryRun = boolQuery(req.query.dryRun, true);
  const limit = boundedInt(req.query.limit, "limit", 50, 1, 250);
  const result = await repairLegacyParlayIdentityForSync({
    dryRun,
    limit,
    externalProvider: "repair_identity",
  });

  return res.json({
    ok: true,
    ...result,
    checkedAt: new Date().toISOString(),
  });
}));


function isLegacyManualEventId(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  return raw.startsWith("leg-") || raw.startsWith("ai-leg-") || raw.startsWith("manual-");
}

/**
 * POST /api/cron/parlays/quarantine-legacy?dryRun=true&limit=25
 *
 * Quarantines legacy/manual picks that cannot be honestly graded because they were saved
 * before canonical grading identity existed and only carry fake event IDs.
 *
 * Real MLB numeric game IDs are left alone so they can grade when final.
 */
parlayRoutes.post("/cron/parlays/quarantine-legacy", asyncHandler(async (req: Request, res: Response) => {
  assertCronAuthorized(req);

  const dryRun = boolQuery(req.query.dryRun, true);
  const limit = boundedInt(req.query.limit, "limit", 25, 1, 100);
  const legacyReason = "Legacy pick saved before canonical grading identity existed; cannot be honestly graded.";

  const supabaseAdmin = await getSupabaseAdmin();

  const { data: picks, error } = await supabaseAdmin
    .from("picks")
    .select("id,event_id,status,explanation")
    .eq("status", "pending")
    .limit(limit);

  if (error) {
    console.error("[parlays/quarantine-legacy] fetch failed", error);
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Failed to fetch legacy parlays for quarantine.",
      details: { code: error.code, hint: error.hint },
      cause: error,
    });
  }

  const quarantined: any[] = [];
  const skipped: any[] = [];

  for (const pick of picks ?? []) {
    if (!isLegacyManualEventId(pick.event_id)) {
      skipped.push({
        pick_id: pick.id,
        event_id: pick.event_id,
        reason: "not_legacy_manual_event_id",
      });
      continue;
    }

    const pickPatch = {
      status: "void",
      explanation: [String(pick.explanation || "").trim(), legacyReason].filter(Boolean).join("\\n\\n"),
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const legPatch = {
      status: "void",
      graded_at: new Date().toISOString(),
    };

    if (!dryRun) {
      const { error: pickUpdateError } = await supabaseAdmin
        .from("picks")
        .update(pickPatch)
        .eq("id", pick.id);

      if (pickUpdateError) {
        skipped.push({
          pick_id: pick.id,
          event_id: pick.event_id,
          reason: "pick_update_failed",
          message: pickUpdateError.message,
        });
        continue;
      }

      const { data: updatedLegs, error: legUpdateError } = await supabaseAdmin
        .from("pick_legs")
        .update(legPatch)
        .eq("pick_id", pick.id)
        .eq("status", "pending")
        .select("id,pick_id,status,graded_at,event_id,game_id");

      if (legUpdateError) {
        skipped.push({
          pick_id: pick.id,
          event_id: pick.event_id,
          reason: "leg_update_failed",
          message: legUpdateError.message,
        });
        continue;
      }

      if (!updatedLegs || updatedLegs.length === 0) {
        skipped.push({
          pick_id: pick.id,
          event_id: pick.event_id,
          reason: "no_pending_child_legs_updated",
        });
        continue;
      }
    }

    quarantined.push({
      pick_id: pick.id,
      event_id: pick.event_id,
      pickPatch,
      legPatch,
    });
  }

  return res.json({
    ok: true,
    dryRun,
    scanned: picks?.length ?? 0,
    quarantinedCount: quarantined.length,
    skippedCount: skipped.length,
    quarantined: quarantined.slice(0, 20),
    skipped: skipped.slice(0, 20),
    checkedAt: new Date().toISOString(),
  });
}));

/**
 * GET /api/parlays/:id
 * Returns a parlay pick with all its legs.
 */
parlayRoutes.get(
  "/parlays/:id",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  getParlayHandler
);

/**
 * GET /api/parlays?user_id=X&limit=50&offset=0
 * List a user's parlays.
 */


/**
 * GET /api/me/ledger
 * Authenticated user ledger for Results, Profile, and The Island dashboard.
 * Returns the current user's picks/parlays with legs grouped in one clean payload.
 */


/**
 * GET /api/me/dashboard-summary
 * Small authenticated summary for The Island dashboard widgets.
 */
parlayRoutes.get("/me/dashboard-summary", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: picks, error } = await supabaseAdmin
    .from("picks")
    .select("id, status, leg_type, created_at")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    console.error("[me/dashboard-summary] fetch failed", error);
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Dashboard summary unavailable.",
      details: { code: error.code, hint: error.hint },
      cause: error,
    });
  }

  const rows = picks ?? [];

  const summary = rows.reduce(
    (acc: any, pick: any) => {
      const status = String(pick.status ?? "pending").toLowerCase();
      acc.total += 1;
      acc[status] = (acc[status] ?? 0) + 1;

      if (pick.leg_type === "parlay") acc.parlays += 1;
      else acc.singles += 1;

      return acc;
    },
    {
      total: 0,
      pending: 0,
      won: 0,
      lost: 0,
      void: 0,
      push: 0,
      parlays: 0,
      singles: 0,
    }
  );

  const graded = summary.won + summary.lost + summary.void + summary.push;
  const decisions = summary.won + summary.lost;

  const winRate =
    decisions > 0 ? Number(((summary.won / decisions) * 100).toFixed(1)) : null;

  const proofScore =
    graded > 0
      ? Math.min(100, Math.round((summary.won * 7 + summary.push * 2 + graded * 1.5)))
      : 0;

  return res.json({
    ok: true,
    widgets: {
      savedPicks: summary.total,
      savedParlays: summary.parlays,
      pendingPicks: summary.pending,
      winRate,
      proofScore,
    },
    summary,
    recent: rows.slice(0, 8),
  });
}));

parlayRoutes.get("/me/ledger", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const limit = boundedInt(req.query.limit, "limit", 100, 1, 200);
  const offset = boundedInt(req.query.offset, "offset", 0, 0, 100000);
  const status = typeof req.query.status === "string" ? req.query.status.toLowerCase() : undefined;

  const allowedStatuses = new Set(["pending", "won", "lost", "void", "push"]);
  const supabaseAdmin = await getSupabaseAdmin();

  let query = supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && allowedStatuses.has(status)) {
    query = query.eq("status", status);
  }

  const { data: picks, count, error } = await query;

  if (error) {
    console.error("[me/ledger] picks fetch failed", error);
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Ledger unavailable.",
      details: { code: error.code, hint: error.hint },
      cause: error,
    });
  }

  const pickIds = (picks ?? []).map((pick: any) => pick.id);

  let legsByPickId: Record<string, any[]> = {};

  if (pickIds.length > 0) {
    const { data: legs, error: legsError } = await supabaseAdmin
      .from("pick_legs")
      .select("*")
      .in("pick_id", pickIds)
      .order("leg_index", { ascending: true });

    if (legsError) {
      console.error("[me/ledger] legs fetch failed", legsError);
      throw new AppError({
        status: 503,
        code: "external_service_error",
        message: "Ledger legs unavailable.",
        details: { code: legsError.code, hint: legsError.hint },
        cause: legsError,
      });
    }

    legsByPickId = (legs ?? []).reduce((acc: Record<string, any[]>, leg: any) => {
      const key = String(leg.pick_id);
      acc[key] = acc[key] ?? [];
      acc[key].push(leg);
      return acc;
    }, {});
  }

  const ledger = (picks ?? []).map((pick: any) => ({
    ...enrichParlayRow(pick, legsByPickId[String(pick.id)] ?? []),
    is_parlay: pick.leg_type === "parlay",
  }));

  const summary = ledger.reduce(
    (acc: any, pick: any) => {
      const normalizedStatus = String(pick.status ?? "pending").toLowerCase();
      acc.total += 1;
      acc[normalizedStatus] = (acc[normalizedStatus] ?? 0) + 1;
      if (pick.is_parlay) acc.parlays += 1;
      else acc.singles += 1;
      return acc;
    },
    { total: 0, pending: 0, won: 0, lost: 0, void: 0, push: 0, parlays: 0, singles: 0 }
  );

  return res.json({
    ok: true,
    ledger,
    summary,
    total: count ?? 0,
    limit,
    offset,
  });
}));

parlayRoutes.get(
  "/me/parlays",
  requireAuth,
  validate({ query: ListParlaysQuerySchema }),
  listMyParlaysHandler
);

parlayRoutes.post(
  "/parlays/save",
  requireAuth,
  validate({ body: SaveMeParlaySchema }),
  saveMeParlayHandler
);

/**
 * PATCH /api/parlays/:id
 * User-editable parlay metadata only. Settlement status is server-graded only.
 */
parlayRoutes.patch(
  "/parlays/:id",
  requireAuth,
  validate({ params: ParlayIdParamsSchema, body: UpdateParlaySchema }),
  updateParlayHandler
);

/**
 * DELETE /api/parlays/:id
 *
 * User-facing hide/remove.
 * This must NEVER mutate status='void'.
 * `void` is reserved for official sportsbook/no-action outcomes only.
 *
 * Hiding preserves grading identity, saved parlay ID, Results Ledger truth,
 * live status, and official sportsbook outcome semantics.
 */
parlayRoutes.delete(
  "/parlays/:id",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  hideParlayHandler
);

/**
 * Legacy route kept for compatibility, but now protected.
 * If user_id is provided, it must match the logged-in user.
 */
parlayRoutes.get(
  "/parlays",
  requireAuth,
  validate({ query: ListParlaysQuerySchema }),
  listLegacyParlaysHandler
);
