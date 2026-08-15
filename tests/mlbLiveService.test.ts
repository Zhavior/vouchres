import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchLiveMlbSlate, buildChunkAFromRosterEntry } from '../src/features/hr-v2/api/mlbLiveService';
import { mockChunkAData } from '../src/features/hr-v2/api/mockData';
import {
  CONFIRMED_STARTER_MIN,
  SCORE_BASELINE_MAX,
} from '../src/features/hr-v2/constants';

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const makeSchedule = (games: object[]) => ({
  dates: [{ games }],
});

const makeGame = (
  gamePk: number,
  homeId: number,
  homeAbbr: string,
  awayId: number,
  awayAbbr: string,
  homePlayers: { id: number; fullName: string }[] = [],
  awayPlayers: { id: number; fullName: string }[] = []
) => ({
  gamePk,
  gameDate: '2026-08-13T19:05:00Z',
  status: { abstractGameState: 'Preview', detailedState: 'Scheduled' },
  teams: {
    home: {
      team: { id: homeId, name: `Team ${homeAbbr}`, abbreviation: homeAbbr },
      probablePitcher: { id: 99001, fullName: 'Home Pitcher', hand: { code: 'R' } },
    },
    away: {
      team: { id: awayId, name: `Team ${awayAbbr}`, abbreviation: awayAbbr },
      probablePitcher: { id: 99002, fullName: 'Away Pitcher', hand: { code: 'L' } },
    },
  },
  venue: { id: 3313, name: 'Test Stadium' },
  lineups:
    homePlayers.length > 0 || awayPlayers.length > 0
      ? {
          homePlayers: homePlayers.map((p) => ({
            id: p.id,
            fullName: p.fullName,
            primaryPosition: { code: '9', name: 'Outfielder', type: 'Outfielder', abbreviation: 'RF' },
          })),
          awayPlayers: awayPlayers.map((p) => ({
            id: p.id,
            fullName: p.fullName,
            primaryPosition: { code: '4', name: 'Second Base', type: 'Infielder', abbreviation: '2B' },
          })),
        }
      : undefined,
});

const makeRosterEntry = (id: number, fullName: string, type = 'Outfielder', abbr = 'RF') => ({
  person: { id, fullName },
  jerseyNumber: String(id % 100),
  position: { code: '9', name: type, type, abbreviation: abbr },
  status: { code: 'A', description: 'Active' },
  parentTeamId: 100,
});

const makePitcherEntry = (id: number, fullName: string) => ({
  person: { id, fullName },
  jerseyNumber: '45',
  position: { code: '1', name: 'Pitcher', type: 'Pitcher', abbreviation: 'P' },
  status: { code: 'A', description: 'Active' },
  parentTeamId: 100,
});

// ─── Suite 1 (existing) — Full active roster fetching ─────────────────────────

