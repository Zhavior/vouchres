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
});
