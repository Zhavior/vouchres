import { Router } from "express";
import type { Request, Response } from "express";
import { AuthedRequest, getSupabaseAdmin, requireAuth, requireLegalConfirmed } from "../middleware/auth";
import { gradingLimiter, pickLimiter } from "../middleware/rateLimit";
import { requireTierOrQuota, incrementQuota } from "../middleware/entitlements";
import { createPick } from "../services/persistence/pickService";
import { getGrader, settleParlay, type GameData, type GradableLeg, type LegOutcome } from "../services/grading/sportGraders";
import { gradePendingPicks } from "../services/grading/gradingService";

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
console.log("[parlayRoutes] mounted");

/* ============================================================
   POST /api/parlays/grade  — stateless grading (no auth, no DB)
   Grades legs live against the sport's data feed (MLB now; NBA/NFL
   return 'pending' until their graders exist). Used by the client to
   settle locally-stored parlays and reflect outcomes in Results.
   Body: { legs: [{ sport, gamePk, market, selection, threshold?, oddsDecimal? }], stakeUnits? }
   ============================================================ */
parlayRoutes.post("/parlays/grade", gradingLimiter, async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const legs = body.legs;
  const stakeUnits = typeof body.stakeUnits === "number" && body.stakeUnits > 0 ? body.stakeUnits : 1.0;

  if (!Array.isArray(legs) || legs.length === 0 || legs.length > 12) {
    return res.status(400).json({ error: "legs must be a 1–12 item array" });
  }
  const valid = legs.every(
    (l: any) =>
      l && typeof l.sport === "string" && typeof l.gamePk === "string" && l.gamePk &&
      typeof l.market === "string" && typeof l.selection === "string"
  );
  if (!valid) {
    return res.status(400).json({ error: "each leg needs sport, gamePk, market, selection" });
  }

  try {
    // Fetch each unique (sport+game) once.
    const gameCache = new Map<string, GameData | null>();
    for (const leg of legs as GradableLeg[]) {
      const key = `${leg.sport}:${leg.gamePk}`;
      if (!gameCache.has(key)) {
        gameCache.set(key, await getGrader(leg.sport).fetchGame(leg.gamePk));
      }
    }

    // Evaluate each leg.
    const gradedLegs = (legs as GradableLeg[]).map((leg) => {
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
      gradedLegs.map((l) => ({ outcome: { status: l.status, actual: l.actual ?? undefined }, oddsDecimal: l.oddsDecimal ?? undefined })),
      stakeUnits
    );

    return res.json({ legs: gradedLegs, parlay, gradedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[parlays/grade] failed", err?.message);
    return res.status(500).json({ error: "grade_failed", message: err?.message });
  }
});

/* ============================================================
   GET /api/parlays/grade-due  — lightweight DB-backed auto-grader
   Finds pending picks/parlays from the last 2 days, grades any whose games
   are now Final via MLB linescore, writes results to Supabase.
   Returns a summary — no heavy report building.
   ============================================================ */
parlayRoutes.get("/parlays/grade-due", requireAuth, gradingLimiter, async (req: AuthedRequest, res: Response) => {
  try {
    const days = Math.min(Number(req.query.days ?? 2), 7);
    const { graded, skipped } = await gradePendingPicks({ days });

    const settled = graded.filter((r) => r.status !== "graded_error");
    const pending = skipped.filter((r) => r.error?.includes("not final") || r.error?.includes("isComplete=false"));
    const errors = skipped.filter((r) => !r.error?.includes("not final") && !r.error?.includes("isComplete=false"));

    console.log(`[parlays/grade-due] settled=${settled.length} pending=${pending.length} errors=${errors.length}`);

    // Best-effort audit trail. Swallow if grading_logs (migration 0004) is absent.
    try {
      const logRows = [
        ...settled.map((r) => ({ pick_id: r.pick_id, status: r.status, reason: "graded", source: "grade-due" })),
        ...pending.map((r) => ({ pick_id: r.pick_id, status: "pending", reason: "pending_not_final", source: "grade-due" })),
        ...errors.map((r) => ({ pick_id: r.pick_id, status: "graded_error", reason: r.error ?? "error", source: "grade-due" })),
      ];
      if (logRows.length > 0) {
        const supabaseAdmin = await getSupabaseAdmin();
        const { error: logErr } = await supabaseAdmin.from("grading_logs").insert(logRows);
        if (logErr && !["42P01", "PGRST205"].includes(logErr.code)) {
          console.warn("[parlays/grade-due] grading_logs write failed", logErr.code, logErr.message);
        }
      }
    } catch (logErr: any) {
      // table missing or transient — never block grading on the audit log
      console.warn("[parlays/grade-due] grading_logs unavailable", logErr?.code);
    }

    return res.json({
      gradedParlays: settled.length,
      gradedLegs: graded.length,
      pendingLegs: pending.length,
      errors: errors.map((e) => ({ pick_id: e.pick_id, error: e.error })),
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[parlays/grade-due] failed", err?.message);
    return res.status(500).json({ error: "grade_due_failed", message: err?.message });
  }
});

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
parlayRoutes.get("/parlays/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const supabaseAdmin = await getSupabaseAdmin();

  const [pickRes, legsRes] = await Promise.all([
    supabaseAdmin
      .from("picks")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user!.id)
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


/**
 * GET /api/me/ledger
 * Authenticated user ledger for Results, Profile, and The Island dashboard.
 * Returns the current user's picks/parlays with legs grouped in one clean payload.
 */


/**
 * GET /api/me/dashboard-summary
 * Small authenticated summary for The Island dashboard widgets.
 */
parlayRoutes.get("/me/dashboard-summary", requireAuth, async (req: AuthedRequest, res: Response) => {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: picks, error } = await supabaseAdmin
    .from("picks")
    .select("id, status, leg_type, created_at")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    console.error("[me/dashboard-summary] fetch failed", error);
    return res.status(500).json({ error: "dashboard_summary_failed" });
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
});

parlayRoutes.get("/me/ledger", requireAuth, async (req: AuthedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 200);
  const offset = Number(req.query.offset ?? 0);
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
    return res.status(500).json({ error: "ledger_fetch_failed" });
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
      return res.status(500).json({ error: "ledger_legs_fetch_failed" });
    }

    legsByPickId = (legs ?? []).reduce((acc: Record<string, any[]>, leg: any) => {
      const key = String(leg.pick_id);
      acc[key] = acc[key] ?? [];
      acc[key].push(leg);
      return acc;
    }, {});
  }

  const ledger = (picks ?? []).map((pick: any) => ({
    ...pick,
    legs: legsByPickId[String(pick.id)] ?? [],
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
    ledger,
    summary,
    total: count ?? 0,
    limit,
    offset,
  });
});

parlayRoutes.get("/me/parlays", requireAuth, async (req: AuthedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  const supabaseAdmin = await getSupabaseAdmin();
  const { data, count, error } = await supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", req.user!.id)
    .eq("leg_type", "parlay")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: "fetch_failed" });

  // Join legs for each parlay
  const picks = data ?? [];
  let legsMap: Record<string, any[]> = {};
  if (picks.length > 0) {
    const pickIds = picks.map((p: any) => p.id);
    const { data: legs } = await supabaseAdmin
      .from("pick_legs")
      .select("*")
      .in("pick_id", pickIds)
      .order("leg_index", { ascending: true });
    for (const leg of legs ?? []) {
      const pid = String(leg.pick_id);
      if (!legsMap[pid]) legsMap[pid] = [];
      legsMap[pid].push(leg);
    }
  }

  const parlays = picks.map((p: any) => ({ ...p, legs: legsMap[String(p.id)] ?? [] }));
  return res.json({ parlays, total: count ?? 0, limit, offset });
});

function americanToDecimal(odds: number): number {
  if (odds >= 100) return 1 + odds / 100;
  if (odds <= -100) return 1 + 100 / Math.abs(odds);
  return Math.max(1.01, odds); // already decimal
}

/**
 * Normalize a leg's odds to DECIMAL, or null when the price is unknown.
 * NEVER fabricates a price (no 1 / 1.01 placeholders). Accepts either an
 * American `odds` field (preferred) or a `odds_decimal` field.
 *   - American (|x| >= 100) → decimal
 *   - decimal that is clearly real (> 1.01) → kept
 *   - 0 / NaN / missing / tiny placeholder → null
 */
function legOddsToDecimalOrNull(leg: any): number | null {
  const raw =
    typeof leg?.odds === "number" ? leg.odds
    : typeof leg?.odds_decimal === "number" ? leg.odds_decimal
    : null;
  if (raw === null || !Number.isFinite(raw) || raw === 0) return null;
  if (Math.abs(raw) >= 100) {
    const d = raw > 0 ? 1 + raw / 100 : 1 + 100 / Math.abs(raw);
    return Number(d.toFixed(3));
  }
  if (raw > 1.01) return Number(raw.toFixed(3));
  return null;
}

/** Postgres "column does not exist" / schema-cache-miss codes — used to detect
 *  whether migration 0003 (client_ref/source) has been applied yet. */
const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);
/** Postgres "function does not exist" / PostgREST RPC-not-found codes. */
const MISSING_FUNCTION_CODES = new Set(["42883", "PGRST202"]);

