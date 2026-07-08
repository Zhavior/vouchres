import { Router } from "express";
import sharp from "sharp";
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
 * SVG rendered server-side, converted to PNG (X/Slack/iMessage crawlers don't
 * accept SVG for og:image/twitter:image).
 */
shareRoutes.get("/share/vouch/:id/card.png", async (req, res) => {
  try {
    const vouch = await getPublicVouch(req.params.id);
    if (!vouch) return res.status(404).json({ error: "vouch_not_found" });

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
    return res.status(500).json({ error: "share_card_failed" });
  }
});

shareRoutes.get("/share/hr-card", async (req, res) => {
  try {
    const params = parseHrShareCardParams(req.query as Record<string, unknown>);
    const board = await getCachedHrBoardResponse({ date: params.date, previewLimit: 350 });
    const candidates = [...(board.candidates ?? []), ...(board.projectedCandidates ?? [])];
    const candidate = findHrShareCardCandidate(candidates, params);

    if (!candidate) {
      return res.status(404).json({
        error: "HR player candidate not found for this board date",
        playerId: params.playerId,
        date: params.date ?? board.date,
      });
    }

    const svg = renderHrShareCardSvg(candidate, {
      date: params.date ?? board.date,
      theme: params.theme,
    });

    Object.entries(HR_SHARE_CARD_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).send(svg);
  } catch (error: unknown) {
    if (error instanceof HrShareCardRequestError) {
      return res.status(error.statusCode).json(error.payload);
    }

    const err = error as { name?: string; message?: string };
    return res.status(500).json({
      error: "Failed to generate HR share card",
      errorName: err?.name ?? "Error",
      message: err?.message ?? "Unknown error",
      route: "/api/share/hr-card",
    });
  }
});
