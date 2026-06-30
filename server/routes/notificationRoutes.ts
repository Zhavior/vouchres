import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, requireStaff } from "../middleware/auth";
import {
  deletePushSubscription,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  processHomeRunEvents,
  savePushSubscription,
} from "../services/notifications/notificationService";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";

export const notificationRoutes = Router();

notificationRoutes.get("/notifications", requireAuth, async (req: AuthedRequest, res: Response) => {
  const start = Date.now();
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const out = await listNotifications(req.user!.id, limit);
  console.log(`[endpoint] GET /api/notifications ${Date.now() - start}ms count=${out.notifications.length} unread=${out.unreadCount}`);
  return res.json(out);
});

notificationRoutes.get("/notifications/unread-count", requireAuth, async (req: AuthedRequest, res: Response) => {
  const out = await listNotifications(req.user!.id, 1);
  return res.json({ notifications: [], unreadCount: out.unreadCount, warnings: out.warnings });
});

notificationRoutes.post("/notifications/:id/read", requireAuth, async (req: AuthedRequest, res: Response) => {
  const out = await markNotificationRead(req.user!.id, req.params.id);
  return res.json(out);
});

notificationRoutes.post("/notifications/read-all", requireAuth, async (req: AuthedRequest, res: Response) => {
  const out = await markAllNotificationsRead(req.user!.id);
  return res.json(out);
});

notificationRoutes.post("/notifications/push/subscribe", requireAuth, async (req: AuthedRequest, res: Response) => {
  const body = req.body ?? {};
  if (typeof body.endpoint !== "string" || typeof body.keys?.p256dh !== "string" || typeof body.keys?.auth !== "string") {
    return res.status(400).json({ ok: false, warnings: ["Invalid push subscription payload"] });
  }
  const out = await savePushSubscription(req.user!.id, body, req.get("user-agent") ?? undefined);
  return res.status(out.ok ? 200 : 500).json(out);
});

notificationRoutes.post("/notifications/push/unsubscribe", requireAuth, async (req: AuthedRequest, res: Response) => {
  const endpoint = String(req.body?.endpoint ?? "");
  if (!endpoint) return res.status(400).json({ ok: false, warnings: ["Missing push endpoint"] });
  const out = await deletePushSubscription(req.user!.id, endpoint);
  return res.status(out.ok ? 200 : 500).json(out);
});

notificationRoutes.post("/notifications/scan-hr", requireAuth, requireStaff, async (req: AuthedRequest, res: Response) => {
  const start = Date.now();
  const date = typeof req.body?.date === "string" ? req.body.date : undefined;
  const events = await getTodayHomeRuns(date);
  const out = await processHomeRunEvents(events);
  console.log(`[endpoint] POST /api/notifications/scan-hr ${Date.now() - start}ms scanned=${out.scanned} created=${out.created}`);
  return res.json(out);
});

