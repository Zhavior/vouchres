import type { VercelRequest, VercelResponse } from "@vercel/node";
import { queueDraft } from "../../../../server/services/aiJudges/socialDraftService";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const draftId = String(req.query.draftId);
    return res.status(200).json({
      status: "queued",
      source: "vercel-serverless",
      draft: queueDraft(draftId),
    });
  } catch (err: any) {
    return res.status(404).json({
      status: "error",
      source: "vercel-serverless",
      message: err?.message ?? "Draft not found",
    });
  }
}
