import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildValidatedHrBoard } from "../../../server/services/mlb/hrPipeline";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const board = await buildValidatedHrBoard();

    res.status(200).json({
      ...board,
      source: board.source ?? "vouchedge_hr_pipeline",
      runtime: "vercel_direct_function",
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Vercel HR Board API Error]", error);

    res.status(500).json({
      error: "Failed to build validated HR board",
      message: error?.message || "Unknown error",
      runtime: "vercel_direct_function",
    });
  }
}
