import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, supabaseAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { findLegsForPicks } from "../repositories/parlayRepository";
import { canFollowerAccessBusinessCapability } from "../services/business/creatorBusinessService";
import {
  buildSubscriberChannelsProjection,
  canViewerAccessCapperSubscriberContent,
  canViewerAccessProfileSubscriberContent,
} from "../services/social/socialProjectionService";
import { PUBLIC_PICK_COLUMNS, toPublicPickDto } from "../lib/publicPickDto";

export const subscriberRoutes = Router();

/** Follower-gated delivery: public + subscriber. Never expose private. */
const FOLLOWER_PICK_VISIBILITIES = ["public", "subscriber"] as const;

function isFollowerVisiblePick(visibility: unknown): boolean {
  return visibility === "public" || visibility === "subscriber";
}

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
  const allowed = await canViewerAccessCapperSubscriberContent(userId, capperId);
  if (!allowed) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: "Follow this capper to view subscriber picks.",
      details: { error: "not_following" },
    });
  }
}

async function assertFollowsProfile(userId: string, profileId: string): Promise<void> {
  const allowed = await canViewerAccessProfileSubscriberContent(userId, profileId);
  if (!allowed) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: "Follow this creator to view subscriber picks.",
      details: { error: "not_following" },
    });
  }
}

async function assertProfileCapability(userId: string, profileId: string, capability: "shared_parlays" | "announcements" | "club_chat"): Promise<void> {
  if (userId === profileId) return;
  const allowed = await canFollowerAccessBusinessCapability({
    ownerProfileId: profileId,
    followerProfileId: userId,
    capability,
  }).catch(() => false);
  if (!allowed) {
    throw new AppError({
      status: 403,
      code: "forbidden",
      message: `Your current membership does not include ${capability.replace("_", " ")} access.`,
      details: { error: "membership_scope_denied", capability },
    });
  }
}

subscriberRoutes.get("/subscriber/channels", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  try {
    const projection = await buildSubscriberChannelsProjection(userId);
    return res.json(apiOkFlat(req, projection as unknown as Record<string, unknown>));
  } catch (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load subscriber channel projection.",
      cause: error,
    });
  }
}));

subscriberRoutes.get("/subscriber/cappers/:id/picks", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const capperId = req.params.id;
  await assertFollowsCapper(userId, capperId);

  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select(PUBLIC_PICK_COLUMNS)
    .eq("capper_id", capperId)
    .eq("leg_type", "parlay")
    .in("visibility", [...FOLLOWER_PICK_VISIBILITIES])
    .is("user_hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // Missing visibility column → fail closed (no private-capper dump).
    if (error.code === "42703" || error.code === "PGRST204") {
      console.warn(
        "[subscriber] picks.visibility unavailable — refusing unfiltered capper parlays",
      );
      return res.json(apiOkFlat(req, { picks: [] }));
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load capper parlays.",
      cause: error,
    });
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const legsByPickId = await findLegsForPicks(rows.map((row: { id: string }) => String(row.id)));

  return res.json(apiOkFlat(req, {
    picks: rows.map((row: Record<string, unknown>) => ({
      ...toPublicPickDto(row),
      legs: legsByPickId[String(row.id)] ?? [],
    })),
  }));
}));

subscriberRoutes.get("/subscriber/profiles/:id/picks", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const profileId = req.params.id;
  await assertFollowsProfile(userId, profileId);
  await assertProfileCapability(userId, profileId, "shared_parlays");

  const limit = Math.min(Number(req.query.limit ?? 20), 50);

  // Follower-gated shared parlays: public + subscriber. Private never. Feed-linked fallback stays public-only.
  const query = supabaseAdmin
    .from("picks")
    .select(PUBLIC_PICK_COLUMNS)
    .eq("user_id", profileId)
    .eq("leg_type", "parlay")
    .in("visibility", [...FOLLOWER_PICK_VISIBILITIES])
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

  // Fail closed: if visibility column is missing/unavailable, never dump all parlays.
  // Fall through to feed-linked picks only (posts prove intentional public share).
  let rows: Record<string, unknown>[] = [];
  if (error?.code === "42703" || error?.code === "PGRST204") {
    console.warn(
      "[subscriber] picks.visibility unavailable — refusing unfiltered profile parlays; using feed-linked only",
    );
    rows = [];
  } else {
    rows = ((data ?? []) as unknown as Record<string, unknown>[])
      .filter((row) => isFollowerVisiblePick(row.visibility));
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
        .select(PUBLIC_PICK_COLUMNS)
        .in("id", pickIds)
        .eq("leg_type", "parlay")
        .eq("visibility", "public")
        .is("user_hidden_at", null);

      if (postedError) {
        if (postedError.code === "42703" || postedError.code === "PGRST204") {
          console.warn(
            "[subscriber] picks.visibility unavailable — refusing unfiltered feed-linked parlays",
          );
          rows = [];
        } else {
          throw new AppError({
            status: 500,
            code: "internal_server_error",
            message: "Failed to load posted parlays.",
            cause: postedError,
          });
        }
      } else {
        rows = (postedPicks ?? []) as unknown as Record<string, unknown>[];
      }
    }
  }

  const legsByPickId = await findLegsForPicks(rows.map((row: { id: string }) => String(row.id)));

  return res.json(apiOkFlat(req, {
    picks: rows.map((row: Record<string, unknown>) => ({
      ...toPublicPickDto(row),
      legs: legsByPickId[String(row.id)] ?? [],
    })),
  }));
}));

