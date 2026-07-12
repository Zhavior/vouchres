import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");

describe("Brain navigation visibility", () => {
  it("keeps Brain Picks available from the desktop and mobile app navigation", () => {
    const sidebar = readFileSync(resolve(ROOT, "src/social/feed/FeedSidebar.tsx"), "utf8");
    const appNav = readFileSync(resolve(ROOT, "src/app/AppNav.tsx"), "utf8");
    expect(sidebar).toContain("{ id: 'brain_picks', label: 'Brain'");
    expect(appNav).toContain("onNavigate('brain_picks')");
  });
});
