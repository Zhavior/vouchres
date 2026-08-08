/**
 * /api/feed is unauthenticated. Two things reached Postgres unchecked:
 *
 *   1. `offset` went through bare Number(), so `?offset=abc` sent NaN into
 *      .range() and `?offset=999999999` sent a nine-digit OFFSET that the
 *      planner has to walk before returning nothing.
 *   2. count:"exact" forced a COUNT(*) across a 4-way embedded select on every
 *      single request.
 *
 * These tests assert on what is actually handed to PostgREST — the range
 * arguments and the count mode — not on the source text.
 */
import express from "express";
import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type Capture = { table: string; count?: string; range?: [number, number] };

const captured: Capture[] = [];

function makeBuilder(table: string) {
  const state: Capture = { table };
  const builder: Record<string, unknown> = {
    select: (_columns?: string, options?: { count?: string }) => {
      state.count = options?.count;
      return builder;
    },
    order: () => builder,
    eq: () => builder,
    or: () => builder,
    range: (from: number, to: number) => {
      state.range = [from, to];
      return builder;
    },
    single: async () => {
      captured.push(state);
      return {
        data: { id: "post-1", author_id: "author-1", is_demo: true },
        error: null,
      };
    },
    maybeSingle: async () => {
      captured.push(state);
      return { data: null, error: null };
    },
    // Awaiting the builder is what actually runs the query.
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
      captured.push(state);
      return Promise.resolve({ data: [], error: null, count: 0 }).then(resolve, reject);
    },
  };
  return builder;
}

vi.mock("../server/middleware/auth", () => ({
  supabaseAdmin: { from: (table: string) => makeBuilder(table) },
  optionalAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireLegalConfirmed: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const { postRoutes } = await import("../server/routes/postRoutes");
  const { apiErrorHandler } = await import("../server/middleware/errorHandler");
  const { requestContext } = await import("../server/middleware/requestContext");

  const app = express();
  app.use(requestContext);
  app.use("/api", postRoutes);
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
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

afterEach(() => {
  captured.length = 0;
});

function postsQuery(): Capture | undefined {
  return captured.find((c) => c.table === "posts" && c.range !== undefined);
}

describe("/api/feed pagination bounds", () => {
  it("rejects a non-numeric offset instead of sending NaN to .range()", async () => {
    const response = await fetch(`${baseUrl}/api/feed?offset=abc`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("validation_error");
    // The decisive part: nothing was queried at all.
    expect(postsQuery()).toBeUndefined();
  });

  it("rejects an offset past the deep-paging ceiling", async () => {
    const response = await fetch(`${baseUrl}/api/feed?offset=999999999`);

    expect(response.status).toBe(400);
    expect(postsQuery()).toBeUndefined();
  });

  it("rejects a negative offset", async () => {
    const response = await fetch(`${baseUrl}/api/feed?offset=-1`);

    expect(response.status).toBe(400);
    expect(postsQuery()).toBeUndefined();
  });

  it("rejects a non-numeric limit instead of sending NaN to .range()", async () => {
    const response = await fetch(`${baseUrl}/api/feed?limit=abc`);

    expect(response.status).toBe(400);
    expect(postsQuery()).toBeUndefined();
  });

  it("caps limit at the page ceiling", async () => {
    const response = await fetch(`${baseUrl}/api/feed?limit=5000`);

    expect(response.status).toBe(400);
    expect(postsQuery()).toBeUndefined();
  });

  it("passes a valid page straight through", async () => {
    const response = await fetch(`${baseUrl}/api/feed?offset=100&limit=25`);

    expect(response.status).toBe(200);
    expect(postsQuery()?.range).toEqual([100, 124]);
  });

  it("does not force COUNT(*) on the embedded select", async () => {
    await fetch(`${baseUrl}/api/feed`);

    expect(postsQuery()?.count).toBe("planned");
    expect(postsQuery()?.count).not.toBe("exact");
  });
});

describe("/api/posts/:id/comments pagination bounds", () => {
  it("rejects a non-numeric offset", async () => {
    const response = await fetch(`${baseUrl}/api/posts/post-1/comments?offset=abc`);

    expect(response.status).toBe(400);
    expect(captured.find((c) => c.table === "post_comments")).toBeUndefined();
  });

  it("rejects an offset past the deep-paging ceiling", async () => {
    const response = await fetch(`${baseUrl}/api/posts/post-1/comments?offset=999999999`);

    expect(response.status).toBe(400);
    expect(captured.find((c) => c.table === "post_comments")).toBeUndefined();
  });

  it("passes a valid page straight through", async () => {
    const response = await fetch(`${baseUrl}/api/posts/post-1/comments?offset=10&limit=20`);

    expect(response.status).toBe(200);
    expect(captured.find((c) => c.table === "post_comments")?.range).toEqual([10, 29]);
  });
});
