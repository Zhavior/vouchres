import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, supabaseAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { findLegsForPicks } from "../repositories/parlayRepository";

export const subscriberRoutes = Router();

async function loadFollowingIds(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("following_profile_id, following_capper_id")
    .eq("follower_id", userId);

  if (error) throw error;

  const profileIds = (data ?? [])
    .map((row: { following_profile_id?: string | null }) => row.following_profile_id)
    .filter(Boolean) as string[];
  const capperIds = (data ?? [])
    .map((row: { following_capper_id?: string | null }) => row.following_capper_id)
    .filter(Boolean) as string[];

  return { profileIds, capperIds };
}

async function assertFollowsCapper(userId: string, capperId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_capper_id", capperId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: "Follow this capper to view subscriber picks.",
      details: { error: "not_following" },
    });
  }
}

async function assertFollowsProfile(userId: string, profileId: string): Promise<void> {
  if (userId === profileId) return;

  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_profile_id", profileId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: "Follow this creator to view subscriber picks.",
      details: { error: "not_following" },
    });
  }
}

subscriberRoutes.get("/subscriber/channels", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const following = await loadFollowingIds(userId);

  const [cappersRes, profilesRes] = await Promise.all([
    supabaseAdmin
      .from("cappers")
      .select("id, display_name, tagline, persona, is_demo, is_active, created_at")
      .eq("is_active", true)
      .order("display_name", { ascending: true }),
    following.profileIds.length > 0
      ? supabaseAdmin
          .from("profiles")
          .select("id, handle, username, display_name, avatar_url, bio, trust_score, total_picks, won_picks, lost_picks")
          .in("id", following.profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (cappersRes.error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load capper channels.",
      cause: cappersRes.error,
    });
  }
  if (profilesRes.error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load followed profiles.",
      cause: profilesRes.error,
    });
  }

  const capperIds = (cappersRes.data ?? []).map((c: { id: string }) => c.id);
  const { data: capperFollowCounts } = capperIds.length > 0
    ? await supabaseAdmin
        .from("follows")
        .select("following_capper_id")
        .in("following_capper_id", capperIds)
    : { data: [] };

  const followerCountByCapper = (capperFollowCounts ?? []).reduce((acc: Record<string, number>, row: { following_capper_id?: string | null }) => {
    const key = String(row.following_capper_id ?? "");
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return res.json(apiOkFlat(req, {
    following,
    cappers: (cappersRes.data ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      follower_count: followerCountByCapper[String(c.id)] ?? 0,
      is_following: following.capperIds.includes(String(c.id)),
    })),
    profiles: profilesRes.data ?? [],
    owner_profile_id: userId,
  }));
}));

subscriberRoutes.get("/subscriber/cappers/:id/picks", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const capperId = req.params.id;
  await assertFollowsCapper(userId, capperId);

  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("*")
    .eq("capper_id", capperId)
    .eq("leg_type", "parlay")
    .is("user_hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load capper parlays.",
      cause: error,
    });
  }

  const rows = data ?? [];
  const legsByPickId = await findLegsForPicks(rows.map((row: { id: string }) => String(row.id)));

  return res.json(apiOkFlat(req, {
    picks: rows.map((row: Record<string, unknown>) => ({
      ...row,
      legs: legsByPickId[String(row.id)] ?? [],
    })),
  }));
}));

subscriberRoutes.get("/subscriber/profiles/:id/picks", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const profileId = req.params.id;
  await assertFollowsProfile(userId, profileId);

  const limit = Math.min(Number(req.query.limit ?? 20), 50);

  // Public/shared parlays only: visibility=public when available, else linked to a feed post.
  let query = supabaseAdmin
    .from("picks")
    .select("*")
    .eq("user_id", profileId)
    .eq("leg_type", "parlay")
    .is("user_hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  if (error && error.code !== "42703" && error.code !== "PGRST204") {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load profile parlays.",
      cause: error,
    });
  }

  let rows = data ?? [];
  if (error?.code === "42703" || error?.code === "PGRST204") {
    const fallback = await supabaseAdmin
      .from("picks")
      .select("*")
      .eq("user_id", profileId)
      .eq("leg_type", "parlay")
      .is("user_hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (fallback.error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to load profile parlays.",
        cause: fallback.error,
      });
    }
    rows = fallback.data ?? [];
  } else {
    rows = (data ?? []).filter((row: { visibility?: string }) => row.visibility === "public");
  }

  if (rows.length === 0) {
    const { data: postedPickIds } = await supabaseAdmin
      .from("posts")
      .select("pick_id")
      .eq("author_id", profileId)
      .not("pick_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    const pickIds = (postedPickIds ?? [])
      .map((row: { pick_id?: string | null }) => row.pick_id)
      .filter(Boolean) as string[];

    if (pickIds.length > 0) {
      const { data: postedPicks, error: postedError } = await supabaseAdmin
        .from("picks")
        .select("*")
        .in("id", pickIds)
        .eq("leg_type", "parlay")
        .is("user_hidden_at", null);

      if (postedError) {
        throw new AppError({
          status: 500,
          code: "internal_server_error",
          message: "Failed to load posted parlays.",
          cause: postedError,
        });
      }
      rows = postedPicks ?? [];
    }
  }

  const legsByPickId = await findLegsForPicks(rows.map((row: { id: string }) => String(row.id)));

  return res.json(apiOkFlat(req, {
    picks: rows.map((row: Record<string, unknown>) => ({
      ...row,
      legs: legsByPickId[String(row.id)] ?? [],
    })),
  }));
}));
