import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: vi.fn(async () => ({
          data: null,
          error: { message: "pick_legs unavailable" },
        })),
      }),
    }),
  })),
}));

describe("previewLiveHrParlayMatches fail-closed", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when pending legs query fails", async () => {
    const { previewLiveHrParlayMatches } = await import(
      "../server/services/grading/liveHrParlayService"
    );
    await expect(previewLiveHrParlayMatches("2026-07-18")).rejects.toMatchObject({
      message: "pick_legs unavailable",
    });
  });
});
