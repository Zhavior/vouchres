import { afterEach, describe, expect, it, vi } from "vitest";
import { resetOpsAlertThrottleForTests, sendOpsAlert } from "../server/lib/opsAlert";

describe("opsAlert", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetOpsAlertThrottleForTests();
    vi.restoreAllMocks();
  });

  it("no-ops when ALERT_WEBHOOK_URL is unset", async () => {
    vi.stubEnv("ALERT_WEBHOOK_URL", "");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await sendOpsAlert({ severity: "critical", title: "test" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts Slack-compatible JSON when webhook is configured", async () => {
    vi.stubEnv("ALERT_WEBHOOK_URL", "https://hooks.example.test/alert");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));

    await sendOpsAlert({
      severity: "critical",
      title: "API 500",
      detail: "boom",
      requestId: "req_1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://hooks.example.test/alert");
    const body = JSON.parse(String(init?.body));
    expect(body.text).toContain("API 500");
    expect(body.text).toContain("req_1");
  });

  it("throttles duplicate alerts within the window", async () => {
    vi.stubEnv("ALERT_WEBHOOK_URL", "https://hooks.example.test/alert");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));

    await sendOpsAlert({ severity: "warning", title: "dup", detail: "same" });
    await sendOpsAlert({ severity: "warning", title: "dup", detail: "same" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
