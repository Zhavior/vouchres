import { Router } from "express";
import type { Response } from "express";
import { optionalAuth, supabaseAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { validateHandle } from "../lib/handleSchema";
import type { RequestWithContext } from "../middleware/requestContext";

/**
 * Public user lookup routes.
 *
 *   GET /api/users/handle/:handle — check @handle availability (public)
 */
export const userRoutes = Router();

userRoutes.get(
  "/handle/:handle",
  optionalAuth,
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const validated = validateHandle(req.params.handle ?? "");
    if (validated.ok === false) {
      return res.json(apiOkFlat(req, { available: false, reason: validated.reason }));
    }

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("handle", validated.handle)
      .maybeSingle();

    return res.json(apiOkFlat(req, {
      available: !data,
      handle: validated.handle,
      reason: data ? "taken" : undefined,
    }));
  }),
);
