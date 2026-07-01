import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../_utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, client, error } = await requireUser(req);
  if (!user || !client) {
    return res.status(401).json({ error, notifications: [], unreadCount: 0, warnings: [error ?? "unauthorized"] });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed", notifications: [], unreadCount: 0, warnings: ["Use GET for this endpoint."] });
  }
  const unread = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  return res.status(200).json({
    notifications: [],
    unreadCount: unread.count ?? 0,
    warnings: unread.error ? [unread.error.message] : [],
  });
}
