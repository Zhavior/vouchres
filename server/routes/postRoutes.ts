import express, { Router } from "express";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AuthedRequest, requireAuth, optionalAuth, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { assertUserOwnsResource } from "../middleware/ownership";
import {
  canDeleteParlayPost,
  PARLAY_POST_LOCKED_MESSAGE,
} from "../lib/postDeletePolicy";
import { setPickVisibilityPublic } from "../repositories/parlayRepository";
import { lockParlayOnFeedShare } from "../services/parlays/userParlayService";
import { notifyFollowersOfAuthorPost } from "../services/social/followService";
import { getHiddenProfileIds } from "../services/social/socialSafetyService";
import { generationLimiter } from "../middleware/rateLimit";

async function denyUnlessOwns(
  userId: string,
  resourceType: "post" | "comment",
  resourceId: string,
  options?: {
    forbiddenMessage?: string;
    forbiddenDetails?: Record<string, unknown>;
    notFoundMessage?: string;
  },
): Promise<void> {
  const owned = await assertUserOwnsResource(userId, resourceType, resourceId);
  if (owned.ok) return;

  if (owned.ok === false && owned.warning === "resource not found for authenticated user") {
    throw new AppError({
      status: options?.forbiddenMessage ? 403 : 404,
      code: options?.forbiddenMessage ? "forbidden" : "not_found",
      message: options?.forbiddenMessage ?? options?.notFoundMessage ?? "Resource not found.",
      ...(options?.forbiddenDetails ? { details: options.forbiddenDetails } : {}),
    });
  }

  throw new AppError({
    status: 500,
    code: "internal_server_error",
    message: "Ownership check failed.",
    details: { warning: owned.ok === false ? owned.warning : "unknown" },
  });
}

/**
 * Posts routes — the social feed.
 *
 *   GET    /api/feed                  — home feed (personalized if logged in)
 *   GET    /api/feed/following        — authenticated own-and-followed timeline
 *   GET    /api/feed/discover         — demo + popular posts for new users
 *   GET    /api/profiles/:id/posts    — public activity for one profile
 *   POST   /api/posts                 — create a post (auth, quota)
 *   GET    /api/posts/:id             — single post with engagement counts
 *   DELETE /api/posts/:id             — delete own post (auth)
 *   POST   /api/posts/:id/view        — record a view (no auth required)
 *   POST   /api/posts/:id/like        — like a post (auth)
 *   DELETE /api/posts/:id/like        — unlike (auth)
 *   POST   /api/posts/:id/comments    — comment (auth)
 *   GET    /api/posts/:id/comments    — list comments
 *   DELETE /api/comments/:id          — delete own comment (auth)
 */
export const postRoutes = Router();

const AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"];

postRoutes.post(
  "/posts/audio",
  requireAuth,
  generationLimiter,
  express.raw({ type: AUDIO_TYPES, limit: "8mb" }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new AppError({ status: 400, code: "bad_request", message: "Record a voice clip first." });
    }
    const contentType = String(req.headers["content-type"] ?? "").split(";")[0];
    if (!AUDIO_TYPES.includes(contentType)) {
      throw new AppError({ status: 400, code: "bad_request", message: "Use a supported audio format." });
    }
    const extension = contentType === "audio/mpeg" ? "mp3" : contentType === "audio/mp4" ? "m4a" : contentType === "audio/ogg" ? "ogg" : "webm";
    const mediaPath = `${req.user!.id}/${randomUUID()}.${extension}`;
    const { error } = await supabaseAdmin.storage.from("post-media").upload(mediaPath, req.body, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      throw new AppError({ status: 500, code: "internal_server_error", message: "Failed to store voice post.", cause: error });
    }
    const { data } = supabaseAdmin.storage.from("post-media").getPublicUrl(mediaPath);
    return res.status(201).json(apiOkFlat(req, { media_path: mediaPath, media_url: data.publicUrl }));
  }),
);

postRoutes.get("/feed", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  let query = supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo, post_kind, media_url, media_type,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, settled_units, locked_at, created_at),
      likes_count:post_likes(count),
      comments_count:post_comments(count)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (req.user) {
    const hiddenProfileIds = await getHiddenProfileIds(req.user.id);
    const { data: follows } = await supabaseAdmin
      .from("follows")
      .select("following_profile_id")
      .eq("follower_id", req.user.id);

    const followedIds = (follows ?? [])
      .map((f: any) => f.following_profile_id)
      .filter((id: string | null) => Boolean(id) && !hiddenProfileIds.has(String(id)));
    followedIds.push(req.user.id);

    if (followedIds.length > 1) {
      query = query.or(`author_id.in.(${followedIds.join(",")}),is_demo.eq.true`);
    } else {
      query = query.eq("is_demo", true);
    }
    if (hiddenProfileIds.size > 0) {
      query = query.not("author_id", "in", `(${[...hiddenProfileIds].join(",")})`);
    }
  } else {
    query = query.eq("is_demo", true);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[feed] query failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch feed.",
      cause: error,
    });
  }

  const rows = data ?? [];
  const total = count ?? rows.length;

  return res.json(apiOkFlat(req, {
    posts: rows,
    total,
    limit,
    offset,
    has_more: offset + rows.length < total,
    has_real_content: rows.some((p: any) => !p.is_demo),
  }));
}));

