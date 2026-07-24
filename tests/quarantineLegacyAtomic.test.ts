import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";

const pickUpdateEqStatus = vi.fn();
const pickUpdateEqId = vi.fn(() => ({ eq: pickUpdateEqStatus }));
const pickUpdate = vi.fn(() => ({ eq: pickUpdateEqId }));

const legRevertIn = vi.fn(async () => ({ error: null }));
const legUpdateSelect = vi.fn();
const legUpdateEqStatus = vi.fn(() => ({ select: legUpdateSelect }));
const legUpdateEqPick = vi.fn(() => ({ eq: legUpdateEqStatus }));
const legUpdate = vi.fn()
  .mockReturnValueOnce({ eq: legUpdateEqPick })
  .mockReturnValueOnce({ in: legRevertIn });

const picksSelectLimit = vi.fn();
const picksSelectEq = vi.fn(() => ({ limit: picksSelectLimit }));
const picksSelect = vi.fn(() => ({ eq: picksSelectEq }));

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({
    from: (table: string) => {
      if (table === "picks") return { select: picksSelect, update: pickUpdate };
      if (table === "pick_legs") return { update: legUpdate };
      throw new Error(`unexpected table ${table}`);
    },
  })),
}));

vi.mock("../server/lib/cronAuth", () => ({
  assertCronAuthorized: vi.fn(),
}));

describe("quarantine-legacy atomic void", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.CRON_SECRET = "test-cron";
  });

  it("voids legs before pick and reverts legs if pick update fails", async () => {
    picksSelectLimit.mockResolvedValueOnce({
      data: [{ id: "pick_1", event_id: "manual-legacy-1", status: "pending", explanation: "" }],
      error: null,
    });
    legUpdateSelect.mockResolvedValueOnce({
      data: [{ id: "leg_1", pick_id: "pick_1", status: "void" }],
      error: null,
    });
    pickUpdateEqStatus.mockResolvedValueOnce({
      error: { message: "pick write failed" },
    });

    const { requestContext } = await import("../server/middleware/requestContext");
    const { parlayCronRoutes } = await import("../server/routes/parlay/parlayCronRoutes");
    const { apiErrorHandler } = await import("../server/middleware/errorHandler");
    const app = express();
    app.use(requestContext);
    app.use(parlayCronRoutes);
    app.use(apiErrorHandler);

    const server = await new Promise<import("http").Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const { port } = server.address() as { port: number };

    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/cron/parlays/quarantine-legacy?dryRun=false&limit=10`,
        {
          method: "POST",
          headers: { Authorization: "Bearer test-cron" },
        },
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.quarantinedCount).toBe(0);
      expect(body.skipped[0]?.reason).toBe("pick_update_failed_reverted_legs");
      expect(legRevertIn).toHaveBeenCalledWith("id", ["leg_1"]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});
