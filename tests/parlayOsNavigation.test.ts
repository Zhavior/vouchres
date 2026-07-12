import { describe, expect, it } from 'vitest';
import { ALL_FEATURES } from '../src/lib/featureConfig';

describe('ParlayOS navigation contract', () => {
  it('exposes one canonical ParlayOS product entry', () => {
    const parlayEntries = ALL_FEATURES.filter((feature) =>
      feature.id === 'live_parlays' || feature.id === 'build',
    );

    expect(parlayEntries).toEqual([
      expect.objectContaining({
        id: 'live_parlays',
        label: 'ParlayOS',
        enabled: true,
        locked: true,
      }),
    ]);
  });
});
