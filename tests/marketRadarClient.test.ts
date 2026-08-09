import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authenticatedGet } = vi.hoisted(() => ({ authenticatedGet: vi.fn() }));

vi.mock('../src/lib/apiClient', () => ({
  apiClient: { get: authenticatedGet },
}));

import { vouchedgeApi } from '../src/api/vouchedgeApi';

describe('vouchedgeApi.marketRadar', () => {
  beforeEach(() => authenticatedGet.mockReset());

  it('uses the authenticated API client for the protected Radar route', async () => {
    const response = { date: '2026-08-08', edges: [] };
    authenticatedGet.mockResolvedValue(response);

    await expect(vouchedgeApi.marketRadar('2026-08-08')).resolves.toBe(response);
    expect(authenticatedGet).toHaveBeenCalledWith('/api/market-radar', { date: '2026-08-08' });
  });
});
