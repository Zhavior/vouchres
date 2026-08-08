/**
 * A client that hangs up mid-request must still be charged its quota slot.
 *
 * requireTierOrQuota reserves a slot before the handler runs and used to refund
 * it whenever the socket closed without a completed write. But the expensive
 * upstream call (Gemini) is already in flight and already billed by the time the
 * client disconnects — nothing cancels it. So `curl -m 1` in a loop bought
 * unbounded upstream spend against a counter that never advanced past 1.
 *
 * These tests drive real HTTP so the abort is a real socket close, not a
 * simulated event, and assert on the persisted counter rather than on source text.
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Stand-in for public.daily_quotas — one counter, mutated the way the real SQL does. */
let counter = 0;
/** Every write the middleware made, so a refund is distinguishable from a seed. */
let writes: string[] = [];

const supabaseAdmin = {
  from(table: string) {
    if (table !== "daily_quotas") throw new Error(`unexpected table ${table}`);
    const builder = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: async () => ({ data: { count: counter }, error: null }),
      upsert: async (row: { count?: number }, opts?: { ignoreDuplicates?: boolean }) => {
        if (opts?.ignoreDuplicates) {
          writes.push("seed");
          return { error: null };
        }
        // The refund path is the only caller that writes an explicit count.
        writes.push(`set:${row.count}`);
        counter = Number(row.count ?? 0);
        return { error: null };
      },
    };
    return builder;
  },
  async rpc(name: string) {
    if (name !== "increment_quota") throw new Error(`unexpected rpc ${name}`);
    counter += 1;
    writes.push("increment");
    return { error: null };
  },
};

vi.mock("../server/middleware/auth", () => ({ supabaseAdmin }));
vi.mock("../server/lib/distributedLock", () => ({
  runWithDistributedLock: async (_key: string, fn: () => Promise<unknown>) => fn(),
}));

type Harness = {
  port: number;
  close: () => Promise<void>;
  /** Resolves once the route handler has begun its (simulated) upstream call. */
  upstreamStarted: () => boolean;
  releaseUpstream: () => void;
};

async function startApp(handler: express.RequestHandler): Promise<Harness> {
  const { requireTierOrQuota } = await import("../server/middleware/entitlements");

  let started = false;
  let release: () => void = () => {};
  const upstream = new Promise<void>((resolve) => {
    release = resolve;
  });

  const app = express();
  app.post(
    "/api/ai/chat",
    (req, _res, next) => {
      (req as unknown as { user: unknown }).user = {
        id: "11111111-1111-1111-1111-111111111111",
        profile: { tier: "creator" },
      };
      next();
    },
    requireTierOrQuota("gold", 5, "ai_chat", 10),
    async (req, res, next) => {
      started = true;
      // Stands in for the Gemini round-trip: money is spent here, and the socket
      // closing does not unspend it.
      await upstream;
      handler(req, res, next);
    },
  );
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = (err as { status?: number })?.status ?? 500;
    res.status(status).json({ error: (err as Error)?.message ?? "error" });
  });

  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));

  return {
    port: (server.address() as AddressInfo).port,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    upstreamStarted: () => started,
    releaseUpstream: release,
  };
}

async function waitUntil(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("timed out waiting for condition");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/** Give any queued refund a generous chance to land before asserting it did not. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
}

describe("AI quota accounting across client aborts", () => {
  beforeEach(() => {
    vi.resetModules();
    counter = 0;
    writes = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the slot consumed when the client aborts after the upstream call starts", async () => {
    const harness = await startApp((_req, res) => res.json({ ok: true }));

    const request = http.request({ port: harness.port, path: "/api/ai/chat", method: "POST" });
    request.on("error", () => {}); // ECONNRESET from our own destroy()
    request.end();

    await waitUntil(harness.upstreamStarted);
    expect(counter).toBe(1); // slot reserved

    request.destroy();
    await settle();

    expect(counter).toBe(1);
    expect(writes).not.toContain("set:0");

    harness.releaseUpstream();
    await harness.close();
  });

  it("burns one slot per abort, so abort-spam has a ceiling", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const harness = await startApp((_req, res) => res.json({ ok: true }));
      const request = http.request({ port: harness.port, path: "/api/ai/chat", method: "POST" });
      request.on("error", () => {});
      request.end();
      await waitUntil(harness.upstreamStarted);
      request.destroy();
      await settle();
      harness.releaseUpstream();
      await harness.close();
    }

    // The bug's signature is a counter pinned at 1 no matter how many aborts.
    expect(counter).toBe(3);
  });

  it("still refunds when the handler genuinely fails", async () => {
    const harness = await startApp((_req, res) => res.status(500).json({ error: "gemini down" }));

    harness.releaseUpstream();
    const status = await new Promise<number>((resolve, reject) => {
      const request = http.request(
        { port: harness.port, path: "/api/ai/chat", method: "POST" },
        (res) => {
          res.resume();
          res.once("end", () => resolve(res.statusCode ?? 0));
        },
      );
      request.on("error", reject);
      request.end();
    });
    await settle();

    expect(status).toBe(500);
    expect(counter).toBe(0);
    expect(writes).toContain("set:0");

    await harness.close();
  });

  it("does not refund a successful response", async () => {
    const harness = await startApp((_req, res) => res.json({ ok: true }));

    harness.releaseUpstream();
    await new Promise<void>((resolve, reject) => {
      const request = http.request(
        { port: harness.port, path: "/api/ai/chat", method: "POST" },
        (res) => {
          res.resume();
          res.once("end", () => resolve());
        },
      );
      request.on("error", reject);
      request.end();
    });
    await settle();

    expect(counter).toBe(1);

    await harness.close();
  });
});
