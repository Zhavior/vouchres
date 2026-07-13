import express, { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  AuthedRequest,
  requireAuth,
  optionalAuth,
  supabaseAdmin,
} from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import { HandleSchema, validateHandle } from "../lib/handleSchema";
import type { RequestWithContext } from "../middleware/requestContext";

/**
 * Auth routes — minimal session/profile endpoints used by the frontend.
 *
 *   GET  /api/auth/me              — current user's full profile (auth required)
 *   POST /api/auth/signout         — invalidate session (Supabase handles client-side)
 *   PATCH /api/auth/profile        — update handle, display_name, bio, avatar_url
 *   GET  /api/auth/handle-check    — public handle availability check
 *   GET  /api/auth/username-check  — legacy alias for handle-check
 */
export const authRoutes = Router();

type AuthedRequestWithContext = AuthedRequest & RequestWithContext;

const ME_PROFILE_COLUMNS = `
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
  is_staff,
  is_demo,
  age_confirmed_at,
  jurisdiction_confirmed_at,
  jurisdiction,
  created_at,
  updated_at
`;

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(ME_PROFILE_COLUMNS)
      .eq("id", req.user!.id)
      .single();

    if (error || !profile) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to load profile.",
        cause: error,
      });
    }

    return res.json(
      apiOkFlat(req, {
        ...profile,
        email: req.user!.email ?? null,
        entitlements: { tier: profile.tier },
      }),
    );
  }),
);

authRoutes.post(
  "/signout",
  requireAuth,
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    return res.json(apiOkFlat(req, {}));
  }),
);

const ProfileUpdateSchema = z.object({
  handle: HandleSchema.optional(),
  username: HandleSchema.optional(),
  display_name: z.string().max(64).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

const AVATAR_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

authRoutes.post(
  "/profile/avatar",
  requireAuth,
  express.raw({ type: AVATAR_UPLOAD_TYPES, limit: "3mb" }),
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message: "Choose a valid profile photo.",
      });
    }

    let normalized: Buffer;
    try {
      normalized = await sharp(req.body)
        .rotate()
        .resize(512, 512, { fit: "cover", withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();
    } catch (error) {
      throw new AppError({
        status: 400,
        code: "bad_request",
        message:
          "That photo format could not be processed. Use JPG, PNG, WebP, or HEIC.",
        cause: error,
      });
    }

    const objectPath = `${req.user!.id}/${randomUUID()}.webp`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(objectPath, normalized, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to store profile photo.",
        cause: uploadError,
      });
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(objectPath);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("id", req.user!.id)
      .select(ME_PROFILE_COLUMNS)
      .single();
    if (error) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to save profile photo.",
        cause: error,
      });
    }

    return res.json(apiOkFlat(req, data as unknown as Record<string, unknown>));
  }),
);

async function assertHandleAvailable(handle: string, excludeUserId: string) {
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .neq("id", excludeUserId)
    .maybeSingle();

  if (existing) {
    throw new AppError({
      status: 409,
      code: "conflict",
      message: "Handle is already taken.",
      details: { error: "handle_taken" },
    });
  }
}

authRoutes.patch(
  "/profile",
  requireAuth,
  validate({ body: ProfileUpdateSchema }),
  asyncHandler(async (req: AuthedRequestWithContext, res: Response) => {
    const updates = req.body as z.infer<typeof ProfileUpdateSchema>;

    const safeUpdates: Record<string, unknown> = {};
    const nextHandle = updates.handle ?? updates.username;
    if (nextHandle !== undefined) {
      await assertHandleAvailable(nextHandle, req.user!.id);
      safeUpdates.handle = nextHandle;
      safeUpdates.username = nextHandle;
    }
    if (updates.display_name !== undefined)
      safeUpdates.display_name = updates.display_name;
    if (updates.bio !== undefined) safeUpdates.bio = updates.bio;
    if (updates.avatar_url !== undefined)
      safeUpdates.avatar_url = updates.avatar_url;

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
      .select(ME_PROFILE_COLUMNS)
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

    return res.json(apiOkFlat(req, data as unknown as Record<string, unknown>));
  }),
);

async function checkHandleAvailability(
  req: RequestWithContext,
  res: Response,
  raw: string,
) {
  const validated = validateHandle(raw);
  if (validated.ok === false) {
    return res.json(
      apiOkFlat(req, { available: false, reason: validated.reason }),
    );
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("handle", validated.handle)
    .maybeSingle();

  return res.json(
    apiOkFlat(req, {
      available: !data,
      handle: validated.handle,
      reason: data ? "taken" : undefined,
    }),
  );
}

authRoutes.get(
  "/handle-check",
  optionalAuth,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    return checkHandleAvailability(req, res, String(req.query.handle ?? ""));
  }),
);

authRoutes.get(
  "/username-check",
  optionalAuth,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const raw = String(req.query.username ?? req.query.handle ?? "");
    return checkHandleAvailability(req, res, raw);
  }),
);
