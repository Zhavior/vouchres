// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiPost = vi.fn(async () => ({ ok: true }));
const apiPatch = vi.fn(async () => ({ ok: true }));

vi.mock('../src/lib/apiClient', () => ({
  apiClient: {
    post: (...args: unknown[]) => apiPost(...args),
    patch: (...args: unknown[]) => apiPatch(...args),
  },
}));

vi.mock('../src/lib/apiBase', () => ({
  apiUrl: (path: string) => path,
}));

import {
  fetchVapidPublicKey,
  getLocalPushPref,
  isPushSupported,
  setLocalPushPref,
  subscribeToPush,
  unsubscribeFromPush,
} from '../src/lib/pushNotifications';

describe('pushNotifications client', () => {
  beforeEach(() => {
    apiPost.mockClear();
    apiPatch.mockClear();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('tracks local push preference', () => {
    expect(getLocalPushPref()).toBe(true);
    setLocalPushPref(false);
    expect(getLocalPushPref()).toBe(false);
  });

  it('reports unsupported environments honestly', () => {
    expect(isPushSupported()).toBe(false);
  });

  it('reads VAPID public key from the API envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ok: true, publicKey: 'test-public', configured: true }),
      })),
    );

    await expect(fetchVapidPublicKey()).resolves.toEqual({
      publicKey: 'test-public',
      configured: true,
    });
  });

  it('fails closed when push APIs are missing', async () => {
    const result = await subscribeToPush();
    expect(result.ok).toBe(false);
    expect(result.warning).toMatch(/not supported/i);
  });

  it('clears preference on unsubscribe even without PushManager', async () => {
    setLocalPushPref(true);
    const result = await unsubscribeFromPush();
    expect(result.ok).toBe(true);
    expect(getLocalPushPref()).toBe(false);
  });
});