async function loadProfileAnnouncementPosts(profileId: string, limit: number) {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, pick_id,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, handle)
    `)
    .eq("author_id", profileId)
    .is("pick_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load creator announcements.",
      cause: error,
    });
  }

  return data ?? [];
}

subscriberRoutes.get("/subscriber/profiles/:id/posts", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const profileId = req.params.id;
  await assertFollowsProfile(userId, profileId);
  await assertProfileCapability(userId, profileId, "announcements");

  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const posts = await loadProfileAnnouncementPosts(profileId, limit);

  return res.json(apiOkFlat(req, { posts }));
}));

subscriberRoutes.get("/subscriber/me/posts", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const posts = await loadProfileAnnouncementPosts(userId, limit);

  return res.json(apiOkFlat(req, { posts }));
}));

type SubscriberChannelKind = "owner" | "capper" | "profile";

async function assertCanAccessSubscriberChannel(userId: string, kind: SubscriberChannelKind, targetId: string) {
  if (kind === "owner") {
    // Owner channels are private to the account holder — never open to followers.
    if (targetId !== userId) {
      throw new AppError({
        status: 403,
        code: "forbidden",
        message: "Owner channel access is restricted to the account holder.",
        details: { error: "owner_channel_forbidden" },
      });
    }
    return;
  }
  if (kind === "capper") {
    await assertFollowsCapper(userId, targetId);
    return;
  }
  await assertFollowsProfile(userId, targetId);
  await assertProfileCapability(userId, targetId, "club_chat");
}

async function loadCapperAnnouncementPosts(capperId: string, limit: number) {
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("id, explanation, selection, created_at, status")
    .eq("capper_id", capperId)
    .eq("leg_type", "parlay")
    .in("visibility", [...FOLLOWER_PICK_VISIBILITIES])
    .is("user_hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      console.warn(
        "[subscriber] picks.visibility unavailable — refusing unfiltered capper announcements",
      );
      return [];
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load capper announcements.",
      cause: error,
    });
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    body: `New shared slip: ${String(row.explanation || row.selection || "Premium parlay").split("\n")[0]}`,
    created_at: row.created_at,
    view_count: 0,
    pick_id: row.id,
    kind: "capper_pick",
    status: row.status,
  }));
}

subscriberRoutes.get("/subscriber/cappers/:id/posts", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const capperId = req.params.id;
  await assertFollowsCapper(userId, capperId);

  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const posts = await loadCapperAnnouncementPosts(capperId, limit);

  return res.json(apiOkFlat(req, { posts }));
}));

const ChannelParamsSchema = z.object({
  kind: z.enum(["owner", "capper", "profile"]),
  targetId: z.string().min(1),
});

const ChannelMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

subscriberRoutes.get("/subscriber/channels/:kind/:targetId/messages", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const params = ChannelParamsSchema.parse({
    kind: req.params.kind,
    targetId: req.params.targetId,
  });
  await assertCanAccessSubscriberChannel(userId, params.kind, params.targetId);

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const { data, error } = await supabaseAdmin
    .from("subscriber_channel_messages")
    .select(`
      id, channel_kind, channel_target_id, body, created_at,
      author:profiles!subscriber_channel_messages_author_id_fkey(id, username, display_name, avatar_url, handle)
    `)
    .eq("channel_kind", params.kind)
    .eq("channel_target_id", params.targetId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return res.json(apiOkFlat(req, { messages: [] }));
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load subscriber chat.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, { messages: data ?? [] }));
}));

subscriberRoutes.post("/subscriber/channels/:kind/:targetId/messages", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const userId = req.user!.id;
  const params = ChannelParamsSchema.parse({
    kind: req.params.kind,
    targetId: req.params.targetId,
  });
  const { body } = ChannelMessageSchema.parse(req.body);
  await assertCanAccessSubscriberChannel(userId, params.kind, params.targetId);

  const { data, error } = await supabaseAdmin
    .from("subscriber_channel_messages")
    .insert({
      channel_kind: params.kind,
      channel_target_id: params.targetId,
      author_id: userId,
      body,
    })
    .select(`
      id, channel_kind, channel_target_id, body, created_at,
      author:profiles!subscriber_channel_messages_author_id_fkey(id, username, display_name, avatar_url, handle)
    `)
    .single();

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      throw new AppError({
        status: 503,
        code: "upstream_unavailable",
        message: "Subscriber chat is not available until migration 0019 is applied.",
      });
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to send subscriber chat message.",
      cause: error,
    });
  }

  return res.status(201).json(apiOkFlat(req, { message: data }));
}));
