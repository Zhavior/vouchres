import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, requireLegalConfirmed } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { betaSignupLimiter, pickLimiter } from "../middleware/rateLimit";
import { requireTierOrQuota, incrementQuota } from "../middleware/entitlements";
import { createPick, getLedger, gradePick } from "../services/persistence/pickService";
import { joinWaitlist } from "../services/persistence/betaService";

export const coreRoutes = Router();

/**
 * POST /api/beta/signup
 * Public waitlist signup. Replaces the localStorage-only flow in PremiumSubPage.
 */
const BetaSignupSchema = z.object({
  email: z.string().email().max(254),
});

coreRoutes.post(
  "/beta/signup",
  betaSignupLimiter,
  validate({ body: BetaSignupSchema }),
  async (req, res: Response) => {
    const { email } = req.body as z.infer<typeof BetaSignupSchema>;
    try {
      const signup = await joinWaitlist(email);
      return res.json({
        ok: true,
        state: signup.state,
        message:
          "You're on the waitlist. We'll email you when your invite is ready.",
      });
    } catch (err) {
      console.error("[beta] signup failed", err);
      return res.status(500).json({ error: "signup_failed" });
    }
  }
);

/**
 * POST /api/legal/confirm
 * User confirms 21+ age and selects jurisdiction.
 * Required before posting picks.
 */
const LegalConfirmSchema = z.object({
  age_confirmed: z.literal(true),
  jurisdiction: z.string().min(2).max(10),
});

coreRoutes.post(
  "/legal/confirm",
  requireAuth,
  validate({ body: LegalConfirmSchema }),
  async (req: AuthedRequest, res: Response) => {
    const { jurisdiction } = req.body as z.infer<typeof LegalConfirmSchema>;
    const { supabaseAdmin } = await import("../middleware/auth");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        age_confirmed_at: new Date().toISOString(),
        jurisdiction_confirmed_at: new Date().toISOString(),
        jurisdiction,
      })
      .eq("id", req.user!.id);

    if (error) return res.status(500).json({ error: "update_failed" });
    return res.json({ ok: true });
  }
);

/**
 * POST /api/picks
 * Create a new pick. Free users limited to 3/day.
 *
 * Body shape (simplified — extend to match your types.ts):
 *   { market, selection, odds_decimal?, stake_units?, confidence?, event_id?, legs?: [...] }
 */
const CreatePickSchema = z.object({
  market: z.string().min(1).max(64),
  selection: z.string().min(1).max(280),
  odds_decimal: z.number().positive().max(1000).optional(),
  stake_units: z.number().positive().max(100).optional(),
  confidence: z.number().min(0).max(100).optional(),
  event_id: z.string().max(64).optional(),
  leg_type: z.enum(["single", "parlay"]).default("single"),
  // Judge panel output (computed server-side via judgeRoutes — client should
  // pass through whatever the panel returned so we can snapshot it)
  judge_quality: z.number().min(0).max(100).optional(),
  judge_risk: z.number().min(0).max(100).optional(),
  judge_bias: z.number().min(0).max(100).optional(),
  judge_trust: z.number().min(0).max(100).optional(),
  judge_verdict: z.string().max(32).optional(),
  explanation: z.string().max(4000).optional(),
});

coreRoutes.post(
  "/picks",
  requireAuth,
  requireLegalConfirmed,
  pickLimiter,
  requireTierOrQuota("gold", 3, "picks_per_day"),
  validate({ body: CreatePickSchema }),
  async (req: AuthedRequest, res: Response) => {
    try {
      const body = req.body as z.infer<typeof CreatePickSchema>;
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

      // Increment quota for free users
      const q = (req as any).__quota;
      if (q) {
        await incrementQuota(req.user!.id, q.key, q.day);
      }

      return res.status(201).json(pick);
    } catch (err) {
      console.error("[picks] create failed", err);
      return res.status(500).json({ error: "create_failed" });
    }
  }
);

/**
 * GET /api/picks
 * Public ledger of all picks. Paginated.
 */
coreRoutes.get("/picks", async (req, res: Response) => {
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const userId = req.query.user_id as string | undefined;
  const capperId = req.query.capper_id as string | undefined;
  const status = req.query.status as "pending" | "won" | "lost" | "push" | "void" | undefined;

  try {
    const { picks, total } = await getLedger({ userId, capperId, status, limit, offset });
    return res.json({ picks, total, limit, offset });
  } catch (err) {
    console.error("[picks] list failed", err);
    return res.status(500).json({ error: "list_failed" });
  }
});

/**
 * POST /api/admin/grade
 * Staff-only endpoint to grade a pick after the event concludes.
 *
 * CRITICAL: This is the ONLY way a pick's status can change. The client
 * cannot grade picks. The grader runs server-side (cron job or admin button).
 */
const GradeSchema = z.object({
  pick_id: z.string().uuid(),
  status: z.enum(["won", "lost", "push", "void", "graded_error"]),
  settled_units: z.number().nullable(),
  learning_note: z.string().max(4000).optional(),
});

coreRoutes.post(
  "/admin/grade",
  requireAuth,
  (await import("../middleware/auth")).requireStaff,
  validate({ body: GradeSchema }),
  async (req: AuthedRequest, res: Response) => {
    const body = req.body as z.infer<typeof GradeSchema>;
    try {
      await gradePick({
        pickId: body.pick_id,
        status: body.status,
        settledUnits: body.settled_units,
        learningNote: body.learning_note,
      });
      return res.json({ ok: true });
    } catch (err) {
      console.error("[admin] grade failed", err);
      return res.status(500).json({ error: "grade_failed" });
    }
  }
);
