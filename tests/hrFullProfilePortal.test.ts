import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/features/hr/components/Profile/HrPlayerProfile.tsx', 'utf8');

describe('HR full profile modal boundary', () => {
  it('covers the full viewport above the app shell with a fixed, high z-index layer', () => {
    expect(source).toContain('className="ve-hr-profile-backdrop fixed inset-0 z-50"');
    expect(source).toContain('fixed inset-0 z-[60]');
  });

  it('renders as a modal dialog that closes on backdrop click', () => {
    expect(source).toContain('role="dialog" aria-modal="true"');
    expect(source).toContain('onClick={onClose}');
  });

  it('returns null instead of rendering when no player is selected', () => {
    expect(source).toContain('if (!player) return null;');
  });
});
