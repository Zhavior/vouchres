import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/ProfilePageZ8.tsx', 'utf8');

describe('Profile trust layout', () => {
  it('does not present fabricated membership or grader status', () => {
    expect(source).not.toContain('Member registered verification: June 19, 2026');
    expect(source).not.toContain('ACTIVE GRADER');
    expect(source).not.toContain('Every parlay risk leg is archived in your browser ledger');
  });

  it('labels performance as settled data with a clear disclosure', () => {
    expect(source).toContain('SETTLED DATA');
    expect(source).toContain('displayedProfile.totalPicks');
  });

  it('renders a server-backed proof snapshot instead of only local post results', () => {
    expect(source).toContain("['profile-proof', profileUserId]");
    expect(source).toContain('Verified record');
    expect(source).toContain('Recent locked picks');
    expect(source).toContain('Pending picks never improve this record.');
  });

  it('keeps owner-only actions off community profiles', () => {
    expect(source).toContain('const isOwnProfile = !viewUserId || viewUserId === user?.id;');
    expect(source).toContain('{isOwnProfile && (');
  });
});
