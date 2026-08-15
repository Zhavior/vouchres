// @vitest-environment happy-dom

import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../src/lib/routePreload', () => ({
  isEagerHrSection: () => false,
  preloadSection: vi.fn(),
}));

vi.mock('../src/components/notifications/UnifiedNotificationCenter', () => ({
  NotificationBellButton: () => <div data-testid="notification-bell" />,
}));

vi.mock('../src/hooks/queries/useLiveGames', () => ({
  hasLiveGames: () => false,
  useLiveGames: () => ({ data: null, isError: false, isLoading: false }),
}));

vi.mock('../src/stores/profileStore', () => ({
  useProfileStore: () => ({
    displayName: 'Test User',
    avatarUrl: '',
    verified: true,
    winRate: 68,
    profileBorderId: 'default',
    role: 'PRO',
    userRole: 'user',
    isAdmin: false,
    admin: false,
    isStaff: false,
    staff: false,
    isDeveloper: false,
    subscriptionTier: 'GOLD',
  }),
}));

import FeedSidebar from '../src/social/feed/FeedSidebar';

describe('FeedSidebar keyboard shortcuts and active state highlights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('highlights only the matching active page and does not highlight on unlisted pages', () => {
    const onSectionChange = vi.fn();

    // 1. On "today": only today is active
    const { container: cToday, unmount: uToday } = render(
      <FeedSidebar activeSection="today" onSectionChange={onSectionChange} />,
    );
    const todayBtn = cToday.querySelector('#sidebar-link-today');
    const hrBtn = cToday.querySelector('#sidebar-link-hr_board');
    const resultsBtn = cToday.querySelector('#sidebar-link-results');
    expect(todayBtn?.getAttribute('aria-current')).toBe('page');
    expect(todayBtn?.getAttribute('data-active')).toBe('true');
    expect(hrBtn?.getAttribute('aria-current')).toBeNull();
    expect(hrBtn?.getAttribute('data-active')).toBe('false');
    expect(resultsBtn?.getAttribute('aria-current')).toBeNull();
    expect(resultsBtn?.getAttribute('data-active')).toBe('false');
    uToday();

    // 2. On "hr_board": only hr_board is active
    const { container: cHr, unmount: uHr } = render(
      <FeedSidebar activeSection="hr_board" onSectionChange={onSectionChange} />,
    );
    expect(cHr.querySelector('#sidebar-link-today')?.getAttribute('aria-current')).toBeNull();
    expect(cHr.querySelector('#sidebar-link-hr_board')?.getAttribute('aria-current')).toBe('page');
    expect(cHr.querySelector('#sidebar-link-results')?.getAttribute('aria-current')).toBeNull();
    uHr();

    // 3. On unlisted page e.g. "pitcher_matchup": NO sidebar link is active
    const { container: cPitcher, unmount: uPitcher } = render(
      <FeedSidebar activeSection="pitcher_matchup" onSectionChange={onSectionChange} />,
    );
    const allActiveItems = cPitcher.querySelectorAll('[data-active="true"]');
    expect(allActiveItems.length).toBe(0);
    expect(cPitcher.querySelector('#sidebar-link-today')?.getAttribute('aria-current')).toBeNull();
    expect(cPitcher.querySelector('#sidebar-link-hr_board')?.getAttribute('aria-current')).toBeNull();
    expect(cPitcher.querySelector('#sidebar-link-results')?.getAttribute('aria-current')).toBeNull();
    expect(cPitcher.querySelector('#sidebar-link-live_games')?.getAttribute('aria-current')).toBeNull();
    expect(cPitcher.querySelector('#sidebar-link-premium')?.getAttribute('aria-current')).toBeNull();
    expect(cPitcher.querySelector('#sidebar-profile-footer')?.getAttribute('aria-current')).toBeNull();
    uPitcher();

    // 4. On unlisted page e.g. "feed" or "build" or "welcome": NO sidebar link is active
    const { container: cFeed, unmount: uFeed } = render(
      <FeedSidebar activeSection="feed" onSectionChange={onSectionChange} />,
    );
    expect(cFeed.querySelectorAll('[data-active="true"]').length).toBe(0);
    uFeed();

    const { container: cWelcome, unmount: uWelcome } = render(
      <FeedSidebar activeSection="welcome" onSectionChange={onSectionChange} />,
    );
    expect(cWelcome.querySelectorAll('[data-active="true"]').length).toBe(0);
    uWelcome();
  });

  it('renders keybind badges with aria-keyshortcuts on sidebar links', () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <FeedSidebar activeSection="today" onSectionChange={onSectionChange} />,
    );

    const todayLink = container.querySelector('#sidebar-link-today');
    expect(todayLink?.getAttribute('aria-keyshortcuts')).toBe('1');
    expect(todayLink?.textContent).toContain('1');

    const hrLink = container.querySelector('#sidebar-link-hr_board');
    expect(hrLink?.getAttribute('aria-keyshortcuts')).toBe('2');
    expect(hrLink?.textContent).toContain('2');

    const settingsBtn = container.querySelector('button[aria-label="Settings (S)"]');
    expect(settingsBtn).not.toBeNull();
    expect(settingsBtn?.getAttribute('aria-keyshortcuts')).toBe('S');

    const profileBtn = container.querySelector('#sidebar-profile-footer');
    expect(profileBtn?.getAttribute('aria-keyshortcuts')).toBe('P');
  });

  it('handles number keybinds 1-9 to navigate to corresponding sidebar items', () => {
    const onSectionChange = vi.fn();
    render(<FeedSidebar activeSection="today" onSectionChange={onSectionChange} />);

    // Press '1' -> navigates to 'today'
    fireEvent.keyDown(window, { key: '1' });
    expect(onSectionChange).toHaveBeenCalledWith('today');

    // Press '2' -> navigates to 'hr_board'
    fireEvent.keyDown(window, { key: '2' });
    expect(onSectionChange).toHaveBeenCalledWith('hr_board');

    // Press '3' -> navigates to 'live_games'
    fireEvent.keyDown(window, { key: '3' });
    expect(onSectionChange).toHaveBeenCalledWith('live_games');

    // Press '4' -> navigates to 'results'
    fireEvent.keyDown(window, { key: '4' });
    expect(onSectionChange).toHaveBeenCalledWith('results');

    // Press 's' -> navigates to 'settings'
    fireEvent.keyDown(window, { key: 's' });
    expect(onSectionChange).toHaveBeenCalledWith('settings');

    // Press 'p' -> navigates to 'profile'
    fireEvent.keyDown(window, { key: 'p' });
    expect(onSectionChange).toHaveBeenCalledWith('profile');
  });

  it('cycles through sidebar sections with [ and ] keys', () => {
    const onSectionChange = vi.fn();
    render(<FeedSidebar activeSection="today" onSectionChange={onSectionChange} />);

    // Press ']' -> steps to next section (hr_board)
    fireEvent.keyDown(window, { key: ']' });
    expect(onSectionChange).toHaveBeenCalledWith('hr_board');

    // Press '[' from 'today' -> steps to last section
    fireEvent.keyDown(window, { key: '[' });
    expect(onSectionChange).toHaveBeenCalled();
  });

  it('does not trigger keybinds when typing in an input element', () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <div>
        <input data-testid="search-box" />
        <FeedSidebar activeSection="today" onSectionChange={onSectionChange} />
      </div>,
    );

    const input = container.querySelector('[data-testid="search-box"]') as HTMLInputElement;
    input.focus();

    fireEvent.keyDown(input, { key: '1' });
    fireEvent.keyDown(input, { key: '2' });
    fireEvent.keyDown(input, { key: 's' });
    fireEvent.keyDown(input, { key: 'p' });

    expect(onSectionChange).not.toHaveBeenCalled();
  });
});
