import { describe, expect, it } from 'vitest';
import { TIER_THRESHOLDS, assignHrTier, tierStyleForScore } from '../src/features/hr/engine/tiers';
import { buildBoard } from '../src/features/hr/utils/normalizeHrWatch';

describe('HR tier alignment', () => {
  it('uses pipeline-aligned thresholds in tiers.ts', () => {
    expect(TIER_THRESHOLDS).toEqual({ elite: 82, strong: 72, watch: 62, sleeper: 52 });
  });

  it('assignHrTier and card styling agree on labels', () => {
    const cases = [
      { score: 88, label: 'Elite' },
      { score: 82, label: 'Elite' },
      { score: 79, label: 'Strong' },
      { score: 72, label: 'Strong' },
      { score: 68, label: 'Watch' },
      { score: 62, label: 'Watch' },
      { score: 58, label: 'Sleeper' },
      { score: 52, label: 'Sleeper' },
      { score: 45, label: 'Fade' },
    ];

    for (const { score, label } of cases) {
      expect(tierStyleForScore(score).label).toBe(label);
      expect(assignHrTier(score).tier === 'Avoid' ? 'Fade' : assignHrTier(score).tier).toBe(label);
    }
  });

  it('normalizeHrWatch riskTier matches board column mapping', () => {
    const board = buildBoard({
      candidates: [
        { playerName: 'Elite Slugger', hrScore: 85, lineupStatus: 'confirmed' },
        { playerName: 'Strong Slugger', hrScore: 76, lineupStatus: 'confirmed' },
        { playerName: 'Watch Slugger', hrScore: 65, lineupStatus: 'confirmed' },
        { playerName: 'Deep Slugger', hrScore: 55, lineupStatus: 'confirmed' },
      ],
    });

    expect(board.confirmed.map((row) => row.riskTier)).toEqual(['Elite', 'Core', 'Watch', 'Deep']);
    expect(board.confirmed.map((row) => tierStyleForScore(row.hrScore).label)).toEqual([
      'Elite',
      'Strong',
      'Watch',
      'Sleeper',
    ]);
  });
});
