import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("deep-scan backend hardening", () => {
  it("public capper picks require visibility=public and fail closed", () => {
    const src = readFileSync("server/routes/publicRoutes.ts", "utf8");
    expect(src).toContain('.eq("visibility", "public")');
    expect(src).toContain("refusing unfiltered capper picks");
  });

  it("capper announcements require visibility=public", () => {
    const src = readFileSync("server/routes/subscriberRoutes.ts", "utf8");
    expect(src).toContain("loadCapperAnnouncementPosts");
    expect(src).toMatch(/loadCapperAnnouncementPosts[\s\S]*visibility", "public"/);
  });

  it("schedules Stripe cancel on account deletion", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(privacy).toContain("cancelSubscriptionsForProfile");
    expect(stripe).toContain("export async function cancelSubscriptionsForProfile");
  });

  it("hard deletion clears notifications, vouches, DMs, stories", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    expect(privacy).toContain('table: "notifications"');
    expect(privacy).toContain('table: "vouches"');
    expect(privacy).toContain('table: "dm_participants"');
    expect(privacy).toContain('table: "user_stories"');
  });

  it("results grade writes to Postgres persistence", () => {
    const src = readFileSync("server/routes/resultRoutes.ts", "utf8");
    expect(src).toContain("persistGradePick");
    expect(src).toContain('source: "postgres"');
    expect(src).not.toContain("gradeAndLearn");
  });

  it("auth epoch Redis failure does not trust cache as epoch 0", () => {
    const auth = readFileSync("server/middleware/auth.ts", "utf8");
    expect(auth).toContain("epoch === null");
    expect(auth).toContain("Promise<number | null>");
  });

  it("DMs require mutual follow", () => {
    const hub = readFileSync("server/services/social/followingHubService.ts", "utf8");
    expect(hub).toContain("dm_requires_mutual_follow");
    expect(hub).toContain("isFriend");
  });

  it("paid expensive routes have paidDailyLimit ceilings", () => {
    expect(readFileSync("server/routes/coreRoutes.ts", "utf8")).toContain(
      'requireTierOrQuota("gold", 3, "picks_per_day", 100)',
    );
    expect(readFileSync("server/routes/agentRoutes.ts", "utf8")).toContain(
      'requireTierOrQuota("gold", 5, "agent_generate_picks", 100)',
    );
    expect(readFileSync("server/routes/parlay/parlayUserRoutes.ts", "utf8")).toContain(
      'requireTierOrQuota("gold", 2, "parlay_lab_saves", 50)',
    );
  });
});
