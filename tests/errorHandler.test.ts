import { describe, expect, it, vi, afterEach } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { AppError } from "../server/errors/AppError";

const captureException = vi.fn();

vi.mock("../server/lib/sentry", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

function runErrorHandler(error: unknown) {
  const req: any = {
    method: "GET",
    originalUrl: "/api/test",
    requestId: "req_test_1",
  };
  const res: any = {
    headersSent: false,
    statusCode: 200,
    body: null,
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
    });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures 5xx errors in Sentry and hides internal details", () => {
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
    });
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
