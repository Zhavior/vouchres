import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('multi-game parlay grading wiring', () => {
  const source = readFileSync(
    new URL('../server/services/grading/gradingService.ts', import.meta.url),
    'utf8',
  );

  it('loads each leg game date for historical schedule resolution', () => {
    expect(source).toContain('odds_decimal, game_date');
  });

  it('passes the raw secondary-game box score into exact leg grading', () => {
    expect(source).toContain('legBoxscore = legGameData.boxscore;');
    expect(source).not.toContain('legBoxscore = await fetchBoxscore(rawGamePk');
  });
});
