/**
 * Shared navigation model for the app shell.
 *
 * The route list, the active-section rules and the icon lookup used to live
 * inside FeedSidebar. The rail is gone — routes render in the global top bar —
 * but the mobile drawer and the command palette need the same answers, so the
 * model lives here rather than inside any one piece of chrome.
 */

import type React from 'react';
import {
  UserCircle, Home, ClipboardCheck, BarChart3, User, Settings, Shield,
  Sparkles, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag,
  MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Sliders,
  Users, UserRoundSearch, Swords, LineChart, Bell,
  CalendarDays, Grid3x3, Crown, Crosshair, LayoutTemplate, Newspaper,
} from 'lucide-react';
import { isAuroraHqFamilySection } from './betaNavigation';
import type { useProfileStore } from '../stores/profileStore';

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles, MessageSquare,
  ShoppingBag, User, UserCircle, Settings, Users, UserRoundSearch, Swords, LineChart, Bell,
  CalendarDays, Grid3x3, Crown, Crosshair, Shield, LayoutTemplate, Newspaper,
};

/**
 * Routes that carry an on-air indicator while MLB games are live — the live
 * desks themselves, not every section that happens to poll the feed.
 */
export const LIVE_ON_AIR_SECTIONS = new Map<string, 'pill' | 'dot'>([
  ['live_games', 'pill'],
]);

export const selectShellProfile = (state: ReturnType<typeof useProfileStore.getState>) => {
  const profile = state.profile;
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    verified: profile.verified,
    winRate: profile.winRate,
    profileBorderId: profile.profileBorderId,
    role: profile.role,
    userRole: profile.userRole,
    isAdmin: profile.isAdmin,
    admin: profile.admin,
    isStaff: profile.isStaff,
    staff: profile.staff,
    isDeveloper: profile.isDeveloper,
    subscriptionTier: profile.subscriptionTier,
  };
};

/** A route tab is active for more sections than the one it is named after. */
export function isNavItemActive(activeSection: string, featureId: string): boolean {
  if (featureId === 'aurora_hr_hq') return isAuroraHqFamilySection(activeSection);
  // `admin_hr_next` renders the same HR Next page behind the admin gate and no
  // longer has a tab of its own, so the Daily tab is what lights up for it —
  // otherwise landing there via the launchpad tile or the `2` shortcut leaves
  // the bar with nothing selected.
  if (featureId === 'hr_board') {
    return (
      activeSection === 'hr_board' ||
      activeSection === 'daily_hr_watch_new' ||
      activeSection === 'admin_hr_next'
    );
  }
  if (featureId === 'td_next') {
    return activeSection === 'td_next';
  }
  if (featureId === 'brain_picks') return activeSection === 'brain_picks' || activeSection === 'brain_performance';
  return activeSection === featureId;
}

export function isEditingText(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
  return false;
}
