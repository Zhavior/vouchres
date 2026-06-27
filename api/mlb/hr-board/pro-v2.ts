import type { VercelRequest, VercelResponse } from "@vercel/node";

const todayISO = () => new Date().toISOString().slice(0, 10);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : todayISO();
    const rawLimit =
      typeof req.query.previewLimit === "string"
        ? Number.parseInt(req.query.previewLimit, 10)
        : 50;
    const previewLimit = clamp(Number.isFinite(rawLimit) ? rawLimit : 50, 10, 350);
    const { buildHrBoardResponse } = require("../../../server/services/mlb/hr-engine/buildHrBoardResponse");

    const board = await buildHrBoardResponse({
      date,
      previewLimit,
    });

    return res.status(200).json({
      ...board,
      count: board.candidates.length,
      rankedCount: board.projectedCandidates.length,
      warning:
        "Test-only HR Engine Pro v2 route is active. Use for validation only. Do not treat as the production-safe preview route.",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to load HR Engine Pro v2 test route",
      errorName: error?.name ?? "Error",
      message: error?.message ?? "Unknown error",
      runtime: "hr_engine_pro_v2",
      source: "official_mlb_statsapi_hr_engine_pro_v2",
      route: "/api/mlb/hr-board/pro-v2",
    });
  }
}
