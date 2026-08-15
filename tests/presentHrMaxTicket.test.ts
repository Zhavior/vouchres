import { describe, expect, it } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import { mapHrWatchToDeskRow } from '../src/features/hr-max/mapHrWatchToDesk';
import {
  deskMatchupLine,
  evidencePips,
  primaryCatalystLabel,
} from '../src/features/hr-max/presentHrMaxTicket';

function player(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'caglianone-1',
    playerName: 'Jac Caglianone',
    playerId: 1,
    team: 'KC',
    opponent: 'LAA',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Starter',
    venue: 'Angel Stadium',
    gamePk: 1,
    gameTime: '7:10 PM',
    headshotUrl: null,
    rank: 1,
    hrScore: 90,
    hitterPower: 88,
    pitcherVulnerability: 80,
    parkFactor: 50,
    recentForm: 70,
    vouchScore: 80,
    dataConfidence: 80,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+400',
    bookOdds: 400,
    reasons: ['Positive power context'],
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('presentHrMaxTicket', () => {
  it('does not repeat the batting team in the matchup line', () => {
    const row = mapHrWatchToDeskRow(player(), 'fresh', null, null);
    const line = deskMatchupLine(row);
    expect(line).toBe('KC @ LAA · 7:10 PM');
    expect(line.startsWith('KC · KC')).toBe(false);
  });

  it('picks the strongest of power/pitcher/park as the catalyst', () => {
    const row = mapHrWatchToDeskRow(player(), 'fresh', null, null);
    expect(primaryCatalystLabel(row)).toBe('Hitter power · Favorable');
    const pips = evidencePips(row);
    expect(pips).toHaveLength(3);
    expect(pips.map((pip) => pip.tone)).toEqual(['confirmed', 'confirmed', 'warning']);
  });

  it('falls back to the mapped signal when layers are missing', () => {
    const row = mapHrWatchToDeskRow(
      player({
        hitterPower: null,
        pitcherVulnerability: null,
        parkFactor: null,
        parkContext: null,
        truthStatus: 'projected',
        riskTier: 'Watch',
      }),
      'delayed',
      null,
      null,
    );
    expect(primaryCatalystLabel(row)).toBe(row.signal);
    expect(evidencePips(row).every((pip) => pip.tone === 'missing')).toBe(true);
  });
});

describe('HrMaxPlayerCard ticket contract', () => {
  it('does not render the layers pill or a repeated team code', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('../src/features/hr-max/components/HrMaxPlayerCard.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('{row.evidence.length} layers');
    expect(source).not.toContain('row.team} · {row.matchupLabel');
    expect(source).toContain('deskMatchupLine');
    expect(source).toContain('primaryCatalystLabel');
    expect(source).toContain('hr-max-pip');
    expect(source).toContain('min-h-[78px]');
  });
});

describe('HrMaxMainPane copy contract', () => {
  it('does not advertise Statcast metrics the desk row does not have', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('../src/features/hr-max/components/HrMaxMainPane.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('Statcast Telemetry');
    expect(source).not.toContain('exit velocity');
    expect(source).not.toContain('launch angle');
  });
});
