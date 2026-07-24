import { afterEach, describe, expect, it, vi } from "vitest";

describe("redisIncr TTL heal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("sets EXPIRE when a counter exists without TTL", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "[]")) as unknown[];
      const cmd = String(body[0] ?? "");
      if (cmd === "INCR") {
        return new Response(JSON.stringify({ result: 3 }), { status: 200 });
      }
      if (cmd === "TTL") {
        return new Response(JSON.stringify({ result: -1 }), { status: 200 });
      }
      if (cmd === "EXPIRE") {
        return new Response(JSON.stringify({ result: 1 }), { status: 200 });
      }
      return new Response(JSON.stringify({ result: null }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { redisIncr } = await import("../server/lib/upstashRedis");
    await expect(redisIncr("rl:ip:1.2.3.4", 60)).resolves.toBe(3);

    const commands = fetchMock.mock.calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)));
    expect(commands).toContainEqual(["INCR", "rl:ip:1.2.3.4"]);
    expect(commands).toContainEqual(["TTL", "rl:ip:1.2.3.4"]);
    expect(commands).toContainEqual(["EXPIRE", "rl:ip:1.2.3.4", 60]);
  });
});
