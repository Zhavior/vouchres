import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, optionalAuth, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";

/**
 * Auth routes — minimal session/profile endpoints used by the frontend.
 *
 *   GET  /api/auth/me           — current user's profile (auth required)
 *   POST /api/auth/signout      — invalidate session (Supabase handles client-side)
 *   PATCH /api/auth/profile     — update display_name, bio, avatar_url
 *   GET  /api/auth/username-check?username=X  — public availability check
 */
export const authRoutes = Router();

type AuthedRequestWithContext = AuthedRequest & RequestWithContext;

authRoutes.get("/me", requireAuth, asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
  return res.json(apiOkFlat(req, { ...req.user!.profile }));
}));

authRoutes.post("/signout", requireAuth, asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
  return res.json(apiOkFlat(req, {}));
}));

const ProfileUpdateSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
  display_name: z.string().max(64).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

authRoutes.patch(
  "/profile",
  requireAuth,
  validate({ body: ProfileUpdateSchema }),
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    const updates = req.body as z.infer<typeof ProfileUpdateSchema>;

    const safeUpdates: Record<string, any> = {};
    if (updates.username !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("lower(username)", updates.username.toLowerCase())
        .neq("id", req.user!.id)
        .maybeSingle();
      if (existing) {
        throw new AppError({
          status: 409,
          code: "conflict",
          message: "Username is already taken.",
          details: { error: "username_taken" },
        });
      }
      safeUpdates.username = updates.username;
    }
    if (updates.display_name !== undefined) safeUpdates.display_name = updates.display_name;
    if (updates.bio !== undefined) safeUpdates.bio = updates.bio;
    if (updates.avatar_url !== undefined) safeUpdates.avatar_url = updates.avatar_url;

    if (Object.keys(safeUpdates).length === 0) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "No updates provided.",
        details: { error: "no_updates" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(safeUpdates)
      .eq("id", req.user!.id)
      .select("*")
      .single();

    if (error) {
      console.error("[auth] profile update failed", error);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to update profile.",
        cause: error,
      });
    }

    return res.json(apiOkFlat(req, data as Record<string, unknown>));
  }),
);

authRoutes.get(
  "/username-check",
  optionalAuth,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const username = String(req.query.username ?? "").trim();
    if (username.length < 3 || username.length > 24) {
      return res.json(apiOkFlat(req, { available: false, reason: "invalid_length" }));
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.json(apiOkFlat(req, { available: false, reason: "invalid_chars" }));
    }

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("lower(username)", username.toLowerCase())
      .maybeSingle();

    return res.json(apiOkFlat(req, { available: !data }));
  }),
);
