import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildHrBoardResponse } from "../mlb/hr-board/_hr-engine-pro/buildHrBoardResponse.js";
import {
  findHrShareCardCandidate,
  HR_SHARE_CARD_HEADERS,
  HrShareCardRequestError,
  parseHrShareCardParams,
  renderHrShareCardSvg,
} from "../../server/services/share/hrShareCard.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const params = parseHrShareCardParams(req.query);
    const board = await buildHrBoardResponse({ date: params.date, previewLimit: 350 });
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
}
