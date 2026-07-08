import type { VercelRequest, VercelResponse } from "@vercel/node";
import { normalizeLimit, normalizeOffset, requireUser } from "../_utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, client, error } = await requireUser(req);
  if (!user || !client) {
    return res.status(401).json({ error, scope: "current_user", picks: [], total: 0, warnings: [error ?? "unauthorized"] });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed", scope: "current_user", picks: [], total: 0, warnings: ["Use GET for this endpoint."] });
  }

  const limit = normalizeLimit(req.query.limit, 100, 200);
  const offset = normalizeOffset(req.query.offset);
  const status = typeof req.query.status === "string" ? req.query.status.toLowerCase() : undefined;
  const allowedStatuses = new Set(["pending", "won", "lost", "void", "push"]);

  let query = client
    .from("picks")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && allowedStatuses.has(status)) query = query.eq("status", status);

  const { data, count, error: fetchError } = await query;
  return res.status(200).json({
    scope: "current_user",
    picks: data ?? [],
    total: count ?? 0,
    limit,
    offset,
    warnings: fetchError ? [fetchError.message] : [],
  });
}
