import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { applyEdgeResearchToPlayer, assembleAiPlayerData, formatPct, formatRate } from "../src/components/player-research/applyEdgeResearch";
import type { MLBPlayer } from "../src/types";
import type { PlayerEdgeResearchPayload } from "../src/pages/pro/usePlayerEdgeResearch";

describe("batter research identity honesty", () => {
  it("does not merge seed team/seasonStats over backend registry players by name", () => {
    const src = readFileSync("src/components/PlayerResearchHub.tsx", "utf8");
    expect(src).toContain("seedByMlbId");
    expect(src).toContain('seasonStats: { avg: "—", hr: "—", rbi: "—", ops: "—" }');
    expect(src).not.toContain("fallbackByName");
    expect(src).not.toMatch(/\.\.\.\(fallback \|\| \{\}\)/);
  });

  it("loads live MLB evidence from the backend edge-research desk", () => {
    const hub = readFileSync("src/components/PlayerResearchHub.tsx", "utf8");
    const dossier = readFileSync("src/components/player-research/AuroraMaxPlayerDossier.tsx", "utf8");
    expect(hub).toContain("AuroraMaxProductMark");
    expect(hub).toContain("/api/mlb/statcast/batters");
    expect(hub).toContain("BvpIntelligenceDesk");
    expect(hub).toContain("statcastByPlayer");
    expect(hub).not.toContain("enrichPlayerStats");
    expect(dossier).toContain("usePlayerEdgeResearch");
    expect(dossier).toContain("applyEdgeResearchToPlayer");
    expect(dossier).toContain("useReducedMotion");
  });

  it("strips invented season lines from MLB stubs until enrich", () => {
    const src = readFileSync("src/utils/mlbApi.ts", "utf8");
    expect(src).toContain("stripUnverifiedSeasonStats");
    expect(src).toContain("overlayLiveRosterIdentity");
    expect(src).not.toContain("generateRealisticGameLogs");
    expect(src).toContain("seasonStats: { avg: '—', hr: '—', rbi: '—', ops: '—'");
    expect(src).toContain('resolveMlbPersonId');
  });

  it("keeps Cognitive-Safe reduced-motion on the player desk", () => {
    const css = readFileSync("src/styles/player-research-aurora-max.css", "utf8");
    const aurora = readFileSync("src/styles/aurora-max.css", "utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".player-research-hub");
    expect(css).toContain("pr-max-tab-pane");
    expect(css).not.toContain("backdrop-blur-3xl");
    expect(aurora).toContain(".aurora-max-shell");
    expect(aurora).toContain("animation-duration");
    expect(aurora).not.toContain("backdrop-blur-3xl");
  });
});

describe("applyEdgeResearchToPlayer", () => {
  const player = {
    id: "592450",
    name: "Aaron Judge",
    team: "NYY",
    position: "RF",
    number: "99",
    headshot: "",
    injuryStatus: "Active",
    injurySeverity: "NONE",
    injuryNotes: "",
    batterScore: 50,
    seasonStats: { avg: "—", hr: "—", rbi: "—", ops: "—" },
    gameLogs: [],
    propositions: [],
    bats: "R",
    throws: "R",
    height: "—",
    weight: "—",
    birthdate: "—",
    advanced: {
      barrelPercent: 0,
      launchAngle: 0,
      exitVelocity: 0,
      hardHitPercent: 0,
      chasePercent: 0,
      woba: 0,
      xwoba: 0,
      sweetSpotPercent: 0,
    },
    splits: {
      vLHP: { avg: "—", obp: "—", slg: "—", ops: "—" },
      vRHP: { avg: "—", obp: "—", slg: "—", ops: "—" },
      home: { avg: "—", obp: "—", slg: "—", ops: "—" },
      away: { avg: "—", obp: "—", slg: "—", ops: "—" },
      last10: { avg: "—", obp: "—", slg: "—", ops: "—" },
    },
    scoutingReport: {
      powerText: "",
      contactText: "",
      disciplineText: "",
      overallScouting: "",
      hotZones: [],
      riskFactor: "MEDIUM",
    },
  } as MLBPlayer;

  const research = {
    playerId: 592450,
    season: {
      homeRuns: 44,
      atBats: 500,
      plateAppearances: 600,
      avg: 0.312,
      slg: 0.7,
      ops: 1.034,
      hrPerPA: 0.073,
      gamesPlayed: 140,
      onBasePercentage: 0.425,
      stolenBases: 8,
      caughtStealing: 2,
    },
    recentGames: [],
    gameLog: [
      { date: "2026-08-01", opponentAbbr: "BOS", opponentName: "Boston", ab: 4, hits: 2, homeRuns: 1, rbi: 2, doubles: 0, triples: 0, totalBases: 5, strikeOuts: 1 },
    ],
    batterVsPitcher: null,
    vsOpponent: [],
    statcast: {
      playerId: 592450,
      pa: 600,
      xwoba: 0.456,
      barrelPct: 22.1,
      hardHitPct: 61.2,
      avgExitVelo: 96.1,
    },
    sprayProfile: null,
    plateDiscipline: { playerId: 592450, chasePct: 21.4, whiffPct: 18, kPct: 22, bbPct: 16 },
    pitchMix: [],
    rolling14Day: null,
    weather: null,
    warnings: [],
    dataSource: "official_mlb",
    updatedAt: "2026-08-13T00:00:00.000Z",
  } as PlayerEdgeResearchPayload;

  it("maps official season and game logs without inventing RBI season totals", () => {
    const next = applyEdgeResearchToPlayer(player, research);
    expect(next.seasonStats.avg).toBe(".312");
    expect(next.seasonStats.hr).toBe("44");
    expect(next.seasonStats.rbi).toBe("—");
    expect(next.seasonStats.ops).toBe("1.034");
    expect(next.gameLogs).toHaveLength(1);
    expect(next.gameLogs[0]?.hr).toBe(1);
    expect(next.splits.vLHP.ops).toBe("—");
  });

  it("omits missing Statcast from the AI payload", () => {
    const payload = assembleAiPlayerData(player, { ...research, statcast: null, plateDiscipline: null });
    expect(payload.advanced).toEqual({});
    expect(formatPct(null)).toBe("—");
    expect(formatRate(null)).toBe("—");
  });
});

describe("PlayerResearchHub Compare and roster honesty", () => {
  const hub = readFileSync("src/components/PlayerResearchHub.tsx", "utf8");

  it("Compare source uses Statcast map display helpers and never invented zeros", () => {
    expect(hub).toContain("listStatcast");
    expect(hub).toContain("formatPct");
    expect(hub).not.toContain("compareA.advanced.barrelPercent");
    expect(hub).not.toContain("Batter Score");
    expect(hub).not.toContain("ProTruthLensIntro");
    expect(hub).not.toContain("PLAYER_RESEARCH_PRO_TABS");
    expect(hub).not.toContain("PLAYER_RESEARCH_PRO_IDEAS");
    expect(hub).not.toContain("PLAYER_RESEARCH_TRUTH_RULES");
  });

  it("scout list toggles Playing today vs All players and prefers active roster first", () => {
    expect(hub).toContain("Playing today");
    expect(hub).toContain("All players");
    expect(hub).toContain('rosterType === "active"');
    expect(hub).toContain("activeRosterIds.has");
    expect(hub).toContain("Number(activeRosterIds.has(b.id)) - Number(activeRosterIds.has(a.id))");
  });
});
