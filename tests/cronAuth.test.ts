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

  it("denies cron requests when CRON_SECRET is unset (fail closed)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("ALLOW_INSECURE_CRON", "");

    expect(isAuthorizedCronRequest(mockRequest())).toBe(false);
    expect(() => assertCronAuthorized(mockRequest())).toThrow(/Cron authentication is not configured/i);
  });

  it("allows local insecure cron only with explicit ALLOW_INSECURE_CRON", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("ALLOW_INSECURE_CRON", "true");

    expect(isAuthorizedCronRequest(mockRequest())).toBe(true);
    expect(() => assertCronAuthorized(mockRequest())).not.toThrow();
  });

  it("never allows insecure cron in production even with ALLOW_INSECURE_CRON", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("ALLOW_INSECURE_CRON", "true");

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
