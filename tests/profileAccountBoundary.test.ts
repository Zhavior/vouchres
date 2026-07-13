import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settingsSource = readFileSync("src/components/SettingsPage.tsx", "utf8");
const themeSource = readFileSync("src/components/ThemeStore.tsx", "utf8");

describe("Profile account boundary", () => {
  it("scopes profile settings to the active account", () => {
    expect(settingsSource).toContain(
      'accountStorageKey("vouchedge_email_alerts")',
    );
    expect(settingsSource).toContain(
      'accountStorageKey("vouchedge_profile_public")',
    );
  });

  it("does not share purchased-theme browser state between accounts", () => {
    expect(themeSource).toContain(
      'accountStorageKey("vouchedge_market_themes")',
    );
  });
});
