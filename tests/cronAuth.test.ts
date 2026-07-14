import { describe, expect, it, vi, afterEach } from "vitest";
import type { Request } from "express";
import { assertCronAuthorized, isAuthorizedCronRequest } from "../server/lib/cronAuth";

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    query: {},
    ...overrides,
  } as Request;
}

describe("cron auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows cron requests in development when CRON_SECRET is unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");

    expect(isAuthorizedCronRequest(mockRequest())).toBe(true);
    expect(() => assertCronAuthorized(mockRequest())).not.toThrow();
  });

  it("denies cron requests in production when CRON_SECRET is unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");

    expect(isAuthorizedCronRequest(mockRequest())).toBe(false);
    expect(() => assertCronAuthorized(mockRequest())).toThrow(/Cron authentication is not configured/i);
  });

  it("requires bearer token when CRON_SECRET is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "secret-token");

    expect(isAuthorizedCronRequest(mockRequest())).toBe(false);
    expect(
      isAuthorizedCronRequest(
        mockRequest({ headers: { authorization: "Bearer secret-token" } }),
      ),
    ).toBe(true);
  });

  it("rejects query-string cron tokens to prevent log/Referer leaks", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "secret-token");

    expect(
      isAuthorizedCronRequest(mockRequest({ query: { token: "secret-token" } })),
    ).toBe(false);
  });

  it("rejects wrong-length bearer tokens without authorizing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "secret-token");

    expect(
      isAuthorizedCronRequest(
        mockRequest({ headers: { authorization: "Bearer short" } }),
      ),
    ).toBe(false);
    expect(
      isAuthorizedCronRequest(
        mockRequest({ headers: { authorization: "Bearer secret-tokenX" } }),
      ),
    ).toBe(false);
  });
});
