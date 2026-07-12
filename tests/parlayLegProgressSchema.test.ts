import { describe, expect, it } from 'vitest';
import { ParlayLegProgressRequestSchema } from '../server/validators/parlaySchemas';

const validLeg = {
  id: 'parlay-1:leg-1',
  gamePk: '745101',
  playerId: '592450',
  marketCode: 'ANYTIME_HR',
  statTarget: 1,
};

describe('ParlayLegProgressRequestSchema', () => {
  it('accepts canonical live-status identity', () => {
    expect(ParlayLegProgressRequestSchema.parse({ legs: [validLeg] })).toEqual({ legs: [validLeg] });
  });

  it('rejects malformed identity without guessing', () => {
    const parsed = ParlayLegProgressRequestSchema.safeParse({
      legs: [{ ...validLeg, gamePk: 'manual', playerId: 'Aaron Judge', statTarget: 0 }],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.success ? [] : parsed.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['legs.0.gamePk', 'legs.0.playerId', 'legs.0.statTarget']),
    );
  });

  it('enforces the same 50-leg production bound as the client', () => {
    const parsed = ParlayLegProgressRequestSchema.safeParse({
      legs: Array.from({ length: 51 }, (_, index) => ({ ...validLeg, id: `leg-${index}` })),
    });
    expect(parsed.success).toBe(false);
  });
});
