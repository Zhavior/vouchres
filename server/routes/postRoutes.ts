import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, optionalAuth, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";

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

postRoutes.get("/feed", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  let query = supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, settled_units),
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

    const followedIds = (follows ?? []).map((f: any) => f.following_profile_id).filter(Boolean);
    followedIds.push(req.user.id);

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

  return res.json({
    ok: true,
    posts: data ?? [],
    total: count ?? 0,
    limit,
    offset,
    has_real_content: (data ?? []).some((p: any) => !p.is_demo),
  });
}));

postRoutes.get("/feed/discover", asyncHandler(async (_req, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status),
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

  return res.json({ ok: true, posts: data ?? [] });
}));

const CreatePostSchema = z.object({
  body: z.string().min(1).max(4000),
  pick_id: z.string().uuid().optional(),
  vouch_id: z.string().uuid().optional(),
});

postRoutes.post(
  "/posts",
  requireAuth,
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

    return res.status(201).json({ ok: true, ...data });
  }),
);

postRoutes.get("/posts/:id", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, created_at, view_count, is_demo,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier),
      pick:picks(id, market, selection, status, settled_units),
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

  return res.json({ ok: true, ...data, liked_by_me });
}));

postRoutes.delete("/posts/:id", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
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

  return res.json({ ok: true });
}));

postRoutes.post("/posts/:id/view", asyncHandler(async (req, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.rpc("increment_post_view", { p_post_id: id });
  if (error) {
    return res.json({ ok: false });
  }
  return res.json({ ok: true });
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

  return res.json({ ok: true, liked: true });
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

  return res.json({ ok: true, liked: false });
}));

const CreateCommentSchema = z.object({
  body: z.string().min(1).max(1000),
});

postRoutes.post(
  "/posts/:id/comments",
  requireAuth,
  validate({ body: CreateCommentSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { body: commentBody } = req.body as z.infer<typeof CreateCommentSchema>;

    const { data: post } = await supabaseAdmin.from("posts").select("id").eq("id", id).single();
    if (!post) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Post not found.",
        details: { error: "post_not_found" },
      });
    }

    const { data, error } = await supabaseAdmin
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
      .single();

    if (error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to create comment.",
        cause: error,
      });
    }

    return res.status(201).json({ ok: true, ...data });
  }),
);

postRoutes.get("/posts/:id/comments", asyncHandler(async (req, res: Response) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  const { data, error } = await supabaseAdmin
    .from("post_comments")
    .select(`
      id, body, created_at,
      author:profiles!post_comments_author_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("post_id", id)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch comments.",
      cause: error,
    });
  }

  return res.json({ ok: true, comments: data ?? [] });
}));

postRoutes.delete("/comments/:id", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
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

  return res.json({ ok: true });
}));
