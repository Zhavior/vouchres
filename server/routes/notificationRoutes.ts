import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, requireStaff, getSupabaseAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { structuredLog } from "../lib/structuredLog";
import { AppError } from "../errors/AppError";
import type { RequestWithContext } from "../middleware/requestContext";
import { assertUserOwnsResource } from "../middleware/ownership";
import { validate } from "../middleware/validation";
import { NotificationPreferencesPatchSchema } from "../validators/mutationSchemas";
import {
  deletePushSubscription,
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  processHomeRunEvents,
  savePushSubscription,
  updateNotificationPreferences,
} from "../services/notifications/notificationService";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";

export const notificationRoutes = Router();

notificationRoutes.get("/notification-preferences", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const prefs = await getNotificationPreferences(req.user!.id);
  return res.json(apiOkFlat(req, { preferences: prefs }));
}));

notificationRoutes.patch(
  "/notification-preferences",
  requireAuth,
  validate({ body: NotificationPreferencesPatchSchema }),
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const body = req.body as Record<string, boolean>;
    const patch: Record<string, boolean> = {};
    for (const key of [
      "in_app_enabled",
      "hr_alerts_enabled",
      "parlay_alerts_enabled",
      "follow_alerts_enabled",
      "tail_alerts_enabled",
      "browser_push_enabled",
    ] as const) {
      if (typeof body[key] === "boolean") patch[key] = body[key];
    }

    const prefs = await updateNotificationPreferences(req.user!.id, patch);
    return res.json(apiOkFlat(req, { preferences: prefs }));
  }),
);

notificationRoutes.get("/notifications", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const start = Date.now();
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const out = await listNotifications(req.user!.id, limit);
  structuredLog({
    level: "info",
    event: "endpoint",
    requestId: req.requestId,
    method: "GET",
    route: "/api/notifications",
    durationMs: Date.now() - start,
    count: out.notifications.length,
    unread: out.unreadCount,
  });
  return res.json(apiOkFlat(req, out as unknown as Record<string, unknown>));
}));

notificationRoutes.get("/notifications/unread-count", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const out = await listNotifications(req.user!.id, 1);
  return res.json(apiOkFlat(req, {
    notifications: [],
    unreadCount: out.unreadCount,
    warnings: out.warnings,
  }));
}));

notificationRoutes.post("/notifications/:id/read", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const owned = await assertUserOwnsResource(req.user!.id, "notification", req.params.id);
  if (owned.ok === false) {
    if (owned.warning === "resource not found for authenticated user") {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Notification not found.",
      });
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Ownership check failed.",
      details: { warning: owned.warning },
    });
  }

  const out = await markNotificationRead(req.user!.id, req.params.id);
  return res.json(apiOkFlat(req, out as unknown as Record<string, unknown>));
}));

notificationRoutes.post("/notifications/read-all", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const out = await markAllNotificationsRead(req.user!.id);
  return res.json(apiOkFlat(req, out as unknown as Record<string, unknown>));
}));

notificationRoutes.post("/notifications/push/subscribe", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
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
  return res.json(apiOkFlat(req, out as unknown as Record<string, unknown>));
}));

notificationRoutes.post("/notifications/push/unsubscribe", requireAuth, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const endpoint = String(req.body?.endpoint ?? "");
  if (!endpoint) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Missing push endpoint.",
      details: { warnings: ["Missing push endpoint"] },
    });
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const { data: subscription, error: lookupError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", req.user!.id)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (lookupError || !subscription) {
    throw new AppError({
      status: 404,
      code: "not_found",
      message: "Push subscription not found.",
    });
  }

  const owned = await assertUserOwnsResource(req.user!.id, "push_subscription", subscription.id);
  if (owned.ok === false) {
    if (owned.warning === "resource not found for authenticated user") {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Push subscription not found.",
      });
    }
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Ownership check failed.",
      details: { warning: owned.warning },
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
  return res.json(apiOkFlat(req, out as unknown as Record<string, unknown>));
}));

notificationRoutes.post("/notifications/scan-hr", requireAuth, requireStaff, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const start = Date.now();
  const date = typeof req.body?.date === "string" ? req.body.date : undefined;
  const feed = await getTodayHomeRuns(date);
  const out = await processHomeRunEvents(feed.events);
  structuredLog({
    level: "info",
    event: "endpoint",
    requestId: req.requestId,
    method: "POST",
    route: "/api/notifications/scan-hr",
    durationMs: Date.now() - start,
    scanned: out.scanned,
    created: out.created,
  });
  return res.json(apiOkFlat(req, out as unknown as Record<string, unknown>));
}));
