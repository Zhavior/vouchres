import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listDrafts } from "../../server/services/aiJudges/socialDraftService";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ready",
    mode: "safe_prototype",
    source: "vercel-serverless",
    warning: "Serverless memory can reset. Use database storage before real posting.",
    drafts: listDrafts(),
  });
}
