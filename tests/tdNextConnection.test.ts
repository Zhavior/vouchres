import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearNflTouchdownSlateCache,
  fetchNflTouchdownSlatePlayers,
} from '../server/services/nfl/nflEspnService';
import {
  liveThreatsQueryOptions,
  tdBoardV2QueryOptions,
  touchdownSlateQueryOptions,
} from '../src/features/nfl-touchdown/queries/touchdownQueries';
import { SportsDataIoTdBoardProvider } from '../server/services/nfl/providers/sportsDataIoProvider';
import { clearTdBoardV2Cache, getTdBoardV2 } from '../server/services/hubs/tdBoardHub';

describe('TD Next connection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    clearNflTouchdownSlateCache();
    clearTdBoardV2Cache();
  });

  it('shares one cached slate build across repeat callers', async () => {
    const scoreboard = {
      events: [{
        status: { type: { state: 'pre' }, displayClock: '0:00' },
        competitions: [{
          competitors: [
            { id: '1', homeAway: 'home', team: { id: '1', abbreviation: 'BUF' } },
            { id: '2', homeAway: 'away', team: { id: '2', abbreviation: 'MIA' } },
          ],
        }],
      }],
    };
    const roster = {
      athletes: [{
        items: [{
          id: '101',
          displayName: 'Test Runner',
          jersey: '1',
          position: { abbreviation: 'RB' },
          headshot: { href: '' },
          statsSummary: { rzShare: 50, inside10: 8 },
        }],
      }],
    };
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      return new Response(JSON.stringify(url.endsWith('/scoreboard') ? scoreboard : roster), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await fetchNflTouchdownSlatePlayers();
    const second = await fetchNflTouchdownSlatePlayers();

    expect(first).toHaveLength(2);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('uses HR-style shared query caching and polling windows', () => {
    const slate = touchdownSlateQueryOptions();
    const v2 = tdBoardV2QueryOptions();
    const threats = liveThreatsQueryOptions();

    expect(slate.staleTime).toBe(60_000);
    expect(slate.gcTime).toBe(15 * 60_000);
    expect(slate.refetchOnMount).toBe(false);
    expect(threats.staleTime).toBe(10_000);
    expect(threats.refetchInterval).toBe(15_000);
    expect(v2.queryKey).toEqual(['nfl', 'td-board', 'v2', 'today']);
    expect(v2.staleTime).toBe(60_000);
    expect(v2.gcTime).toBe(15 * 60_000);
  });

  it('fails honestly without a licensed provider instead of fetching or returning demo players', async () => {
    vi.stubEnv('SPORTSDATAIO_API_KEY', '');
    vi.stubEnv('SPORTSDATA_API_KEY', '');
    vi.stubEnv('SPORTSDATAIO_TD_BOARD_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const provider = new SportsDataIoTdBoardProvider();
    const snapshot = await provider.fetchBoard({ date: '2026-08-22' });

    expect(snapshot.connection).toBe('not_configured');
    expect(snapshot.dataQuality).toBe('unavailable');
    expect(snapshot.players).toEqual([]);
    expect(snapshot.coverage.sourcedFieldPercent).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deduplicates and caches the V2 not-configured response', async () => {
    vi.stubEnv('SPORTSDATAIO_API_KEY', '');
    vi.stubEnv('SPORTSDATA_API_KEY', '');
    vi.stubEnv('SPORTSDATAIO_TD_BOARD_URL', '');

    const first = await getTdBoardV2({ date: '2026-08-22', limit: 48 });
    const second = await getTdBoardV2({ date: '2026-08-22', limit: 48 });

    expect(first.connection).toBe('not_configured');
    expect(first.diagnostics.cache).toBe('miss');
    expect(second.diagnostics.cache).toBe('l1');
    expect(second.pageInfo.total).toBe(0);
  });

  it('accepts only a complete canonical provider candidate and attaches provenance', async () => {
    vi.stubEnv('SPORTSDATAIO_API_KEY', 'test-key');
    vi.stubEnv('SPORTSDATAIO_TD_BOARD_URL', 'https://provider.test/td-board');
    const sourceUpdatedAt = '2026-08-22T12:00:00.000Z';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      sourceUpdatedAt,
      games: [],
      warnings: [],
      missingCapabilities: [],
      players: [{
        id: '101',
        name: 'Verified Runner',
        position: 'RB',
        team: 'BUF',
        opponent: 'MIA',
        isHome: true,
        gameStatus: 'PRE',
        tdpiScore: 72.5,
        tier: 'STRONG',
        impliedTeamTotal: 26.5,
        rzTouchShare: 54.2,
        inside10Touches: 8,
        oppRzDefRank: 25,
        oppRzTdPercentAllowed: 62.1,
        marketOdds: '+135',
        modelEdgePercent: 4.2,
        sourceUpdatedAt,
        fieldSources: {
          tdpiScore: 'vouchedge-model-v2',
          rzTouchShare: 'sportsdataio:red-zone-usage',
          marketOdds: 'sportsdataio:player-props',
        },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const snapshot = await new SportsDataIoTdBoardProvider().fetchBoard({ date: '2026-08-22' });

    expect(snapshot.connection).toBe('live');
    expect(snapshot.players).toHaveLength(1);
    expect(snapshot.players[0].provenance.source).toBe('sportsdataio');
    expect(snapshot.players[0].provenance.fields.marketOdds).toContain('player-props');
    const calledUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(calledUrl.searchParams.get('date')).toBe('2026-08-22');
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)['Ocp-Apim-Subscription-Key']).toBe('test-key');
  });

  it('uses only safe schedule identity fields from a scrambled trial key', async () => {
    vi.stubEnv('SPORTSDATAIO_API_KEY', 'trial-key');
    vi.stubEnv('SPORTSDATAIO_TD_BOARD_URL', '');
    vi.stubEnv('SPORTSDATAIO_DATA_MODE', 'scrambled_trial');
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = url.endsWith('/Teams')
        ? [
            { Key: 'BUF', TeamID: 1, FullName: 'Buffalo Bills', PrimaryColor: '00338D', WikipediaLogoUrl: 'buf.svg' },
            { Key: 'MIA', TeamID: 2, FullName: 'Miami Dolphins', PrimaryColor: '008E97', WikipediaLogoUrl: 'mia.svg' },
          ]
        : [{
            ScoreID: 44,
            DateTimeUTC: '2026-08-22T17:00:00Z',
            AwayTeam: 'MIA',
            HomeTeam: 'BUF',
            AwayTeamID: 2,
            HomeTeamID: 1,
            AwayScore: 99,
            HomeScore: 88,
            PointSpread: 42,
            OverUnder: 123,
            IsInProgress: false,
            IsOver: false,
            LastUpdated: '2026-08-22T11:00:00Z',
          }];
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const snapshot = await new SportsDataIoTdBoardProvider().fetchBoard({ date: '2026-08-22' });

    expect(snapshot.connection).toBe('partial');
    expect(snapshot.players).toEqual([]);
    expect(snapshot.games).toHaveLength(1);
    expect(snapshot.games[0].shortName).toBe('MIA @ BUF');
    expect(snapshot.games[0].homeTeam.score).toBeNull();
    expect(snapshot.games[0].awayTeam.score).toBeNull();
    expect(snapshot.games[0].spread).toBeNull();
    expect(snapshot.games[0].overUnder).toBeNull();
    expect(snapshot.warnings[0]).toMatch(/scrambles/i);
  });
});
