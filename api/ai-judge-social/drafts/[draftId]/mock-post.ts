import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mockPostDraft } from "../../../../server/services/aiJudges/socialDraftService";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const draftId = String(req.query.draftId);
    return res.status(200).json({
      status: "mock_posted",
      source: "vercel-serverless",
      message: "Safe prototype only. Nothing was posted to X/Twitter.",
      draft: mockPostDraft(draftId),
    });
  } catch (err: any) {
    return res.status(404).json({
      status: "error",
      source: "vercel-serverless",
      message: err?.message ?? "Draft not found",
    });
  }
}
