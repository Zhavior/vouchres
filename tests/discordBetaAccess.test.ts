import { describe, expect, it } from 'vitest';
import { isDiscordBetaGateOpen } from '../src/lib/discordBetaAccess';
import { FOUNDER_EMAIL } from '../src/lib/founderAccess';
import { mapAuthMeToCreatorProof } from '../src/lib/profileFromAuth';

describe('isDiscordBetaGateOpen', () => {
  const member = { discordGuildMember: true, discordBetaAccess: true };
  const unverified = { discordGuildMember: false, discordBetaAccess: false };

  it('lets guests through', () => {
    expect(isDiscordBetaGateOpen(unverified, { accountId: null, isDev: false, forceGate: true })).toBe(true);
    expect(isDiscordBetaGateOpen(unverified, { accountId: '', isDev: false, forceGate: true })).toBe(true);
  });

  it('skips the wall in Vite DEV unless forceGate is on', () => {
    expect(isDiscordBetaGateOpen(unverified, { accountId: 'user-1', isDev: true, forceGate: false })).toBe(true);
    expect(isDiscordBetaGateOpen(unverified, { accountId: 'user-1', isDev: true, forceGate: true })).toBe(false);
  });

  it('lets the founder email through in production even without Discord flags', () => {
    expect(isDiscordBetaGateOpen(unverified, {
      accountId: 'user-1',
      email: FOUNDER_EMAIL,
      isDev: false,
      forceGate: true,
    })).toBe(true);
  });

  it('lets staff and admin through in production even without Discord flags', () => {
    expect(isDiscordBetaGateOpen(
      { ...unverified, isStaff: true },
      { accountId: 'user-1', isDev: false, forceGate: true },
    )).toBe(true);
    expect(isDiscordBetaGateOpen(
      { ...unverified, isAdmin: true },
      { accountId: 'user-1', isDev: false, forceGate: true },
    )).toBe(true);
  });

  it('requires both Discord flags for a normal production account', () => {
    expect(isDiscordBetaGateOpen(unverified, { accountId: 'user-1', isDev: false, forceGate: true })).toBe(false);
    expect(isDiscordBetaGateOpen(
      { discordGuildMember: true, discordBetaAccess: false },
      { accountId: 'user-1', isDev: false, forceGate: true },
    )).toBe(false);
    expect(isDiscordBetaGateOpen(member, { accountId: 'user-1', isDev: false, forceGate: true })).toBe(true);
  });
});

describe('mapAuthMeToCreatorProof Discord flags', () => {
  it('keeps current Discord flags when /api/auth/me omits them', () => {
    const mapped = mapAuthMeToCreatorProof(
      { handle: 'ace' },
      {
        displayName: 'Ace',
        username: 'ace',
        handle: 'ace',
        avatarUrl: '',
        bio: '',
        verified: false,
        winRate: 0,
        totalPicks: 0,
        wonPicks: 0,
        unitsTracked: 0,
        unitsNetProfit: 0,
        subscriptionTier: 'BASIC',
        discordGuildMember: true,
        discordBetaAccess: true,
      },
    );
    expect(mapped.discordGuildMember).toBe(true);
    expect(mapped.discordBetaAccess).toBe(true);
  });

  it('honors an explicit false from /api/auth/me', () => {
    const mapped = mapAuthMeToCreatorProof(
      { discord_guild_member: false, discord_beta_access: false },
      {
        displayName: 'Ace',
        username: 'ace',
        handle: 'ace',
        avatarUrl: '',
        bio: '',
        verified: false,
        winRate: 0,
        totalPicks: 0,
        wonPicks: 0,
        unitsTracked: 0,
        unitsNetProfit: 0,
        subscriptionTier: 'BASIC',
        discordGuildMember: true,
        discordBetaAccess: true,
      },
    );
    expect(mapped.discordGuildMember).toBe(false);
    expect(mapped.discordBetaAccess).toBe(false);
  });
});
