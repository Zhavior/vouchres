import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { getPublicParlayProof } from "../services/proof/parlayProofService";
import { getPublicVouchWithAuthor } from "../services/persistence/vouchService";

export const proofRoutes = Router();

proofRoutes.get("/proof/parlay/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const proof = await getPublicParlayProof(req.params.id, baseUrl);
  if (!proof) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Parlay proof not found or not public.",
    });
  }
  return res.json(apiOkFlat(req, { proof }));
}));

proofRoutes.get("/proof/vouch/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const result = await getPublicVouchWithAuthor(req.params.id);
  if (!result) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Vouch proof not found or not public.",
    });
  }

  const { vouch, author } = result;
  return res.json(apiOkFlat(req, {
    proof: {
      id: vouch.id,
      user_id: vouch.user_id,
      market: vouch.market,
      player_or_team: vouch.player_or_team,
      game_name: vouch.game_name,
      odds: vouch.odds,
      selection: vouch.selection,
      status: vouch.status,
      ai_confidence: vouch.ai_confidence,
      created_at: vouch.created_at,
      updated_at: vouch.updated_at,
      author,
      proof_url: `${req.protocol}://${req.get("host")}/v/${encodeURIComponent(vouch.id)}`,
    },
  }));
}));
