import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, getSupabaseAdmin, requireAuth, requireLegalConfirmed, requireStaff } from "../middleware/auth";
import { betaSignupLimiter, pickLimiter } from "../middleware/rateLimit";
import { requireTierOrQuota, incrementQuota } from "../middleware/entitlements";
import { createPick, getLedger, gradePick } from "../services/persistence/pickService";
import { joinWaitlist } from "../services/persistence/betaService";

export const coreRoutes = Router();

/**
 * POST /api/beta/signup
 * Public waitlist signup. Replaces the localStorage-only flow in PremiumSubPage.
 */
function badRequest(res: Response, message = "invalid_request") {
  return res.status(400).json({ error: message });
}

function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

type CreatePickBody = {
  market: string;
  selection: string;
  odds_decimal?: number;
  stake_units?: number;
  confidence?: number;
  event_id?: string;
  leg_type?: "single" | "parlay";
  judge_quality?: number;
  judge_risk?: number;
  judge_bias?: number;
  judge_trust?: number;
  judge_verdict?: string;
  explanation?: string;
};

coreRoutes.post(
  "/beta/signup",
  betaSignupLimiter,
  async (req, res: Response) => {
    const email = req.body?.email;
    if (!isEmail(email)) return badRequest(res, "validation_error");
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
coreRoutes.post(
  "/legal/confirm",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    const { age_confirmed, jurisdiction } = req.body ?? {};
    if (age_confirmed !== true || typeof jurisdiction !== "string" || jurisdiction.length < 2 || jurisdiction.length > 10) {
      return badRequest(res, "validation_error");
    }
    const supabaseAdmin = await getSupabaseAdmin();
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
coreRoutes.post(
  "/picks",
  requireAuth,
  requireLegalConfirmed,
  pickLimiter,
  requireTierOrQuota("gold", 3, "picks_per_day"),
  async (req: AuthedRequest, res: Response) => {
    try {
      const body = req.body as CreatePickBody;
      if (
        typeof body?.market !== "string" ||
        body.market.length < 1 ||
        body.market.length > 64 ||
        typeof body.selection !== "string" ||
        body.selection.length < 1 ||
        body.selection.length > 280 ||
        (body.odds_decimal !== undefined && (!isNumber(body.odds_decimal) || body.odds_decimal <= 0 || body.odds_decimal > 1000)) ||
        (body.stake_units !== undefined && (!isNumber(body.stake_units) || body.stake_units <= 0 || body.stake_units > 100)) ||
        (body.confidence !== undefined && (!isNumber(body.confidence) || body.confidence < 0 || body.confidence > 100)) ||
        (body.event_id !== undefined && (typeof body.event_id !== "string" || body.event_id.length > 64)) ||
        (body.leg_type !== undefined && body.leg_type !== "single" && body.leg_type !== "parlay")
      ) {
        return badRequest(res, "validation_error");
      }
      const pick = await createPick({
        user_id: req.user!.id,
        capper_id: null,
        leg_type: body.leg_type ?? "single",
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
coreRoutes.post(
  "/admin/grade",
  requireAuth,
  requireStaff,
  async (req: AuthedRequest, res: Response) => {
    const body = req.body as {
      pick_id?: string;
      status?: "won" | "lost" | "push" | "void" | "graded_error";
      settled_units?: number | null;
      learning_note?: string;
    };
    if (
      typeof body?.pick_id !== "string" ||
      !["won", "lost", "push", "void", "graded_error"].includes(String(body.status)) ||
      (body.settled_units !== null && body.settled_units !== undefined && !isNumber(body.settled_units)) ||
      (body.learning_note !== undefined && (typeof body.learning_note !== "string" || body.learning_note.length > 4000))
    ) {
      return badRequest(res, "validation_error");
    }
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