postRoutes.get("/feed/following", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Math.max(0, Number(req.query.offset ?? 0));
  const { data: follows, error: followsError } = await supabaseAdmin
    .from("follows")
    .select("following_profile_id")
    .eq("follower_id", req.user!.id)
    .not("following_profile_id", "is", null);

  if (followsError) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load followed profiles.",
      cause: followsError,
    });
  }

  const hiddenProfileIds = await getHiddenProfileIds(req.user!.id);
  const authorIds = [
    req.user!.id,
    ...new Set(
      (follows ?? [])
        .map((row) => String(row.following_profile_id))
        .filter((id) => Boolean(id) && !hiddenProfileIds.has(id)),
    ),
  ];
  const { data, error, count } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo, post_kind, media_url, media_type,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, settled_units, locked_at, created_at),
      likes_count:post_likes(count),
      comments_count:post_comments(count)
    `, { count: "exact" })
    .in("author_id", authorIds)
    .eq("is_demo", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load following feed.",
      cause: error,
    });
  }

  const posts = data ?? [];
  const total = count ?? posts.length;
  return res.json(apiOkFlat(req, {
    posts,
    total,
    limit,
    offset,
    has_more: offset + posts.length < total,
  }));
}));

postRoutes.get("/profiles/:id/posts", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Math.max(0, Number(req.query.offset ?? 0));
  if (req.user && (await getHiddenProfileIds(req.user.id)).has(req.params.id)) {
    return res.json(apiOkFlat(req, { posts: [], total: 0, limit, offset, has_more: false }));
  }
  const { data, error, count } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo, post_kind, media_url, media_type,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, settled_units, locked_at, created_at),
      likes_count:post_likes(count),
      comments_count:post_comments(count)
    `, { count: "exact" })
    .eq("author_id", req.params.id)
    .eq("is_demo", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load profile activity.",
      cause: error,
    });
  }

  const posts = data ?? [];
  const total = count ?? posts.length;
  return res.json(apiOkFlat(req, {
    posts,
    total,
    limit,
    offset,
    has_more: offset + posts.length < total,
  }));
}));

