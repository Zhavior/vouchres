import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const profileCss = readFileSync('src/styles/hr-profile.css', 'utf8');
const profileSource = readFileSync('src/features/hr/components/Profile/HrPlayerProfile.tsx', 'utf8');

describe('HR full profile sidebar boundary', () => {
  it('keeps the full profile inside the desktop content viewport', () => {
    expect(profileCss).toContain('#layout-inner-frame:not(.ve-layout-welcome) .ve-hr-profile-shell');
    expect(profileCss).toContain('left: var(--ve-sidebar-width, 72px)');
    expect(profileCss).toContain('width: auto');
  });

  it('keeps the backdrop on the same boundary as the profile', () => {
    expect(profileCss).toContain('#layout-inner-frame:not(.ve-layout-welcome) .ve-hr-profile-backdrop');
  });

  it('preserves the mobile full-screen dialog behavior', () => {
    expect(profileCss).toContain('@media (min-width: 768px)');
    expect(profileSource).toContain('className="ve-hr-profile ve-hr-profile-shell fixed inset-0');
  });
});
