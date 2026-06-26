import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const mod = await import("../../../server/services/mlb/hrPipeline");
    const board = await mod.buildValidatedHrBoard();

    return res.status(200).json({
      ...board,
      source: board.source ?? "vouchedge_hr_pipeline",
      runtime: "vercel_direct_function_lazy_import",
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Vercel HR Board API Error]", error);

    return res.status(500).json({
      error: "Failed to build validated HR board",
      message: error?.message || "Unknown error",
      stack: error?.stack || null,
      runtime: "vercel_direct_function_lazy_import",
    });
  }
}
