import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getAuthToken: vi.fn(),
  refreshSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../src/lib/supabaseClient', () => ({
  getAuthToken: authMocks.getAuthToken,
  supabase: {
    auth: {
      refreshSession: authMocks.refreshSession,
      signOut: authMocks.signOut,
    },
  },
}));

describe('apiClient auth recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { location: { origin: 'https://app.test' } });
  });

  it('refreshes once and retries /api/auth/me without signing out', async () => {
    authMocks.getAuthToken
      .mockResolvedValueOnce('stale-access-token')
      .mockResolvedValueOnce('fresh-access-token');
    authMocks.refreshSession.mockResolvedValue({
      data: { session: { access_token: 'fresh-access-token' } },
      error: null,
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, data: { id: 'user-1' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { apiClient } = await import('../src/lib/apiClient');
    await expect(apiClient.get('/api/auth/me')).resolves.toEqual({ id: 'user-1' });

    expect(authMocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(authMocks.signOut).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer fresh-access-token',
    });
  });

  it('surfaces a failed refresh without revoking the session', async () => {
    authMocks.getAuthToken.mockResolvedValue('stale-access-token');
    authMocks.refreshSession.mockResolvedValue({
      data: { session: null },
      error: new Error('refresh failed'),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
    ));

    const { apiClient } = await import('../src/lib/apiClient');
    await expect(apiClient.get('/api/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(authMocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(authMocks.signOut).not.toHaveBeenCalled();
  });
});
