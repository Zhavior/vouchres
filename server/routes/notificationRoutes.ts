import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, requireStaff } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
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

notificationRoutes.get("/notifications", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const start = Date.now();
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const out = await listNotifications(req.user!.id, limit);
  console.log(`[endpoint] GET /api/notifications ${Date.now() - start}ms count=${out.notifications.length} unread=${out.unreadCount}`);
  return res.json({ ok: true, ...out });
}));

notificationRoutes.get("/notifications/unread-count", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const out = await listNotifications(req.user!.id, 1);
  return res.json({
    ok: true,
    notifications: [],
    unreadCount: out.unreadCount,
    warnings: out.warnings,
  });
}));

notificationRoutes.post("/notifications/:id/read", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const out = await markNotificationRead(req.user!.id, req.params.id);
  return res.json({ ok: true, ...out });
}));

notificationRoutes.post("/notifications/read-all", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const out = await markAllNotificationsRead(req.user!.id);
  return res.json({ ok: true, ...out });
}));

notificationRoutes.post("/notifications/push/subscribe", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const body = req.body ?? {};
  if (typeof body.endpoint !== "string" || typeof body.keys?.p256dh !== "string" || typeof body.keys?.auth !== "string") {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Invalid push subscription payload.",
      details: { warnings: ["Invalid push subscription payload"] },
    });
  }
  const out = await savePushSubscription(req.user!.id, body, req.get("user-agent") ?? undefined);
  if (!out.ok) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to save push subscription.",
      details: out,
    });
  }
  return res.json({ ok: true, ...out });
}));

notificationRoutes.post("/notifications/push/unsubscribe", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const endpoint = String(req.body?.endpoint ?? "");
  if (!endpoint) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Missing push endpoint.",
      details: { warnings: ["Missing push endpoint"] },
    });
  }
  const out = await deletePushSubscription(req.user!.id, endpoint);
  if (!out.ok) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to delete push subscription.",
      details: out,
    });
  }
  return res.json({ ok: true, ...out });
}));

notificationRoutes.post("/notifications/scan-hr", requireAuth, requireStaff, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const start = Date.now();
  const date = typeof req.body?.date === "string" ? req.body.date : undefined;
  const feed = await getTodayHomeRuns(date);
  const out = await processHomeRunEvents(feed.events);
  console.log(`[endpoint] POST /api/notifications/scan-hr ${Date.now() - start}ms scanned=${out.scanned} created=${out.created}`);
  return res.json({ ok: true, ...out });
}));
