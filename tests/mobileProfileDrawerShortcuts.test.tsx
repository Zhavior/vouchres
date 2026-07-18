// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../src/hooks/queries/useLiveGames', () => ({
  hasLiveGames: () => false,
  useLiveGames: () => ({ data: null }),
}));

vi.mock('../src/components/notifications/UnifiedNotificationCenter', () => ({
  NotificationBellButton: () => null,
}));

import MobileProfileDrawer from '../src/social/feed/MobileProfileDrawer';

const profile = {
  id: 'u1',
  username: 've',
  displayName: 'VE',
  avatarUrl: '',
  subscriptionTier: 'BASIC',
  totalPicks: 0,
  winRate: 0,
  unitsNetProfit: 0,
} as any;

describe('MobileProfileDrawer shortcuts', () => {
  it('exposes Judge Home and HR Board in the Menu drawer', () => {
    const onSectionChange = vi.fn();
    render(
      <MobileProfileDrawer
        open
        onClose={vi.fn()}
        activeSection="today"
        onSectionChange={onSectionChange}
        profile={profile}
      />,
    );

    expect(screen.getByText('Judge Home')).toBeTruthy();
    expect(screen.getByText('HR Board')).toBeTruthy();
    fireEvent.click(screen.getByText('Judge Home'));
    expect(onSectionChange).toHaveBeenCalledWith('judge_home');
  });
});
