import { describe, expect, it } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import type { DailyMlbReport } from '../src/types/mlb';
import {
  buildTodayChangeDigest,
  createTodayChangeSnapshot,
  parseTodayChangeDigestEnvelope,
  TODAY_CHANGE_DIGEST_VERSION,
} from '../src/components/today/todayChangeDigestModel';

function report(status = 'Scheduled', score = { away: 0, home: 0 }): DailyMlbReport {
  return {
    date: '2026-07-28',
    gameCount: 1,
    dataQuality: 'full',
    generatedAt: '2026-07-28T12:00:00.000Z',
    disclaimer: 'Research only.',
    vulnerablePitchers: [],
    hrTargets: [],
    sneakyHr: [],
    runEnvironments: [],
    games: [{
      gamePk: 42,
      gameDate: '2026-07-28T23:00:00.000Z',
      status,
      awayTeam: { teamId: 1, name: 'Away', abbreviation: 'AWY' },
      homeTeam: { teamId: 2, name: 'Home', abbreviation: 'HME' },
      venue: 'Park',
      probablePitchers: { away: null, home: null },
      score,
      inning: null,
      dataQuality: 'full',
    }],
  };
}

function player(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'player-7',
    playerName: 'Verified Player',
    playerId: 7,
    team: 'AWY',
    opponent: 'HME',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    gamePk: 42,
    gameTime: null,
    headshotUrl: null,
    rank: 1,
    hrScore: 70,
    hitterPower: null,
    pitcherVulnerability: null,
    parkFactor: null,
    weather: null,
    platoon: null,
    recentForm: null,
    vouchScore: null,
    dataConfidence: 60,
    truthStatus: 'projected',
    riskTier: 'Core',
    oddsLabel: 'Unavailable',
    reasons: [],
    warnings: [],
    sourceMode: 'curated',
    ...overrides,
  };
}

describe('today change digest model', () => {
  it('reports a projected-to-official lineup transition using source values', () => {
    const before = createTodayChangeSnapshot(report(), [player()], '2026-07-28T12:00:00.000Z');
    const current = createTodayChangeSnapshot(report(), [player({ truthStatus: 'official' })], '2026-07-28T13:00:00.000Z');

    expect(buildTodayChangeDigest(before, current)).toMatchObject([{
      kind: 'lineup',
      title: 'Verified Player lineup status changed',
      previousValue: 'Projected',
      currentValue: 'Official',
    }]);
  });

  it('reports a game becoming final with its real score', () => {
    const before = createTodayChangeSnapshot(report('In Progress', { away: 2, home: 1 }), []);
    const current = createTodayChangeSnapshot(report('Final', { away: 4, home: 3 }), []);
    const changes = buildTodayChangeDigest(before, current);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: 'game-final', detail: 'Final score: 4–3.' });
  });

  it('ignores small score movement and reports only material research changes', () => {
    const before = createTodayChangeSnapshot(report(), [player({ hrScore: 70, dataConfidence: 60 })]);
    const smallMove = createTodayChangeSnapshot(report(), [player({ hrScore: 74, dataConfidence: 69 })]);
    const materialMove = createTodayChangeSnapshot(report(), [player({ hrScore: 75, dataConfidence: 70 })]);

    expect(buildTodayChangeDigest(before, smallMove)).toEqual([]);
    expect(buildTodayChangeDigest(before, materialMove)).toMatchObject([{
      kind: 'research',
      detail: 'HR research score: 70 → 75. Data confidence: 60 → 70.',
    }]);
  });

  it('uses fixed lineup, game, then research ordering', () => {
    const before = createTodayChangeSnapshot(report('Scheduled'), [player()]);
    const current = createTodayChangeSnapshot(report('In Progress'), [player({ truthStatus: 'official', hrScore: 80 })]);

    expect(buildTodayChangeDigest(before, current).map((change) => change.kind)).toEqual([
      'lineup',
      'game-status',
      'research',
    ]);
  });

  it('does not compare different slate dates', () => {
    const before = createTodayChangeSnapshot(report(), [player()]);
    const nextReport = { ...report('Final'), date: '2026-07-29' };
    const current = createTodayChangeSnapshot(nextReport, [player({ truthStatus: 'official', hrScore: 90 })]);

    expect(buildTodayChangeDigest(before, current)).toEqual([]);
  });

  it('rejects another account or storage version', () => {
    const snapshot = createTodayChangeSnapshot(report(), []);
    const valid = JSON.stringify({ version: TODAY_CHANGE_DIGEST_VERSION, accountId: 'account-a', snapshot });
    const outdated = JSON.stringify({ version: 0, accountId: 'account-a', snapshot: { ...snapshot, version: 0 } });

    expect(parseTodayChangeDigestEnvelope(valid, 'account-a')?.accountId).toBe('account-a');
    expect(parseTodayChangeDigestEnvelope(valid, 'account-b')).toBeNull();
    expect(parseTodayChangeDigestEnvelope(outdated, 'account-a')).toBeNull();
  });
});
