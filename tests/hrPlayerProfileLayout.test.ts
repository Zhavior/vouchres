import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/features/hr/components/Profile/HrPlayerProfile.tsx', import.meta.url),
  'utf8',
);

describe('HR full profile layout', () => {
  it('portals the profile outside transformed page containers', () => {
    expect(source).toContain("import { createPortal } from 'react-dom';");
    expect(source).toContain('return createPortal(');
    expect(source).toContain('document.body,');
  });

  it('uses the dedicated premium dossier stylesheet', () => {
    expect(source).toContain("import './hr-player-profile.css';");
    expect(source).toContain('hr-profile__rail');
    expect(source).toContain('hr-profile__metrics');
    expect(source).toContain('max-w-[1320px]');
  });

  it('uses the full viewport on mobile and only the content column on desktop', () => {
    expect(source).toContain('inset-y-0 left-0 right-0');
    expect(source).toContain('md:left-[72px]');
    expect(source).toContain('xl:left-[280px]');
    expect(source).not.toContain('className="fixed inset-0 z-[60]');
  });

  it('keeps the desktop navigation above the profile backdrop', () => {
    expect(source).toContain('z-30 md:left-[72px] xl:left-[280px]');
  });
});
