import { describe, expect, it } from "vitest";
import { hrBoardQueryOptions } from "../src/hooks/queries/hrBoardQuery";

describe("HR board query connection policy", () => {
  it("does not leak the previous date through placeholder data", () => {
    const options = hrBoardQueryOptions("2026-07-27");
    expect(options.queryKey).toEqual(["hrBoard", "2026-07-27"]);
    expect(options.placeholderData).toBeUndefined();
    expect(options.refetchInterval).toBe(false);
    expect(options.refetchOnReconnect).toBe(true);
  });
});
