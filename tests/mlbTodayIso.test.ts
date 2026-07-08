import { describe, expect, it } from "vitest";
import { todayISO } from "../server/services/mlb/mlbClient";

describe("MLB today date", () => {
  it("uses the MLB/Eastern baseball date instead of UTC", () => {
    expect(todayISO(new Date("2026-07-08T00:58:52.000Z"))).toBe("2026-07-07");
  });

  it("rolls to the next date after midnight in New York", () => {
    expect(todayISO(new Date("2026-07-08T04:01:00.000Z"))).toBe("2026-07-08");
  });
});
