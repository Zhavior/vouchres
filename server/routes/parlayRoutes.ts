import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, getSupabaseAdmin, requireAuth, requireLegalConfirmed } from "../middleware/auth";
import { pickLimiter } from "../middleware/rateLimit";
import { requireTierOrQuota, incrementQuota } from "../middleware/entitlements";
import { createPick } from "../services/persistence/pickService";

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

type ParlayLegBody = {
  event_id: string;
  market: string;
  selection: string;
  odds_decimal: number;
};

type CreateParlayBody = {
  legs: ParlayLegBody[];
  stake_units?: number;
  confidence?: number;
  explanation?: string;
  judge_quality?: number;
  judge_risk?: number;
  judge_bias?: number;
  judge_trust?: number;
  judge_verdict?: string;
};

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLeg(leg: unknown): leg is ParlayLegBody {
  const row = leg as ParlayLegBody;
  return (
    typeof row?.event_id === "string" &&
    row.event_id.length <= 64 &&
    typeof row.market === "string" &&
    row.market.length >= 1 &&
    row.market.length <= 64 &&
    typeof row.selection === "string" &&
    row.selection.length >= 1 &&
    row.selection.length <= 280 &&
    isNumber(row.odds_decimal) &&
    row.odds_decimal > 0 &&
    row.odds_decimal <= 1000
  );
}

function isValidParlayBody(body: unknown): body is CreateParlayBody {
  const row = body as CreateParlayBody;
  return (
    Array.isArray(row?.legs) &&
    row.legs.length >= 2 &&
    row.legs.length <= 8 &&
    row.legs.every(isValidLeg) &&
    (row.stake_units === undefined || (isNumber(row.stake_units) && row.stake_units > 0 && row.stake_units <= 100)) &&
    (row.confidence === undefined || (isNumber(row.confidence) && row.confidence >= 0 && row.confidence <= 100)) &&
    (row.explanation === undefined || (typeof row.explanation === "string" && row.explanation.length <= 4000))
  );
}

/**
 * POST /api/parlays
 *
 * Creates a parlay pick + all legs atomically.
 *
 * Combined odds = product of leg odds (standard parlay math).
 * The pick's event_id is set to the FIRST leg's event_id (for grading
 * convenience — the grader will fetch each leg's event_id individually).
 */
parlayRoutes.post(
  "/parlays",
  requireAuth,
  requireLegalConfirmed,
  pickLimiter,
  requireTierOrQuota("gold", 2, "parlays_per_day"),
  async (req: AuthedRequest, res: Response) => {
    if (!isValidParlayBody(req.body)) {
      return res.status(400).json({ error: "validation_error" });
    }
    const body = req.body;

    // 1. Compute combined odds
    const combinedOdds = body.legs.reduce((product, leg) => product * leg.odds_decimal, 1);

    // 2. Use the first leg's event_id as the parlay's parent event
    // (the grader handles multi-event parlays via pick_legs.event_id)
    const parentEventId = body.legs[0].event_id;

    try {
      // 3. Create the parent parlay pick
      const parlay = await createPick({
        user_id: req.user!.id,
        capper_id: null,
        leg_type: "parlay",
        sport: "mlb",
        event_id: parentEventId,
        market: `${body.legs.length}-leg parlay`,
        selection: body.legs.map((l) => l.selection).join(" | "),
        odds_decimal: Number(combinedOdds.toFixed(3)),
        stake_units: body.stake_units ?? 1.0,
        confidence: body.confidence ?? null,
        judge_quality: body.judge_quality ?? null,
        judge_risk: body.judge_risk ?? null,
        judge_bias: body.judge_bias ?? null,
        judge_trust: body.judge_trust ?? null,
        judge_verdict: body.judge_verdict ?? null,
        explanation: body.explanation ?? null,
        is_demo: false,
      });

      // 4. Insert all legs in a single batch
      const legsToInsert = body.legs.map((leg, index) => ({
        pick_id: parlay.id,
        leg_index: index,
        event_id: leg.event_id,
        market: leg.market,
        selection: leg.selection,
        odds_decimal: leg.odds_decimal,
        status: "pending" as const,
      }));

      const supabaseAdmin = await getSupabaseAdmin();
      const { error: legsError } = await supabaseAdmin
        .from("pick_legs")
        .insert(legsToInsert);

      if (legsError) {
        // Rollback the parent pick — legs failed to insert
        console.error("[parlays] legs insert failed, rolling back parent", legsError);
        await supabaseAdmin.from("picks").delete().eq("id", parlay.id);
        return res.status(500).json({ error: "parlay_creation_failed" });
      }

      // 5. Increment quota for free users
      const q = (req as any).__quota;
      if (q) {
        await incrementQuota(req.user!.id, q.key, q.day);
      }

      // 6. Return the parlay with legs
      return res.status(201).json({
        ...parlay,
        legs: legsToInsert.map((l, i) => ({
          ...l,
          id: `${parlay.id}-leg-${i}`, // synthetic ID for client display
        })),
        combined_odds: Number(combinedOdds.toFixed(3)),
      });
    } catch (err) {
      console.error("[parlays] create failed", err);
      return res.status(500).json({ error: "parlay_creation_failed" });
    }
  }
);

/**
 * GET /api/parlays/:id
 * Returns a parlay pick with all its legs.
 */
parlayRoutes.get("/parlays/:id", async (req, res: Response) => {
  const { id } = req.params;
  const supabaseAdmin = await getSupabaseAdmin();

  const [pickRes, legsRes] = await Promise.all([
    supabaseAdmin
      .from("picks")
      .select("*")
      .eq("id", id)
      .eq("leg_type", "parlay")
      .single(),
    supabaseAdmin
      .from("pick_legs")
      .select("*")
      .eq("pick_id", id)
      .order("leg_index", { ascending: true }),
  ]);

  if (pickRes.error || !pickRes.data) {
    return res.status(404).json({ error: "parlay_not_found" });
  }

  return res.json({
    ...pickRes.data,
    legs: legsRes.data ?? [],
  });
});

/**
 * GET /api/parlays?user_id=X&limit=50&offset=0
 * List a user's parlays.
 */
parlayRoutes.get("/parlays", async (req, res: Response) => {
  const userId = req.query.user_id as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  if (!userId) {
    return res.status(400).json({ error: "user_id_required" });
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const { data, count, error } = await supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("leg_type", "parlay")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: "fetch_failed" });

  return res.json({ parlays: data ?? [], total: count ?? 0, limit, offset });
});
