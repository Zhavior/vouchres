import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CreatePickSchema } from "../server/validators/pickSchemas";
import { deriveParentStatusFromLegs } from "../server/services/grading/liveHrParlayWriteService";

describe("deep-scan highs hardening", () => {
  it("rejects client avoid markets/selections at pick create", () => {
    expect(CreatePickSchema.safeParse({ market: "hr_avoid", selection: "Judge HR" }).success).toBe(false);
    expect(CreatePickSchema.safeParse({ market: "hr", selection: "Avoid Judge HR" }).success).toBe(false);
    expect(CreatePickSchema.safeParse({ market: "hr", selection: "Aaron Judge 1+ HR" }).success).toBe(true);
  });

  it("post detail routes require view ACL", () => {
    const src = readFileSync("server/routes/postRoutes.ts", "utf8");
    expect(src).toContain("async function assertCanViewPost");
    expect(src).toMatch(/get\("\/posts\/:id"[\s\S]{0,400}assertCanViewPost/);
    expect(src).toMatch(/get\("\/posts\/:id\/comments"[\s\S]{0,400}assertCanViewPost/);
    expect(src).toMatch(/post\("\/posts\/:id\/like"[\s\S]{0,400}assertCanViewPost/);
  });

  it("stripe customer retrieve only recreates on resource_missing", () => {
    const src = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(src).toContain('code === "resource_missing"');
    expect(src).toContain("statusCode === 404");
    expect(src).toContain("live-sub reconciliation failed");
  });

  it("erasure deletes Auth user before profile", () => {
    const src = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    const authIdx = src.indexOf("auth.admin.deleteUser");
    const profileIdx = src.indexOf('from("profiles").delete()');
    expect(authIdx).toBeGreaterThan(-1);
    expect(profileIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(profileIdx);
  });

  it("invalid parlay game pk fails closed instead of soft-push", () => {
    const src = readFileSync("server/services/grading/gradingService.ts", "utf8");
    expect(src).toContain("parlay_leg_invalid_game_pk");
    expect(src).toContain("client_avoid_market_rejected");
    expect(src).not.toMatch(/Skipped legacy\/manual leg with invalid game id/);
  });

  it("live HR parent settle uses gradePick for pending parents only", () => {
    const src = readFileSync("server/services/grading/liveHrParlayWriteService.ts", "utf8");
    expect(src).toContain("gradePick");
    expect(src).toContain('!== "pending"');
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "won" }])).toBe("won");
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "pending" }])).toBeNull();
  });
});
