import { describe, expect, it } from 'vitest';
import {
  PRODUCT_WORKSPACES,
  getPrimaryProductNavigation,
  getProductWorkspace,
} from '../src/app/productNavigation';

describe('customer-facing product navigation', () => {
  it('exposes exactly five stable product concepts', () => {
    expect(getPrimaryProductNavigation().map((item) => item.label)).toEqual([
      'Today',
      'Intelligence',
      'Players',
      'Parlays',
      'Profile',
    ]);
  });

  it('assigns every section to only one workspace', () => {
    const sections = PRODUCT_WORKSPACES.flatMap((workspace) => workspace.sections);
    expect(new Set(sections).size).toBe(sections.length);
  });

  it('keeps specialist routes available without promoting them to primary navigation', () => {
    expect(getProductWorkspace('hitter_matchup_zones').id).toBe('intelligence');
    expect(getProductWorkspace('results').id).toBe('parlays');
    expect(getProductWorkspace('subscriber_hub').id).toBe('profile');
  });

  it('falls back safely to Today for unknown legacy routes', () => {
    expect(getProductWorkspace('unknown-route').id).toBe('today');
  });
});
