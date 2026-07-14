import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/features/hr/components/Profile/HrPlayerProfile.tsx', 'utf8');

describe('HR full profile modal boundary', () => {
  it('escapes the app shell stacking context through a body portal', () => {
    expect(source).toContain("import { createPortal } from 'react-dom'");
    expect(source).toContain('return createPortal(');
    expect(source).toContain('document.body');
  });

  it('covers the navigation sidebar while the full profile is open', () => {
    expect(source).toContain('fixed inset-0 z-[190]');
    expect(source).toContain('fixed inset-0 z-[200] flex flex-col');
  });

  it('keeps server rendering safe', () => {
    expect(source).toContain("if (!player || typeof document === 'undefined') return null;");
  });
});
