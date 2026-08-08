import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PRODUCT_WORKSPACES,
  getPrimaryProductNavigation,
  getProductWorkspace,
} from '../src/app/productNavigation';

const desktopSidebarSource = readFileSync(
  new URL('../src/social/feed/FeedSidebar.tsx', import.meta.url),
  'utf8',
);
const mobileDrawerSource = readFileSync(
  new URL('../src/social/feed/MobileProfileDrawer.tsx', import.meta.url),
  'utf8',
);

describe('customer-facing product navigation', () => {
  it('exposes exactly four stable beta product jobs', () => {
    expect(getPrimaryProductNavigation().map((item) => item.label)).toEqual([
      'Today',
      'Research',
      'Track Record',
      'Account',
    ]);
  });

  it('assigns every section to only one workspace', () => {
    const sections = PRODUCT_WORKSPACES.flatMap((workspace) => workspace.sections);
    expect(new Set(sections).size).toBe(sections.length);
  });

  it('keeps specialist routes available without promoting them to primary navigation', () => {
    expect(getProductWorkspace('hitter_matchup_zones').id).toBe('research');
    expect(getProductWorkspace('results').id).toBe('track_record');
    expect(getProductWorkspace('subscriber_hub').id).toBe('account');
  });

  it('falls back safely to Today for unknown legacy routes', () => {
    expect(getProductWorkspace('unknown-route').id).toBe('today');
  });

  it('drives desktop and mobile navigation from the workspace model without false active states', () => {
    for (const source of [desktopSidebarSource, mobileDrawerSource]) {
      expect(source).toContain('getSidebarFeatures');
      expect(source).toContain('isBetaDestinationActive');
    }
    expect(desktopSidebarSource).toContain('isSidebarItemActive(activeSection, f.id)');
    expect(mobileDrawerSource).toContain('isDrawerItemActive(activeSection, item.id)');
  });
});