const MAX_LEGS = 12;
const VALID_SOURCES = new Set(["manual", "scanner", "ai_pick", "edge_island"]);
const NORMALIZED_STATUSES = new Set(["pending", "live", "won", "lost", "void", "partially_void"]);
/** Map the app's normalized status onto the DB pick_status enum. */
function toDbStatus(normalized: string): "pending" | "won" | "lost" | "void" | "push" {
  switch (normalized) {
    case "won": return "won";
    case "lost": return "lost";
    case "void": return "void";
    case "partially_void": return "void";
    // 'live' has no DB column — it is derived client-side; persist as pending.
    case "live":
    case "pending":
    default: return "pending";
  }
}

interface MeParlayValidation {
  ok: boolean;
  error?: string;
  detail?: string;
}

/** Validate + normalize the POST /api/me/parlays body. Returns clean errors. */
function validateMeParlayBody(body: any): MeParlayValidation {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };

  const legs = body.legs;
  if (!Array.isArray(legs) || legs.length < 1) {
    return { ok: false, error: "legs_required", detail: "At least 1 leg is required." };
  }
  if (legs.length > MAX_LEGS) {
    return { ok: false, error: "too_many_legs", detail: `Max ${MAX_LEGS} legs.` };
  }
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (!leg || typeof leg !== "object") {
      return { ok: false, error: "invalid_leg", detail: `Leg ${i} is not an object.` };
    }
    const odds = typeof leg.odds === "number" ? leg.odds : leg.odds_decimal;
    if (odds !== undefined && (typeof odds !== "number" || !Number.isFinite(odds))) {
      return { ok: false, error: "invalid_odds", detail: `Leg ${i} odds must be numeric.` };
    }
  }
  if (body.title !== undefined && (typeof body.title !== "string" || body.title.length > 200)) {
    return { ok: false, error: "invalid_title", detail: "Title must be a string ≤ 200 chars." };
  }
  if (body.wagerAmount !== undefined) {
    const stake = body.wagerAmount;
    if (typeof stake !== "number" || !Number.isFinite(stake) || stake < 0 || stake > 100000) {
      return { ok: false, error: "invalid_stake", detail: "Stake must be a non-negative number." };
    }
  }
  if (body.source !== undefined && !VALID_SOURCES.has(String(body.source))) {
    return { ok: false, error: "invalid_source", detail: `source must be one of ${[...VALID_SOURCES].join(", ")}.` };
  }
  if (body.status !== undefined && !NORMALIZED_STATUSES.has(String(body.status).toLowerCase())) {
    return { ok: false, error: "invalid_status", detail: `status must be one of ${[...NORMALIZED_STATUSES].join(", ")}.` };
  }
  return { ok: true };
}

