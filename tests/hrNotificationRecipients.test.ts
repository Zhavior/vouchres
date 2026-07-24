import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("HR notification recipient scoping", () => {
  it("never selects all profiles as default recipients", () => {
    const src = readFileSync("server/services/notifications/notificationService.ts", "utf8");
    expect(src).toContain("refusing unscoped profile fan-out");
    expect(src).toContain('eq("hr_alerts_enabled", true)');
    expect(src).toContain('eq("in_app_enabled", true)');
    expect(src).not.toMatch(/from\("profiles"\)[\s\S]{0,80}\.select\("id"\)[\s\S]{0,40}\.limit\(1000\)/);
  });

  it("intersects explicit userIds with opted-in prefs and fails closed on pref errors", () => {
    const src = readFileSync("server/services/notifications/notificationService.ts", "utf8");
    expect(src).toContain("FAIL_CLOSED_PREFS");
    expect(src).toContain("query.in(\"user_id\", scoped)");
    expect(src).toContain("Never overwrite an explicit opt-out");
    expect(src).not.toMatch(/follow_alerts_enabled === false[\s\S]{0,120}follow_alerts_enabled:\s*true/);
  });
});
