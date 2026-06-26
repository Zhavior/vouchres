import { supabaseAdmin } from "../../middleware/auth";

/**
 * Pick persistence — replaces server/services/trust/resultLedgerService.ts
 * (which was an in-memory Map with 4 seeded fake picks).
 *
 * All pick lifecycle operations now go through Postgres. Trust scores are
 * rolled up via triggers / scheduled jobs.
 */

export interface PickRecord {
  id: string;
  user_id: string | null;
  capper_id: string | null;
  leg_type: "single" | "parlay";
  sport: string;
  event_id: string | null;
  market: string;
  selection: string;
  odds_decimal: number | null;
  stake_units: number | null;
  confidence: number | null;
  judge_quality: number | null;
  judge_risk: number | null;
  judge_bias: number | null;
  judge_trust: number | null;
  judge_verdict: string | null;
  status: "pending" | "won" | "lost" | "push" | "void" | "graded_error";
  graded_at: string | null;
  settled_units: number | null;
  explanation: string | null;
  learning_note: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Insert a new pick. Server-side only — RLS allows users to insert their own.
 * For capper picks, use the service role (this client).
 */
export async function createPick(
  input: Partial<Omit<PickRecord, "id" | "status" | "graded_at" | "settled_units" | "created_at" | "updated_at">> & {
    user_id: string | null;
    capper_id: string | null;
    leg_type: "single" | "parlay";
    sport: string;
    market: string;
    selection: string;
    is_demo?: boolean;
  }
): Promise<PickRecord> {
  const { data, error } = await supabaseAdmin
    .from("picks")
    .insert({ ...input, status: "pending" })
    .select("*")
    .single();

  if (error) throw error;
  return data as PickRecord;
}

/**
 * Grade a pick — set status, settled_units, learning_note.
 *
 * CRITICAL: Only call this from a trusted grading job (server-side cron or
 * admin route). NEVER accept grading input from the client — that was the
 * old vulnerability where /api/results/grade trusted the client to report
 * whether a pick won.
 */
export async function gradePick(opts: {
  pickId: string;
  status: "won" | "lost" | "push" | "void" | "graded_error";
  settledUnits: number | null;
  learningNote?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("picks")
    .update({
      status: opts.status,
      graded_at: new Date().toISOString(),
      settled_units: opts.settledUnits,
      learning_note: opts.learningNote ?? null,
    })
    .eq("id", opts.pickId);

  if (error) throw error;

  // Recompute the author's trust score (roll up from graded picks)
  await recomputeTrustForPick(opts.pickId);
}

/**
 * Get the public ledger — paginated, optionally filtered by author or status.
 */
export async function getLedger(opts: {
  userId?: string;
  capperId?: string;
  status?: PickRecord["status"];
  limit?: number;
  offset?: number;
}): Promise<{ picks: PickRecord[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;

  let query = supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.userId) query = query.eq("user_id", opts.userId);
  if (opts.capperId) query = query.eq("capper_id", opts.capperId);
  if (opts.status) query = query.eq("status", opts.status);

  const { data, count, error } = await query;
  if (error) throw error;

  return { picks: (data ?? []) as PickRecord[], total: count ?? 0 };
}

/**
 * Recompute trust_score, total_picks, won_picks, etc. for the author of a
 * pick after it has been graded. Updates both public.profiles and public.trust_scores.
 */
async function recomputeTrustForPick(pickId: string): Promise<void> {
  // 1. Look up the pick to find the author
  const { data: pick } = await supabaseAdmin
    .from("picks")
    .select("user_id, capper_id, sport")
    .eq("id", pickId)
    .single();
  if (!pick) return;

  const isUser = !!pick.user_id;
  const subjectId = (pick.user_id ?? pick.capper_id) as string;
  const subjectType: "user" | "capper" = isUser ? "user" : "capper";
  const scope = pick.sport ?? "overall";

  // 2. Aggregate all graded picks for this author in this scope
  const authorFilter = isUser
    ? { user_id: subjectId }
    : { capper_id: subjectId };

  const { data: graded, error } = await supabaseAdmin
    .from("picks")
    .select("status, settled_units")
    .match({ ...authorFilter, sport: scope })
    .in("status", ["won", "lost", "push"]);

  if (error) {
    console.error("[picks] trust recompute query failed", error);
    return;
  }

  const won = graded?.filter((p) => p.status === "won").length ?? 0;
  const lost = graded?.filter((p) => p.status === "lost").length ?? 0;
  const pushed = graded?.filter((p) => p.status === "push").length ?? 0;
  const total = won + lost + pushed;
  const netUnits =
    graded?.reduce((sum, p) => sum + Number(p.settled_units ?? 0), 0) ?? 0;

  // 3. Compute trust score on 0–100 scale.
  // Formula: weighted blend of win% and ROI, dampened for small samples.
  // This is intentionally simple — you can swap in mlbIntelligenceEngine.scoring
  // if you want the production formula.
  const winPct = total > 0 ? won / total : 0.5;
  const roiPerPick = total > 0 ? netUnits / total : 0;
  // Damp toward 50 (neutral) until the author has 20+ graded picks
  const damp = Math.min(1, total / 20);
  const rawScore = 50 + 30 * (winPct - 0.5) + 20 * Math.max(-1, Math.min(1, roiPerPick * 5));
  const score = 50 * (1 - damp) + rawScore * damp;
  const clampedScore = Math.max(0, Math.min(100, Number(score.toFixed(2))));

  // 4. Upsert trust_scores
  await supabaseAdmin.from("trust_scores").upsert(
    {
      subject_type: subjectType,
      subject_id: subjectId,
      scope,
      score: clampedScore,
      total_picks: total,
      won_picks: won,
      lost_picks: lost,
      pushed_picks: pushed,
      net_units: Number(netUnits.toFixed(2)),
      window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      window_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "subject_type,subject_id,scope" }
  );

  // 5. Mirror to profiles if subject is a user
  if (isUser) {
    await supabaseAdmin
      .from("profiles")
      .update({
        trust_score: clampedScore,
        total_picks: total,
        won_picks: won,
        lost_picks: lost,
        pushed_picks: pushed,
        net_units: Number(netUnits.toFixed(2)),
      })
      .eq("id", subjectId);
  }
}
