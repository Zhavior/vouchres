import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PRODUCT_WORKSPACES,
  getPrimaryProductNavigation,
  getProductWorkspace,
} from '../src/app/productNavigation';

const shellSources = [
  '../src/social/feed/FeedSidebar.tsx',
  '../src/social/feed/MobileProfileDrawer.tsx',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

describe('customer-facing product navigation', () => {
  it('exposes exactly five stable product concepts', () => {
    expect(getPrimaryProductNavigation().map((item) => item.label)).toEqual([
      'Today',
      'HR Intelligence',
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

  it('drives desktop and mobile navigation from the workspace model without false active states', () => {
    for (const source of shellSources) {
      expect(source).toContain('getSidebarFeatures');
      expect(
        source.includes('activeSection === item.id') ||
          source.includes('activeSection === f.id'),
      ).toBe(true);
    }
  });
});
