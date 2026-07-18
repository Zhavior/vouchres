import { beforeEach, describe, expect, it, vi } from "vitest";

const setTag = vi.fn();
const setExtras = vi.fn();
const setUser = vi.fn();
const captureExceptionRaw = vi.fn();

vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  httpIntegration: vi.fn(() => ({})),
  expressIntegration: vi.fn(() => ({})),
  requestHandler: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  expressErrorHandler: vi.fn(() => (_err: unknown, _req: unknown, _res: unknown, next: () => void) => next()),
  withScope: (fn: (scope: {
    setTag: typeof setTag;
    setExtras: typeof setExtras;
    setUser: typeof setUser;
  }) => void) =>
    fn({ setTag, setExtras, setUser }),
  captureException: (...args: unknown[]) => captureExceptionRaw(...args),
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}));

describe("captureException context mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
  });

  it("promotes requestId/path/method/code into Sentry tags and extras", async () => {
    const sentry = await import("../server/lib/sentry");
    sentry.initServerSentry();

    sentry.captureException(new Error("boom"), {
      requestId: "req_abc",
      method: "GET",
      path: "/api/mlb/hr-board/today",
      code: "internal_server_error",
      userId: "user_1",
    });

    expect(setTag).toHaveBeenCalledWith("request_id", "req_abc");
    expect(setTag).toHaveBeenCalledWith("http_method", "GET");
    expect(setTag).toHaveBeenCalledWith("http_path", "/api/mlb/hr-board/today");
    expect(setTag).toHaveBeenCalledWith("error_code", "internal_server_error");
    expect(setUser).toHaveBeenCalledWith({ id: "user_1" });
    expect(setExtras).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "req_abc",
        path: "/api/mlb/hr-board/today",
        code: "internal_server_error",
      }),
    );
    expect(captureExceptionRaw).toHaveBeenCalledTimes(1);
  });
});
