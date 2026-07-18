import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("backend ceiling hardening invariants", () => {
  it("public and subscriber pick routes use PUBLIC_PICK_COLUMNS", () => {
    const publicRoutes = readFileSync("server/routes/publicRoutes.ts", "utf8");
    const subscriber = readFileSync("server/routes/subscriberRoutes.ts", "utf8");
    expect(publicRoutes).toContain("PUBLIC_PICK_COLUMNS");
    expect(publicRoutes).toContain("toPublicPickDtos");
    expect(subscriber).toContain("PUBLIC_PICK_COLUMNS");
    expect(subscriber).toContain("toPublicPickDto");
  });

  it("deletion job uses a distributed lock", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    expect(privacy).toContain('runWithDistributedLock');
    expect(privacy).toContain("cron:account-deletion");
  });

  it("atomic parlay settlement refuses legacy fallback in production", () => {
    const grading = readFileSync("server/services/grading/gradingService.ts", "utf8");
    expect(grading).toContain("ALLOW_LEGACY_PARLAY_SETTLEMENT");
    expect(grading).toContain("isProductionRuntime");
    expect(grading).toContain("!isProductionRuntime()");
    expect(grading).toContain("fatal: true");
    expect(grading).toContain("atomic_settlement_required");
    // Escape hatch must not bypass production fail-closed.
    expect(grading).not.toMatch(
      /ALLOW_LEGACY_PARLAY_SETTLEMENT === "true"\s*\|\|\s*\([\s\S]*NODE_ENV !== "production"/,
    );
  });

  it("share HR card is rate-limited", () => {
    const share = readFileSync("server/routes/shareRoutes.ts", "utf8");
    expect(share).toMatch(/share\/hr-card[\s\S]*mlbReadLimiter|mlbReadLimiter[\s\S]*share\/hr-card/);
  });

  it("privacy cancel/status allow pending deletion auth", () => {
    const privacy = readFileSync("server/routes/privacyRoutes.ts", "utf8");
    expect(privacy).toContain("requireAuthAllowPendingDeletion");
    expect(privacy).toMatch(/cancel-deletion[\s\S]*requireAuthAllowPendingDeletion|requireAuthAllowPendingDeletion[\s\S]*cancel-deletion/);
  });

  it("quota increments fail closed", () => {
    const entitlements = readFileSync("server/middleware/entitlements.ts", "utf8");
    expect(entitlements).toContain("Quota tracking is temporarily unavailable.");
    expect(entitlements).not.toMatch(/quota seed failed[\s\S]{0,80}return;/);
  });

  it("stripe sync invalidates auth session cache", () => {
    const stripe = readFileSync("server/services/billing/stripeService.ts", "utf8");
    expect(stripe).toContain("bumpAuthUserEpoch");
    expect(stripe).toContain("reclaimed stale processing webhook");
  });
});
