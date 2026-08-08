import { describe, expect, it } from 'vitest';
import { ALL_FEATURES } from '../src/lib/featureConfig';

describe('My List navigation contract', () => {
  it('exposes one canonical My List product entry', () => {
    const parlayEntries = ALL_FEATURES.filter((feature) =>
      feature.id === 'live_parlays' || feature.id === 'build',
    );

    expect(parlayEntries).toEqual([
      expect.objectContaining({
        id: 'live_parlays',
        label: 'My List',
        enabled: true,
        locked: true,
      }),
    ]);
  });
});
