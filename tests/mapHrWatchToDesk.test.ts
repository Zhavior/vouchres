import { describe, expect, it } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import { mapHrWatchToDeskRow, sortDeskRows } from '../src/features/hr-max/mapHrWatchToDesk';

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
    recentForm: 88,
    vouchScore: 91,
    dataConfidence: 86,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+250',
    bookOdds: 250,
    reasons: ['Elite barrel rate against this pitch mix.'],
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HR Command Desk mapper', () => {
  it('keeps confirmed lineup truth and published board scores', () => {
    const row = mapHrWatchToDeskRow(player(), 'fresh', new Date('2026-08-13T16:00:00Z'), 'validated_hr_board_pipeline');

    expect(row.confirmed).toBe(true);
    expect(row.truthState).toBe('confirmed');
    expect(row.score).toBe(96);
    expect(row.read).toBe('Elite barrel rate against this pitch mix.');
    expect(row.receipt.sources).toContain('Official lineup');
    expect(row.receipt.sources).toContain('Validated HR board');
    expect(row.evidence.find((item) => item.label === 'Hitter power')?.value).toBe('Favorable');
  });

  it('labels projected lineups and missing layers instead of inventing them', () => {
    const row = mapHrWatchToDeskRow(
      player({
        truthStatus: 'projected',
        riskTier: 'Core',
        hitterPower: null,
        weather: null,
        bullpen: null,
        pitcherName: null,
        reasons: [],
      }),
      'delayed',
      null,
      null,
    );

    expect(row.confirmed).toBe(false);
    expect(row.truthState).toBe('projected');
    expect(row.dataStatus).toBe('projected');
    expect(row.read).toContain('No model rationale');
    expect(row.receipt.missing).toContain('Official batting order is unavailable.');
    expect(row.receipt.missing).toContain('Probable pitcher is unavailable.');
    expect(row.evidence.find((item) => item.label === 'Hitter power')?.tone).toBe('missing');
    expect(row.receipt.sources).toContain('Projected lineup');
    expect(row.receipt.sources).not.toContain('Weather feed');
  });

  it('sorts by published HRPI, then game time, then attention without fabricating ranks', () => {
    const late = mapHrWatchToDeskRow(player({ stableId: 'late', hrScore: 70, gameTime: '9:40 PM', vouchScore: 40 }), 'fresh', null, null);
    const early = mapHrWatchToDeskRow(player({ stableId: 'early', hrScore: 80, gameTime: '6:40 PM', vouchScore: 99 }), 'fresh', null, null);

    expect(sortDeskRows([late, early], 'hrpi').map((row) => row.id)).toEqual(['early', 'late']);
    expect(sortDeskRows([late, early], 'time').map((row) => row.id)).toEqual(['early', 'late']);
    expect(sortDeskRows([late, early], 'volume').map((row) => row.id)).toEqual(['early', 'late']);
  });
});
