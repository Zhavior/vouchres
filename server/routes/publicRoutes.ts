import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, requireStaff, supabaseAdmin } from "../middleware/auth";
import { generationLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { buildAiJudgeLeaderboard } from "../services/aiJudges/aiJudgeLeaderboardService";
import {
  EXTENSION_DOCS_PATH,
  getAgent,
  listAgentMeta,
} from "../services/aiJudges/agentRegistry";

/**
 * Public routes — world-readable data used by the home feed, leaderboard,
 * capper directory, and profile pages.
 */
export const publicRoutes = Router();

publicRoutes.post(
  "/ai-judges/save-current-picks",
  requireAuth,
  requireStaff,
  generationLimiter,
  asyncHandler(async (_req, res: Response) => {
    try {
      const { saveCurrentAiJudgePicksToLedger } = await import("../services/aiJudges/aiJudgePickLedgerService");
      const payload = await saveCurrentAiJudgePicksToLedger();
      return res.json({ ok: true, ...payload });
    } catch (error: any) {
      console.error("[ai-judges] save current picks failed", error?.message);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: error?.message ?? "Failed to save AI Judge picks",
        expose: true,
        cause: error,
      });
    }
  }),
);

publicRoutes.get("/ai-judges/registry", asyncHandler(async (_req, res: Response) => {
  const customSlotEnabled =
    process.env.AI_AGENT_PLUGINS_ENABLED === "true" ||
    process.env.NODE_ENV !== "production";

  return res.json({
    ok: true,
    status: "ready",
    agents: listAgentMeta(),
    customSlotEnabled,
    extensionDocs: EXTENSION_DOCS_PATH,
  });
}));

publicRoutes.post(
  "/ai-judges/agents/:id/run",
  requireAuth,
  requireStaff,
  generationLimiter,
  asyncHandler(async (req, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: `Agent not found: ${req.params.id}`,
      });
    }

    return res.json({
      ok: true,
      status: "stub",
      agentId: agent.id,
      message:
        "Extension point reserved. Wire external agent runners here via registerAgent() + staff auth.",
    });
  }),
);

publicRoutes.get("/ai-judges/leaderboard", asyncHandler(async (_req, res: Response) => {
  try {
    const payload = await buildAiJudgeLeaderboard();
    return res.json({ ok: true, ...payload });
  } catch (error: any) {
    console.error("[ai-judges] leaderboard failed", error?.message);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to build AI Judge leaderboard",
      cause: error,
    });
  }
}));

publicRoutes.get("/leaderboard", asyncHandler(async (req, res: Response) => {
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
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch leaderboard.",
      cause: error,
    });
  }

  if (!scores || scores.length === 0) {
    return res.json({ ok: true, entries: [] });
  }

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
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to hydrate leaderboard.",
      cause: cappersRes.error ?? usersRes.error,
    });
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
    }

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
  });

  return res.json({ ok: true, entries });
}));

publicRoutes.get("/cappers", asyncHandler(async (_req, res: Response) => {
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
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch cappers.",
      cause: error,
    });
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

  return res.json({ ok: true, cappers });
}));

publicRoutes.get("/cappers/:id", asyncHandler(async (req, res: Response) => {
  const { id } = req.params;

  const { data: capper, error } = await supabaseAdmin
    .from("cappers")
    .select("id, display_name, tagline, persona, is_demo, is_active, created_at")
    .eq("id", id)
    .single();

  if (error || !capper) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Capper not found.",
    });
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
    ok: true,
    ...capper,
    trust_scores: scoresRes.data ?? [],
    recent_picks: picksRes.data ?? [],
  });
}));

publicRoutes.get("/cappers/:id/picks", asyncHandler(async (req, res: Response) => {
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
  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch capper picks.",
      cause: error,
    });
  }

  return res.json({ ok: true, picks: data ?? [], total: count ?? 0, limit, offset });
}));

publicRoutes.get("/profile/:id", asyncHandler(async (req, res: Response) => {
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
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Profile not found.",
    });
  }

  return res.json({ ok: true, ...profile });
}));

publicRoutes.get("/profile/:id/stats", asyncHandler(async (req, res: Response) => {
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
    ok: true,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    subscribers: 0,
    posts: posts.count ?? 0,
  });
}));

publicRoutes.get("/profile/:id/picks", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);
  const status = req.query.status as string | undefined;

  if (id !== req.user!.id && !req.user!.profile.is_staff) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: "You cannot view another user's private picks.",
    });
  }

  let query = supabaseAdmin
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch profile picks.",
      cause: error,
    });
  }

  return res.json({ ok: true, picks: data ?? [], total: count ?? 0, limit, offset });
}));

publicRoutes.post("/follow", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { following_profile_id, following_capper_id } = req.body ?? {};

  if (!following_profile_id && !following_capper_id) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Must specify a follow target.",
      details: { error: "must_specify_target" },
    });
  }
  if (following_profile_id && following_capper_id) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Only one follow target is allowed.",
      details: { error: "only_one_target" },
    });
  }
  if (following_profile_id === req.user!.id) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "You cannot follow yourself.",
      details: { error: "cannot_follow_self" },
    });
  }

  const { error } = await supabaseAdmin.from("follows").upsert(
    {
      follower_id: req.user!.id,
      following_profile_id: following_profile_id ?? null,
      following_capper_id: following_capper_id ?? null,
    },
    { onConflict: "follower_id,following_profile_id,following_capper_id" },
  );

  if (error) {
    console.error("[follow] upsert failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to follow target.",
      cause: error,
    });
  }

  return res.json({ ok: true });
}));

publicRoutes.delete("/follow", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { following_profile_id, following_capper_id } = req.body ?? {};

  const { error } = await supabaseAdmin
    .from("follows")
    .delete()
    .match({
      follower_id: req.user!.id,
      following_profile_id: following_profile_id ?? null,
      following_capper_id: following_capper_id ?? null,
    });

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to unfollow target.",
      cause: error,
    });
  }

  return res.json({ ok: true });
}));

publicRoutes.get("/following", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("following_profile_id, following_capper_id, created_at")
    .eq("follower_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch follows.",
      cause: error,
    });
  }

  return res.json({ ok: true, follows: data ?? [] });
}));
