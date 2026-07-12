import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/ProfilePage.tsx', 'utf8');

describe('Profile trust layout', () => {
  it('does not present fabricated membership or grader status', () => {
    expect(source).not.toContain('Member registered verification: June 19, 2026');
    expect(source).not.toContain('ACTIVE GRADER');
    expect(source).not.toContain('Every parlay risk leg is archived in your browser ledger');
  });

  it('labels performance as settled data with a clear disclosure', () => {
    expect(source).toContain('SETTLED DATA');
    expect(source).toContain('Unsettled picks and local-only drafts are excluded.');
    expect(source).toContain("profile.totalPicks > 0 ? `${profile.totalPicks} PICKS TRACKED` : 'NO SETTLED PICKS'");
  });

  it('keeps owner-only actions off community profiles', () => {
    expect(source).toContain('const isOwnProfile = !viewUserId || viewUserId === user?.id;');
    expect(source).toContain('{isOwnProfile && (');
    expect(source).toContain('Back to your profile');
  });
});
