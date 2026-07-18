import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/routes/privacyRoutes", () => ({
  processScheduledDeletions: vi.fn(),
}));

describe("dailyDeleteJob", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("exits non-zero when any user deletion fails", async () => {
    const { processScheduledDeletions } = await import("../server/routes/privacyRoutes");
    vi.mocked(processScheduledDeletions).mockResolvedValueOnce({
      processed: 1,
      errors: ["user abc: related-row delete failed"],
    });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const { runDailyDeleteJob } = await import("../server/cron/dailyDeleteJob");
    await runDailyDeleteJob();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("does not exit when the batch is clean", async () => {
    const { processScheduledDeletions } = await import("../server/routes/privacyRoutes");
    vi.mocked(processScheduledDeletions).mockResolvedValueOnce({
      processed: 2,
      errors: [],
    });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const { runDailyDeleteJob } = await import("../server/cron/dailyDeleteJob");
    await runDailyDeleteJob();

    expect(exitSpy).not.toHaveBeenCalled();
  });
});
