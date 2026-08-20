// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DiscordBetaAccessGate from '../src/components/auth/DiscordBetaAccessGate';
import type { CreatorProofProfile } from '../src/types';

vi.mock('../src/lib/discordClient', () => ({
  startDiscordConnect: vi.fn(),
  retryDiscordGuildJoin: vi.fn(),
}));

const mockProfile: CreatorProofProfile = {
  id: 'test-user-1',
  displayName: 'Test User',
  username: 'testuser',
  handle: 'testuser',
  avatarUrl: '',
  bio: '',
  verified: false,
  winRate: 0,
  totalPicks: 0,
  wonPicks: 0,
  unitsTracked: 0,
  unitsNetProfit: 0,
  subscriptionTier: 'BASIC',
  discordConnectedAt: null,
  discordGuildMember: false,
  discordBetaAccess: false,
};

describe('DiscordBetaAccessGate', () => {
  it('renders children when the gate is open for a verified member', () => {
    const verifiedProfile = {
      ...mockProfile,
      discordGuildMember: true,
      discordBetaAccess: true,
    };

    render(
      <DiscordBetaAccessGate profile={verifiedProfile}>
        <div data-testid="protected-content">HR Next Board</div>
      </DiscordBetaAccessGate>,
    );

    expect(screen.getByTestId('protected-content')).not.toBeNull();
    expect(screen.queryByText(/Join Discord to Unlock HR Next/i)).toBeNull();
  });

  it('renders the Discord beta access gate when unverified in forced gate mode', () => {
    const originalEnv = import.meta.env.VITE_FORCE_DISCORD_BETA_GATE;
    import.meta.env.VITE_FORCE_DISCORD_BETA_GATE = 'true';

    try {
      render(
        <DiscordBetaAccessGate profile={mockProfile}>
          <div data-testid="protected-content">HR Next Board</div>
        </DiscordBetaAccessGate>,
      );

      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.getByText(/Join Discord to Unlock HR Next/i)).not.toBeNull();
      expect(screen.getByText(/Connect Discord & Enter HR Next/i)).not.toBeNull();
    } finally {
      import.meta.env.VITE_FORCE_DISCORD_BETA_GATE = originalEnv;
    }
  });
});
