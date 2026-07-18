import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisIncr: vi.fn(),
}));

describe("rate limit response headers", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("sets Retry-After and X-RateLimit-* on 429", async () => {
    const { authLimiter } = await import("../server/middleware/rateLimit");

    const headers: Record<string, string> = {};
    const req: any = {
      ip: "9.9.9.9",
      path: "/api/auth/me",
      requestId: "req_rl_1",
      headers: {},
    };
    const res: any = {
      statusCode: 200,
      body: null,
      getHeader(name: string) {
        return headers[name.toLowerCase()];
      },
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = String(value);
        return this;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: unknown) {
        this.body = body;
        return this;
      },
    };

    for (let i = 0; i < 31; i++) {
      let proceeded = false;
      await authLimiter(req, res, () => {
        proceeded = true;
      });
      if (!proceeded) break;
    }

    expect(res.statusCode).toBe(429);
    expect(headers["retry-after"]).toBeTruthy();
    expect(headers["x-ratelimit-limit"]).toBe("30");
    expect(Number(headers["x-ratelimit-remaining"])).toBe(0);
  });
});
