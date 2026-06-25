import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, optionalAuth, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";

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

// =========================================================
// Feed
// =========================================================

/**
 * GET /api/feed?limit=50&offset=0
 * Returns posts from people the caller follows, plus their own.
 * Falls back to demo posts if caller follows nobody.
 */
postRoutes.get("/feed", optionalAuth, async (req: AuthedRequest, res: Response) => {
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

  // If logged in, filter to: posts by people I follow + my own posts + all demo posts
  if (req.user) {
    const { data: follows } = await supabaseAdmin
      .from("follows")
      .select("following_profile_id")
      .eq("follower_id", req.user.id);

    const followedIds = (follows ?? []).map((f: any) => f.following_profile_id).filter(Boolean);
    followedIds.push(req.user.id); // include self

    if (followedIds.length > 1) {
      query = query.or(`author_id.in.(${followedIds.join(",")}),is_demo.eq.true`);
    } else {
      // Following nobody — show demo posts only
      query = query.eq("is_demo", true);
    }
  } else {
    // Not logged in — show demo posts only
    query = query.eq("is_demo", true);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[feed] query failed", error);
    return res.status(500).json({ error: "fetch_failed" });
  }

  return res.json({
    posts: data ?? [],
    total: count ?? 0,
    limit,
    offset,
    has_real_content: (data ?? []).some((p: any) => !p.is_demo),
  });
});

/**
 * GET /api/feed/discover
 * Returns demo + popular posts for new users to see what the feed looks like.
 * Public — no auth required.
 */
postRoutes.get("/feed/discover", async (_req, res: Response) => {
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

  if (error) return res.status(500).json({ error: "fetch_failed" });
  return res.json({ posts: data ?? [] });
});

// =========================================================
// Posts CRUD
// =========================================================

const CreatePostSchema = z.object({
  body: z.string().min(1).max(4000),
  pick_id: z.string().uuid().optional(),
});

/**
 * POST /api/posts
 * Create a post. Optionally attach a pick.
 *
 * Quota: free users can post 10 times/day. Paid users unlimited.
 * (Apply the quota middleware in your route registration.)
 */
postRoutes.post(
  "/posts",
  requireAuth,
  validate({ body: CreatePostSchema }),
  async (req: AuthedRequest, res: Response) => {
    const { body: postBody, pick_id } = req.body as z.infer<typeof CreatePostSchema>;

    // If pick_id is provided, verify ownership
    if (pick_id) {
      const { data: pick } = await supabaseAdmin
        .from("picks")
        .select("user_id")
        .eq("id", pick_id)
        .single();
      if (!pick || pick.user_id !== req.user!.id) {
        return res.status(403).json({ error: "pick_not_owned" });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert({
        author_id: req.user!.id,
        body: postBody,
        pick_id: pick_id ?? null,
        is_demo: false,
      })
      .select(`
        id, body, created_at, view_count, is_demo,
        author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, tier)
      `)
      .single();

    if (error) {
      console.error("[posts] create failed", error);
      return res.status(500).json({ error: "create_failed" });
    }

    return res.status(201).json(data);
  }
);

/**
 * GET /api/posts/:id
 */
postRoutes.get("/posts/:id", optionalAuth, async (req, res: Response) => {
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

  if (error || !data) return res.status(404).json({ error: "not_found" });

  // If logged in, check if caller has liked this post
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

  return res.json({ ...data, liked_by_me });
});

/**
 * DELETE /api/posts/:id
 * Author can delete their own post. Cascade deletes likes + comments.
 */
postRoutes.delete("/posts/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", req.user!.id); // RLS-style filter at the query level too

  if (error) return res.status(500).json({ error: "delete_failed" });
  return res.json({ ok: true });
});

/**
 * POST /api/posts/:id/view
 * Record a view. Idempotent per session (client uses sessionStorage to dedupe).
 */
postRoutes.post("/posts/:id/view", async (req, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.rpc("increment_post_view", { p_post_id: id });
  if (error) {
    // Probably the post doesn't exist — fail silently
    return res.json({ ok: false });
  }
  return res.json({ ok: true });
});

// =========================================================
// Likes
// =========================================================

/**
 * POST /api/posts/:id/like
 */
postRoutes.post("/posts/:id/like", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  // Verify post exists
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("id")
    .eq("id", id)
    .single();
  if (!post) return res.status(404).json({ error: "post_not_found" });

  const { error } = await supabaseAdmin.from("post_likes").upsert(
    { post_id: id, profile_id: req.user!.id },
    { onConflict: "post_id,profile_id" }
  );

  if (error) {
    // 23505 = unique violation — already liked. Treat as success.
    if (error.code !== "23505") {
      return res.status(500).json({ error: "like_failed" });
    }
  }

  return res.json({ ok: true, liked: true });
});

/**
 * DELETE /api/posts/:id/like
 */
postRoutes.delete("/posts/:id/like", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("post_likes")
    .delete()
    .eq("post_id", id)
    .eq("profile_id", req.user!.id);

  if (error) return res.status(500).json({ error: "unlike_failed" });
  return res.json({ ok: true, liked: false });
});

// =========================================================
// Comments
// =========================================================

const CreateCommentSchema = z.object({
  body: z.string().min(1).max(1000),
});

/**
 * POST /api/posts/:id/comments
 */
postRoutes.post(
  "/posts/:id/comments",
  requireAuth,
  validate({ body: CreateCommentSchema }),
  async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { body: commentBody } = req.body as z.infer<typeof CreateCommentSchema>;

    // Verify post exists
    const { data: post } = await supabaseAdmin.from("posts").select("id").eq("id", id).single();
    if (!post) return res.status(404).json({ error: "post_not_found" });

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

    if (error) return res.status(500).json({ error: "comment_failed" });
    return res.status(201).json(data);
  }
);

/**
 * GET /api/posts/:id/comments?limit=50&offset=0
 */
postRoutes.get("/posts/:id/comments", async (req, res: Response) => {
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

  if (error) return res.status(500).json({ error: "fetch_failed" });
  return res.json({ comments: data ?? [] });
});

/**
 * DELETE /api/comments/:id
 */
postRoutes.delete("/comments/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("post_comments")
    .delete()
    .eq("id", id)
    .eq("author_id", req.user!.id);

  if (error) return res.status(500).json({ error: "delete_failed" });
  return res.json({ ok: true });
});
