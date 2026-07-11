import { Router } from "express";
import type { Request, Response } from "express";
import { AuthedRequest, getSupabaseAdmin, requireAuth } from "../../middleware/auth";
import { requireTierOrQuota, incrementQuota } from "../../middleware/entitlements";
import { generationLimiter, gradingLimiter } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validation";
import { asyncHandler } from "../../lib/asyncHandler";
import { apiOkFlat } from "../../lib/apiResponse";
import { AppError } from "../../errors/AppError";
import type { RequestWithContext } from "../../middleware/requestContext";
import { boundedInt, upstreamUnavailable } from "../../lib/requestValidators";
import { getGrader, settleParlay, type GameData, type GradableLeg, type LegOutcome } from "../../services/grading/sportGraders";
import { getFeedComposerOptions } from "../../services/feed/composerOptionsService";
import {
  getParlayHandler,
  getParlayAuditHandler,
  hideParlayHandler,
  listLegacyParlaysHandler,
  listMyParlaysHandler,
  repairParlayIdentityHandler,
  saveMeParlayHandler,
  tailParlayHandler,
  updateParlayHandler,
} from "../../controllers/parlayController";
import {
  ListParlaysQuerySchema,
  ParlayIdParamsSchema,
  GradeParlaySchema,
  type GradeParlayInput,
  SaveMeParlaySchema,
  UpdateParlaySchema,
} from "../../validators/parlaySchemas";
import {
  AI_PARLAY_SOURCE,
  buildGeneratedAiParlays,
  enrichParlayRow,
  todayYmd,
  ymdFromValue,
} from "./parlayRouteHelpers";

/** User-facing parlay routes — save, list, grade preview, dashboard widgets. */
export const parlayUserRoutes = Router();

parlayUserRoutes.post(
  "/parlays/ai-generate",
  requireAuth,
  generationLimiter,
  requireTierOrQuota("gold", 2, "parlay_lab_saves"),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const start = Date.now();
    const date = ymdFromValue(req.body?.date) ?? todayYmd();
    const options = await getFeedComposerOptions({ sport: "MLB", date }).catch((err) => {
      console.error("[parlays/ai-generate] failed", (err as Error)?.message);
      throw upstreamUnavailable("AI parlay generation unavailable.", err);
    });
    const result = buildGeneratedAiParlays(options);
    const q = (req as { __quota?: { key: string; day: string } }).__quota;
    if (q) {
      await incrementQuota(req.user!.id, q.key, q.day);
    }
    console.log(`[parlays/ai-generate] date=${date} parlays=${result.parlays.length} warnings=${result.warnings.length} ${Date.now() - start}ms`);
    return res.json(apiOkFlat(req, {
      parlays: result.parlays,
      warnings: result.warnings,
      generatedAt: new Date().toISOString(),
      source: AI_PARLAY_SOURCE,
    }));
  }),
);

parlayUserRoutes.post(
  "/parlays/grade",
  gradingLimiter,
  validate({ body: GradeParlaySchema }),
  asyncHandler(async (req: Request & RequestWithContext, res: Response) => {
    const { legs, stakeUnits } = req.body as GradeParlayInput;
    const normalizedLegs = legs as GradableLeg[];

    const gameCache = new Map<string, GameData | null>();
    for (const leg of normalizedLegs) {
      const key = `${leg.sport}:${leg.gamePk}`;
      if (!gameCache.has(key)) {
        gameCache.set(key, await getGrader(leg.sport).fetchGame(leg.gamePk));
      }
    }

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
      stakeUnits,
    );

    return res.json(apiOkFlat(req, {
      legs: gradedLegs,
      parlay,
      gradedAt: new Date().toISOString(),
    }));
  }),
);

parlayUserRoutes.post("/parlays", requireAuth, asyncHandler(async (_req: AuthedRequest, res: Response) => {
  throw new AppError({
    status: 410,
    code: "gone",
    message: "Use POST /api/parlays/save for canonical parlay saves.",
    details: { legacy: "legacy_parlay_route_disabled" },
  });
}));

parlayUserRoutes.get(
  "/parlays/:id",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  getParlayHandler,
);

parlayUserRoutes.get("/me/dashboard-summary", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
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
    },
  );

  const graded = summary.won + summary.lost + summary.void + summary.push;
  const decisions = summary.won + summary.lost;

  const winRate =
    decisions > 0 ? Number(((summary.won / decisions) * 100).toFixed(1)) : null;

  const proofScore =
    graded > 0
      ? Math.min(100, Math.round((summary.won * 7 + summary.push * 2 + graded * 1.5)))
      : 0;

  return res.json(apiOkFlat(req, {
    widgets: {
      savedPicks: summary.total,
      savedParlays: summary.parlays,
      pendingPicks: summary.pending,
      winRate,
      proofScore,
    },
    summary,
    recent: rows.slice(0, 8),
  }));
}));

parlayUserRoutes.get("/me/ledger", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
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
    { total: 0, pending: 0, won: 0, lost: 0, void: 0, push: 0, parlays: 0, singles: 0 },
  );

  return res.json(apiOkFlat(req, {
    ledger,
    summary,
    total: count ?? 0,
    limit,
    offset,
  }));
}));

parlayUserRoutes.get(
  "/me/parlays",
  requireAuth,
  validate({ query: ListParlaysQuerySchema }),
  listMyParlaysHandler,
);

parlayUserRoutes.post(
  "/parlays/save",
  requireAuth,
  validate({ body: SaveMeParlaySchema }),
  saveMeParlayHandler,
);

parlayUserRoutes.get(
  "/parlays/:id/audit",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  getParlayAuditHandler,
);

parlayUserRoutes.post(
  "/parlays/:id/repair-identity",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  repairParlayIdentityHandler,
);

parlayUserRoutes.patch(
  "/parlays/:id",
  requireAuth,
  validate({ params: ParlayIdParamsSchema, body: UpdateParlaySchema }),
  updateParlayHandler,
);

parlayUserRoutes.post(
  "/parlays/:id/tail",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  tailParlayHandler,
);

parlayUserRoutes.delete(
  "/parlays/:id",
  requireAuth,
  validate({ params: ParlayIdParamsSchema }),
  hideParlayHandler,
);

parlayUserRoutes.get(
  "/parlays",
  requireAuth,
  validate({ query: ListParlaysQuerySchema }),
  listLegacyParlaysHandler,
);