postRoutes.get("/feed/discover", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo, post_kind, media_url, media_type,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, locked_at, created_at),
      likes_count:post_likes(count),
      comments_count:post_comments(count)
    `)
    .order("view_count", { ascending: false })
    .limit(20);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch discover feed.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, { posts: data ?? [] }));
}));

const CreatePostSchema = z.object({
  body: z.string().min(1).max(4000),
  pick_id: z.string().uuid().optional(),
  vouch_id: z.string().uuid().optional(),
  post_kind: z.enum(["discussion", "research_note", "result", "vouch", "parlay", "audio"]).optional(),
  media_path: z.string().max(300).optional(),
  media_type: z.enum(["audio"]).optional(),
});

postRoutes.post(
  "/posts",
  requireAuth,
  validate({ body: CreatePostSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { body: postBody, pick_id, vouch_id, post_kind, media_path, media_type } = req.body as z.infer<typeof CreatePostSchema>;

    if (pick_id) {
      const { data: pick } = await supabaseAdmin
        .from("picks")
        .select("user_id")
        .eq("id", pick_id)
        .single();
      if (!pick || pick.user_id !== req.user!.id) {
        throw new AppError({
          status: 403,
          code: "forbidden",
          message: "Pick is not owned by the current user.",
          details: { error: "pick_not_owned" },
        });
      }
    }

    if (vouch_id) {
      const { data: vouch } = await supabaseAdmin
        .from("vouches")
        .select("user_id")
        .eq("id", vouch_id)
        .single();
      if (!vouch || vouch.user_id !== req.user!.id) {
        throw new AppError({
          status: 403,
          code: "forbidden",
          message: "Vouch is not owned by the current user.",
          details: { error: "vouch_not_owned" },
        });
      }
    }

    if ((media_path && media_type !== "audio") || (!media_path && media_type)) {
      throw new AppError({ status: 400, code: "bad_request", message: "Invalid post media." });
    }
    if (media_path && !media_path.startsWith(`${req.user!.id}/`)) {
      throw new AppError({ status: 403, code: "forbidden", message: "Post media is not owned by the current user." });
    }
    const mediaUrl = media_path
      ? supabaseAdmin.storage.from("post-media").getPublicUrl(media_path).data.publicUrl
      : null;

    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert({
        author_id: req.user!.id,
        body: postBody,
        pick_id: pick_id ?? null,
        vouch_id: vouch_id ?? null,
        is_demo: false,
        post_kind: post_kind ?? (pick_id ? "parlay" : "discussion"),
        media_url: mediaUrl,
        media_type: media_type ?? null,
      })
      .select(`
        id, body, created_at, view_count, is_demo, post_kind, media_url, media_type,
        author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier)
      `)
      .single();

    if (error) {
      console.error("[posts] create failed", error);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to create post.",
        cause: error,
      });
    }

    if (pick_id) {
      await lockParlayOnFeedShare({
        userId: req.user!.id,
        parlayId: pick_id,
        postId: String(data.id),
      }).catch((err) => {
        console.warn("[posts] parlay lock failed", (err as Error)?.message);
        return setPickVisibilityPublic(pick_id, req.user!.id);
      });
    }

    notifyFollowersOfAuthorPost({
      authorId: req.user!.id,
      postId: String(data.id),
      body: postBody,
      pickId: pick_id ?? null,
    }).catch((err) => {
      console.warn("[posts] follower notifications failed", (err as Error)?.message);
    });

    return res.status(201).json(apiOkFlat(req, data as unknown as Record<string, unknown>));
  }),
);

postRoutes.get("/posts/:id", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo, post_kind, media_url, media_type,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, settled_units, locked_at, created_at),
      likes_count:post_likes(count),
      comments_count:post_comments(count)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Post not found.",
    });
  }

  let liked_by_me = false;
  if (req.user) {
    const { data: like } = await supabaseAdmin
      .from("post_likes")
      .select("post_id")
      .eq("post_id", id)
      .eq("profile_id", req.user.id)
      .maybeSingle();
    liked_by_me = !!like;
  }

  return res.json(apiOkFlat(req, { ...data, liked_by_me }));
}));

postRoutes.delete("/posts/:id", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const { data: post, error: fetchError } = await supabaseAdmin
    .from("posts")
    .select("id, created_at, pick_id")
    .eq("id", id)
    .single();

  if (fetchError || !post) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Post not found.",
    });
  }

  await denyUnlessOwns(req.user!.id, "post", id, {
    forbiddenMessage: "You can only delete your own posts.",
    forbiddenDetails: { error: "not_post_owner" },
  });

  if (post.pick_id) {
    const { data: pick } = await supabaseAdmin
      .from("picks")
      .select("leg_type")
      .eq("id", post.pick_id)
      .maybeSingle();

    if (pick?.leg_type === "parlay" && !canDeleteParlayPost(post.created_at)) {
      throw new AppError({
        status: 403,
        code: "parlay_post_locked",
        message: PARLAY_POST_LOCKED_MESSAGE,
        details: { error: "parlay_post_locked" },
      });
    }
  }

  const { error } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", req.user!.id);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to delete post.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, {}));
}));

postRoutes.post("/posts/:id/view", asyncHandler(async (req, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.rpc("increment_post_view", { p_post_id: id });
  if (error) {
    return res.json({ ok: false });
  }
  return res.json(apiOkFlat(req, {}));
}));

postRoutes.post("/posts/:id/like", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("id")
    .eq("id", id)
    .single();
  if (!post) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Post not found.",
      details: { error: "post_not_found" },
    });
  }

  const { error } = await supabaseAdmin.from("post_likes").upsert(
    { post_id: id, profile_id: req.user!.id },
    { onConflict: "post_id,profile_id" },
  );

  if (error && error.code !== "23505") {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to like post.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, { liked: true }));
}));

postRoutes.delete("/posts/:id/like", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("post_likes")
    .delete()
    .eq("post_id", id)
    .eq("profile_id", req.user!.id);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to unlike post.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, { liked: false }));
}));

const CreateCommentSchema = z.object({
  body: z.string().min(1).max(1000),
  parent_id: z.string().uuid().optional(),
  reply_to_user_id: z.string().uuid().optional(),
});

const COMMENT_SELECT = `
  id, body, created_at, parent_id, reply_to_user_id,
  author:profiles!post_comments_author_id_fkey(id, username, display_name, avatar_url),
  reply_to:profiles!post_comments_reply_to_user_id_fkey(id, username, display_name),
  likes_count:comment_likes(count)
