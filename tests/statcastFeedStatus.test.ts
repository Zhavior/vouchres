import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchText: vi.fn(),
}));

describe("statcast feed status honesty", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("tags failed Savant fetches as unavailable instead of a silent empty map", async () => {
    const { sportsFetchText } = await import("../server/lib/sports/sportsHttpClient");
    vi.mocked(sportsFetchText).mockRejectedValue(new Error("savant down"));

    const { getStatcastBatterMapResult } = await import(
      "../server/services/mlb/statcastClient"
    );
    const result = await getStatcastBatterMapResult(2026);

    expect(result.feedStatus).toBe("unavailable");
    expect(result.map).toEqual({});
    expect(result.errorMessage).toMatch(/savant down/i);
  });
});
