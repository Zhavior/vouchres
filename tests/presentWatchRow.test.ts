import { describe, expect, it } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import {
  hrpiV4ModelCard,
  presentWatchRow,
  sortIntelV2Rows,
} from '../src/features/hr/presentWatchRow';

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
    reasons: ['Elite barrel rate against this pitch mix.', 'Confirmed cleanup spot adds PA volume.'],
    warnings: ['Late bullpen usage is unresolved.'],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

function ladder(row: ReturnType<typeof presentWatchRow>, label: string) {
  return row.evidence.find((item) => item.label === label);
}

const INVENTED = /\b(xSLG|Barrel%|HR\/9|humidity|wind)\s*[:=]?\s*[\d.]+/i;

describe('HR Intelligence v2 presenter', () => {
  it('keeps confirmed lineup truth and published board scores', () => {
    const row = presentWatchRow(player(), 'fresh', new Date('2026-08-13T16:00:00Z'), 'validated_hr_board_pipeline');

    expect(row.confirmed).toBe(true);
    expect(row.displayTier).toBe('Elite');
    expect(row.truthState).toBe('confirmed');
    expect(row.score).toBe(96);
    expect(row.strikeLine).toBe('Aaron Judge | NYY vs BOS');
    expect(row.hrpiLine).toBe('HRPI: 96/100 | Elite | LINEUP CONFIRMED');
    expect(row.read).toBe('Elite barrel rate against this pitch mix.');
    expect(row.matchupSummary).toContain('Elite barrel rate against this pitch mix.');
    expect(row.matchupSummary).toContain('Confirmed cleanup spot adds PA volume.');
    expect(row.matchupSummary).toContain('Board lists Garrett Crochet as the opposing pitcher.');
    expect(row.receipt.sources).toContain('Official lineup');
    expect(row.receipt.sources).toContain('Validated HR board');
    expect(ladder(row, '[+] Power profile')?.value).toBe('98/100');
    expect(ladder(row, '[+] Power profile')?.detail).toContain('Raw Statcast (xSLG, Barrel%) missing on this row.');
    expect(ladder(row, '[+] Pitch matchup')?.value).toBe('82/100');
    expect(ladder(row, '[+] Park & weather')?.value).toBe('73/100');
    expect(ladder(row, '[+] Park & weather')?.detail).toContain('Weather UNKNOWN');
    expect(ladder(row, '[-] Main risk')?.detail).toContain('Late bullpen usage is unresolved.');
    expect(row.canAddToSlip).toBe(true);
    expect(row.hitterPower).toBe(98);
    expect(row.pitcherName).toBe('Garrett Crochet');
    expect(row.headshotUrl).toBe('/judge.png');
    expect(row.receipt.methodology).toBe(hrpiV4ModelCard());
    expect(row.receipt.methodology).toContain('does not recompute');
    expect(row.receipt.methodology).toContain('35/35/15/15');
    expect(row.receipt.methodology).toContain('35/25/20/10/10');
    expect(INVENTED.test(JSON.stringify(row.evidence))).toBe(false);
  });

  it('maps engine Core to Strong and labels missing layers without inventing stats', () => {
    const row = presentWatchRow(
      player({
        truthStatus: 'projected',
        riskTier: 'Core',
        hrScore: 96,
        hitterPower: null,
        pitcherVulnerability: null,
        parkFactor: null,
        parkContext: null,
        parkIndex: null,
        weather: null,
        recentForm: null,
        bullpen: null,
        pitcherName: null,
        venue: null,
        reasons: [],
        warnings: [],
      }),
      'delayed',
      null,
      null,
    );

    expect(row.displayTier).toBe('Strong');
    expect(row.score).toBe(96);
    expect(row.hrpiLine).toBe('HRPI: 96/100 | Strong | LINEUP PROJECTED');
    expect(row.confirmed).toBe(false);
    expect(row.truthState).toBe('projected');
    expect(row.dataStatus).toBe('projected');
    expect(row.read).toContain('No model rationale');
    expect(row.matchupSummary).toContain('Opposing pitcher is unavailable on this row.');
    expect(row.matchupSummary).toContain('Weather is UNKNOWN on this payload.');
    expect(row.receipt.missing).toContain('Official batting order is unavailable.');
    expect(row.receipt.missing).toContain('Probable pitcher is unavailable.');
    expect(row.receipt.missing).toContain('Weather is UNKNOWN on this payload.');
    expect(ladder(row, '[+] Power profile')?.tone).toBe('missing');
    expect(ladder(row, '[+] Power profile')?.value).toBe('missing');
    expect(ladder(row, '[+] Pitch matchup')?.value).toBe('missing');
    expect(ladder(row, '[+] Park & weather')?.value).toBe('UNKNOWN');
    expect(ladder(row, '[+] Park & weather')?.detail).toContain('Weather UNKNOWN');
    expect(ladder(row, '[+] Park & weather')?.detail).toContain('Wind and humidity missing on this row.');
    expect(row.receipt.sources).toContain('Projected lineup');
    expect(INVENTED.test(JSON.stringify(row))).toBe(false);
    expect(row.receipt.methodology).toContain('not a guaranteed pick');
  });

  it('keeps board tier when published HRPI would look Elite', () => {
    const row = presentWatchRow(player({ riskTier: 'Core', hrScore: 91 }), 'fresh', null, null);
    expect(row.displayTier).toBe('Strong');
    expect(row.score).toBe(91);
    expect(row.hrpiLine).toContain('| Strong |');
  });

  it('does not convert a raw park index into a shadow park layer', () => {
    const row = presentWatchRow(
      player({
        parkFactor: null,
        parkContext: null,
        parkIndex: 121,
        weather: null,
      }),
      'fresh',
      null,
      null,
    );
    const park = ladder(row, '[+] Park & weather');
    expect(park?.value).toBe('UNKNOWN');
    expect(park?.score).toBeNull();
    expect(park?.detail).toContain('raw park index 121');
    expect(park?.detail).toContain('Weather UNKNOWN');
    expect(INVENTED.test(JSON.stringify(park))).toBe(false);
  });

  it('reports a present weather layer without inventing wind or humidity', () => {
    const row = presentWatchRow(player({ weather: 61, parkFactor: 73 }), 'fresh', null, null);
    const park = ladder(row, '[+] Park & weather');
    expect(park?.value).toBe('73/100');
    expect(park?.detail).toContain('Weather layer 61/100');
    expect(park?.detail).not.toContain('Weather UNKNOWN');
    expect(park?.detail).toContain('Wind and humidity missing on this row.');
  });

  it('sorts by published HRPI, then game time, then attention', () => {
    const late = presentWatchRow(player({ stableId: 'late', hrScore: 70, gameTime: '9:40 PM', vouchScore: 40 }), 'fresh', null, null);
    const early = presentWatchRow(player({ stableId: 'early', hrScore: 80, gameTime: '6:40 PM', vouchScore: 99 }), 'fresh', null, null);

    expect(sortIntelV2Rows([late, early], 'hrpi').map((row) => row.id)).toEqual(['early', 'late']);
    expect(sortIntelV2Rows([late, early], 'time').map((row) => row.id)).toEqual(['early', 'late']);
    expect(sortIntelV2Rows([late, early], 'volume').map((row) => row.id)).toEqual(['early', 'late']);
  });
});
