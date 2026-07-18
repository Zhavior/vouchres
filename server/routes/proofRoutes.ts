import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { getPublicParlayProof } from "../services/proof/parlayProofService";
import { getPublicVouchWithAuthor } from "../services/persistence/vouchService";
import { decodeOtsProofBase64 } from "../services/trust/openTimestampService";
import { getSupabaseAdmin } from "../middleware/auth";
import { findPublicParlayById } from "../repositories/parlayRepository";
import { getSafePublicOrigin } from "../lib/publicOrigin";

export const proofRoutes = Router();

proofRoutes.get("/proof/parlay/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const baseUrl = getSafePublicOrigin();
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

proofRoutes.get("/proof/parlay/:id/ots", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const parlay = await findPublicParlayById(req.params.id);
  if (!parlay) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Parlay proof not found or not public.",
    });
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("proof_hash, ots_proof")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to load OpenTimestamp proof.",
      cause: error,
    });
  }

  const proofBytes = decodeOtsProofBase64(String(data?.ots_proof ?? ""));
  if (!proofBytes) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "OpenTimestamp proof is not available for this parlay yet.",
      details: { proof_hash: data?.proof_hash ?? null },
    });
  }

  const filename = `${req.params.id}.ots`;
  res.setHeader("Content-Type", "application/vnd.opentimestamps.ots");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.send(proofBytes);
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
      proof_url: `${getSafePublicOrigin()}/v/${encodeURIComponent(vouch.id)}`,
    },
  }));
}));
