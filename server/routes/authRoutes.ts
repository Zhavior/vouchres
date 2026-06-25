import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, optionalAuth } from "../middleware/auth";

/**
 * Auth routes — minimal session/profile endpoints used by the frontend.
 *
 *   GET  /api/auth/me           — current user's profile (auth required)
 *   POST /api/auth/signout      — invalidate session (Supabase handles client-side)
 *   PATCH /api/auth/profile     — update display_name, bio, avatar_url
 *   GET  /api/auth/username-check?username=X  — public availability check
 */
export const authRoutes = Router();

/**
 * GET /api/auth/me
 * Returns the caller's full profile. Used by useAuth() on app load.
 */
authRoutes.get("/me", requireAuth, (req: AuthedRequest, res: Response) => {
  // requireAuth already loaded the profile into req.user.profile
  // Fetch the full row including stats
  return res.json(req.user!.profile);
});

/**
 * POST /api/auth/signout
 * Server-side no-op for Supabase JWT auth (the JWT just expires client-side).
 * Endpoint exists so the frontend has a stable API surface if we later move
 * to cookie-session auth or add server-side session revocation.
 */
authRoutes.post("/signout", requireAuth, async (req: AuthedRequest, res: Response) => {
  // In a future implementation: revoke the refresh token via Supabase admin API.
  // For now, the client calls supabase.auth.signOut() which clears localStorage.
  return res.json({ ok: true });
});

/**
 * PATCH /api/auth/profile
 * Update editable profile fields. Server-side validation prevents users
 * from writing to fields they shouldn't (tier, is_staff, trust_score, etc.)
 */
const ProfileUpdateSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
  display_name: z.string().max(64).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

import { z } from "zod";
import { validate } from "../middleware/validation";
import { supabaseAdmin } from "../middleware/auth";

authRoutes.patch(
  "/profile",
  requireAuth,
  validate({ body: ProfileUpdateSchema }),
  async (req: AuthedRequest, res: Response) => {
    const updates = req.body as z.infer<typeof ProfileUpdateSchema>;

    // Whitelist fields — never accept tier, is_staff, trust_score, etc. from client
    const safeUpdates: Record<string, any> = {};
    if (updates.username !== undefined) {
      // Check availability
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("lower(username)", updates.username.toLowerCase())
        .neq("id", req.user!.id)
        .maybeSingle();
      if (existing) {
        return res.status(409).json({ error: "username_taken" });
      }
      safeUpdates.username = updates.username;
    }
    if (updates.display_name !== undefined) safeUpdates.display_name = updates.display_name;
    if (updates.bio !== undefined) safeUpdates.bio = updates.bio;
    if (updates.avatar_url !== undefined) safeUpdates.avatar_url = updates.avatar_url;

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ error: "no_updates" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(safeUpdates)
      .eq("id", req.user!.id)
      .select("*")
      .single();

    if (error) {
      console.error("[auth] profile update failed", error);
      return res.status(500).json({ error: "update_failed" });
    }

    return res.json(data);
  }
);

/**
 * GET /api/auth/username-check?username=X
 * Public — used by the signup form to check availability as the user types.
 */
authRoutes.get(
  "/username-check",
  optionalAuth,
  async (req, res: Response) => {
    const username = String(req.query.username ?? "").trim();
    if (username.length < 3 || username.length > 24) {
      return res.json({ available: false, reason: "invalid_length" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.json({ available: false, reason: "invalid_chars" });
    }

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("lower(username)", username.toLowerCase())
      .maybeSingle();

    return res.json({ available: !data });
  }
);
