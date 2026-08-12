// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';
import { hasRealAuthToken } from '../src/app/sectionNavigation';
import { getPersistedAuthSession, signOut, supabase } from '../src/lib/supabaseClient';

describe('auth session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ignores a stale legacy access-token copy', () => {
    localStorage.setItem('vouchedge_auth_token', 'stale-token-that-is-long-enough');
    expect(hasRealAuthToken()).toBe(false);
  });

  it('recognizes the canonical Supabase session', () => {
    localStorage.setItem('vouchedge.auth', JSON.stringify({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: 'user-1' },
    }));
    expect(getPersistedAuthSession()?.user.id).toBe('user-1');
    expect(hasRealAuthToken()).toBe(true);
  });

  it('uses local scope for an explicit browser sign-out', async () => {
    const original = supabase.auth.signOut;
    let receivedScope: string | undefined;
    supabase.auth.signOut = (async (options?: { scope?: 'global' | 'local' | 'others' }) => {
      receivedScope = options?.scope;
      return { error: null };
    }) as typeof supabase.auth.signOut;

    try {
      await signOut();
      expect(receivedScope).toBe('local');
    } finally {
      supabase.auth.signOut = original;
    }
  });
});
