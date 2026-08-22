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
  it('mounts only the replacement list, parlay editor, and ledger', () => {
    expect(workspace).toContain("type WorkspaceView = 'list' | 'parlay' | 'saved'");
    expect(workspace).toContain('My List &amp; Parlay Editor');
    expect(workspace).toContain('My List + Editor');
    expect(workspace).toContain('Parlay Editor');
    expect(workspace).toContain('Parlay Ledger');
    expect(workspace).not.toContain('AI Picks');
    expect(workspace).not.toContain('CommunityPanel');
    expect(workspace).not.toContain('ParlayOsTemplatesRow');
  });

  it('keeps saved players independent until explicitly promoted to a parlay', () => {
    expect(workspace).toContain("type ListState = 'players' | 'waiting' | 'removed'");
    expect(workspace).toContain('Keep Player Only');
    expect(workspace).toContain('Add to Parlay');
    expect(workspace).toContain('A verified game is required before this player can become a gradable parlay leg.');
    expect(workspace).toContain('Unconfirmed targets can wait here without affecting the active parlay.');
  });

  it('opens a compact dock without navigating away from the current page', () => {
    expect(layer).toContain('Open picks');
    expect(layer).toContain('onClick={toggleSheet}');
    expect(layer).toContain('aria-label="My List"');
    expect(layer).toContain('Full Workspace');
    expect(layer).toContain('onClick={handleOpenHub}');
    expect(layer).not.toContain('max-h-[85vh]');
    expect(layer).not.toContain('ParlayBuilderRail');
    expect(appShell).toContain("suppressFloatingDock={activeSection === 'build' || activeSection === 'live_parlays'}");
  });

  it('opens the canonical replacement workspace without the old mobile shell', () => {
    expect(router).toContain("case 'live_parlays':");
    expect(router).toContain('<ParlayShell key="live_parlays"');
    expect(router).toContain("parlayOsPanelForSection('live_parlays')");
    expect(workspace).toContain('useState<WorkspaceView>');
    expect(workspace).toContain('My List and parlay workspace');
    expect(workspace).not.toContain('ParlayOsMobileSlipDock');
  });
});