describe('src/features/hr-v2/api/mlbLiveService - Full Active Roster Fetching', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches schedule and parallel team active rosters, excluding only Pitchers (including Two-Way Players)', async () => {
    const mockSchedule = makeSchedule([
      makeGame(
        745001,
        147, 'NYY',
        111, 'BOS',
        [{ id: 592450, fullName: 'Aaron Judge' }, { id: 650402, fullName: 'Gleyber Torres' }],
        [{ id: 660271, fullName: 'Shohei Ohtani' }, { id: 646240, fullName: 'Rafael Devers' }]
      ),
    ]);

    const mockYankeesRoster = {
      roster: [
        makeRosterEntry(592450, 'Aaron Judge', 'Outfielder', 'RF'),
        makeRosterEntry(650402, 'Gleyber Torres', 'Infielder', '2B'),
        makePitcherEntry(543037, 'Gerrit Cole'),
      ],
    };

    const mockRedSoxRoster = {
      roster: [
        makeRosterEntry(660271, 'Shohei Ohtani', 'Two-Way Player', 'TWP'),
        makeRosterEntry(646240, 'Rafael Devers', 'Infielder', '3B'),
        makePitcherEntry(519242, 'Chris Sale'),
      ],
    };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/schedule')) {
        return new Response(JSON.stringify(mockSchedule), { status: 200 });
      }
      if (url.includes('/teams/147/roster')) {
        return new Response(JSON.stringify(mockYankeesRoster), { status: 200 });
      }
      if (url.includes('/teams/111/roster')) {
        return new Response(JSON.stringify(mockRedSoxRoster), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    const slate = await fetchLiveMlbSlate();

    // 2 Yankees (Judge, Torres) + 2 Red Sox (Ohtani [Two-Way Player], Devers) = 4 hitters
    // Pitchers Cole and Sale must be excluded
    expect(slate.length).toBe(4);

    const playerNames = slate.map((p) => p.identity.name);
    expect(playerNames).toContain('Aaron Judge');
    expect(playerNames).toContain('Gleyber Torres');
    expect(playerNames).toContain('Shohei Ohtani');
    expect(playerNames).toContain('Rafael Devers');
    expect(playerNames).not.toContain('Gerrit Cole');
    expect(playerNames).not.toContain('Chris Sale');

    // Confirm ranks are assigned sequentially 1..4
    expect(slate.map((p) => p.rank)).toEqual([1, 2, 3, 4]);

    // Check Ohtani opposing pitcher matchup is the home team's probable (Cole at NYY)
    const ohtani = slate.find((p) => p.identity.name === 'Shohei Ohtani');
    expect(ohtani?.opponentTeamId).toBe('NYY');
    expect(ohtani?.opposingPitcherName).toBe('Home Pitcher');

    // Check Judge opposing pitcher matchup is the away team's probable (Sale at BOS)
    const judge = slate.find((p) => p.identity.name === 'Aaron Judge');
    expect(judge?.opponentTeamId).toBe('BOS');
    expect(judge?.opposingPitcherName).toBe('Away Pitcher');
  });

  it('falls back to mockChunkAData on schedule fetch failure or empty schedule', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('Network timeout');
    });

    const fallbackSlate = await fetchLiveMlbSlate();
    expect(fallbackSlate).toBe(mockChunkAData);
  });

  // ─── NEW TEST 1: One team's roster fetch fails ─────────────────────────────
  it('returns players from the healthy team when one team roster fetch returns HTTP 500', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const schedule = makeSchedule([makeGame(800001, 120, 'WSH', 121, 'NYM')]);
    const wshRoster = {
      roster: [
        makeRosterEntry(601934, 'Juan Soto', 'Outfielder', 'RF'),
        makePitcherEntry(800100, 'WSH Pitcher'),
      ],
    };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/schedule')) return new Response(JSON.stringify(schedule), { status: 200 });
      if (url.includes('/teams/120/roster')) return new Response(JSON.stringify(wshRoster), { status: 200 });
      // NYM roster fails with 500
      if (url.includes('/teams/121/roster')) return new Response('Internal Server Error', { status: 500 });
      return new Response('Not Found', { status: 404 });
    });

    const slate = await fetchLiveMlbSlate();

    // Only WSH hitters rendered — NYM 500 must not propagate
    expect(slate.length).toBe(1);
    expect(slate[0].identity.name).toBe('Juan Soto');
    expect(slate[0].identity.teamAbbreviation).toBe('WSH');

    // Per-team failure must be logged with teamId for debugging
    // Note: the HTTP 500 path logs a single string (no thrown error as second arg)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('teamId=121')
    );

    warnSpy.mockRestore();
  });

  // ─── NEW TEST 2: Doubleheader deduplication ────────────────────────────────
  it('fetches team roster once and does not duplicate players when same team appears in two games (doubleheader)', async () => {
    const TEAM_ID = 147; // Yankees in both games
    const OPP1_ID = 111;
    const OPP2_ID = 110;

    const schedule = makeSchedule([
      makeGame(900001, TEAM_ID, 'NYY', OPP1_ID, 'BOS'),
      makeGame(900002, TEAM_ID, 'NYY', OPP2_ID, 'BAL'), // same NYY team, second game
    ]);

    const yankeesRoster = {
      roster: [
        makeRosterEntry(592450, 'Aaron Judge', 'Outfielder', 'RF'),
        makeRosterEntry(650402, 'Gleyber Torres', 'Infielder', '2B'),
        makePitcherEntry(543037, 'Gerrit Cole'),
      ],
    };
    const opp1Roster = { roster: [makeRosterEntry(600001, 'BOS Player 1', 'Outfielder', 'CF')] };
    const opp2Roster = { roster: [makeRosterEntry(700001, 'BAL Player 1', 'Outfielder', 'LF')] };

    const rosterFetchCalls: string[] = [];

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/schedule')) return new Response(JSON.stringify(schedule), { status: 200 });
      if (url.includes(`/teams/${TEAM_ID}/roster`)) {
        rosterFetchCalls.push(url);
        return new Response(JSON.stringify(yankeesRoster), { status: 200 });
      }
      if (url.includes(`/teams/${OPP1_ID}/roster`)) return new Response(JSON.stringify(opp1Roster), { status: 200 });
      if (url.includes(`/teams/${OPP2_ID}/roster`)) return new Response(JSON.stringify(opp2Roster), { status: 200 });
      return new Response('Not Found', { status: 404 });
    });

    const slate = await fetchLiveMlbSlate();

    // Yankees roster must be fetched exactly ONCE (teamIds is a Set)
    expect(rosterFetchCalls.length).toBe(1);

    // Aaron Judge must appear exactly once despite appearing in two game iterations
    const judgeEntries = slate.filter((p) => p.identity.name === 'Aaron Judge');
    expect(judgeEntries.length).toBe(1);

    // Gleyber Torres same
    const gleyberEntries = slate.filter((p) => p.identity.name === 'Gleyber Torres');
    expect(gleyberEntries.length).toBe(1);

    // Total: 2 NYY hitters + 1 BOS + 1 BAL = 4
    expect(slate.length).toBe(4);
  });

  // ─── NEW TEST 3: Full schedule fetch timeout ───────────────────────────────
  it('falls back to mockChunkAData when schedule fetch is aborted (AbortController timeout)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      // Simulate abort signal firing immediately
      const signal = init?.signal as AbortSignal | undefined;
      if (signal) {
        const err = new DOMException('The operation was aborted.', 'AbortError');
        throw err;
      }
      return new Response('', { status: 200 });
    });

    const slate = await fetchLiveMlbSlate();

    expect(slate).toBe(mockChunkAData);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[mlbLiveService] Fallback'),
      expect.anything()
    );

    warnSpy.mockRestore();
  });

  // ─── NEW TEST 4: Large-scale volume test ──────────────────────────────────
  it('handles 15-game slate with realistic team counts and returns player count in sane range', async () => {
    // Build 15 games with 30 unique teams (each team appears once)
    // Each team gets 13 hitters + 2 pitchers in roster
    const GAMES = 15;
    const teams: Array<{ id: number; abbr: string }> = Array.from({ length: GAMES * 2 }, (_, i) => ({
      id: 200 + i,
      abbr: `T${i}`,
    }));

    const games = Array.from({ length: GAMES }, (_, i) => {
      const home = teams[i * 2];
      const away = teams[i * 2 + 1];
      return makeGame(1000 + i, home.id, home.abbr, away.id, away.abbr);
    });

    const schedule = makeSchedule(games);

    // Each team roster: 13 hitters + 2 pitchers
    const makeTeamRoster = (teamBaseId: number) => ({
      roster: [
        ...Array.from({ length: 13 }, (_, j) => makeRosterEntry(teamBaseId * 100 + j, `Player ${teamBaseId}-${j}`)),
        makePitcherEntry(teamBaseId * 100 + 50, `Pitcher ${teamBaseId}`),
        makePitcherEntry(teamBaseId * 100 + 51, `Pitcher2 ${teamBaseId}`),
      ],
    });

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/schedule')) return new Response(JSON.stringify(schedule), { status: 200 });

      for (const team of teams) {
        if (url.includes(`/teams/${team.id}/roster`)) {
          return new Response(JSON.stringify(makeTeamRoster(team.id)), { status: 200 });
        }
      }
      return new Response('Not Found', { status: 404 });
    });

    const slate = await fetchLiveMlbSlate();

    // 30 teams × 13 hitters = 390 expected
    // Confirm in a sane real-world range (200-600), not capped, not exploding
    expect(slate.length).toBeGreaterThanOrEqual(200);
    expect(slate.length).toBeLessThanOrEqual(600);

    // All ranks must be unique sequential 1..N
    const ranks = slate.map((p) => p.rank).sort((a, b) => a - b);
    expect(ranks[0]).toBe(1);
    expect(ranks[ranks.length - 1]).toBe(slate.length);
    expect(new Set(ranks).size).toBe(slate.length);
  });

  // ─── NEW TEST 5: Confirmed-starter cross-reference ────────────────────────
  it('assigns lineupStatus confirmed_starter to player in lineup and roster status to player only on roster', async () => {
    const IN_LINEUP_ID = 592450; // Aaron Judge — in both roster and lineup
    const ROSTER_ONLY_ID = 650402; // Gleyber Torres — on roster but NOT in lineup

    const schedule = makeSchedule([
      makeGame(
        745001,
        147, 'NYY',
        111, 'BOS',
        [{ id: IN_LINEUP_ID, fullName: 'Aaron Judge' }], // only Judge in home lineup
        [] // no away lineup
      ),
    ]);

    const yankeesRoster = {
      roster: [
        makeRosterEntry(IN_LINEUP_ID, 'Aaron Judge', 'Outfielder', 'RF'),
        makeRosterEntry(ROSTER_ONLY_ID, 'Gleyber Torres', 'Infielder', '2B'),
        makePitcherEntry(543037, 'Gerrit Cole'),
      ],
    };
    const bosRoster = { roster: [makeRosterEntry(646240, 'Rafael Devers', 'Infielder', '3B')] };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/schedule')) return new Response(JSON.stringify(schedule), { status: 200 });
      if (url.includes('/teams/147/roster')) return new Response(JSON.stringify(yankeesRoster), { status: 200 });
      if (url.includes('/teams/111/roster')) return new Response(JSON.stringify(bosRoster), { status: 200 });
      return new Response('Not Found', { status: 404 });
    });

    const slate = await fetchLiveMlbSlate();

    const judge = slate.find((p) => p.identity.name === 'Aaron Judge');
    const torres = slate.find((p) => p.identity.name === 'Gleyber Torres');
    const devers = slate.find((p) => p.identity.name === 'Rafael Devers');

    // Judge is in the lineup → confirmed_starter
    expect(judge?.lineupStatus).toBe('confirmed_starter');
    expect(judge?.lineupSlot).toBe(1); // first (and only) home lineup entry

    // Torres is on roster but NOT in lineup → roster (lineup was posted)
    expect(torres?.lineupStatus).toBe('roster');
    expect(torres?.lineupSlot).toBeUndefined();

    // Devers is on the away team. The home lineup was posted (Judge confirmed),
    // so lineupPosted=true for this game. Any away player NOT in awayPlayers gets
    // lineupStatus: 'roster' (not 'unknown') because we know the lineup data exists.
    // 'unknown' is only set when game.lineups is completely absent/empty for BOTH sides.
    expect(devers?.lineupStatus).toBe('roster');
  });

  // ─── NEW TEST 6: scoreBasis distinction and score ordering invariant ───────
  it('confirmed_lineup players get scoreBasis confirmed_lineup, roster_baseline players get lower scores', async () => {
    const STARTER_ID = 592450;
    const ROSTER_ID = 650402;

    const schedule = makeSchedule([
      makeGame(
        745001,
        147, 'NYY',
        111, 'BOS',
        [{ id: STARTER_ID, fullName: 'Aaron Judge' }],
        []
      ),
    ]);

    const yankeesRoster = {
      roster: [
        makeRosterEntry(STARTER_ID, 'Aaron Judge', 'Outfielder', 'RF'),
        makeRosterEntry(ROSTER_ID, 'Gleyber Torres', 'Infielder', '2B'),
        makePitcherEntry(543037, 'Gerrit Cole'),
      ],
    };
    const bosRoster = { roster: [] };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/schedule')) return new Response(JSON.stringify(schedule), { status: 200 });
      if (url.includes('/teams/147/roster')) return new Response(JSON.stringify(yankeesRoster), { status: 200 });
      if (url.includes('/teams/111/roster')) return new Response(JSON.stringify(bosRoster), { status: 200 });
      return new Response('Not Found', { status: 404 });
    });

    const slate = await fetchLiveMlbSlate();

    const judge = slate.find((p) => p.identity.name === 'Aaron Judge');
    const torres = slate.find((p) => p.identity.name === 'Gleyber Torres');

    expect(judge).toBeDefined();
    expect(torres).toBeDefined();

    // scoreBasis must distinguish signal quality
    expect(judge?.score.scoreBasis).toBe('confirmed_lineup');
    expect(torres?.score.scoreBasis).toBe('roster_baseline');

    // Invariant: no roster_baseline score may meet or exceed the lowest confirmed_lineup score
    expect(judge!.score.hrIndex).toBeGreaterThanOrEqual(CONFIRMED_STARTER_MIN);
    expect(torres!.score.hrIndex).toBeLessThanOrEqual(SCORE_BASELINE_MAX);
    expect(torres!.score.hrIndex).toBeLessThan(judge!.score.hrIndex);

    // Ranking must place confirmed starters above roster players
    expect(judge!.rank).toBeLessThan(torres!.rank);

    // primaryRecommendation copy must be honest about basis
    expect(judge?.score.primaryRecommendation).toMatch(/Starting in lineup slot #1/);
    expect(torres?.score.primaryRecommendation).toMatch(/awaiting lineup confirmation/);
  });
});
