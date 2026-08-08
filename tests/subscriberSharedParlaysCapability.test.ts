import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("subscriber shared parlay capability gate", () => {
  it("uses shared_parlays capability for profile picks and channel projection", () => {
    const routes = readFileSync("server/routes/subscriberRoutes.ts", "utf8");
    const projection = readFileSync("server/services/social/socialProjectionService.ts", "utf8");

    expect(routes).toContain('assertProfileCapability(userId, profileId, "shared_parlays")');
    expect(projection).toContain("canFollowerAccessBusinessCapability");
    expect(projection).toContain('capability: "shared_parlays"');
    expect(projection).toContain("shared_parlays_access");
  });

  it.todo("routes capper picks through shared_parlays after cappers have an owner profile mapping");
});
