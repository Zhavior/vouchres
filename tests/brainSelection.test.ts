import { describe, expect, it } from 'vitest';
import { mergeServerLedgerPicks, selectBrainPicks } from '../src/features/brain/brainSelection';
import { selectPitcherKBrainPicks } from '../src/features/brain/pitcherKSelection';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import type { StatPlayerRow } from '../src/features/mlb-stats/types/statHubTypes';
import { readFileSync } from 'node:fs';

function hitter(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'hitter-1', playerName: 'Hitter One', playerId: 1, team: 'NYY', opponent: 'BOS',
    teamLogoUrl: null, opponentLogoUrl: null, pitcherName: 'Pitcher One', venue: 'Park', gamePk: 1,
    gameTime: null, headshotUrl: null, rank: 1, hrScore: 85, hitterPower: 84,
    pitcherVulnerability: 76, parkFactor: 108, recentForm: 75, vouchScore: 80,
    dataConfidence: 82, truthStatus: 'official', riskTier: 'Elite', oddsLabel: 'No book odds',
    reasons: ['Power'], warnings: [], sourceMode: 'confirmed',
    ...overrides,
  };
}

function pitcher(overrides: Partial<StatPlayerRow> = {}): StatPlayerRow {
  return {
    stableId: 'pitcher-1', playerName: 'Pitcher One', playerId: 10, team: 'NYY', opponent: 'BOS',
    lineupStatus: 'projected', statScore: 82, tier: 'elite', confidence: 78,
    drivers: [{ id: 'k9', label: 'K / 9', value: 88, weight: 38 }], isHeuristic: true,
    seasonValue: 120,
    ...overrides,
  };
}

describe('brain selection policy', () => {
  it('rejects weak roster rows instead of filling the list', () => {
    const picks = selectBrainPicks([
      hitter(),
      hitter({ stableId: 'weak', playerName: 'Weak', riskTier: 'Deep', hrScore: 48, dataConfidence: 45 }),
    ]);
    expect(picks.map((pick) => pick.player.playerName)).toEqual(['Hitter One']);
  });

  it('prefers an official shortlist when at least ten official players qualify', () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, index) => hitter({
        stableId: `o${index + 1}`,
        playerName: `Official ${index + 1}`,
        team: ['NYY', 'BOS', 'LAD', 'ATL', 'CHC', 'HOU', 'SEA', 'SF', 'MIL', 'CLE'][index],
        gamePk: index + 1,
      })),
      hitter({ stableId: 'p1', playerName: 'Preview', team: 'TOR', gamePk: 99, truthStatus: 'projected', hrScore: 99 }),
    ];
    expect(selectBrainPicks(rows).every((pick) => pick.evidenceQuality === 'official')).toBe(true);
  });

  it('limits concentration to two players per game and team', () => {
    const rows = Array.from({ length: 5 }, (_, index) => hitter({
      stableId: `same-${index}`, playerName: `Same ${index}`, team: 'NYY', gamePk: 1, rank: index + 1,
    }));
    expect(selectBrainPicks(rows)).toHaveLength(2);
  });

  it('keeps pitcher K selections on their own elite and strong thresholds', () => {
    const picks = selectPitcherKBrainPicks([
      pitcher(),
      pitcher({ stableId: 'watch', playerName: 'Watch Pitcher', team: 'BOS', tier: 'watch', statScore: 52 }),
      pitcher({ stableId: 'low-confidence', playerName: 'Low Confidence', team: 'LAD', confidence: 40 }),
    ]);
    expect(picks.map((pick) => pick.pitcher.playerName)).toEqual(['Pitcher One']);
    expect(picks[0].explanation).toContain('not a calibrated sportsbook-line prediction');
  });

  it('sources K candidates only from scheduled probable pitchers', () => {
    const source = readFileSync('src/features/mlb-stats/engine/mlbStatsApiData.ts', 'utf8');
    expect(source).toContain("const probablePitcherName = side === 'away' ? game.awayPitcher : game.homePitcher;");
    expect(source).toContain("statType !== 'pitcher_k'");
    expect(source).toContain('samePersonName');
  });
});

describe('mergeServerLedgerPicks', () => {
  it('keeps server ledger order and scores even when client math would diverge', () => {
    const picks = mergeServerLedgerPicks(
      [
        {
          playerId: '2',
          playerName: 'Server First',
          team: 'BOS',
          opponent: 'NYY',
          rank: 1,
          score: 91,
          confidence: 80,
          tier: 'Elite',
          evidenceQuality: 'official',
          reasons: ['Power'],
        },
        {
          playerId: '1',
          playerName: 'Server Second',
          team: 'NYY',
          opponent: 'BOS',
          rank: 2,
          score: 70,
          confidence: 70,
          tier: 'Core',
          evidenceQuality: 'preview',
        },
      ],
      [
        hitter({ playerId: 1, playerName: 'Board One', hrScore: 99 }),
        hitter({
          stableId: 'two',
          playerId: 2,
          playerName: 'Board Two',
          team: 'BOS',
          opponent: 'NYY',
          hrScore: 40,
          pitcherName: 'Ace',
        }),
      ],
    );
    expect(picks.map((pick) => pick.player.playerName)).toEqual(['Board Two', 'Board One']);
    expect(picks.map((pick) => pick.selectionScore)).toEqual([91, 70]);
    expect(picks[0].player.pitcherName).toBe('Ace');
    expect(picks[1].evidenceQuality).toBe('preview');
  });

  it('still renders ledger picks when the board row is missing', () => {
    const picks = mergeServerLedgerPicks(
      [{
        playerId: '99',
        playerName: 'Ledger Only',
        team: 'LAD',
        opponent: 'SF',
        rank: 1,
        score: 88,
        confidence: 76,
        tier: 'Strong',
        evidenceQuality: 'official',
        reasons: ['Form'],
      }],
      [],
    );
    expect(picks).toHaveLength(1);
    expect(picks[0].player.playerName).toBe('Ledger Only');
    expect(picks[0].selectionScore).toBe(88);
  });
});
