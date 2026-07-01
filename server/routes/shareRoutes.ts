import { Router } from "express";
import { getCachedHrBoardResponse } from "../services/hubs/hrBoardHub";
import {
  findHrShareCardCandidate,
  HR_SHARE_CARD_HEADERS,
  HrShareCardRequestError,
  parseHrShareCardParams,
  renderHrShareCardSvg,
} from "../services/share/hrShareCard";

export const shareRoutes = Router();

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
