// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { GameMatchup, LiveScore } from '../src/types/matchup';
import {
  applyScores,
  mergeMatchups,
  mergeOfficialLiveUpdates,
} from '../src/components/LiveGamesProZ8';

function game(id: number, patch: Partial<GameMatchup> = {}): GameMatchup {
  return {
    gamePk: id,
    status: 'Scheduled',
    isLive: false,
    isFinal: false,
    gameTime: `2026-07-12T${String(id).padStart(2, '0')}:00:00Z`,
    venue: 'Verified venue',
    away: { teamId: 1, name: 'Away', abbreviation: 'AWY', logo: '', record: null, seasonWinPct: 0, probablePitcher: null },
    home: { teamId: 2, name: 'Home', abbreviation: 'HME', logo: '', record: null, seasonWinPct: 0, probablePitcher: null },
    score: { away: 0, home: 0 },
    winProbability: { away: 45, home: 55 },
    winProbModel: [],
    runEnvironment: null,
    topHrWatch: [],
    keyFactors: [],
    whatToWatch: [],
    aiVerdict: 'Verified context',
    dataQuality: 'limited',
    ...patch,
  };
}

describe('Live Games polling stability', () => {
  it('lets official final status clear a stale live flag', () => {
    const enriched = game(1, { status: 'Top 9', isLive: true, aiVerdict: 'Keep this enrichment' });
    const official = game(1, { status: 'Final', isFinal: true, score: { away: 4, home: 2 } });
    const [result] = mergeOfficialLiveUpdates([enriched], [official]);

    expect(result.isFinal).toBe(true);
    expect(result.isLive).toBe(false);
    expect(result.score).toEqual({ away: 4, home: 2 });
    expect(result.aiVerdict).toBe('Keep this enrichment');
  });

  it('does not resurrect a final game while merging enrichment', () => {
    const officialFinal = game(1, { status: 'Final', isFinal: true });
    const staleModel = game(1, { status: 'In Progress', isLive: true });
    const [result] = mergeMatchups([officialFinal], [staleModel]);
    expect(result).toMatchObject({ isFinal: true, isLive: false, status: 'Final' });
  });

  it('keeps schedule order stable when a game becomes live', () => {
    const original = [game(1), game(2)];
    const updated = mergeOfficialLiveUpdates(original, [game(2, { status: 'Live', isLive: true })]);
    expect(updated.map((item) => item.gamePk)).toEqual([1, 2]);
  });

  it('treats a final score update as not live', () => {
    const score: LiveScore = { gamePk: 1, status: 'Final', isLive: true, isFinal: true, score: { away: 3, home: 1 } };
    const [result] = applyScores([game(1, { isLive: true })], [score]);
    expect(result).toMatchObject({ isFinal: true, isLive: false, score: { away: 3, home: 1 } });
  });
});
