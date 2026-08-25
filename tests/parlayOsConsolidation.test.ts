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
  it("classifies build, live_parlays and results as Parlay OS sections", () => {
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

  it("gives Results its own desk while the workspace keeps build and live_parlays", () => {
    /*
     * This previously asserted the opposite — that ResultsStudio could only be
     * reached through the workspace's Track Record tab, because two mounts had
     * once diverged. Results is now a desk in its own right: it owns the graded
     * slate record, and the saved-slip ledger that used to own the section
     * lives on that desk's "My slips" tab, so there is still exactly one copy.
     */
    expect(routerSource).toContain("function ResultsShell");
    expect(routerSource).toMatch(/<ResultsStudio\b/);

    // Still one mount — the guard that mattered about the old arrangement.
    expect(routerSource.match(/<ResultsStudio\b/g) ?? []).toHaveLength(1);
  });

  it("hands every Parlay OS route its panel from the shared mapping", () => {
    // Guards against a future edit hardcoding a panel and desyncing the doors.
    const hardcoded = routerSource.match(/<ParlayShell[^>]*panel="[^"]*"/g);
    expect(hardcoded).toBeNull();
    const mapped = routerSource.match(/panel=\{parlayOsPanelForSection\('[a-z_]+'\)\}/g) ?? [];
    /*
     * The sections the *workspace* routes, which is no longer every Parlay OS
     * section: `results` still classifies as one (it shares the Track Record
     * workspace and its panel mapping) but now renders on its own desk rather
     * than through ParlayShell.
     */
    const workspaceRouted = [...PARLAY_OS_SECTIONS].filter((s) => s !== "results");
    expect(mapped).toHaveLength(workspaceRouted.length);
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
