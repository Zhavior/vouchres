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
});
