import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");

describe("ProjectVABrAIns execution boundary", () => {
  it("does not preload Brain pages from non-Brain routes", () => {
    const source = readFileSync(resolve(ROOT, "src/lib/routePreload.ts"), "utf8");
    expect(source).toContain("hr_board: ['mlb_stats', 'daily_players']");
    expect(source).not.toMatch(/hr_board:\s*\[[^\]]*brain_/);
  });

  it("keeps runtime Brain API calls inside the two Brain pages", () => {
    const allowedFiles = [
      "src/features/brain/BrainPicksPage.tsx",
      "src/features/brain/BrainPerformancePage.tsx",
    ];
    const sources = allowedFiles.map((file) => readFileSync(resolve(ROOT, file), "utf8"));
    expect(sources.join("\n")).toContain("/api/intelligence/brain/mlb/scan");
    expect(sources.join("\n")).toContain("/api/intelligence/brain/mlb/picks");
    expect(sources.join("\n")).toContain("/api/intelligence/brain/mlb/performance");

    const nonBrainEntrypoints = [
      "src/App.tsx",
      "src/app/AuthenticatedApp.tsx",
      "src/features/hr/pages/HomeRunIntelligencePageZ8.tsx",
      "src/components/routing/MainViewRouter.tsx",
    ];
    for (const file of nonBrainEntrypoints) {
      expect(readFileSync(resolve(ROOT, file), "utf8"), file).not.toContain("/api/intelligence/brain/");
    }
  });
});
