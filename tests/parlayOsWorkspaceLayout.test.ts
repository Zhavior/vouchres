import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workspace = readFileSync(
  new URL('../src/components/parlay/ParlayOsWorkspace.tsx', import.meta.url),
  'utf8',
);
const layer = readFileSync(
  new URL('../src/components/parlay/os/ParlayOsLayer.tsx', import.meta.url),
  'utf8',
);
const appShell = readFileSync(
  new URL('../src/app/AppShell.tsx', import.meta.url),
  'utf8',
);
const router = readFileSync(
  new URL('../src/components/routing/MainViewRouter.tsx', import.meta.url),
  'utf8',
);

describe('ParlayOS workspace foundation', () => {
  it('uses a 65/35-style desktop builder and watchlist split', () => {
    expect(workspace).toContain("lg:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)]");
    expect(workspace).toContain('Slip Builder');
    expect(workspace).toContain('Watchlist');
    expect(workspace).toContain('Research queue');
    expect(workspace).not.toContain('layout="fixed"');
    expect(workspace).not.toContain('xl:pr-80');
  });

  it('shows honest watchlist states without inventing targets', () => {
    expect(workspace).toContain("type WatchlistTab = 'targets' | 'waiting' | 'removed'");
    expect(workspace).toContain('Nothing under review yet');
    expect(workspace).toContain('Nothing waiting for confirmation');
    expect(workspace).toContain('Waiting targets never affect active-slip odds or risk calculations.');
  });

  it('opens a compact dock without navigating away from the current page', () => {
    expect(layer).toContain('Open slip dock');
    expect(layer).toContain('onClick={toggleSheet}');
    expect(layer).toContain('aria-label="ParlayOS dock"');
    expect(layer).toContain('Full Workspace');
    expect(layer).toContain('onClick={handleOpenHub}');
    expect(layer).not.toContain('max-h-[85vh]');
    expect(layer).not.toContain('ParlayBuilderRail');
    expect(appShell).toContain("suppressFloatingDock={activeSection === 'build' || activeSection === 'live_parlays'}");
  });

  it('opens the canonical navigation on Build and gives mobile focused workspace tabs', () => {
    expect(router).toContain('<ParlayShell key="live_parlays" panel="build"');
    expect(workspace).toContain("'slip' | 'watchlist' | 'review'");
    expect(workspace).toContain('ParlayOS mobile workspace');
    expect(workspace).not.toContain('ParlayOsMobileSlipDock');
  });
});
