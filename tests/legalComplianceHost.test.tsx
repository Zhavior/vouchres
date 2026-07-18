// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('../src/lib/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../src/lib/analytics', () => ({
  initPostHog: vi.fn(),
}));

import { LegalComplianceHost } from '../src/components/legal/LegalComplianceHost';

describe('LegalComplianceHost', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthMock.mockReset();
  });

  it('shows cookie banner when consent is missing', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(<LegalComplianceHost isLoggedIn={false} />);
    expect(await screen.findByLabelText('Cookie consent')).toBeTruthy();
  });

  it('shows LegalGate for signed-in users missing age confirmation', async () => {
    localStorage.setItem(
      'vouchedge.cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        consented_at: new Date().toISOString(),
        version: 1,
      }),
    );
    useAuthMock.mockReturnValue({
      user: {
        id: 'u1',
        age_confirmed_at: null,
        jurisdiction_confirmed_at: null,
        jurisdiction: null,
      },
      loading: false,
      refresh: vi.fn(),
    });

    render(<LegalComplianceHost isLoggedIn />);
    expect(await screen.findByRole('heading', { name: 'Before you continue' })).toBeTruthy();
  });

  it('hides LegalGate once age + jurisdiction are confirmed', () => {
    localStorage.setItem(
      'vouchedge.cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        consented_at: new Date().toISOString(),
        version: 1,
      }),
    );
    useAuthMock.mockReturnValue({
      user: {
        id: 'u1',
        age_confirmed_at: '2026-01-01T00:00:00Z',
        jurisdiction_confirmed_at: '2026-01-01T00:00:00Z',
        jurisdiction: 'US-NJ',
      },
      loading: false,
      refresh: vi.fn(),
    });

    render(<LegalComplianceHost isLoggedIn />);
    expect(screen.queryByRole('heading', { name: 'Before you continue' })).toBeNull();
  });
});
