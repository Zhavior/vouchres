import { describe, expect, it } from 'vitest';
import { resolveVisibleHrRows } from '../server/services/mlb/hrBoardResponse';

describe('resolveVisibleHrRows', () => {
  it('falls back to the full projected pool when no confirmed or preview rows are available', () => {
    const visibleRows = resolveVisibleHrRows({
      confirmedCandidates: [],
      projectedCandidates: [],
      fullProjectedCandidates: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      previewLimit: 0,
    });

    expect(visibleRows).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  });
});
