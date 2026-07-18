import { describe, expect, it } from "vitest";
import { redactOddsApiUrl } from "../server/services/mlb/parlayOddsFeedService";

describe("redactOddsApiUrl", () => {
  it("masks apiKey query values", () => {
    const raw =
      "https://api.the-odds-api.com/v4/sports/baseball_mlb/events?apiKey=super-secret&regions=us";
    expect(redactOddsApiUrl(raw)).toContain("apiKey=REDACTED");
    expect(redactOddsApiUrl(raw)).not.toContain("super-secret");
  });
});
