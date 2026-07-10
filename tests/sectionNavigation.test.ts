import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PUBLIC_SECTIONS,
  consumeAfterAuthDestination,
  gateSectionForAuth,
  redirectToPublicIntro,
  requiresLogin,
  resolveAuthenticatedSection,
  saveAfterAuthDestination,
} from '../src/app/sectionNavigation';

function mockLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal('localStorage', {
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
  return store;
}

describe('sectionNavigation auth gate', () => {
  beforeEach(() => {
    mockLocalStorage();
    vi.stubGlobal('window', {
      history: { replaceState: vi.fn() },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('only exposes the intro terminal as a public section', () => {
    expect([...PUBLIC_SECTIONS]).toEqual(['vouchedge_intro']);
    expect(requiresLogin('welcome')).toBe(true);
    expect(requiresLogin('hr_board')).toBe(true);
    expect(requiresLogin('vouchedge_intro')).toBe(false);
  });

  it('redirects signed-out users to intro and saves their destination', () => {
    const replaceState = vi.fn();
    vi.stubGlobal('window', { history: { replaceState } });

    const gated = gateSectionForAuth('hr_board');

    expect(gated).toBe('vouchedge_intro');
    expect(localStorage.getItem('vouchedge_after_auth_destination')).toBe('hr_board');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/vouchedge');
  });

  it('restores saved destination after auth for signed-in users leaving intro', () => {
    mockLocalStorage({
      'sb-test-auth-token': JSON.stringify({
        access_token: 'x'.repeat(24),
        user: { id: 'user-1' },
      }),
      vouchedge_active_section: 'hr_board',
    });

    expect(resolveAuthenticatedSection('vouchedge_intro')).toBe('hr_board');
  });

  it('consumes the saved after-auth destination once', () => {
    saveAfterAuthDestination('today');
    expect(consumeAfterAuthDestination()).toBe('today');
    expect(consumeAfterAuthDestination()).toBeNull();
  });

  it('redirectToPublicIntro rewrites the URL to /vouchedge', () => {
    const replaceState = vi.fn();
    vi.stubGlobal('window', { history: { replaceState } });

    redirectToPublicIntro();

    expect(replaceState).toHaveBeenCalledWith(null, '', '/vouchedge');
  });
});
