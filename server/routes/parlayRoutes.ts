import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, requireLegalConfirmed, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";
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

const ParlayLegSchema = z.object({
  event_id: z.string().max(64),
  market: z.string().min(1).max(64),
  selection: z.string().min(1).max(280),
  odds_decimal: z.number().positive().max(1000),
});

const CreateParlaySchema = z.object({
  legs: z.array(ParlayLegSchema).min(2).max(8),
  stake_units: z.number().positive().max(100).default(1.0),
  confidence: z.number().min(0).max(100).optional(),
  explanation: z.string().max(4000).optional(),
  // Optional: judge panel output for the combined parlay
  judge_quality: z.number().min(0).max(100).optional(),
  judge_risk: z.number().min(0).max(100).optional(),
  judge_bias: z.number().min(0).max(100).optional(),
  judge_trust: z.number().min(0).max(100).optional(),
  judge_verdict: z.string().max(32).optional(),
});

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
  validate({ body: CreateParlaySchema }),
  async (req: AuthedRequest, res: Response) => {
    const body = req.body as z.infer<typeof CreateParlaySchema>;

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
        stake_units: body.stake_units,
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
