import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { helmetMiddleware } from "../server/middleware/cors";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(helmetMiddleware);
  app.get("/csp-probe", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("CSP probe server did not bind.");
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

describe("helmet CSP connect-src", () => {
  it("allows Supabase Realtime WebSocket origins", async () => {
    const response = await fetch(`${baseUrl}/csp-probe`);
    expect(response.status).toBe(200);

    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.supabase\.co/);
    expect(csp).toMatch(/connect-src[^;]*wss:\/\/\*\.supabase\.co/);
  });
});
