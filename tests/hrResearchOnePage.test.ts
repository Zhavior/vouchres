import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const profile = readFileSync('src/features/hr/components/Profile/HrPlayerProfile.tsx', 'utf8');
const spy = readFileSync('src/features/hr/components/Profile/useResearchScrollSpy.ts', 'utf8');
const page = readFileSync('src/features/hr/pages/HomeRunIntelligencePage.tsx', 'utf8');

describe('HR research one-page dossier', () => {
  it('renders all research sections on one scroll page', () => {
    expect(profile).toContain('data-research-section="overview"');
    expect(profile).toContain('data-research-section="layers"');
    expect(profile).toContain('data-research-section="bvp"');
    expect(profile).toContain('data-research-section="team"');
    expect(profile).toContain('data-research-section="form"');
    expect(profile).toContain('ve-hr-research-page');
    expect(profile).not.toContain("activeSection === 'overview' &&");
  });

  it('uses scroll-spy jump navigation instead of tab swapping', () => {
    expect(spy).toContain('IntersectionObserver');
    expect(spy).toContain('scrollIntoView');
    expect(profile).toContain('scrollToSection');
    expect(profile).toContain('Jump to research');
  });

  it('lazy-loads board views and research dossier for faster first paint', () => {
    expect(page).toContain("lazy(() => import('../components/Columns/HrBoard')");
    expect(page).toContain("lazy(() => import('../components/Profile/HrPlayerProfile')");
    expect(page).toContain('{isProfileOpen && vm.selectedPlayer && (');
  });
});
