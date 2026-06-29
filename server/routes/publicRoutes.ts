import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, optionalAuth, supabaseAdmin } from "../middleware/auth";
import { buildAiJudgeLeaderboard } from "../services/aiJudges/aiJudgeLeaderboardService";
import { saveCurrentAiJudgePicksToLedger } from "../services/aiJudges/aiJudgePickLedgerService";

/**
 * Public routes — world-readable data used by the home feed, leaderboard,
 * capper directory, and profile pages.
 *
 *   GET  /api/leaderboard              — top cappers by trust score
 *   GET  /api/cappers                  — all active cappers (with stats)
 *   GET  /api/cappers/:id              — single capper detail
 *   GET  /api/cappers/:id/picks        — capper's recent picks
 *   GET  /api/profile/:id              — any user's public profile
 *   GET  /api/profile/:id/stats        — followers/following/posts counts
 *   GET  /api/profile/:id/picks        — user's recent picks
 *   POST /api/follow                   — follow a user or capper (auth)
 *   DELETE /api/follow                 — unfollow (auth)
 *   GET  /api/following                — caller's follows (auth)
 */
export const publicRoutes = Router();


// =========================================================
// AI Judge Leaderboard
// =========================================================


publicRoutes.post("/ai-judges/save-current-picks", async (_req, res: Response) => {
  try {
    const payload = await saveCurrentAiJudgePicksToLedger();
    return res.json(payload);
  } catch (error: any) {
    console.error("[ai-judges] save current picks failed", error?.message);
    return res.status(500).json({
      status: "error",
      message: error?.message ?? "Failed to save AI Judge picks",
    });
  }
});

publicRoutes.get("/ai-judges/leaderboard", async (_req, res: Response) => {
  try {
    const payload = await buildAiJudgeLeaderboard();
    return res.json(payload);
  } catch (error: any) {
    console.error("[ai-judges] leaderboard failed", error?.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to build AI Judge leaderboard",
    });
  }
});

// =========================================================
// Leaderboard
// =========================================================

/**
 * GET /api/leaderboard?scope=overall&limit=50&min_picks=20&include_users=false
 */
