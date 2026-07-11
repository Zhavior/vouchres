import { describe, expect, it } from 'vitest';
import { buildLiveLensGames, filterLiveLensGames } from '../src/components/live/useLiveGamesLens';
import type { GameMatchup, LiveScore } from '../src/types/matchup';

const officialGame = {
  id: '12345',
  homeTeam: 'Detroit Tigers',
  awayTeam: 'Philadelphia Phillies',
  homeScore: 0,
  awayScore: 0,
  status: 'Scheduled',
  venue: 'Comerica Park',
  gameDate: '2026-07-10T23:10:00.000Z',
  isLive: false,
  isFinal: false,
  predictionsAvailable: true,
};

const enrichment: GameMatchup = {
  gamePk: 12345,
  status: 'Scheduled',
  isLive: false,
  isFinal: false,
  gameTime: officialGame.gameDate,
  venue: 'Comerica Park',
  away: { teamId: 147, name: 'Wrong Away Team', abbreviation: 'NYY', logo: '', record: null, seasonWinPct: 0, probablePitcher: null },
  home: { teamId: 120, name: 'Wrong Home Team', abbreviation: 'WSH', logo: '', record: null, seasonWinPct: 0, probablePitcher: null },
  score: { away: 0, home: 0 },
  winProbability: { away: 48, home: 52 },
  winProbModel: ['Backed model'],
  runEnvironment: null,
  topHrWatch: [],
  keyFactors: [],
  whatToWatch: [],
  aiVerdict: 'Backed model available.',
  dataQuality: 'full',
};

const liveScore: LiveScore = {
  gamePk: 12345,
  status: 'In Progress',
  isLive: true,
  isFinal: false,
  inning: 4,
  inningState: 'Top',
  score: { away: 2, home: 1 },
};

describe('Live Games lens model', () => {
  it('keeps official team identity while applying live score and enrichment overlays', () => {
    const [game] = buildLiveLensGames({
      officialGames: [officialGame],
      enrichments: [enrichment],
      scores: [liveScore],
      hrBoard: undefined,
    });

    expect(game.away.name).toBe('Philadelphia Phillies');
    expect(game.away.abbreviation).toBe('PHI');
    expect(game.home.name).toBe('Detroit Tigers');
    expect(game.home.abbreviation).toBe('DET');
    expect(game.score).toEqual({ away: 2, home: 1 });
    expect(game.isLive).toBe(true);
    expect(game.winProbability).toEqual({ away: 48, home: 52 });
  });

  it('filters without changing the underlying selected game identities', () => {
    const games = buildLiveLensGames({
      officialGames: [officialGame],
      enrichments: [],
      scores: [liveScore],
      hrBoard: undefined,
    });

    expect(filterLiveLensGames(games, 'live')).toHaveLength(1);
    expect(filterLiveLensGames(games, 'upcoming')).toHaveLength(0);
    expect(games[0].gamePk).toBe(12345);
  });
});
