import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PARLAY_OS_SECTIONS,
  isParlayOsSection,
  parlayOsPanelForSection,
} from "../src/lib/parlays/parlayOsSections";
import { PRODUCT_WORKSPACES } from "../src/app/productNavigation";

const routerSource = readFileSync(
  resolve(__dirname, "../src/components/routing/MainViewRouter.tsx"),
  "utf8",
);

describe("Parlay OS section consolidation", () => {
  it("routes build, live_parlays and results to the one workspace", () => {
    expect([...PARLAY_OS_SECTIONS].sort()).toEqual(["build", "live_parlays", "results"]);
    for (const section of PARLAY_OS_SECTIONS) {
      expect(isParlayOsSection(section)).toBe(true);
    }
    expect(isParlayOsSection("today")).toBe(false);
  });

  it("opens My List on the replacement workspace and Results on its ledger", () => {
    expect(parlayOsPanelForSection("build")).toBe("build");
    expect(parlayOsPanelForSection("live_parlays")).toBe("build");
    expect(parlayOsPanelForSection("results")).toBe("vai_ledger");
  });

  it("falls back to the builder for an unknown section", () => {
    expect(parlayOsPanelForSection("nonsense")).toBe("build");
  });

  it("no longer mounts a standalone Results route beside the workspace", () => {
    // ResultsStudio must reach the screen only through the workspace's Track
    // Record tab; a second mount is what made the two copies diverge.
    expect(routerSource).not.toContain("function ResultsShell");
    expect(routerSource).not.toMatch(/<ResultsStudio\b/);
  });

  it("hands every Parlay OS route its panel from the shared mapping", () => {
    // Guards against a future edit hardcoding a panel and desyncing the doors.
    const hardcoded = routerSource.match(/<ParlayShell[^>]*panel="[^"]*"/g);
    expect(hardcoded).toBeNull();
    const mapped = routerSource.match(/panel=\{parlayOsPanelForSection\('[a-z_]+'\)\}/g) ?? [];
    expect(mapped).toHaveLength(PARLAY_OS_SECTIONS.length);
  });

  it("keeps all three sections inside the Track Record workspace", () => {
    const trackRecord = PRODUCT_WORKSPACES.find((w) => w.id === "track_record");
    expect(trackRecord).toBeDefined();
    for (const section of PARLAY_OS_SECTIONS) {
      expect(trackRecord!.sections).toContain(section);
    }
    // The workspace's own front door is one of the consolidated sections.
    expect(isParlayOsSection(trackRecord!.defaultSection)).toBe(true);
  });

  it("passes the profile into the Track Record tab", () => {
    // Without it ResultsStudio attributes every slip to "You".
    expect(routerSource).toMatch(/profile=\{profile\}/);
  });
});
