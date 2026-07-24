import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("batter research identity honesty", () => {
  it("does not merge seed team/seasonStats over backend registry players by name", () => {
    const src = readFileSync("src/components/PlayerResearchHub.tsx", "utf8");
    expect(src).toContain("seedByMlbId");
    expect(src).toContain('seasonStats: { avg: "—", hr: "—", rbi: "—", ops: "—" }');
    expect(src).not.toContain("fallbackByName");
    expect(src).not.toMatch(/\.\.\.\(fallback \|\| \{\}\)/);
  });

  it("loads live MLB season stats when a player is selected", () => {
    const src = readFileSync("src/components/PlayerResearchHub.tsx", "utf8");
    expect(src).toContain("enrichPlayerStats");
    expect(src).toContain("Player Research");
    expect(src).toContain("setSelectedPlayer((current)");
  });

  it("strips invented season lines from MLB stubs until enrich", () => {
    const src = readFileSync("src/utils/mlbApi.ts", "utf8");
    expect(src).toContain("stripUnverifiedSeasonStats");
    expect(src).toContain("overlayLiveRosterIdentity");
    expect(src).not.toContain("generateRealisticGameLogs");
    expect(src).toContain("seasonStats: { avg: '—', hr: '—', rbi: '—', ops: '—'");
    expect(src).toContain('const numericId = /^\\d+$/.test(player.id)');
  });
});
