import { describe, expect, it } from 'vitest';
import {
  buildOpponentLineupFromHrBoard,
  hasProjectedHitters,
  rowMatchesOpponentTeam,
} from '../src/lib/matchups/buildOpponentLineupFallback';

describe('buildOpponentLineupFallback', () => {
  it('matches opponent rows by teamId even when names differ', () => {
    expect(
      rowMatchesOpponentTeam(
        { playerId: 1, playerName: 'Judge', teamId: 147, team: 'NYY' },
        { teamId: 147, name: 'New York Yankees', abbreviation: 'NYY' },
        1001,
      ),
    ).toBe(true);
  });

  it('matches by abbreviation when teamId is missing', () => {
    expect(
      rowMatchesOpponentTeam(
        { playerId: 2, playerName: 'Soto', team: 'NYY', teamAbbr: 'NYY' },
        { teamId: null, name: 'New York Yankees', abbreviation: 'NYY' },
      ),
    ).toBe(true);
  });

  it('does not mix the other side of the same game', () => {
    expect(
      rowMatchesOpponentTeam(
        { playerId: 3, playerName: 'Ohtani', teamId: 119, team: 'LAD', gamePk: 1001 },
        { teamId: 147, name: 'New York Yankees', abbreviation: 'NYY' },
        1001,
      ),
    ).toBe(false);
  });

  it('builds a visible lineup from HR board candidates', () => {
    const payload = buildOpponentLineupFromHrBoard({
      gamePk: 1001,
      pitcher: { id: 50, name: 'Ace', team: 'BOS', throws: 'R' },
      opponent: { teamId: 147, name: 'New York Yankees', abbreviation: 'NYY' },
      hrBoard: {
        candidates: [
          { playerId: 99, playerName: 'Aaron Judge', teamId: 147, team: 'NYY', position: 'RF', bats: 'R' },
          { playerId: 88, playerName: 'Wrong Side', teamId: 111, team: 'BOS', position: 'SS', bats: 'L' },
        ],
        games: [
          {
            gamePk: 1001,
            rows: [
              { playerId: 77, playerName: 'Juan Soto', teamId: 147, teamAbbr: 'NYY', position: 'LF', bats: 'L' },
            ],
          },
        ],
      },
    });

    expect(payload.opponent.projectedLineup.map((r) => r.name)).toEqual([
      'Juan Soto',
      'Aaron Judge',
    ]);
    expect(hasProjectedHitters(payload)).toBe(true);
  });

  it('returns an honest empty payload when nothing matches', () => {
    const payload = buildOpponentLineupFromHrBoard({
      gamePk: 1001,
      pitcher: { id: 50, name: 'Ace', team: 'BOS', throws: 'R' },
      opponent: { teamId: 147, name: 'New York Yankees', abbreviation: 'NYY' },
      hrBoard: {
        candidates: [
          { playerId: 88, playerName: 'Wrong Side', teamId: 111, team: 'BOS' },
        ],
      },
    });

    expect(payload.opponent.projectedLineup).toEqual([]);
    expect(payload.warnings.some((w) => w.includes('No opponent hitters'))).toBe(true);
    expect(hasProjectedHitters(payload)).toBe(false);
  });
});
