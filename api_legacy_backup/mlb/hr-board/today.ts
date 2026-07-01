import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildHrBoardResponse } from "./_hr-engine-pro/buildHrBoardResponse.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : todayISO();
    // Accept both `previewLimit` and the client's `limit` param (alias).
    const rawLimitStr =
      typeof req.query.previewLimit === "string"
        ? req.query.previewLimit
        : typeof req.query.limit === "string"
          ? req.query.limit
          : "";
    const rawLimit = rawLimitStr ? Number.parseInt(rawLimitStr, 10) : 50;
    const previewLimit = clamp(Number.isFinite(rawLimit) ? rawLimit : 50, 10, 350);

    const board = await buildHrBoardResponse({
      date,
      previewLimit,
    });

    return res.status(200).json({
      ...board,
      runtime: "hr_engine_pro_v2",
      runtimeRoute: "production_today_hr_engine_pro_v2",
      source: "official_mlb_statsapi_hr_engine_pro_v2",
      count: board.candidates.length,
      rankedCount: board.projectedCandidates.length,
      warning:
        "Production HR Engine Pro v2 route is active. Preview rows remain unconfirmed until official lineups populate candidates[].",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to load production HR Engine Pro v2 board",
      errorName: error?.name ?? "Error",
      message: error?.message ?? "Unknown error",
      runtime: "hr_engine_pro_v2",
      runtimeRoute: "production_today_hr_engine_pro_v2",
      source: "official_mlb_statsapi_hr_engine_pro_v2",
      route: "/api/mlb/hr-board/today",
    });
  }
}
