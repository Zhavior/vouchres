import { Router } from "express";
import type { Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { AuthedRequest, getSupabaseAdmin, requireAuth, requireLegalConfirmed, requireStaff } from "../middleware/auth";
import { betaSignupLimiter, pickLimiter } from "../middleware/rateLimit";
import { requireTierOrQuota, incrementQuota } from "../middleware/entitlements";
import { validate } from "../middleware/validation";
import { createPick, getLedger, gradePick } from "../services/persistence/pickService";
import { joinWaitlist } from "../services/persistence/betaService";
import { BetaSignupSchema, GradePickSchema, LegalConfirmSchema, type BetaSignupInput, type GradePickInput, type LegalConfirmInput } from "../validators/coreSchemas";
import { CreatePickSchema, ListPicksQuerySchema, type CreatePickInput, type ListPicksQuery } from "../validators/pickSchemas";

export const coreRoutes = Router();

coreRoutes.post(
  "/beta/signup",
  betaSignupLimiter,
  validate({ body: BetaSignupSchema }),
  asyncHandler(async (req, res: Response) => {
    const { email } = req.body as BetaSignupInput;
    const signup = await joinWaitlist(email);
    return res.json({
      ok: true,
      state: signup.state,
      message:
        "You're on the waitlist. We'll email you when your invite is ready.",
    });
  })
);

/**
 * POST /api/legal/confirm
 * User confirms 21+ age and selects jurisdiction.
 * Required before posting picks.
 */
coreRoutes.post(
  "/legal/confirm",
  requireAuth,
  validate({ body: LegalConfirmSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { jurisdiction } = req.body as LegalConfirmInput;
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        age_confirmed_at: new Date().toISOString(),
        jurisdiction_confirmed_at: new Date().toISOString(),
        jurisdiction,
      })
      .eq("id", req.user!.id);

    if (error) throw error;
    return res.json({ ok: true });
  })
);

/**
 * POST /api/picks
 * Create a new pick. Free users limited to 3/day.
 *
 * Body shape (simplified — extend to match your types.ts):
 *   { market, selection, odds_decimal?, stake_units?, confidence?, event_id?, legs?: [...] }
 */
coreRoutes.post(
  "/picks",
  requireAuth,
  requireLegalConfirmed,
  pickLimiter,
  requireTierOrQuota("gold", 3, "picks_per_day"),
  validate({ body: CreatePickSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const body = req.body as CreatePickInput;
    const pick = await createPick({
      user_id: req.user!.id,
      capper_id: null,
      leg_type: body.leg_type,
      sport: "mlb",
      event_id: body.event_id ?? null,
      market: body.market,
      selection: body.selection,
      odds_decimal: body.odds_decimal ?? null,
      stake_units: body.stake_units ?? null,
      confidence: body.confidence ?? null,
      judge_quality: body.judge_quality ?? null,
      judge_risk: body.judge_risk ?? null,
      judge_bias: body.judge_bias ?? null,
      judge_trust: body.judge_trust ?? null,
      judge_verdict: body.judge_verdict ?? null,
      explanation: body.explanation ?? null,
      is_demo: false,
    });

    // Increment quota for free users after the canonical write succeeds.
    const q = (req as any).__quota;
    if (q) {
      await incrementQuota(req.user!.id, q.key, q.day);
    }

    return res.status(201).json(pick);
  })
);

/**
 * GET /api/picks
 * Current user's pick ledger. Staff may query another user explicitly.
 */
coreRoutes.get(
  "/picks",
  requireAuth,
  validate({ query: ListPicksQuerySchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const query = req.query as unknown as ListPicksQuery;
    const requestedUserId = query.user_id;
    const capperId = query.capper_id;
    const userId = requestedUserId ?? (capperId && req.user!.profile.is_staff ? undefined : req.user!.id);

    if (requestedUserId && requestedUserId !== req.user!.id && !req.user!.profile.is_staff) {
      throw new AppError({ status: 403, code: "forbidden", message: "You cannot read another user's pick ledger." });
    }
    if (capperId && !req.user!.profile.is_staff) {
      throw new AppError({ status: 403, code: "forbidden", message: "Only staff can query capper ledgers directly." });
    }

    const { picks, total } = await getLedger({
      userId,
      capperId,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
    return res.json({ picks, total, limit: query.limit, offset: query.offset });
  })
);

/**
 * POST /api/admin/grade
 * Staff-only endpoint to grade a pick after the event concludes.
 *
 * CRITICAL: This is the ONLY way a pick's status can change. The client
 * cannot grade picks. The grader runs server-side (cron job or admin button).
 */
coreRoutes.post(
  "/admin/grade",
  requireAuth,
  requireStaff,
  validate({ body: GradePickSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const body = req.body as GradePickInput;
    const graded = await gradePick({
      pickId: body.pick_id,
      status: body.status,
      settledUnits: body.settled_units ?? null,
      learningNote: body.learning_note,
    });

    if (!graded) {
      throw new AppError({
        status: 409,
        code: "domain_state_error",
        message: "Pick was not pending or does not exist; no grade was applied.",
      });
    }

    return res.json({ ok: true });
  })
);
