import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, optionalAuth, requireAuth, requireStaff, supabaseAdmin } from "../middleware/auth";
import { generationLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { PUBLIC_PICK_COLUMNS, toPublicPickDtos } from "../lib/publicPickDto";
import type { RequestWithContext } from "../middleware/requestContext";
import { AppError } from "../errors/AppError";
import { validate } from "../middleware/validation";
import { FollowCreateSchema, FollowDeleteSchema } from "../validators/mutationSchemas";
import { buildAiJudgeLeaderboard } from "../services/aiJudges/aiJudgeLeaderboardService";
import {
  getRelationshipForTarget,
  getProfileSocialStats,
  getSocialGraph,
  getSuggestedProfiles,
  removeFollow,
  upsertFollow,
  type RelationshipType,
  type SocialGraphBucket,
} from "../services/social/followService";
import {
  getMostVouchedPlayers,
  getPlayerVouchSummary,
  togglePlayerVouch,
} from "../services/social/playerVouchService";
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
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    try {
      const { saveCurrentAiJudgePicksToLedger } = await import("../services/aiJudges/aiJudgePickLedgerService");
      const payload = await saveCurrentAiJudgePicksToLedger();
      return res.json(apiOkFlat(req, payload as unknown as Record<string, unknown>));
    } catch (error: any) {
      console.error("[ai-judges] save current picks failed", error?.message);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to save AI Judge picks.",
        expose: false,
        cause: error,
      });
    }
  }),
);

publicRoutes.get("/ai-judges/registry", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const customSlotEnabled =
    process.env.AI_AGENT_PLUGINS_ENABLED === "true" ||
    process.env.NODE_ENV !== "production";

  return res.json(apiOkFlat(req, {
    status: "ready",
    agents: listAgentMeta(),
    customSlotEnabled,
    extensionDocs: EXTENSION_DOCS_PATH,
  }));
}));

publicRoutes.post(
  "/ai-judges/agents/:id/run",
  requireAuth,
  requireStaff,
  generationLimiter,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: `Agent not found: ${req.params.id}`,
      });
    }

    return res.json(apiOkFlat(req, {
      status: "stub",
      agentId: agent.id,
      message:
        "Extension point reserved. Wire external agent runners here via registerAgent() + staff auth.",
    }));
  }),
);

publicRoutes.get("/ai-judges/leaderboard", asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const payload = await buildAiJudgeLeaderboard();
    return res.json(apiOkFlat(req, payload as unknown as Record<string, unknown>));
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

publicRoutes.get("/leaderboard", asyncHandler(async (req: RequestWithContext, res: Response) => {
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
    return res.json(apiOkFlat(req, { entries: [] }));
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

  return res.json(apiOkFlat(req, { entries }));
}));

publicRoutes.get("/cappers", asyncHandler(async (req: RequestWithContext, res: Response) => {
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

  return res.json(apiOkFlat(req, { cappers }));
}));

publicRoutes.get("/cappers/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
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
      .select("id, market, selection, status, settled_units, created_at, graded_at, event_id, visibility")
      .eq("capper_id", id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let recentPicks = picksRes.data ?? [];
  if (picksRes.error) {
    // Missing visibility column → fail closed (never dump private capper slips).
    if (picksRes.error.code === "42703" || picksRes.error.code === "PGRST204") {
      console.warn("[public] picks.visibility unavailable — refusing unfiltered capper recent picks");
      recentPicks = [];
    } else {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to fetch capper picks.",
        cause: picksRes.error,
      });
    }
  }

  return res.json(apiOkFlat(req, {
    ...capper,
    trust_scores: scoresRes.data ?? [],
    recent_picks: recentPicks,
  }));
}));

publicRoutes.get("/cappers/:id/picks", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);
  const status = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from("picks")
    .select(PUBLIC_PICK_COLUMNS, { count: "exact" })
    .eq("capper_id", id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      console.warn("[public] picks.visibility unavailable — refusing unfiltered capper picks");
      return res.json(apiOkFlat(req, { picks: [], total: 0, limit, offset }));
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch capper picks.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, {
    picks: toPublicPickDtos((data ?? []) as unknown as Array<Record<string, unknown>>),
    total: count ?? 0,
    limit,
    offset,
  }));
}));

