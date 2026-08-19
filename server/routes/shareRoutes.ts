import { Router } from "express";
import sharp from "sharp";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { getCachedValidatedHrBoard } from "../services/hubs/hrBoardHub";
import {
  findHrShareCardCandidate,
  HR_SHARE_CARD_HEADERS,
  HrShareCardRequestError,
  parseHrShareCardParams,
  renderHrShareCardSvg,
} from "../services/share/hrShareCard";
import { renderVouchShareCardSvg, VOUCH_SHARE_CARD_HEADERS } from "../services/share/vouchShareCard";
import { renderParlayShareCardSvg, PARLAY_SHARE_CARD_HEADERS } from "../services/share/parlayShareCard";
import { renderHrListShareCardSvg, HR_LIST_SHARE_CARD_HEADERS } from "../services/share/hrListShareCard";
import { getPublicHrList, hrListAuthorLabel } from "../services/hr-list/hrListService";
import { getPublicVouch } from "../services/persistence/vouchService";
import { getPublicParlayProof, parlayProofAuthorLabel } from "../services/proof/parlayProofService";
import { getSafePublicOrigin } from "../lib/publicOrigin";
import { mlbReadLimiter } from "../middleware/rateLimit";

export const shareRoutes = Router();

/**
 * GET /api/share/vouch/:id/card.png
 * Public share-card image for a vouch, used as the Open Graph image at /v/:id.
 */
shareRoutes.get("/share/vouch/:id/card.png", mlbReadLimiter, asyncHandler(async (req, res) => {
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

shareRoutes.get("/share/hr-card", mlbReadLimiter, asyncHandler(async (req, res) => {
  try {
    const params = parseHrShareCardParams(req.query as unknown as Record<string, unknown>);
    const board = await getCachedValidatedHrBoard(params.date);
    const confirmed = board.candidates ?? [];
    let candidate = findHrShareCardCandidate(confirmed, params);
    if (!candidate) {
      candidate = findHrShareCardCandidate(board.projectedCandidates ?? [], params);
    }

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

    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to generate HR share card.",
      expose: false,
      cause: error,
    });
  }
}));

/**
 * GET /api/share/parlay/:id/card.png
 * Public share-card image for a parlay proof at /p/:id.
 */
shareRoutes.get("/share/parlay/:id/card.png", mlbReadLimiter, asyncHandler(async (req, res) => {
  const baseUrl = getSafePublicOrigin();
  const proof = await getPublicParlayProof(req.params.id, baseUrl);
  if (!proof) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Parlay not found.",
      details: { error: "parlay_not_found" },
    });
  }

  try {
    const svg = renderParlayShareCardSvg({
      title: proof.explanation || proof.selection || `${proof.legs.length}-leg parlay`,
      legCount: proof.legs.length,
      status: proof.status,
      oddsDecimal: proof.odds_decimal,
      authorHandle: parlayProofAuthorLabel(proof).replace(/^@/, ""),
      createdAt: proof.created_at,
      lockedAt: proof.locked_at,
      lockReason: proof.lock_reason,
    });

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    Object.entries(PARLAY_SHARE_CARD_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).send(png);
  } catch (error) {
    console.error("[share] parlay card render failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to render parlay share card.",
      cause: error,
    });
  }
}));

/**
 * GET /api/share/hr-list/:id/card.png
 * Open Graph image for a public "My HR List" at /l/:id.
 *
 * This card carries the entire message on purpose: X strips the headline and
 * description from link previews and renders only the image, so the players,
 * their numbers, the VouchEdge mark, and the destination URL are all drawn in.
 */
shareRoutes.get("/share/hr-list/:id/card.png", mlbReadLimiter, asyncHandler(async (req, res) => {
  const list = await getPublicHrList(req.params.id);
  if (!list) {
    // Private and non-existent lists are indistinguishable here by design.
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "HR list not found.",
      details: { error: "hr_list_not_found" },
    });
  }

  try {
    const svg = await renderHrListShareCardSvg({
      listId: list.id,
      title: list.title,
      ownerHandle: hrListAuthorLabel(list).replace(/^@/, ""),
      slateDate: list.slate_date,
      entries: list.entries,
      publicOrigin: getSafePublicOrigin(),
    });

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    Object.entries(HR_LIST_SHARE_CARD_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).send(png);
  } catch (error) {
    console.error("[share] hr-list card render failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to render HR list share card.",
      cause: error,
    });
  }
}));
