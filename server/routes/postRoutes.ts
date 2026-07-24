import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, optionalAuth, requireLegalConfirmed, supabaseAdmin } from "../middleware/auth";
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
import { socialOutboxRepository } from "../repositories/socialOutboxRepository";
import { filterUuids, isUuid } from "../lib/uuid";

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
 *   GET    /api/feed/discover         — demo + popular posts for new users
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

/** Include visibility so public reads can strip non-public pick embeds. */
const POST_PICK_EMBED =
  "pick:picks(id, market, selection, status, settled_units, locked_at, created_at, visibility)";

/** Fail closed: never expose a non-public pick through a post embed. */
function sanitizePostPickEmbed<T extends Record<string, unknown>>(row: T): T {
  const pick = row.pick as { visibility?: string } | null | undefined;
  if (!pick || typeof pick !== "object") return row;
  if (pick.visibility !== "public") {
    return { ...row, pick: null };
  }
  const { visibility: _visibility, ...safePick } = pick as Record<string, unknown>;
  return { ...row, pick: safePick };
}

/**
 * Post detail / comments / likes are follower-circle (or demo / own).
 * Fail closed with 404 so private posts are not enumerable by id.
 */
async function assertCanViewPost(
  viewerId: string | undefined,
  post: { id: string; author_id: string; is_demo?: boolean | null },
): Promise<void> {
  if (post.is_demo) return;
  if (viewerId && viewerId === post.author_id) return;

  if (viewerId) {
    const { data: follow } = await supabaseAdmin
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_profile_id", post.author_id)
      .maybeSingle();
    if (follow) return;
  }

  throw new AppError({
    status: 404,
    code: "not_found",
    message: "Post not found.",
  });
}

async function loadPostForViewAcl(postId: string): Promise<{
  id: string;
  author_id: string;
  is_demo: boolean | null;
}> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id, author_id, is_demo")
    .eq("id", postId)
    .single();

  if (error || !data) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Post not found.",
    });
  }

  return data as { id: string; author_id: string; is_demo: boolean | null };
}

postRoutes.get("/feed", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  let query = supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, settled_units, locked_at, created_at),
      likes_count:post_likes(count),
      comments_count:post_comments(count)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (req.user) {
    const { data: follows } = await supabaseAdmin
      .from("follows")
      .select("following_profile_id")
      .eq("follower_id", req.user.id);

    const followedIds = filterUuids((follows ?? []).map((f: any) => f.following_profile_id));
    if (isUuid(req.user.id)) followedIds.push(req.user.id);

    if (followedIds.length > 1) {
      query = query.or(`author_id.in.(${followedIds.join(",")}),is_demo.eq.true`);
    } else {
      query = query.eq("is_demo", true);
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

postRoutes.get("/feed/discover", asyncHandler(async (req: RequestWithContext, res: Response) => {
  // Public discover is demo-only — never rank private/circle author posts by views.
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, locked_at, created_at),
      likes_count:post_likes(count),
      comments_count:post_comments(count)
    `)
    .eq("is_demo", true)
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
});

postRoutes.post(
  "/posts",
  requireAuth,
  requireLegalConfirmed,
  validate({ body: CreatePostSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { body: postBody, pick_id, vouch_id } = req.body as z.infer<typeof CreatePostSchema>;

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
      // Lock + public BEFORE insert so a feed share is never editable/public without a lock,
      // and feed/detail never race a private embed.
      let locked;
      try {
        locked = await lockParlayOnFeedShare({
          userId: req.user!.id,
          parlayId: pick_id,
        });
      } catch (err) {
        throw new AppError({
          status: 503,
          code: "external_service_error",
          message: "Could not lock pick for feed share. Post was not created.",
          details: { error: "pick_lock_required" },
          expose: true,
          cause: err,
        });
      }
      if (!locked) {
        throw new AppError({
          status: 503,
          code: "external_service_error",
          message: "Could not lock pick for feed share. Post was not created.",
          details: { error: "pick_lock_required" },
          expose: true,
        });
      }

      try {
        await setPickVisibilityPublic(pick_id, req.user!.id);
      } catch (err) {
        throw new AppError({
          status: 503,
          code: "external_service_error",
          message: "Could not make pick public for feed share. Post was not created.",
          details: { error: "pick_visibility_required" },
          expose: true,
          cause: err,
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

    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert({
        author_id: req.user!.id,
        body: postBody,
        pick_id: pick_id ?? null,
        vouch_id: vouch_id ?? null,
        is_demo: false,
      })
      .select(`
        id, body, created_at, view_count, is_demo,
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
      // The pick is already locked and public. Attach the post id for audit linkage.
      await lockParlayOnFeedShare({
        userId: req.user!.id,
        parlayId: pick_id,
        postId: String(data.id),
      }).catch((err) => {
        console.warn("[posts] post lock linkage failed", (err as Error)?.message);
      });
    }

    void (async () => {
      const authorId = req.user!.id;
      const postId = String(data.id);
      const queued = await socialOutboxRepository.queueEvent({
        user_id: authorId,
        event_type: "NOTE_UPSERT",
        payload: {
          authorId,
          postId,
          body: postBody,
          pickId: pick_id ?? null,
        },
      });
      if (!queued) {
        await notifyFollowersOfAuthorPost({
          authorId,
          postId,
          body: postBody,
          pickId: pick_id ?? null,
        });
      }
    })().catch((err) => {
      console.warn("[posts] follower notifications failed", (err as Error)?.message);
    });

    return res.status(201).json(apiOkFlat(req, data as unknown as Record<string, unknown>));
  }),
);

postRoutes.get("/posts/:id", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const aclPost = await loadPostForViewAcl(id);
  await assertCanViewPost(req.user?.id, aclPost);

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo,
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

postRoutes.post("/posts/:id/view", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const aclPost = await loadPostForViewAcl(String(req.params.id));
  await assertCanViewPost(req.user?.id, aclPost);
  const { id } = req.params;
  const { error } = await supabaseAdmin.rpc("increment_post_view", { p_post_id: id });
  if (error) {
    return res.json({ ok: false });
  }
  return res.json(apiOkFlat(req, {}));
}));

postRoutes.post("/posts/:id/like", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const aclPost = await loadPostForViewAcl(id);
  await assertCanViewPost(req.user!.id, aclPost);

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

    const aclPost = await loadPostForViewAcl(id);
    await assertCanViewPost(req.user!.id, aclPost);

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
  const aclPost = await loadPostForViewAcl(id);
  await assertCanViewPost(req.user?.id, aclPost);

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
    .select("id, post_id")
    .eq("id", id)
    .maybeSingle();

  if (!comment) {
    throw new AppError({ status: 404, code: "not_found", message: "Comment not found." });
  }

  const aclPost = await loadPostForViewAcl(String(comment.post_id));
  await assertCanViewPost(req.user!.id, aclPost);

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