publicRoutes.get("/profile/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const { id } = req.params;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(`
      id,
      username,
      handle,
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

  return res.json(apiOkFlat(req, profile as unknown as Record<string, unknown>));
}));

publicRoutes.get("/profile/:id/stats", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const { id } = req.params;
  const stats = await getProfileSocialStats(id);
  return res.json(apiOkFlat(req, stats as unknown as Record<string, unknown>));
}));

/**
 * The proof snapshot is deliberately built from settled pick rows, rather
 * than trusting a client-side profile cache. It is safe to show publicly:
 * no private notes, idempotency keys, or raw grading data leave the server.
 */
publicRoutes.get("/profile/:id/proof", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const { id } = req.params;
  const [profileResult, picksResult, social] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, won_picks, lost_picks, pushed_picks, net_units")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("picks")
      .select("id, market, selection, status, settled_units, created_at, locked_at, graded_at")
      .eq("user_id", id)
      .in("status", ["won", "lost", "push"])
      .order("graded_at", { ascending: false, nullsFirst: false })
      .limit(5),
    getProfileSocialStats(id),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (!profileResult.data) {
    throw new AppError({ status: 404, code: "not_found", message: "Profile not found." });
  }
  if (picksResult.error) throw picksResult.error;

  const settledPicks = (picksResult.data ?? []) as Array<Record<string, unknown>>;
  // These values are maintained by the grading service when a pick settles;
  // using the profile snapshot gives the full record, while the query above
  // only needs to fetch the five rows rendered on this page.
  const wins = Number(profileResult.data.won_picks ?? 0);
  const losses = Number(profileResult.data.lost_picks ?? 0);
  const pushes = Number(profileResult.data.pushed_picks ?? 0);
  const settled = wins + losses + pushes;
  const decisionCount = wins + losses;
  const netUnits = Number(profileResult.data.net_units ?? 0);

  return res.json(apiOkFlat(req, {
    record: {
      wins,
      losses,
      pushes,
      settled,
      winRate: decisionCount > 0 ? Math.round((wins / decisionCount) * 1000) / 10 : null,
      netUnits: Math.round(netUnits * 100) / 100,
    },
    recentSettled: settledPicks.map((pick) => ({
      id: String(pick.id),
      market: String(pick.market ?? "pick"),
      selection: String(pick.selection ?? "Untitled pick"),
      status: String(pick.status),
      settledUnits: Number(pick.settled_units ?? 0),
      lockedAt: pick.locked_at ?? null,
      gradedAt: pick.graded_at ?? null,
      createdAt: pick.created_at ?? null,
    })),
    social,
  }));
}));

publicRoutes.get("/profile/:id/picks", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
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
    .select(PUBLIC_PICK_COLUMNS, { count: "exact" })
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

  return res.json(apiOkFlat(req, {
    picks: toPublicPickDtos((data ?? []) as unknown as Array<Record<string, unknown>>),
    total: count ?? 0,
    limit,
    offset,
  }));
}));

publicRoutes.post(
  "/follow",
  requireAuth,
  validate({ body: FollowCreateSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const {
    following_profile_id,
    following_capper_id,
    relationship_type,
    notify_enabled,
  } = req.body as {
    following_profile_id?: string | null;
    following_capper_id?: string | null;
    relationship_type?: RelationshipType;
    notify_enabled?: boolean;
  };

  if (following_profile_id === req.user!.id) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "You cannot follow yourself.",
      details: { error: "cannot_follow_self" },
    });
  }

  const relationshipType = (relationship_type ?? "follow") as RelationshipType;

  const result = await upsertFollow({
    followerId: req.user!.id,
    followingProfileId: following_profile_id ?? null,
    followingCapperId: following_capper_id ?? null,
    relationshipType,
    notifyEnabled: notify_enabled !== false,
  });

  return res.json(apiOkFlat(req, {
    relationship_type: result.relationshipType,
    notify_enabled: result.notifyEnabled,
    notifications_enabled: result.notifyEnabled,
  }));
}));

