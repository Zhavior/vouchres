import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  generateHrSocialDrafts,
  listDrafts,
  listJudges,
  mockPostDraft,
  queueDraft,
} from "../../server/services/aiJudges/socialDraftService";

function getPath(req: VercelRequest): string[] {
  const raw = req.query.path;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return [raw];
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = getPath(req);

  try {
    if (req.method === "GET" && path[0] === "judges") {
      return res.status(200).json({
        status: "ready",
        mode: "safe_prototype",
        source: "vercel-serverless-catchall",
        judges: listJudges(),
      });
    }

    if (req.method === "POST" && path[0] === "generate-hr-drafts") {
      const result = await generateHrSocialDrafts({
        date: req.body?.date,
        scheduledFor: req.body?.scheduledFor,
      });

      return res.status(200).json({
        status: "ready",
        mode: "safe_prototype_no_real_x_posting",
        source: "vercel-serverless-catchall",
        ...result,
      });
    }

    if (req.method === "GET" && path[0] === "drafts" && path.length === 1) {
      return res.status(200).json({
        status: "ready",
        mode: "safe_prototype",
        source: "vercel-serverless-catchall",
        warning: "Serverless memory can reset. Use database storage before real posting.",
        drafts: listDrafts(),
      });
    }

    if (req.method === "POST" && path[0] === "drafts" && path[2] === "queue") {
      return res.status(200).json({
        status: "queued",
        source: "vercel-serverless-catchall",
        draft: queueDraft(path[1]),
      });
    }

    if (req.method === "POST" && path[0] === "drafts" && path[2] === "mock-post") {
      return res.status(200).json({
        status: "mock_posted",
        source: "vercel-serverless-catchall",
        message: "Safe prototype only. Nothing was posted to X/Twitter.",
        draft: mockPostDraft(path[1]),
      });
    }

    return res.status(404).json({
      status: "error",
      message: "AI judge social route not found",
      path,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      message: err?.message ?? "AI judge social API failed",
      path,
    });
  }
}
