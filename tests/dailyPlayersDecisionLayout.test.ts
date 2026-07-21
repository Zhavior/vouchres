import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/pages/DailyPlayersPageZ8.tsx', 'utf8');

describe('Daily Players decision layout', () => {
  it('keeps projected players clearly separated from confirmed lineups', () => {
    expect(source).toContain('Official lineup not posted yet — projected roster preview only.');
    expect(source).toContain("{item === 'pending' ? 'Preview' : item}");
    expect(source).toContain("label: 'Confirmed'");
    expect(source).toContain("label: 'Preview Only'");
  });

  it('uses an accessible matchup selector instead of a horizontal shortcut rail', () => {
    expect(source).toContain('aria-label="Choose matchup"');
    expect(source).not.toContain('aria-label="Matchup shortcuts"');
    expect(source).not.toContain('overflow-x-auto px-1 pb-1');
  });

  it('moves search to the first matching roster without changing player data', () => {
    expect(source).toContain('const firstMatchingGame = games.findIndex');
    expect(source).toContain('setSelectedGameIndex(firstMatchingGame)');
    expect(source).toContain('Find a player or team');
  });
});
