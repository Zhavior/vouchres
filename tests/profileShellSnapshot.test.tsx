// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AppShellProvider,
  useAppPosts,
  useAppProfile,
  useAppSavedSlips,
  useAppSavedVouchIds,
  useAppShell,
} from '../src/context/AppShellContext';
import { useAppCommandStore } from '../src/stores/appCommandStore';
import { useVouchesStore } from '../src/stores/vouchesStore';
import type { Vouch } from '../src/types';

/**
 * Mirrors ProfileShell's store subscriptions in MainViewRouter without mounting
 * the full ProfilePageZ8 tree (auth/query/recharts).
 */
function ProfileShell() {
  const { onSaveVouch } = useAppShell();
  const savedVouchIds = useAppSavedVouchIds();
  const posts = useAppPosts();
  const profile = useAppProfile();
  const savedSlips = useAppSavedSlips();
  const {
    onClearProfileViewUser,
    onUpdateProfile,
    onLikePost,
    onVouchPost,
    onRepostPost,
    onDeletePost,
    onAddComment,
  } = useAppCommandStore();

  void onSaveVouch;
  void onClearProfileViewUser;
  void onUpdateProfile;
  void onLikePost;
  void onVouchPost;
  void onRepostPost;
  void onDeletePost;
  void onAddComment;

  return (
    <div data-testid="profile-shell">
      <span data-testid="saved-vouch-ids">{savedVouchIds.join(',')}</span>
      <span data-testid="profile-name">{profile.displayName}</span>
      <span data-testid="post-count">{posts.length}</span>
      <span data-testid="slip-count">{savedSlips.length}</span>
    </div>
  );
}

function stubVouch(id: string): Vouch {
  return {
    id,
    vouchSource: 'test',
    userNote: '',
    market: 'HR',
    sport: 'MLB',
    gameName: 'NYY @ BOS',
    odds: '+200',
    status: 'PENDING',
    savedCount: 0,
    vouchedCount: 0,
    createdAt: '2026-08-13T00:00:00.000Z',
  };
}

afterEach(() => {
  useVouchesStore.setState({ savedVouches: [] });
});

describe('ProfileShell zustand snapshots', () => {
  it('renders without max-update-depth when saved vouch ids are derived', () => {
    useVouchesStore.setState({
      savedVouches: [stubVouch('v1'), stubVouch('v2')],
    });

    expect(() => {
      render(
        <AppShellProvider value={{ accountId: null, onSaveVouch: () => {} }}>
          <ProfileShell />
        </AppShellProvider>,
      );
    }).not.toThrow();

    expect(screen.getByTestId('profile-shell')).toBeTruthy();
    expect(screen.getByTestId('saved-vouch-ids').textContent).toBe('v1,v2');
  });

  it('keeps the same id snapshot across rerender when vouches are unchanged', () => {
    useVouchesStore.setState({
      savedVouches: [stubVouch('v1')],
    });

    const view = render(
      <AppShellProvider value={{ accountId: null, onSaveVouch: () => {} }}>
        <ProfileShell />
      </AppShellProvider>,
    );

    expect(screen.getByTestId('saved-vouch-ids').textContent).toBe('v1');

    expect(() => {
      view.rerender(
        <AppShellProvider value={{ accountId: null, onSaveVouch: () => {} }}>
          <ProfileShell />
        </AppShellProvider>,
      );
    }).not.toThrow();

    expect(screen.getByTestId('saved-vouch-ids').textContent).toBe('v1');
  });
});
