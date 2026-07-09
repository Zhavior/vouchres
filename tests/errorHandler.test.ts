import { describe, expect, it, vi, afterEach } from "vitest";
import { ZodError, z } from "zod";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { AppError } from "../server/errors/AppError";

const captureException = vi.fn();
const isSentryEnabled = vi.fn(() => false);

vi.mock("../server/lib/sentry", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
  isSentryEnabled: () => isSentryEnabled(),
}));

function runErrorHandler(error: unknown, overrides: { requestId?: string } = {}) {
  const req: any = {
    method: "GET",
    originalUrl: "/api/test",
    requestId: overrides.requestId ?? "req_test_1",
  };
  const res: any = {
    headersSent: false,
    statusCode: 200,
    body: null,
    setHeader() {
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  const next = vi.fn();

  apiErrorHandler(error, req, res, next);

  return { req, res, next };
}

describe("api error handler", () => {
  afterEach(() => {
    captureException.mockClear();
    isSentryEnabled.mockReset();
    isSentryEnabled.mockReturnValue(false);
    vi.unstubAllEnvs();
  });

  it("returns unified envelope for AppError", () => {
    const { res } = runErrorHandler(
      new AppError({ status: 404, code: "not_found", message: "Missing resource." }),
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Missing resource.",
        requestId: "req_test_1",
      },
      meta: {
        requestId: "req_test_1",
        timestamp: expect.any(String),
      },
    });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures 5xx errors in Sentry and hides internal details", () => {
    isSentryEnabled.mockReturnValue(true);

    const { res } = runErrorHandler(
      new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Database exploded.",
        expose: false,
      }),
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: "internal_server_error",
        message: "Internal server error.",
        requestId: "req_test_1",
      },
      meta: {
        requestId: "req_test_1",
        timestamp: expect.any(String),
      },
    });
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("skips Sentry capture when Sentry is disabled", () => {
    isSentryEnabled.mockReturnValue(false);

    runErrorHandler(
      new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Database exploded.",
        expose: false,
      }),
    );

    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures 5xx errors when Sentry is enabled", () => {
    isSentryEnabled.mockReturnValue(true);

    runErrorHandler(
      new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Database exploded.",
        expose: false,
      }),
    );

    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("normalizes Zod validation failures into requestId-aware envelopes", () => {
    let zodError: ZodError;
    try {
      z.object({ days: z.number().int().min(1) }).parse({ days: "nope" });
      throw new Error("Expected Zod parse to fail");
    } catch (error) {
      zodError = error as ZodError;
    }

    const { res } = runErrorHandler(zodError!, { requestId: "req_zod_9" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        requestId: "req_zod_9",
      },
      meta: {
        requestId: "req_zod_9",
        timestamp: expect.any(String),
      },
    });
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(captureException).not.toHaveBeenCalled();
  });
});
