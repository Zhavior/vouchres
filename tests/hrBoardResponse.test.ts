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

  it('never lets isConfirmed smuggle projected-like rows into candidates[]', () => {
    const payload = buildHrBoardApiPayload({
      candidates: [
        {
          playerId: 1,
          playerName: 'Fake Confirmed',
          team: 'NYY',
          hrScore: 99,
          lineupStatus: 'projected_unconfirmed',
          isConfirmed: true,
        },
      ],
    });

    expect(payload.candidates).toHaveLength(0);
    expect(payload.confirmedCandidates).toHaveLength(0);
  });

  it('sanitizes rawRows fallback instead of publishing unsanitized board rows', () => {
    const payload = buildHrBoardApiPayload({
      confirmedCandidates: [],
      projectedCandidates: [],
      allProjectedCandidates: [],
      rows: [
        {
          playerId: 9,
          playerName: 'Mismatch Guy',
          team: 'NYY',
          hrScore: 80,
          lineupStatus: 'confirmed',
          blockedReasons: ['Team mismatch / stale roster assignment'],
        },
        {
          playerId: 10,
          playerName: 'Preview Guy',
          team: 'BOS',
          hrScore: 70,
          lineupStatus: 'projected_unconfirmed',
        },
      ],
    });

    expect(payload.candidates).toHaveLength(0);
    expect(payload.rows.map((row: { playerName: string }) => row.playerName)).toEqual(['Preview Guy']);
    expect(payload.rows[0].warnings?.some((w: string) => w.includes('Official lineup not posted yet'))).toBe(true);
  });
});