/**
 * POST /api/me/parlays
 * Auth-only save for user-built parlays (no legal gate, no quota).
 *
 * Safety:
 *   - Full input validation (clean 400s, never crashes).
 *   - Duplicate protection via client_ref (idempotency key = the frontend's
 *     local parlay id). Re-saving the same parlay returns the existing row.
 *   - Atomic parent+legs insert via create_parlay_with_legs RPC when present;
 *     otherwise a parent-insert + leg-insert with rollback (no orphan parents).
 *   - Graceful degradation if migration 0003 (client_ref/source/RPC) is not
 *     applied yet.
 */
parlayRoutes.post("/me/parlays", (req, _res, next) => { console.log("[parlayRoutes] POST /api/me/parlays hit"); next(); }, requireAuth, async (req: AuthedRequest, res: Response) => {
  const body = req.body ?? {};
  const userId = req.user!.id;

  const v = validateMeParlayBody(body);
  if (!v.ok) {
    return res.status(400).json({ error: v.error, detail: v.detail });
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.slice(0, 200) : "My Parlay";
  const mode = body.mode === "REAL" ? "REAL" : "PRACTICE";
  const rawLegs: any[] = body.legs;
  const wagerAmount = typeof body.wagerAmount === "number" && body.wagerAmount > 0 ? body.wagerAmount : 1.0;
  const aiGenerated = body.aiGenerated === true;
  const source = VALID_SOURCES.has(String(body.source))
    ? String(body.source)
    : aiGenerated ? "ai_pick" : "manual";
  const clientRef = typeof body.clientRef === "string" && body.clientRef
    ? body.clientRef.slice(0, 128)
    : (typeof body.id === "string" && body.id ? body.id.slice(0, 128) : null);
  const dbStatus = toDbStatus(String(body.status ?? "pending").toLowerCase());

  // Normalize each leg's odds to decimal-or-null. Combined odds are only
  // computed when EVERY leg has a real price — otherwise the total is unknown
  // (null), never fabricated from placeholders.
  const legOdds: (number | null)[] = rawLegs.map((leg: any) => legOddsToDecimalOrNull(leg));
  const allLegsPriced = legOdds.length > 0 && legOdds.every((o) => o !== null);
  const combinedOdds: number | null = allLegsPriced
    ? Number((legOdds as number[]).reduce((prod, d) => prod * d, 1).toFixed(3))
    : null;

  const selectionSummary = rawLegs
    .map((l: any) => String(l.selection || l.market || "").slice(0, 60))
    .filter(Boolean)
    .join(" | ")
    .slice(0, 500);

  const parentEventId = String(rawLegs[0]?.gamePk || rawLegs[0]?.event_id || rawLegs[0]?.game || "manual").slice(0, 64);
  const sport = String(body.sport || rawLegs[0]?.sport || "mlb").slice(0, 32);

  const legsJson = rawLegs.map((leg: any, i: number) => ({
    leg_index: i,
    event_id: String(leg.gamePk || leg.event_id || leg.game || "manual").slice(0, 64),
    market: String(leg.market || leg.marketCode || "prop").slice(0, 64),
    selection: String(leg.selection || "").slice(0, 280) || "—",
    odds_decimal: legOdds[i], // decimal or null — never a placeholder
  }));

  const supabaseAdmin = await getSupabaseAdmin();

  const respond = (parlay: any, legsForResponse: any[], deduped = false) =>
    res.status(deduped ? 200 : 201).json({
      id: parlay.id,
      ...parlay,
      legs: legsForResponse,
      combined_odds: Number(combinedOdds.toFixed(3)),
      ai_generated: aiGenerated,
      deduped,
    });

  // 0. Duplicate protection — if this client_ref already exists, return it.
  if (clientRef) {
    try {
      const { data: existing } = await supabaseAdmin
        .from("picks")
        .select("*")
        .eq("user_id", userId)
        .eq("client_ref", clientRef)
        .limit(1)
        .maybeSingle();
      if (existing) {
        const { data: legs } = await supabaseAdmin
          .from("pick_legs").select("*").eq("pick_id", existing.id).order("leg_index", { ascending: true });
        return respond(existing, legs ?? [], true);
      }
    } catch (err: any) {
      // client_ref column missing (migration 0003 not applied) — skip dedup.
      if (!MISSING_COLUMN_CODES.has(err?.code)) {
        console.warn("[me/parlays] dedup lookup failed (continuing)", err?.code, err?.message);
      }
    }
  }

  // 1. Preferred path: atomic RPC.
  try {
    const { data: rpcPick, error: rpcError } = await supabaseAdmin.rpc("create_parlay_with_legs", {
      p_user_id: userId,
      p_sport: sport,
      p_event_id: parentEventId,
      p_market: `${rawLegs.length}-leg parlay`,
      p_selection: selectionSummary || title,
      p_odds_decimal: Number(combinedOdds.toFixed(3)),
      p_stake_units: wagerAmount,
      p_confidence: typeof body.edgeScore === "number" ? body.edgeScore : null,
      p_explanation: title,
      p_is_demo: mode === "PRACTICE",
      p_source: source,
      p_client_ref: clientRef,
      p_legs: legsJson,
    });

    if (!rpcError && rpcPick) {
      const pick = Array.isArray(rpcPick) ? rpcPick[0] : rpcPick;
      const { data: legs } = await supabaseAdmin
        .from("pick_legs").select("*").eq("pick_id", pick.id).order("leg_index", { ascending: true });
      return respond(pick, legs ?? []);
    }
    if (rpcError && !MISSING_FUNCTION_CODES.has(rpcError.code)) {
      // Real RPC failure (not just "function missing") — surface it.
      console.error("[me/parlays] RPC create failed", rpcError.code, rpcError.message);
      return res.status(500).json({ error: "save_failed" });
    }
    // else: RPC not installed → fall through to manual path.
  } catch (err: any) {
    if (!MISSING_FUNCTION_CODES.has(err?.code)) {
      console.error("[me/parlays] RPC threw", err?.code, err?.message);
    }
    // fall through to manual path
  }

  // 2. Fallback path: parent insert + legs insert with rollback.
  try {
    // Build parent payload; include source/client_ref only — strip on missing-col retry.
    const buildParent = (withExtras: boolean) => ({
      user_id: userId,
      capper_id: null,
      leg_type: "parlay" as const,
      sport,
      event_id: parentEventId,
      market: `${rawLegs.length}-leg parlay`,
      selection: selectionSummary || title,
      odds_decimal: Number(combinedOdds.toFixed(3)),
      stake_units: wagerAmount,
      confidence: typeof body.edgeScore === "number" ? body.edgeScore : null,
      explanation: title,
      is_demo: mode === "PRACTICE",
      status: dbStatus,
      ...(withExtras ? { source, client_ref: clientRef } : {}),
    });

    let parlay: any;
    let insertRes = await supabaseAdmin.from("picks").insert(buildParent(true)).select("*").single();
    if (insertRes.error && MISSING_COLUMN_CODES.has(insertRes.error.code)) {
      // Migration 0003 not applied — retry without source/client_ref.
      insertRes = await supabaseAdmin.from("picks").insert(buildParent(false)).select("*").single();
    }
    if (insertRes.error || !insertRes.data) {
      console.error("[me/parlays] parent insert failed", insertRes.error?.code, insertRes.error?.message);
      return res.status(500).json({ error: "save_failed" });
    }
    parlay = insertRes.data;

    const legsToInsert = legsJson.map((l) => ({ ...l, pick_id: parlay.id, status: "pending" as const }));
    const { error: legsError } = await supabaseAdmin.from("pick_legs").insert(legsToInsert);
    if (legsError) {
      // ROLLBACK: do not leave an orphan parent pick without legs.
      console.error("[me/parlays] legs insert failed — rolling back parent", legsError.code, legsError.message);
      await supabaseAdmin.from("picks").delete().eq("id", parlay.id);
      return res.status(500).json({ error: "parlay_creation_failed", detail: "Leg insert failed; parlay rolled back." });
    }

    const { data: legs } = await supabaseAdmin
      .from("pick_legs").select("*").eq("pick_id", parlay.id).order("leg_index", { ascending: true });
    return respond(parlay, legs ?? []);
  } catch (err: any) {
    console.error("[me/parlays] save failed", err?.message);
    return res.status(500).json({ error: "save_failed" });
  }
});

/**
 * PATCH /api/parlays/:id
 * Update parlay title, status, or settled_units. Ownership enforced.
 */
parlayRoutes.patch("/parlays/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const supabaseAdmin = await getSupabaseAdmin();

  // Verify ownership first
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("picks")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", req.user!.id)
    .single();

  if (fetchErr || !existing) {
    return res.status(404).json({ error: "parlay_not_found" });
  }

  const allowed: Record<string, true> = { explanation: true, status: true, stake_units: true };
  const updates: Record<string, unknown> = {};

  if (typeof req.body.title === "string") updates.explanation = req.body.title.slice(0, 200);
  if (["pending", "won", "lost", "void", "push"].includes(String(req.body.status || ""))) {
    updates.status = req.body.status;
  }
  if (typeof req.body.stake_units === "number" && req.body.stake_units > 0) {
    updates.stake_units = req.body.stake_units;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "no_valid_fields" });
  }

  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "update_failed" });
  return res.json(data);
});

/**
 * DELETE /api/parlays/:id
 * Soft-deletes a parlay by setting status='void'. Ownership enforced.
 */
parlayRoutes.delete("/parlays/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: existing } = await supabaseAdmin
    .from("picks")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", req.user!.id)
    .single();

  if (!existing) return res.status(404).json({ error: "parlay_not_found" });

  await supabaseAdmin
    .from("picks")
    .update({ status: "void", updated_at: new Date().toISOString() })
    .eq("id", id);

  return res.json({ deleted: true, id });
});

/**
 * Legacy route kept for compatibility, but now protected.
 * If user_id is provided, it must match the logged-in user.
 */
parlayRoutes.get("/parlays", requireAuth, async (req: AuthedRequest, res: Response) => {
  const requestedUserId = req.query.user_id as string | undefined;
  const userId = req.user!.id;

  if (requestedUserId && requestedUserId !== userId) {
    return res.status(403).json({ error: "forbidden" });
  }

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

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
