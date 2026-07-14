import { describe, expect, it } from 'vitest';
import { buildHrBoardApiPayload } from '../server/services/mlb/hrBoardResponse';

describe('buildHrBoardApiPayload', () => {
  it('falls back to the full projected pool when no confirmed or preview rows are available', () => {
    const payload = buildHrBoardApiPayload({
      confirmedCandidates: [],
      projectedCandidates: [],
      allProjectedCandidates: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      previewLimit: 0,
    });

    expect(payload.rows.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('treats pipeline candidates as confirmed batting-order players', () => {
    const payload = buildHrBoardApiPayload({
      candidates: [
        {
          playerId: 123,
          playerName: 'Confirmed Slugger',
          team: 'NYY',
          gamePk: 456,
          hrScore: 91,
          lineupStatus: 'confirmed',
        },
      ],
      projectedCandidates: [
        {
          playerId: 789,
          playerName: 'Preview Hitter',
          team: 'BOS',
          gamePk: 456,
          hrScore: 72,
          lineupStatus: 'projected_unconfirmed',
        },
      ],
    });

    expect(payload.candidates).toHaveLength(1);
    expect(payload.candidates[0].playerName).toBe('Confirmed Slugger');
    expect(payload.confirmedCandidates).toHaveLength(1);
    expect(payload.candidateBuckets.confirmed).toHaveLength(1);
    expect(payload.counts.confirmedCandidates).toBe(1);
    expect(payload.rows[0].playerName).toBe('Confirmed Slugger');
    expect(payload.dataQuality).toBe('confirmed');
    expect(payload.projectedCandidates[0].warnings?.some((w: string) => w.includes('Official lineup not posted yet'))).toBe(true);
  });
});
