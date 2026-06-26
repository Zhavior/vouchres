import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildValidatedHrBoard } from "../../../server/services/mlb/hrPipeline";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const board = await buildValidatedHrBoard();

    return res.status(200).json({
      ...board,
      source: board.source ?? "vouchedge_hr_pipeline",
      runtime: "vercel_direct_function_static_import",
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Vercel HR Board API Error]", error);

    return res.status(500).json({
      error: "Failed to build validated HR board",
      message: error?.message || "Unknown error",
      stack: error?.stack || null,
      runtime: "vercel_direct_function_static_import",
    });
  }
}
