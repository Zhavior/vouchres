import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateHrSocialDrafts } from "../../server/services/aiJudges/socialDraftService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const result = await generateHrSocialDrafts({
      date: req.body?.date,
      scheduledFor: req.body?.scheduledFor,
    });

    return res.status(200).json({
      status: "ready",
      mode: "safe_prototype_no_real_x_posting",
      source: "vercel-serverless",
      ...result,
    });
  } catch (err: any) {
    return res.status(503).json({
      status: "error",
      source: "vercel-serverless",
      message: err?.message ?? "Failed to generate AI judge drafts",
    });
  }
}