publicRoutes.get("/leaderboard", async (req, res: Response) => {
  const scope = (req.query.scope as string) ?? "overall";
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const minPicks = Number(req.query.min_picks ?? 20);
  const includeUsers = req.query.include_users === "true";

  const subjectTypes = includeUsers ? ["capper", "user"] : ["capper"];

  const { data: scores, error } = await supabaseAdmin
    .from("trust_scores")
    .select(`
      subject_type,
      subject_id,
      scope,
      score,
      total_picks,
      won_picks,
      lost_picks,
      pushed_picks,
      net_units,
      window_start,
      window_end
    `)
    .eq("scope", scope)
    .in("subject_type", subjectTypes)
    .gte("total_picks", minPicks)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[leaderboard] query failed", error);
    return res.status(500).json({ error: "fetch_failed" });
  }

  if (!scores || scores.length === 0) {
    return res.json({ entries: [] });
  }

  // Hydrate with display info from profiles or cappers
  const capperIds = scores.filter((s: any) => s.subject_type === "capper").map((s: any) => s.subject_id);
  const userIds = scores.filter((s: any) => s.subject_type === "user").map((s: any) => s.subject_id);

  const [cappersRes, usersRes] = await Promise.all([
    capperIds.length > 0
      ? supabaseAdmin
          .from("cappers")
          .select("id, display_name, tagline, is_demo, is_active")
          .in("id", capperIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? supabaseAdmin
          .from("profiles")
          .select("id, username, display_name, avatar_url, is_demo")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (cappersRes.error || usersRes.error) {
    console.error("[leaderboard] hydration failed", cappersRes.error, usersRes.error);
    return res.status(500).json({ error: "hydration_failed" });
  }

  const capperMap = new Map((cappersRes.data ?? []).map((c: any) => [c.id, c]));
  const userMap = new Map((usersRes.data ?? []).map((u: any) => [u.id, u]));

  const entries = scores.map((s: any) => {
    if (s.subject_type === "capper") {
      const c = capperMap.get(s.subject_id);
      return {
        subject_type: "capper",
        capper_id: s.subject_id,
        display_name: c?.display_name ?? "Unknown",
        tagline: c?.tagline ?? "",
        is_demo: c?.is_demo ?? true,
        is_active: c?.is_active ?? false,
        score: Number(s.score),
        total_picks: s.total_picks,
        won_picks: s.won_picks,
        lost_picks: s.lost_picks,
        pushed_picks: s.pushed_picks,
        net_units: Number(s.net_units),
        window_start: s.window_start,
        window_end: s.window_end,
      };
    } else {
      const u = userMap.get(s.subject_id);
      return {
        subject_type: "user",
        user_id: s.subject_id,
        username: u?.username ?? "unknown",
        display_name: u?.display_name ?? "",
        avatar_url: u?.avatar_url ?? null,
        is_demo: u?.is_demo ?? false,
        score: Number(s.score),
        total_picks: s.total_picks,
        won_picks: s.won_picks,
        lost_picks: s.lost_picks,
        pushed_picks: s.pushed_picks,
        net_units: Number(s.net_units),
        window_start: s.window_start,
        window_end: s.window_end,
      };
    }
  });

  return res.json({ entries });
});

// =========================================================
// Cappers
// =========================================================

/**
 * GET /api/cappers
 * Returns all active cappers with their overall trust stats.
 */
publicRoutes.get("/cappers", async (_req, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("cappers")
    .select(`
      id,
      display_name,
      tagline,
      persona,
      is_demo,
      is_active,
      created_at
    `)
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  if (error) {
    console.error("[cappers] query failed", error);
    return res.status(500).json({ error: "fetch_failed" });
  }

  const capperIds = (data ?? []).map((c: any) => c.id);
  const { data: scores } = await supabaseAdmin
    .from("trust_scores")
    .select("subject_id, score, total_picks, won_picks, lost_picks, pushed_picks, net_units")
    .eq("scope", "overall")
    .in("subject_id", capperIds);

  const scoreMap = new Map((scores ?? []).map((s: any) => [s.subject_id, s]));

  const cappers = (data ?? []).map((c: any) => {
    const s = scoreMap.get(c.id);
    return {
      id: c.id,
      display_name: c.display_name,
      tagline: c.tagline,
      persona: c.persona,
      is_demo: c.is_demo,
      is_active: c.is_active,
      trust_score: s ? Number(s.score) : 50.0,
      total_picks: s?.total_picks ?? 0,
      won_picks: s?.won_picks ?? 0,
      lost_picks: s?.lost_picks ?? 0,
      pushed_picks: s?.pushed_picks ?? 0,
      net_units: s ? Number(s.net_units) : 0.0,
    };
  });

  return res.json({ cappers });
});

/**
 * GET /api/cappers/:id
 */
publicRoutes.get("/cappers/:id", async (req, res: Response) => {
  const { id } = req.params;

  const { data: capper, error } = await supabaseAdmin
    .from("cappers")
    .select("id, display_name, tagline, persona, is_demo, is_active, created_at")
    .eq("id", id)
    .single();

  if (error || !capper) {
    return res.status(404).json({ error: "not_found" });
  }

  const [scoresRes, picksRes] = await Promise.all([
    supabaseAdmin
      .from("trust_scores")
      .select("scope, score, total_picks, won_picks, lost_picks, pushed_picks, net_units")
      .eq("subject_type", "capper")
      .eq("subject_id", id),
    supabaseAdmin
      .from("picks")
      .select("id, market, selection, status, settled_units, created_at, graded_at, event_id")
      .eq("capper_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return res.json({
    ...capper,
    trust_scores: scoresRes.data ?? [],
    recent_picks: picksRes.data ?? [],
  });
});

/**
 * GET /api/cappers/:id/picks?limit=50&offset=0&status=pending|won|lost
 */
publicRoutes.get("/cappers/:id/picks", async (req, res: Response) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);
  const status = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .eq("capper_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: "fetch_failed" });

  return res.json({ picks: data ?? [], total: count ?? 0, limit, offset });
});

// =========================================================
// User profiles (public)
// =========================================================

/**
 * GET /api/profile/:id
 * Public profile. Does NOT include email or PII.
 */
publicRoutes.get("/profile/:id", async (req, res: Response) => {
  const { id } = req.params;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      bio,
      tier,
      trust_score,
      total_picks,
      won_picks,
      lost_picks,
      pushed_picks,
      net_units,
      is_demo,
      is_staff,
      created_at
    `)
    .eq("id", id)
    .single();

  if (error || !profile) {
    return res.status(404).json({ error: "not_found" });
  }

  return res.json(profile);
});

/**
 * GET /api/profile/:id/stats
 * Follower / following / post counts.
 */
publicRoutes.get("/profile/:id/stats", async (req, res: Response) => {
  const { id } = req.params;

  const [followers, following, posts] = await Promise.all([
    supabaseAdmin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_profile_id", id),
    supabaseAdmin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id),
    supabaseAdmin
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", id),
  ]);

  return res.json({
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    subscribers: 0, // implement when paid subs to cappers exist
    posts: posts.count ?? 0,
  });
});

/**
 * GET /api/profile/:id/picks
 */
publicRoutes.get("/profile/:id/picks", async (req, res: Response) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);
  const status = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: "fetch_failed" });

  return res.json({ picks: data ?? [], total: count ?? 0, limit, offset });
});

// =========================================================
// Follows (auth required)
// =========================================================

/**
 * POST /api/follow
 * Body: { following_profile_id?: string, following_capper_id?: string }
 */
publicRoutes.post("/follow", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { following_profile_id, following_capper_id } = req.body ?? {};

  if (!following_profile_id && !following_capper_id) {
    return res.status(400).json({ error: "must_specify_target" });
  }
  if (following_profile_id && following_capper_id) {
    return res.status(400).json({ error: "only_one_target" });
  }
  if (following_profile_id === req.user!.id) {
    return res.status(400).json({ error: "cannot_follow_self" });
  }

  const { error } = await supabaseAdmin.from("follows").upsert(
    {
      follower_id: req.user!.id,
      following_profile_id: following_profile_id ?? null,
      following_capper_id: following_capper_id ?? null,
    },
    { onConflict: "follower_id,following_profile_id,following_capper_id" }
  );

  if (error) {
    console.error("[follow] upsert failed", error);
    return res.status(500).json({ error: "follow_failed" });
  }

  return res.json({ ok: true });
});

/**
 * DELETE /api/follow
 * Same body shape as POST.
 */
publicRoutes.delete("/follow", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { following_profile_id, following_capper_id } = req.body ?? {};

  const { error } = await supabaseAdmin
    .from("follows")
    .delete()
    .match({
      follower_id: req.user!.id,
      following_profile_id: following_profile_id ?? null,
      following_capper_id: following_capper_id ?? null,
    });

  if (error) return res.status(500).json({ error: "unfollow_failed" });
  return res.json({ ok: true });
});

/**
 * GET /api/following
 * Returns the caller's follows.
 */
publicRoutes.get("/following", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("following_profile_id, following_capper_id, created_at")
    .eq("follower_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "fetch_failed" });
  return res.json({ follows: data ?? [] });
});
