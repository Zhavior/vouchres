import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { parlayRoutes } from "../server/routes/parlayRoutes";
import { AppError } from "../server/errors/AppError";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = {
      id: "user-test-1",
      profile: { is_staff: (globalThis as any).__parlayTestIsStaff !== false },
    };
    next();
  },
  optionalAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = {
      id: "user-test-1",
      profile: { is_staff: (globalThis as any).__parlayTestIsStaff !== false },
    };
    next();
  },
  requireStaff: (req: any, _res: unknown, next: (err?: unknown) => void) => {
    if (!req.user?.profile?.is_staff) {
      return next(new AppError({
        status: 403,
        code: "forbidden",
        message: "Staff access is required.",
      }));
    }
    next();
  },
  getSupabaseAdmin: vi.fn(async () => ({
    from: () => ({
      insert: async () => ({ error: null }),
    }),
  })),
}));

vi.mock("../server/services/grading/sportGraders", () => ({
  getGrader: vi.fn(() => ({
    fetchGame: vi.fn(async () => ({
      final: true,
      homeScore: 5,
      awayScore: 3,
    })),
    evaluateLeg: vi.fn(() => ({ status: "won", actual: 1 })),
  })),
  settleParlay: vi.fn(() => ({ status: "won", payout: 2.5 })),
}));

vi.mock("../server/services/grading/gradingService", () => ({
  gradePendingPicks: vi.fn(async () => ({
    graded: [],
    skipped: [],
    summary: { warnings: [] },
  })),
}));

import { gradePendingPicks } from "../server/services/grading/gradingService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("CRON_SECRET", "");

  const app = express();
  app.use(express.json());
  app.use("/api", parlayRoutes);
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
  vi.unstubAllEnvs();
});

describe("parlay routes", () => {
  it("returns gone envelope for legacy POST /parlays", async () => {
    const response = await fetch(`${baseUrl}/api/parlays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "gone",
        message: expect.stringContaining("/api/parlays/save"),
      },
    });
  });

  it("returns ok envelope for stateless POST /parlays/grade", async () => {
    const response = await fetch(`${baseUrl}/api/parlays/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legs: [
          {
            sport: "MLB",
            gamePk: "777001",
            market: "ANYTIME_HR",
            selection: "Player HR",
            oddsDecimal: 2.1,
          },
        ],
        stakeUnits: 1,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.legs).toHaveLength(1);
    expect(body.parlay).toBeTruthy();
    expect(body.gradedAt).toEqual(expect.any(String));
  });

  it("rejects unauthorized cron grading when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");

    const response = await fetch(`${baseUrl}/api/cron/parlays/grade-due`);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "invalid_token",
        message: "Unauthorized cron request.",
      },
    });
  });

  it("allows cron grading with bearer secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.mocked(gradePendingPicks).mockResolvedValueOnce({
      graded: [],
      skipped: [],
      summary: { warnings: [] },
    } as any);

    const response = await fetch(`${baseUrl}/api/cron/parlays/grade-due`, {
      headers: { Authorization: "Bearer cron-secret" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: "cron_grade_due",
      gradedParlays: 0,
    });
  });

  it("returns graded envelope when gradePendingPicks settles picks", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.mocked(gradePendingPicks).mockResolvedValueOnce({
      graded: [
        { pick_id: "pick-1", status: "won" },
        { pick_id: "pick-2", status: "lost" },
        { pick_id: "pick-3", status: "graded_error", error: "feed_missing" },
      ],
      skipped: [{ pick_id: "pick-4", reason: "not_final" }],
      summary: { warnings: ["one game still live"] },
    } as any);

    const response = await fetch(`${baseUrl}/api/cron/parlays/grade-due`, {
      headers: { Authorization: "Bearer cron-secret" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: "cron_grade_due",
      gradedParlays: 2,
      gradedLegs: 3,
    });
    expect(gradePendingPicks).toHaveBeenCalled();
  });

  it("rejects non-staff POST /parlays/grade-due", async () => {
    (globalThis as any).__parlayTestIsStaff = false;
    vi.mocked(gradePendingPicks).mockClear();
    try {
      const response = await fetch(`${baseUrl}/api/parlays/grade-due`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 2 }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toMatchObject({
        ok: false,
        error: { code: "forbidden" },
      });
      expect(vi.mocked(gradePendingPicks).mock.calls).toEqual([]);
    } finally {
      (globalThis as any).__parlayTestIsStaff = true;
    }
  });

  it("returns graded envelope for authenticated POST /parlays/grade-due", async () => {
    vi.mocked(gradePendingPicks).mockResolvedValueOnce({
      graded: [
        { pick_id: "pick-a", status: "won" },
        { pick_id: "pick-b", status: "graded_error", error: "bad_feed" },
      ],
      skipped: [
        { pick_id: "pick-c", error: "game isComplete=false" },
        { pick_id: "pick-d", error: "unexpected grader failure" },
      ],
      summary: { warnings: ["partial settle"] },
    } as any);

    const response = await fetch(`${baseUrl}/api/parlays/grade-due`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 3 }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: "grade_due",
      gradedParlays: 1,
      gradedLegs: 2,
      pendingLegs: 1,
      warnings: ["partial settle"],
      errors: [{ pick_id: "pick-d", error: "unexpected grader failure" }],
    });
    expect(gradePendingPicks).toHaveBeenCalledWith({ days: 3 });
  });

  it("survives grading_logs insert failures without blocking the grade response", async () => {
    const { getSupabaseAdmin } = await import("../server/middleware/auth");
    vi.mocked(getSupabaseAdmin).mockResolvedValueOnce({
      from: () => ({
        insert: async () => {
          throw Object.assign(new Error("grading_logs unavailable"), { code: "ECONNRESET" });
        },
      }),
    } as any);
    vi.mocked(gradePendingPicks).mockResolvedValueOnce({
      graded: [{ pick_id: "pick-1", status: "won" }],
      skipped: [],
      summary: { warnings: [] },
    } as any);

    const response = await fetch(`${baseUrl}/api/parlays/grade-due`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 2 }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: "grade_due",
      gradedParlays: 1,
      gradedLegs: 1,
    });
  });
});
