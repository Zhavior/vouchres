import { describe, expect, it } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import { buildBoard } from '../src/features/hr/utils/normalizeHrWatch';
import {
  mapHrWatchBoardToChunkA,
  mapHrWatchRowToChunkA,
} from '../src/features/hr-v2/api/mapHrWatchRowToChunkA';

function player(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'judge-99',
    playerName: 'Aaron Judge',
    playerId: 592450,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Garrett Crochet',
    venue: 'Yankee Stadium',
    gamePk: 777,
    gameTime: '7:05 PM',
    headshotUrl: '/judge.png',
    rank: 1,
    hrScore: 96,
    hitterPower: 98,
    pitcherVulnerability: 82,
    parkFactor: 73,
    parkIndex: 121,
    recentForm: 88,
    vouchScore: 91,
    dataConfidence: 86,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+250',
    bookOdds: 250,
    impliedProbability: 0.286,
    reasons: ['Elite barrel rate against this pitch mix.'],
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('mapHrWatchRowToChunkA', () => {
  it('keeps numeric MLB person id and published HRPI, without inventing Statcast', () => {
    const chunk = mapHrWatchRowToChunkA(player(), '2026-08-15T12:00:00.000Z');

    expect(chunk.playerId).toBe('592450');
    expect(chunk.identity.mlbId).toBe('592450');
    expect(chunk.score.hrIndex).toBe(96);
    expect(chunk.lineupStatus).toBe('confirmed_starter');
    expect(chunk.score.scoreBasis).toBe('confirmed_lineup');
    expect(chunk.statcastSummary?.parkFactor).toBe(121);
    expect(chunk.statcastSummary?.xSLG).toBeUndefined();
    expect(chunk.statcastSummary?.barrelRate).toBeUndefined();
    expect(chunk.identity.handedness).toBeUndefined();
    expect(chunk.opposingPitcherHandedness).toBeUndefined();
    expect(chunk.odds?.provider).toBe('Validated HR board');
    expect(chunk.odds?.price).toBe(250);
  });

  it('correctly maps xSLG and barrelRate when provided by API payload', () => {
    const chunkWithStatcast = mapHrWatchRowToChunkA(
      player({
        xslg: 0.685,
        barrelRate: 0.242,
      }),
      '2026-08-15T12:00:00.000Z',
    );

    expect(chunkWithStatcast.statcastSummary?.xSLG).toBe(0.685);
    expect(chunkWithStatcast.statcastSummary?.barrelRate).toBe(0.242);
    expect(chunkWithStatcast.statcastSummary?.parkFactor).toBe(121);
  });

  it('labels projected rows as roster and skips blocked players on the board map', () => {
    const projected = mapHrWatchRowToChunkA(
      player({ truthStatus: 'projected', riskTier: 'Core', bookOdds: null, parkIndex: null }),
      '2026-08-15T12:00:00.000Z',
    );
    expect(projected.lineupStatus).toBe('roster');
    expect(projected.score.scoreBasis).toBe('roster_baseline');
    expect(projected.statcastSummary).toBeUndefined();
    expect(projected.odds).toBeNull();

    const board = {
      confirmed: [player()],
      curated: [player({ stableId: 'preview', playerId: 660271, playerName: 'Shohei Ohtani', hrScore: 80, truthStatus: 'projected' as const })],
      all: [],
      blocked: [player({ stableId: 'blocked', playerId: 1, playerName: 'Blocked Bat', truthStatus: 'blocked' as const })],
      warnings: [],
      note: null,
      disclaimer: null,
      truthMessage: null,
      counts: {
        confirmedCandidates: 1,
        projectedCandidates: 1,
        hiddenProjectedCandidates: 0,
        blockedPlayers: 1,
        totalVisiblePool: 2,
      },
    };

    const mapped = mapHrWatchBoardToChunkA(board, '2026-08-15T12:00:00.000Z');
    expect(mapped.map((row) => row.identity.name)).toEqual(['Aaron Judge', 'Shohei Ohtani']);
  });

  it('resolves mlbapi_ stub ids before using them as playerId', () => {
    const chunk = mapHrWatchRowToChunkA(
      player({ playerId: 'mlbapi_592450', headshotUrl: null }),
      '2026-08-15T12:00:00.000Z',
    );
    expect(chunk.playerId).toBe('592450');
    expect(chunk.identity.mlbId).toBe('592450');
  });
});

describe('buildBoard + mapHrWatchBoardToChunkA', () => {
  it('reads confirmed candidates from the same payload shape hr_max uses', () => {
    const board = buildBoard({
      candidates: [
        {
          playerId: 592450,
          playerName: 'Aaron Judge',
          team: 'NYY',
          opponent: 'BOS',
          hrScore: 91,
          lineupStatus: 'confirmed',
          opponentPitcherName: 'Garrett Crochet',
        },
      ],
    });
    const mapped = mapHrWatchBoardToChunkA(board, '2026-08-15T12:00:00.000Z');
    expect(mapped).toHaveLength(1);
    expect(mapped[0].lineupStatus).toBe('confirmed_starter');
    expect(mapped[0].score.hrIndex).toBe(91);
  });
});
