import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildValidatedHrBoard } from "../../../server/services/mlb/hrPipeline";
import { buildHrBoardApiPayload } from "../../../server/services/mlb/hrBoardResponse";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date =
      typeof req.query.date === "string" && req.query.date.trim()
        ? req.query.date
        : undefined;

    const result = await buildValidatedHrBoard(date);
    return res.status(200).json(buildHrBoardApiPayload(result, req.query.previewLimit));
  } catch (error: any) {
    console.error("[vercel hr-board/today] pipeline failed:", error?.message);
    return res.status(503).json({
      error: "HR board unavailable",
      message: error?.message ?? "Unknown error",
    });
  }
}
