import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
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

vouchRoutes.get("/vouches", optionalAuth, async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.json({ vouches: [] });
  try {
    const vouches = await listVouchesForUser(req.user.id);
    return res.json({ vouches });
  } catch (error) {
    console.error("[vouches] list failed", error);
    return res.status(500).json({ error: "fetch_failed" });
  }
});

vouchRoutes.post(
  "/vouches",
  requireAuth,
  validate({ body: CreateVouchSchema }),
  async (req: AuthedRequest, res: Response) => {
    const body = req.body as z.infer<typeof CreateVouchSchema>;
    try {
      const vouch = await createVouch({ user_id: req.user!.id, ...body });
      return res.status(201).json(vouch);
    } catch (error) {
      console.error("[vouches] create failed", error);
      return res.status(500).json({ error: "create_failed" });
    }
  }
);

vouchRoutes.delete("/vouches/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const hidden = await hideVouch(id, req.user!.id);
    if (!hidden) return res.status(404).json({ error: "not_found" });
    return res.json({ ok: true });
  } catch (error) {
    console.error("[vouches] hide failed", error);
    return res.status(500).json({ error: "hide_failed" });
  }
});
