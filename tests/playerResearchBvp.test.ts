import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildBvpView } from "../src/components/player-research/bvp/bvpView";
import { bbShare, gameSidesFromToday, historyFromEdge, isoFromSeason, mergeArsenal, playerMatchesBatterTeam } from "../src/components/player-research/bvp/liveBvp";
import { classifyMlbRole, isPitcherPosition, pitcherWarningCopy } from "../src/components/player-research/bvp/positionGuard";
import type { Batter, Pitcher } from "../src/components/player-research/bvp/types";
import type { PlayerEdgeResearchPayload } from "../src/pages/pro/usePlayerEdgeResearch";

const judge: Batter = {
  id: "592450",
  name: "Aaron Judge",
  team: "NYY",
  position: "RF",
  bats: "R",
  xSlg: 0.68,
  hardHitPct: 61.2,
  iso: 0.35,
  exitVelo: 96.1,
};

const strider: Pitcher = {
  id: "675911",
  name: "Spencer Strider",
  team: "ATL",
  position: "SP",
  throws: "R",
  era: 2.85,
  whip: 0.98,
  barrelRateAllowed: null,
  hr9VsLhb: null,
  hr9VsRhb: null,
  hr9: 0.8,
  pitchMix: [],
};

const holmes: Pitcher = {
  ...strider,
  id: "605280",
  name: "Clay Holmes",
  team: "NYM",
  position: "RP",
};

describe("BvP position guard", () => {
  it("classifies P, SP, RP, CP, LHP, RHP as pitchers", () => {
    for (const pos of ["P", "SP", "RP", "CP", "LHP", "RHP", "sp", " rp "]) {
      expect(classifyMlbRole(pos)).toBe("pitcher");
      expect(isPitcherPosition(pos)).toBe(true);
    }
  });

  it("classifies position players as batters and empty as unknown", () => {
    expect(classifyMlbRole("RF")).toBe("batter");
    expect(classifyMlbRole("DH")).toBe("batter");
    expect(classifyMlbRole(null)).toBe("unknown");
    expect(classifyMlbRole("TWP")).toBe("unknown");
  });
});

describe("BvP live mapping", () => {
  it("builds today slate sides from probable pitchers", () => {
    const sides = gameSidesFromToday([
      {
        gamePk: 1,
        awayTeam: { abbreviation: "ATL" },
        homeTeam: { abbreviation: "NYY" },
        probablePitchers: {
          away: { pitcherId: 675911, pitcherName: "Spencer Strider", throws: "R", team: "ATL", teamId: 144 },
          home: null,
        },
      },
    ]);
    expect(sides).toHaveLength(1);
    expect(sides[0]?.batterTeamAbbr).toBe("NYY");
    expect(sides[0]?.pitcherId).toBe("675911");
  });

  it("matches registry team names to slate abbreviations", () => {
    expect(playerMatchesBatterTeam({ team: "Detroit Tigers" }, "DET")).toBe(true);
    expect(playerMatchesBatterTeam({ team: "NYY" }, "NYY")).toBe(true);
    expect(playerMatchesBatterTeam({ team: "New York Mets" }, "DET")).toBe(false);
  });

  it("derives ISO from season SLG-AVG and never invents a 50 rating", () => {
    expect(isoFromSeason(0.312, 0.7)).toBeCloseTo(0.388);
    expect(isoFromSeason(null, 0.7)).toBeNull();
    expect(bbShare(12, 3)).toBeCloseTo(20);
  });

  it("merges pitcher usage with batter wOBA and leaves run value unknown", () => {
    const rows = mergeArsenal(
      [{ pitchType: "FF", pitchName: "4-Seam", pitchUsage: 48, woba: null, xwoba: null, whiffPct: null, hardHitPct: null, pitches: 100 }],
      [{ pitchType: "FF", pitchName: "4-Seam", pitchUsage: 40, woba: 0.412, xwoba: 0.4, whiffPct: 20, hardHitPct: 50, pitches: 28 }],
    );
    expect(rows[0]?.usagePct).toBe(48);
    expect(rows[0]?.batterWoba).toBe(0.412);
    expect(rows[0]?.batterRunValue).toBeNull();
  });

  it("maps vsPlayerTotal without inventing hard-hit", () => {
    const history = historyFromEdge({
      batterVsPitcher: { ab: 12, h: 3, doubles: 0, triples: 0, hr: 1, bb: 1, k: 5, avg: 0.25, slg: 0.5, ops: 0.833, sampleSize: 12 },
    } as PlayerEdgeResearchPayload);
    expect(history.ops).toBe(0.833);
    expect(history.hardHitRate).toBeNull();
  });
});

describe("BvP view model", () => {
  it("is ready for a batter vs pitcher pair", () => {
    const view = buildBvpView({
      batter: judge,
      pitcher: strider,
      batterSlotPlayer: judge,
      pitcherInBatterSlot: null,
      handSplit: "ALL",
      venueSplit: "ALL",
      selectedVenue: "home",
    });
    expect(view.kind).toBe("ready");
  });

  it("warns when a relief pitcher is placed in the batter slot", () => {
    const view = buildBvpView({
      batter: null,
      pitcher: strider,
      batterSlotPlayer: holmes,
      pitcherInBatterSlot: holmes,
      handSplit: "ALL",
      venueSplit: "ALL",
      selectedVenue: null,
    });
    expect(view.kind).toBe("pitcher_in_batter");
    expect(pitcherWarningCopy()).toMatch(/Pitcher selector/);
  });

  it("hides RHP when the LHP split is on", () => {
    const view = buildBvpView({
      batter: judge,
      pitcher: strider,
      batterSlotPlayer: judge,
      pitcherInBatterSlot: null,
      handSplit: "LHP",
      venueSplit: "ALL",
      selectedVenue: "home",
    });
    expect(view.kind).toBe("empty");
  });
});

describe("BvP desk honesty", () => {
  const desk = readFileSync("src/components/player-research/bvp/BvpIntelligenceDesk.tsx", "utf8");
  const hub = readFileSync("src/components/PlayerResearchHub.tsx", "utf8");
  const css = readFileSync("src/styles/player-research-aurora-max.css", "utf8");

  it("mounts on Player Research as a BvP mode and calls live MLB routes", () => {
    expect(hub).toContain('id: "bvp" as Mode');
    expect(hub).toContain("BvpIntelligenceDesk");
    expect(desk).toContain("/api/mlb/games/today");
    expect(desk).toContain("usePlayerEdgeResearch");
    expect(desk).toContain("usePitcherResearch");
    expect(desk).not.toContain("demo_fixture");
    expect(desk).not.toContain("HomeRunIntelligencePageZ8");
  });

  it("keeps batter vs pitcher metric families split and does not invent a 0-100 rating", () => {
    expect(desk).toContain("Batter · hitting");
    expect(desk).toContain("Pitcher · pitching");
    expect(desk).toContain("Career BvP OPS");
    expect(desk).not.toContain("Fixture rating");
    expect(desk).not.toContain("batterScore");
    expect(desk).not.toContain("bg-[#");
  });

  it("does not wear demo-fixture chrome over live feeds", () => {
    expect(hub).toContain("BvP · official MLB Stats API + Savant");
    expect(hub).not.toContain("Demo fixture");
    expect(hub).not.toContain("BvP demo fixtures");
  });

  it("stays Cognitive-Safe on the player desk", () => {
    expect(css).toContain(".pr-bvp-desk");
    expect(css).not.toContain("backdrop-blur-3xl");
    expect(desk).not.toContain("animate-pulse");
    expect(desk).not.toContain("marquee");
  });
});
