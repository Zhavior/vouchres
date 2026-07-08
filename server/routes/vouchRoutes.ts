import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { createVouch, listVouchesForUser, hideVouch } from "../services/persistence/vouchService";

/**
 * Vouch routes — Vouch Board persistence (was localStorage-only).
 *
 *   GET    /api/vouches       — list current user's saved vouches (auth)
 *   POST   /api/vouches       — save a vouch (auth)
 *   DELETE /api/vouches/:id   — hide a vouch (auth; soft-hide, not a real delete)
 */
export const vouchRoutes = Router();

const CreateVouchSchema = z.object({
  vouch_source: z.string().min(1).max(120),
  user_note: z.string().max(2000).optional(),
  market: z.string().min(1).max(64),
  sport: z.string().min(1).max(32).optional(),
  player_or_team: z.string().max(120).optional(),
  game_name: z.string().min(1).max(200),
  odds: z.string().min(1).max(20),
  line: z.string().max(40).optional(),
  selection: z.string().max(280).optional(),
  ai_confidence: z.number().min(0).max(100).optional(),
  capper_confidence: z.number().min(0).max(100).optional(),
  risk_tier: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  longer_breakdown: z.string().max(4000).optional(),
  card_theme: z.string().max(40).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

vouchRoutes.get("/vouches", optionalAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.json({ ok: true, vouches: [] });

  const vouches = await listVouchesForUser(req.user.id).catch((error) => {
    console.error("[vouches] list failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to fetch vouches.",
      cause: error,
    });
  });

  return res.json({ ok: true, vouches });
}));

vouchRoutes.post(
  "/vouches",
  requireAuth,
  validate({ body: CreateVouchSchema }),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const body = req.body as z.infer<typeof CreateVouchSchema>;

    const vouch = await createVouch({ user_id: req.user!.id, ...body }).catch((error) => {
      console.error("[vouches] create failed", error);
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Failed to create vouch.",
        cause: error,
      });
    });

    return res.status(201).json({ ok: true, ...vouch });
  }),
);

vouchRoutes.delete("/vouches/:id", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const hidden = await hideVouch(id, req.user!.id).catch((error) => {
    console.error("[vouches] hide failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to hide vouch.",
      cause: error,
    });
  });

  if (!hidden) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Vouch not found.",
    });
  }

  return res.json({ ok: true });
}));