publicRoutes.delete(
  "/follow",
  requireAuth,
  validate({ body: FollowDeleteSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const { following_profile_id, following_capper_id } = req.body as {
    following_profile_id?: string | null;
    following_capper_id?: string | null;
  };

  await removeFollow({
    followerId: req.user!.id,
    followingProfileId: following_profile_id ?? null,
    followingCapperId: following_capper_id ?? null,
  });

  return res.json(apiOkFlat(req, {}));
}));

publicRoutes.get("/following", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const graph = await getSocialGraph({
    userId: req.user!.id,
    bucket: "following",
  });

  const follows = graph.entries.map((entry) => ({
    following_profile_id: entry.profileId,
    following_capper_id: entry.capperId,
    username: entry.username,
    display_name: entry.displayName,
    relationship_type: entry.relationshipType,
    notify_enabled: entry.notifyEnabled,
    is_friend: entry.isFriend,
    created_at: entry.followedAt,
  }));

  return res.json(apiOkFlat(req, { follows, summary: graph.summary }));
}));

publicRoutes.get("/social/graph", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const bucket = String(req.query.bucket ?? "all").trim().toLowerCase() as SocialGraphBucket;
  const allowed: SocialGraphBucket[] = ["all", "following", "followers", "friends", "subscribers", "tailing"];
  const normalized = allowed.includes(bucket) ? bucket : "all";
  const graph = await getSocialGraph({ userId: req.user!.id, bucket: normalized });
  return res.json(apiOkFlat(req, graph as unknown as Record<string, unknown>));
}));

publicRoutes.get("/social/relationship", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const profileId = typeof req.query.profile_id === "string" ? req.query.profile_id : null;
  const capperId = typeof req.query.capper_id === "string" ? req.query.capper_id : null;
  if (!profileId && !capperId) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Must specify profile_id or capper_id.",
    });
  }

  const relationship = await getRelationshipForTarget({
    viewerId: req.user!.id,
    profileId,
    capperId,
  });

  return res.json(apiOkFlat(req, relationship as unknown as Record<string, unknown>));
}));

publicRoutes.get("/social/suggestions", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 8), 24);
  const suggestions = await getSuggestedProfiles({
    userId: req.user!.id,
    limit,
  });
  return res.json(apiOkFlat(req, { suggestions }));
}));

publicRoutes.get("/player-vouches/summary", optionalAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const rawPlayerIds = typeof req.query.playerIds === "string" ? req.query.playerIds : "";
  const playerIds = rawPlayerIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (playerIds.length === 0) {
    return res.json(apiOkFlat(req, { summaries: [] }));
  }

  const summaries = await getPlayerVouchSummary({
    date,
    playerIds,
    viewerId: req.user?.id ?? null,
  });

  return res.json(apiOkFlat(req, { summaries }));
}));

publicRoutes.get("/player-vouches/leaderboard", optionalAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const limit = Math.min(Number(req.query.limit ?? 6), 12);
  const players = await getMostVouchedPlayers({
    date,
    limit,
    viewerId: req.user?.id ?? null,
  });

  return res.json(apiOkFlat(req, { players }));
}));

publicRoutes.post("/player-vouches/toggle", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const body = req.body as {
    player_id?: string | number;
    player_name?: string;
    team?: string | null;
    opponent?: string | null;
    game_pk?: string | number | null;
    context_date?: string | null;
    source_page?: string | null;
  };

  if (body.player_id == null || !String(body.player_id).trim() || !body.player_name?.trim()) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "player_id and player_name are required.",
    });
  }

  const result = await togglePlayerVouch({
    userId: req.user!.id,
    playerId: body.player_id,
    playerName: body.player_name.trim(),
    team: body.team ?? null,
    opponent: body.opponent ?? null,
    gamePk: body.game_pk ?? null,
    contextDate: body.context_date ?? null,
    sourcePage: body.source_page ?? null,
  });

  return res.json(apiOkFlat(req, result));
}));
