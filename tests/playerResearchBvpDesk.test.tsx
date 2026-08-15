// @vitest-environment happy-dom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BvpIntelligenceDesk } from "../src/components/player-research/bvp/BvpIntelligenceDesk";
import type { MLBPlayer } from "../src/types";

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body,
  };
}

const judge = {
  id: "592450",
  name: "Aaron Judge",
  team: "NYY",
  position: "RF",
  bats: "R",
  throws: "R",
  number: "99",
  headshot: "",
  injuryStatus: "Active",
  injurySeverity: "NONE",
  injuryNotes: "",
  batterScore: 0,
  seasonStats: { avg: "—", hr: "—", rbi: "—", ops: "—" },
  gameLogs: [],
  propositions: [],
  height: "—",
  weight: "—",
  birthdate: "—",
  advanced: {},
  splits: {
    vLHP: { avg: "—", obp: "—", slg: "—", ops: "—" },
    vRHP: { avg: "—", obp: "—", slg: "—", ops: "—" },
    home: { avg: "—", obp: "—", slg: "—", ops: "—" },
    away: { avg: "—", obp: "—", slg: "—", ops: "—" },
    last10: { avg: "—", obp: "—", slg: "—", ops: "—" },
  },
  scoutingReport: { powerText: "", contactText: "", disciplineText: "", overallScouting: "", hotZones: [], riskFactor: "MEDIUM" },
} as MLBPlayer;

const strider = { ...judge, id: "675911", name: "Spencer Strider", team: "ATL", position: "SP" } as MLBPlayer;
const holmes = { ...judge, id: "605280", name: "Clay Holmes", team: "NYM", position: "RP" } as MLBPlayer;

describe("BvpIntelligenceDesk live feeds", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/mlb/games/today")) {
        return jsonResponse({
          ok: true,
          games: [{
            gamePk: 1,
            awayTeam: { abbreviation: "ATL" },
            homeTeam: { abbreviation: "NYY" },
            probablePitchers: {
              away: { pitcherId: 675911, pitcherName: "Spencer Strider", throws: "R", team: "ATL", teamId: 144 },
              home: null,
            },
          }],
        });
      }
      if (url.includes("pitcher-research")) {
        return jsonResponse({
          ok: true,
          playerId: 675911,
          season: { era: 2.85, whip: 0.98, homeRunsPer9: 0.8, inningsPitched: 80, strikeOuts: 100, baseOnBalls: 20, gamesStarted: 12, gamesPitched: 12 },
          pitchMix: [{ pitchType: "FF", pitchName: "4-Seam", pitchUsage: 48, woba: null, xwoba: null, whiffPct: null, hardHitPct: null, pitches: 100 }],
          warnings: [],
          dataSource: "official_mlb",
          updatedAt: "2026-08-13T00:00:00.000Z",
        });
      }
      if (url.includes("edge-research")) {
        return jsonResponse({
          ok: true,
          playerId: 592450,
          season: { avg: 0.312, slg: 0.7, ops: 1.034, homeRuns: 44, atBats: 500, plateAppearances: 600, hrPerPA: 0.07, gamesPlayed: 140, onBasePercentage: 0.4, stolenBases: 8, caughtStealing: 2 },
          batterVsPitcher: { ab: 12, h: 3, doubles: 0, triples: 0, hr: 1, bb: 1, k: 5, avg: 0.25, slg: 0.5, ops: 0.833, sampleSize: 12 },
          statcast: { playerId: 592450, pa: 600, xwoba: 0.4, xslg: 0.68, barrelPct: 22, hardHitPct: 61.2, avgExitVelo: 96.1 },
          pitchMix: [{ pitchType: "FF", pitchName: "4-Seam", pitchUsage: 40, woba: 0.412, xwoba: 0.4, whiffPct: 20, hardHitPct: 50, pitches: 28 }],
          warnings: [],
          dataSource: "official_mlb",
          updatedAt: "2026-08-13T00:00:00.000Z",
          recentGames: [],
          gameLog: [],
          vsOpponent: [],
          sprayProfile: null,
          plateDiscipline: null,
          rolling14Day: null,
          weather: null,
        });
      }
      return jsonResponse({ ok: true });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders Judge vs Strider from today's slate and live research", async () => {
    render(<BvpIntelligenceDesk players={[judge, strider, holmes]} />);
    await waitFor(() => {
      expect(screen.getAllByText("Aaron Judge").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Spencer Strider").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Official MLB Stats API \+ Savant/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Career BvP OPS/)).toBeTruthy();
    expect(screen.getByText("xSLG")).toBeTruthy();
    expect(screen.getByText("ERA")).toBeTruthy();
    expect(screen.queryByText(/Demo fixture/)).toBeNull();
  });

  it("shows the pitcher-in-batter warning for a searched relief pitcher", async () => {
    render(<BvpIntelligenceDesk players={[judge, strider, holmes]} />);
    await waitFor(() => expect(screen.getByLabelText("Batter roster")).toBeTruthy());
    const batterSelect = screen.getByLabelText("Batter roster") as HTMLSelectElement;
    expect([...batterSelect.options].map((option) => option.value)).not.toContain("605280");

    fireEvent.change(screen.getByPlaceholderText("Search batter"), { target: { value: "Holmes" } });
    fireEvent.change(screen.getByLabelText("Batter roster"), { target: { value: "605280" } });
    expect(screen.getByRole("alert").textContent).toMatch(/Pitcher selected — use the Pitcher selector/);
    expect(screen.queryByText("xSLG")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /move to pitcher slot/i }));
    expect(screen.queryByText(/No matchup for these filters/)).toBeNull();
    expect(screen.getByText("xSLG")).toBeTruthy();
  });
});