`;

async function hydrateCommentLikes(comments: Record<string, unknown>[], userId?: string) {
  if (!userId || comments.length === 0) {
    return comments.map((row) => ({ ...row, liked_by_me: false }));
  }

  const ids = comments.map((row) => String(row.id));
  const { data: likedRows } = await supabaseAdmin
    .from("comment_likes")
    .select("comment_id")
    .eq("profile_id", userId)
    .in("comment_id", ids);

  const liked = new Set((likedRows ?? []).map((row: { comment_id: string }) => row.comment_id));
  return comments.map((row) => ({ ...row, liked_by_me: liked.has(String(row.id)) }));
}

postRoutes.post(
  "/posts/:id/comments",
  requireAuth,
  validate({ body: CreateCommentSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { body: commentBody, parent_id, reply_to_user_id } = req.body as z.infer<typeof CreateCommentSchema>;

    const { data: post } = await supabaseAdmin.from("posts").select("id").eq("id", id).single();
    if (!post) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Post not found.",
        details: { error: "post_not_found" },
      });
    }

    if (parent_id) {
      const { data: parentComment } = await supabaseAdmin
        .from("post_comments")
        .select("id, post_id")
        .eq("id", parent_id)
        .maybeSingle();
      if (!parentComment || parentComment.post_id !== id) {
        throw new AppError({
          status: 400,
          code: "bad_request",
          message: "Invalid reply target.",
        });
      }
    }

    const insertPayload: Record<string, unknown> = {
      post_id: id,
      author_id: req.user!.id,
      body: commentBody,
      parent_id: parent_id ?? null,
      reply_to_user_id: reply_to_user_id ?? null,
    };

    let { data, error } = await supabaseAdmin
      .from("post_comments")
      .insert(insertPayload)
      .select(COMMENT_SELECT)
      .single();

    if (error && (error.code === "42703" || error.code === "PGRST204")) {
      ({ data, error } = await supabaseAdmin
        .from("post_comments")
        .insert({
          post_id: id,
          author_id: req.user!.id,
          body: commentBody,
        })
        .select(`
          id, body, created_at,
          author:profiles!post_comments_author_id_fkey(id, username, display_name, avatar_url)
        `)
        .single());
    }

    if (error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to create comment.",
        cause: error,
      });
    }

    const [hydrated] = await hydrateCommentLikes([data as Record<string, unknown>], req.user!.id);
    return res.status(201).json(apiOkFlat(req, hydrated as unknown as Record<string, unknown>));
  }),
);

postRoutes.get("/posts/:id/comments", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  let data: Record<string, unknown>[] | null = null;
  let error: { code?: string; message?: string } | null = null;

  const primary = await supabaseAdmin
    .from("post_comments")
    .select(COMMENT_SELECT)
    .eq("post_id", id)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  data = (primary.data ?? []) as Record<string, unknown>[];
  error = primary.error;

  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    const fallback = await supabaseAdmin
      .from("post_comments")
      .select(`
        id, body, created_at,
        author:profiles!post_comments_author_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);
    data = (fallback.data ?? []) as Record<string, unknown>[];
    error = fallback.error;
  }

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch comments.",
      cause: error,
    });
  }

  const comments = await hydrateCommentLikes((data ?? []) as Record<string, unknown>[], req.user?.id);
  return res.json(apiOkFlat(req, { comments, limit, offset }));
}));

postRoutes.post("/comments/:id/like", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { data: comment } = await supabaseAdmin
    .from("post_comments")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!comment) {
    throw new AppError({ status: 404, code: "not_found", message: "Comment not found." });
  }

  const { error } = await supabaseAdmin.from("comment_likes").upsert(
    { comment_id: id, profile_id: req.user!.id },
    { onConflict: "comment_id,profile_id" },
  );

  if (error && error.code !== "23505" && error.code !== "42P01") {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to like comment.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, { liked: true }));
}));

postRoutes.delete("/comments/:id/like", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("comment_likes")
    .delete()
    .eq("comment_id", id)
    .eq("profile_id", req.user!.id);

  if (error && error.code !== "42P01") {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to unlike comment.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, { liked: false }));
}));

postRoutes.delete("/comments/:id", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  await denyUnlessOwns(req.user!.id, "comment", id, {
    notFoundMessage: "Comment not found.",
  });

  const { error } = await supabaseAdmin
    .from("post_comments")
    .delete()
    .eq("id", id)
    .eq("author_id", req.user!.id);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to delete comment.",
      cause: error,
    });
  }

  return res.json(apiOkFlat(req, {}));
}));
