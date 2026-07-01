import type { VercelRequest, VercelResponse } from "@vercel/node";
import { normalizeLimit, requireUser } from "./_utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, client, error } = await requireUser(req);
  if (!user || !client) {
    return res.status(401).json({ error, notifications: [], unreadCount: 0, warnings: [error ?? "unauthorized"] });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed", notifications: [], unreadCount: 0, warnings: ["Use GET for this endpoint."] });
  }

  const limit = normalizeLimit(req.query.limit, 50, 100);
  const [rows, unread] = await Promise.all([
    client
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  const warnings = [
    rows.error ? `notifications lookup failed: ${rows.error.message}` : null,
    unread.error ? `unread count failed: ${unread.error.message}` : null,
  ].filter(Boolean);

  return res.status(200).json({
    notifications: rows.data ?? [],
    unreadCount: unread.count ?? 0,
    warnings,
  });
}
