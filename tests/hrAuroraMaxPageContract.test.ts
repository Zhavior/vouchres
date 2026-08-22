import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HR Command Desk Aurora Max contract', () => {
  it('is a new route, not a restyle of Home Run Intelligence', () => {
    const page = readFileSync('src/features/hr-max/pages/HrAuroraMaxPage.tsx', 'utf8');
    const desk = readFileSync('src/features/hr-max/components/HrMaxDesk.tsx', 'utf8');
    const routes = readFileSync('src/lib/routeModules.ts', 'utf8');
    const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');

    expect(existsSync('src/features/hr/pages/HomeRunIntelligencePageZ8.tsx')).toBe(false);
    expect(routes).not.toContain('hrMax');
    expect(routes).not.toContain('HrAuroraMaxPage');
    expect(router).toContain('const HrAuroraMaxPage = lazyPage(');
    expect(router).toContain("import('../../features/hr-max/pages/HrAuroraMaxPage')");
    expect(router).toContain("case 'hr_max':");
    expect(router).toContain('HrAuroraMaxPage');
    expect(router).not.toContain('HomeRunIntelligencePageZ8');
    expect(page).not.toContain('HomeRunIntelligencePageZ8');
    expect(desk).not.toContain('HomeRunIntelligencePageZ8');
    expect(desk).not.toContain("from '../../hr/components/Columns/HrBoard'");
    expect(desk).not.toContain('z8-hr-lens');
    expect(desk).not.toContain('HrCommandCenter');
    expect(desk).not.toContain('WorkspaceRenderer');
    expect(desk).toContain('useHrBoardViewModel');
    expect(desk).toContain('AuroraMaxCommandHeader');
    expect(desk).toContain('Research command desk');
  });

  it('keeps the desk internally synchronous inside its route chunk', () => {
    const desk = readFileSync('src/features/hr-max/components/HrMaxDesk.tsx', 'utf8');
    const page = readFileSync('src/features/hr-max/pages/HrAuroraMaxPage.tsx', 'utf8');

    expect(page).not.toContain('lazyWithRetry');
    expect(desk).not.toContain('lazyWithRetry');
    expect(desk).not.toContain('React.lazy');
    expect(desk).not.toContain('loadHrCommandCenter');
    expect(desk).not.toContain('loadWorkspaceRenderer');

    const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
    expect(router).toContain('const HrAuroraMaxPage = lazyPage(');
    expect(router).toContain("import('../../features/hr-max/pages/HrAuroraMaxPage')");

    const appNav = readFileSync('src/app/AppNav.tsx', 'utf8');
    const cmdk = readFileSync('src/social/feed/CmdKPalette.tsx', 'utf8');
    const shell = readFileSync('src/app/AppShell.tsx', 'utf8');
    expect(appNav).not.toContain("preloadSection('hr_max')");
    expect(cmdk).not.toMatch(/CMDK_PREFETCH_SECTIONS = \[[^\]]*hr_max/);
    expect(shell).toContain('allowParlayOsLayer');
    expect(shell).toContain('isEagerHrSection');
    expect(shell).not.toMatch(/lazyWithRetry\(\(\)\s*=>\s*import\([^)]*MainViewRouter/);
    expect(shell).toContain("import MainViewRouter from '../components/routing/MainViewRouter'");
  });
});
