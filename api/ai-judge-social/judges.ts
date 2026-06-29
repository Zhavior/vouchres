import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listJudges } from "../../server/services/aiJudges/socialDraftService";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ready",
    mode: "safe_prototype",
    source: "vercel-serverless",
    judges: listJudges(),
  });
}
