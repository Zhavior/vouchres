import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { notificationRoutes } from "../server/routes/notificationRoutes";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user-notif-test", profile: { is_staff: true } };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/services/notifications/notificationService", () => ({
  listNotifications: vi.fn(async () => ({
    notifications: [{ id: "n1", title: "Test", read: false }],
    unreadCount: 1,
    warnings: [],
  })),
  markNotificationRead: vi.fn(async () => ({ ok: true })),
  markAllNotificationsRead: vi.fn(async () => ({ ok: true, updated: 2 })),
  savePushSubscription: vi.fn(async () => ({ ok: true })),
  deletePushSubscription: vi.fn(async () => ({ ok: true })),
  processHomeRunEvents: vi.fn(async () => ({ scanned: 3, created: 1 })),
}));

vi.mock("../server/services/mlb/hrFeedService", () => ({
  getTodayHomeRuns: vi.fn(async () => ({ events: [] })),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api", notificationRoutes);
  app.use("/api", apiErrorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Test server did not bind.");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("notification routes", () => {
  it("exposes VAPID public key without auth", async () => {
    const previous = process.env.VAPID_PUBLIC_KEY;
    process.env.VAPID_PUBLIC_KEY = "test-vapid-public-key";
    try {
      const response = await fetch(`${baseUrl}/api/notifications/push/vapid-public-key`);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        ok: true,
        publicKey: "test-vapid-public-key",
        configured: true,
      });
    } finally {
      if (previous === undefined) delete process.env.VAPID_PUBLIC_KEY;
      else process.env.VAPID_PUBLIC_KEY = previous;
    }
  });

  it("returns ok envelope for notification list", async () => {
    const response = await fetch(`${baseUrl}/api/notifications`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      notifications: [{ id: "n1", title: "Test", read: false }],
      unreadCount: 1,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns ok envelope for unread count", async () => {
    const response = await fetch(`${baseUrl}/api/notifications/unread-count`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      unreadCount: 1,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns ok envelope for scan-hr staff route", async () => {
    const response = await fetch(`${baseUrl}/api/notifications/scan-hr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      scanned: 3,
      created: 1,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });
});
