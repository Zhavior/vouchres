import { describe, expect, it, vi } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import { buildHrDecisionBrief, toHrParlayPickerPlayer } from '../src/features/hr/utils/hrDecisionBrief';
import { buildBoard } from '../src/features/hr/utils/normalizeHrWatch';

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
    warnings: ['Wind is projected to blow in.'],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HR Player Intelligence decision brief', () => {
  it('surfaces the primary evidence, risk, verification, and freshness', () => {
    vi.setSystemTime(new Date('2026-07-16T16:10:00Z'));
    const brief = buildHrDecisionBrief(player(), 'fresh', new Date('2026-07-16T16:05:00Z'));

    expect(brief).toMatchObject({
      reason: 'Elite barrel rate against this pitch mix.',
      risk: 'Wind is projected to blow in.',
      lineupLabel: 'Confirmed lineup',
      pitcherLabel: 'Garrett Crochet',
      freshnessLabel: 'Fresh · updated 5m ago',
      canAddToSlip: true,
    });
    vi.useRealTimers();
  });

  it('shows honest missing states and blocks an unidentified player', () => {
    const brief = buildHrDecisionBrief(player({ playerId: null, pitcherName: null, reasons: [], warnings: [] }), 'stale', null);

    expect(brief.reason).toContain('No model rationale');
    expect(brief.risk).toContain('No specific risk note');
    expect(brief.pitcherLabel).toBe('Probable pitcher unavailable');
    expect(brief.freshnessLabel).toBe('Stale · update time unavailable');
    expect(brief.canAddToSlip).toBe(false);
    expect(brief.addToSlipBlockReason).toBe('Official player ID unavailable.');
  });

  it('does not expose a dead slip action in the public device preview', () => {
    const brief = buildHrDecisionBrief(player(), 'fresh', null, false);

    expect(brief.canAddToSlip).toBe(false);
    expect(brief.addToSlipBlockReason).toBe('Open the app to build a slip.');
  });

  it('hands canonical player and game identity to ParlayOS without invented propositions', () => {
    expect(toHrParlayPickerPlayer(player())).toEqual({
      id: '592450',
      name: 'Aaron Judge',
      team: 'NYY',
      position: '',
      headshot: '/judge.png',
      propositions: [],
      resolvedGamePk: '777',
    });
  });

  it('never promotes a projected-bucket row from a stale confirmed label', () => {
    const board = buildBoard({
      projectedCandidates: [{
        playerName: 'Juan Soto',
        playerId: 665742,
        team: 'NYM',
        opponent: 'PHI',
        hrScore: 98,
        lineupStatus: 'confirmed',
        warnings: ['Official lineup not posted yet. Do not treat as confirmed.'],
      }],
    });

    expect(board.curated[0]?.truthStatus).toBe('projected');
  });
});
