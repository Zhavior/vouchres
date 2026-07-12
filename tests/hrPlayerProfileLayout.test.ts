import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/features/hr/components/Profile/HrPlayerProfile.tsx', import.meta.url),
  'utf8',
);

describe('HR full profile layout', () => {
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
