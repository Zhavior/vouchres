import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");

describe("Brain navigation visibility", () => {
  it("keeps Brain Picks in the full sidebar while Today owns the mobile dock slot", () => {
    const featureConfig = readFileSync(resolve(ROOT, "src/lib/featureConfig.ts"), "utf8");
    const appNav = readFileSync(resolve(ROOT, "src/app/AppNav.tsx"), "utf8");
    expect(featureConfig).toContain('id: "brain_picks", label: "Brain Picks"');
    expect(appNav).toContain("onNavigate('today')");
    expect(appNav).not.toContain("onNavigate('brain_picks')");
  });
});
