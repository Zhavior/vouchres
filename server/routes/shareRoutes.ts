import { Router } from "express";
import sharp from "sharp";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { getCachedHrBoardResponse } from "../services/hubs/hrBoardHub";
import {
  findHrShareCardCandidate,
  HR_SHARE_CARD_HEADERS,
  HrShareCardRequestError,
  parseHrShareCardParams,
  renderHrShareCardSvg,
} from "../services/share/hrShareCard";
import { renderVouchShareCardSvg, VOUCH_SHARE_CARD_HEADERS } from "../services/share/vouchShareCard";
import { getPublicVouch } from "../services/persistence/vouchService";

export const shareRoutes = Router();

/**
 * GET /api/share/vouch/:id/card.png
 * Public share-card image for a vouch, used as the Open Graph image at /v/:id.
 */
shareRoutes.get("/share/vouch/:id/card.png", asyncHandler(async (req, res) => {
  const vouch = await getPublicVouch(req.params.id);
  if (!vouch) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Vouch not found.",
      details: { error: "vouch_not_found" },
    });
  }

  try {
    const svg = renderVouchShareCardSvg({
      playerOrTeam: vouch.player_or_team,
      market: vouch.market,
      gameName: vouch.game_name,
      odds: vouch.odds,
      selection: vouch.selection,
      aiConfidence: vouch.ai_confidence,
      capperConfidence: vouch.capper_confidence,
      riskTier: vouch.risk_tier,
      cardTheme: vouch.card_theme,
    });

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    Object.entries(VOUCH_SHARE_CARD_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).send(png);
  } catch (error) {
    console.error("[share] vouch card render failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to render vouch share card.",
      cause: error,
    });
  }
}));

shareRoutes.get("/share/hr-card", asyncHandler(async (req, res) => {
  try {
    const params = parseHrShareCardParams(req.query as Record<string, unknown>);
    const board = await getCachedHrBoardResponse({ date: params.date, previewLimit: 350 });
    const candidates = [...(board.candidates ?? []), ...(board.projectedCandidates ?? [])];
    const candidate = findHrShareCardCandidate(candidates, params);

    if (!candidate) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "HR player candidate not found for this board date.",
        details: {
          playerId: params.playerId,
          date: params.date ?? board.date,
        },
      });
    }

    const svg = renderHrShareCardSvg(candidate, {
      date: params.date ?? board.date,
      theme: params.theme,
    });

    Object.entries(HR_SHARE_CARD_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).send(svg);
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    if (error instanceof HrShareCardRequestError) {
      throw new AppError({
        status: error.statusCode,
        code: error.statusCode === 404 ? "not_found" : "bad_request",
        message: typeof error.payload?.error === "string"
          ? error.payload.error
          : "Invalid HR share card request.",
        details: error.payload,
        expose: true,
      });
    }

    const err = error as { name?: string; message?: string };
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to generate HR share card.",
      details: {
        errorName: err?.name ?? "Error",
        message: err?.message ?? "Unknown error",
        route: "/api/share/hr-card",
      },
      cause: error,
    });
  }
}));
