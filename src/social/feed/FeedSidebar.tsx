/**
 * FeedSidebar — Z8 Obsidian rebuild
 *
 * Design rules:
 *  - Z8 tokens only: vouch-emerald (primary), vouch-cyan (secondary), borderless depth
 *  - No per-group rainbow colors — every group and nav item shares the same two-accent system
 *  - Collapsible group sections (open by default, user preference persisted in localStorage)
 *  - Sport pill switcher (MLB / NBA / NFL) at top
 *  - BEGINNER/PRO toggle removed → lives in Settings
 *  - Notifications: one bell in sidebar brand row (desktop) / drawer header (mobile)
 *  - Logout: sidebar footer (desktop) / drawer footer (mobile) only
 *  - Cmd+K hint at top for power users
 *  - All 18+ features preserved, just 2-level hierarchy
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Z8_LABEL, Z8_SIDEBAR_SHELL, Z8_SIDEBAR_PANEL, Z8_SIDEBAR_SURFACE,
  Z8_SIDEBAR_ICON_BOX, Z8_SIDEBAR_ACTIVE, Z8_SIDEBAR_IDLE,
} from '../../theme/z8Tokens';
import {
  UserCircle, Home, ClipboardCheck, BarChart3, User, Settings, Shield,
  Sparkles, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag,
  MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Sliders,
  Eye, Zap, Palette, Users, UserRoundSearch, Swords, LineChart, Bell,
  ChevronDown, Command, ChevronRight, CalendarDays, Grid3x3, Crown, LogOut,
} from 'lucide-react';
import {
  ALL_FEATURES, getSidebarFeatures, loadFeatureLayout,
  FeatureLayout,
} from '../../lib/featureConfig';
import { canAccessThemeStore } from '../../lib/adminDevAccess';
import { preloadSection } from '../../lib/routePreload';
import { NotificationBellButton } from '../../components/notifications/UnifiedNotificationCenter';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, SportId } from '../../sports/registry';
import { useProfileStore } from '../../stores/profileStore';
import { useShallow } from 'zustand/react/shallow';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { performAppLogout } from '../../lib/appLogout';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIDEBAR_GROUPS = ['Daily', 'Pro Labs', 'AI', 'Build & Track', 'Social', 'Account'] as const;

/**
 * Groups that are collapsed by default.
 * User overrides are persisted to localStorage so the state survives refreshes.
 */
const DEFAULT_COLLAPSED: Record<string, boolean> = {
  'Account': false,
  'Social': false,
};

const COLLAPSED_KEY = 've-sidebar-collapsed';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles, MessageSquare,
  ShoppingBag, User, UserCircle, Settings, Users, UserRoundSearch, Swords, LineChart, Bell,
  CalendarDays, Grid3x3, Crown,
};

/** HR nav items use Flame per featureConfig — ensure icon resolves even if registry drifts. */
const HR_NAV_IDS = new Set(['hr_board']);

/** Group → Z8 accent class used for the group header label colour. Disciplined two-accent system: emerald for proof/action groups, cyan for everything else. */
const GROUP_ACCENT: Record<string, string> = {
  Daily: 'text-vouch-cyan',
  'Pro Labs': 'text-vouch-cyan',
  AI: 'text-vouch-cyan',
  'Build & Track': 'text-vouch-cyan',
  Social: 'text-vouch-cyan',
  Account: 'text-white/40',
};

const selectSidebarProfile = (state: ReturnType<typeof useProfileStore.getState>) => {
  const profile = state.profile;
  return {
    displayName: profile.displayName,
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
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadCollapsedState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    if (raw) return { ...DEFAULT_COLLAPSED, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_COLLAPSED };
}

function saveCollapsedState(state: Record<string, boolean>) {
  try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface NavItemProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  onNavigate: (id: string) => void;
  badge?: React.ReactNode;
}

const NavItem = React.memo(function NavItem({ id, label, icon, isActive, onNavigate, badge }: NavItemProps) {
  const resolvedIcon = HR_NAV_IDS.has(id) ? 'Flame' : icon;
  const IconComponent = ICON_MAP[resolvedIcon] || Settings;

  const handleClick = useCallback(() => {
    preloadSection(id);
    onNavigate(id);
  }, [id, onNavigate]);

  const handleIntent = useCallback(() => {
    preloadSection(id);
  }, [id]);

  return (
    <button
      key={id}
      type="button"
      onClick={handleClick}
      onPointerDown={handleIntent}
      onMouseEnter={handleIntent}
      onFocus={handleIntent}
      id={`sidebar-link-${id}`}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'group relative w-full flex items-center justify-center xl:justify-start gap-3',
        'pl-2 xl:pl-3.5 pr-2 xl:pr-3 py-2.5 text-sm uppercase tracking-wide transition-all outline-none font-z8',
        isActive ? `${Z8_SIDEBAR_ACTIVE} shadow-[0_0_28px_rgba(0,240,255,0.22)]` : Z8_SIDEBAR_IDLE,
      ].join(' ')}
    >
      {isActive && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-0 w-[3px] bg-ve-ion shadow-[0_0_14px_rgba(0,229,255,0.95)]"
        />
      )}
      <span
        className={[
          'relative z-10 h-7 w-7 shrink-0 transition-all',
          isActive
            ? 'flex items-center justify-center bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_14px_rgba(0,240,255,0.35)]'
            : `${Z8_SIDEBAR_ICON_BOX} group-hover:text-vouch-cyan group-hover:shadow-[0_0_10px_rgba(0,240,255,0.15)]`,
        ].join(' ')}
      >
        <IconComponent className="h-3.5 w-3.5" />
      </span>
      <span className="relative z-10 hidden xl:block truncate text-[12px] font-bold leading-none">
        {label}
      </span>
      {badge && <span className="relative z-10 ml-auto hidden xl:block">{badge}</span>}
    </button>
  );
});

interface SidebarGroupProps {
  group: string;
  items: Array<{ id: string; label: string; icon: string }>;
  activeSection: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const SidebarGroup = React.memo(function SidebarGroup({
  group,
  items,
  activeSection,
  onNavigate,
  collapsed,
  onToggle,
}: SidebarGroupProps) {
  const accentClass = GROUP_ACCENT[group] || 'text-white/40';
  const hasActive = items.some(i => i.id === activeSection);

  return (
    <div className={['transition-all overflow-hidden', Z8_SIDEBAR_PANEL, hasActive ? 'shadow-[0_0_24px_rgba(0,240,255,0.08)]' : ''].join(' ')}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-vouch-cyan/5 outline-none ${Z8_LABEL}`}
        aria-expanded={!collapsed}
      >
        <span className={['hidden xl:block', accentClass].join(' ')}>
          {group}
        </span>
        <span className="xl:hidden flex items-center justify-center w-5 h-5 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <span className={['block w-1.5 h-1.5 bg-current', accentClass].join(' ')} />
        </span>
        <span className="hidden xl:flex items-center gap-1.5">
          <span className="text-[9px] text-white/30">
            {items.length}
          </span>
          <ChevronDown
            className={[
              'h-3 w-3 text-white/40 transition-transform',
              collapsed ? '-rotate-90' : 'rotate-0',
            ].join(' ')}
          />
        </span>
      </button>

      <div
        className={[
          'overflow-hidden transition-all duration-300',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[1200px] opacity-100',
        ].join(' ')}
        aria-hidden={collapsed}
      >
        <div className="px-2 pb-2.5 pt-2 space-y-1">
          {items.map(f => (
            <NavItem
              key={f.id}
              id={f.id}
              label={f.label}
              icon={f.icon}
              isActive={activeSection === f.id}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

interface FeedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenCmdK?: () => void;
  onLogoutComplete?: () => void;
}

function FeedSidebar({
  activeSection,
  onSectionChange,
  onOpenCmdK,
  onLogoutComplete,
}: FeedSidebarProps) {
  const profile = useProfileStore(useShallow(selectSidebarProfile));
  const [layout, setLayout] = useState<FeatureLayout>(() => loadFeatureLayout());
  const [activeSport, setActiveSportState] = useState<SportId>(() => getActiveSport());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedState);
  const [signingOut, setSigningOut] = useState(false);
  const previousSectionRef = useRef(activeSection);

  // Reload layout only after leaving Customize — avoids localStorage reads on every nav click.
  useEffect(() => {
    const previous = previousSectionRef.current;
    previousSectionRef.current = activeSection;
    if (previous === 'customize' && activeSection !== 'customize') {
      setLayout(loadFeatureLayout());
    }
  }, [activeSection]);

  useEffect(() => onSportChange(setActiveSportState), []);

  const handleSportClick = useCallback((id: SportId) => {
    setActiveSport(id);
    setActiveSportState(id);
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [group]: !prev[group] };
      saveCollapsedState(next);
      return next;
    });
  }, []);

  const handleNavigate = useCallback((id: string) => {
    preloadSection(id);
    onSectionChange(id);
  }, [onSectionChange]);

  const handleLogout = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await performAppLogout(onLogoutComplete);
    } finally {
      setSigningOut(false);
    }
  }, [onLogoutComplete, signingOut]);

  const sidebarFeatures = useMemo(() => {
    const items = getSidebarFeatures(layout, {
      canAccessThemeStore: canAccessThemeStore(profile),
      activeSport,
    });
    for (const id of ['today', 'hr_board', 'mlb_stats'] as const) {
      if (!items.some(f => f.id === id)) {
        const feature = ALL_FEATURES.find(f => f.id === id);
        if (feature) items.push(feature);
      }
    }
    return items
      .filter(f => f.id !== 'notifications')
      .sort((a, b) => a.order - b.order);
  }, [layout, profile, activeSport]);

  const ungrouped = useMemo(() => sidebarFeatures.filter(f => !f.group), [sidebarFeatures]);
  const grouped = useMemo(
    () =>
      SIDEBAR_GROUPS.map(group => ({
        group,
        items: sidebarFeatures.filter(f => f.group === group),
      })).filter(s => s.items.length > 0),
    [sidebarFeatures],
  );

  const profileInitials = useMemo(
    () => profile.displayName.split(' ').map(n => n[0]).join(''),
    [profile.displayName],
  );

  return (
    <aside
      id="z8-feed-sidebar"
      className={[
        'relative hidden md:flex h-full min-h-0 flex-col',
        'w-[72px] xl:w-[280px]',
        Z8_SIDEBAR_SHELL,
        'px-2 xl:px-3.5 py-4',
        'justify-between select-none',
        'z-40 flex-shrink-0 overflow-y-auto scrollbar-none',
      ].join(' ')}
    >
      <div className="relative z-10 space-y-4 flex-1">
        <div className="relative">
          <div className="flex items-start gap-1.5">
            <button
              onClick={() => handleNavigate('feed')}
              className={`group relative min-w-0 flex-1 flex items-center gap-3 ${Z8_SIDEBAR_SURFACE} p-2.5 cursor-pointer transition-all hover:bg-vouch-cyan/8 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]`}
              id="brand-logo-id"
              aria-label="Go to Home Feed"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_16px_rgba(0,240,255,0.25)]">
                <span className={`${Z8_LABEL} text-[13px] font-black tracking-tight text-vouch-cyan`}>VE</span>
              </div>
              <div className="hidden xl:block min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-black uppercase italic tracking-tight text-white">
                    VouchEdge
                  </span>
                  <span className={`${Z8_LABEL} bg-vouch-cyan/15 px-2 py-0.5 text-[9px] tracking-widest text-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]`}>
                    Live
                  </span>
                </div>
                <p className={`mt-0.5 truncate ${Z8_LABEL} text-white/40`}>
                  MLB Intelligence Command
                </p>
              </div>
            </button>
            <NotificationBellButton size="sm" className="shrink-0 mt-0.5" />
          </div>
          <div className="z8-accent-line mt-2.5 w-full" aria-hidden />
        </div>

        <button
          onClick={onOpenCmdK}
          className={`hidden xl:flex w-full items-center gap-2 px-3 py-2 transition-all hover:bg-vouch-cyan/5 hover:text-white ${Z8_SIDEBAR_SURFACE} ${Z8_LABEL} tracking-widest text-white/40`}
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Quick search…</span>
          <span className={`flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${Z8_LABEL}`}>
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        <div
          className={`flex flex-col xl:flex-row gap-1 p-1.5 ${Z8_SIDEBAR_SURFACE}`}
          id="sidebar-sport-switcher"
          role="group"
          aria-label="Sport selector"
        >
          {SPORT_LIST.map(sport => {
            const isActive = activeSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => handleSportClick(sport.id)}
                disabled={!sport.enabled}
                title={sport.enabled ? `Switch to ${sport.label}` : `${sport.label} — coming soon`}
                id={`sidebar-sport-${sport.id}`}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-black uppercase tracking-wide transition-all',
                  isActive
                    ? 'bg-vouch-cyan/10 text-vouch-cyan shadow-[0_0_16px_rgba(0,240,255,0.12)]'
                    : sport.enabled
                      ? 'text-white/40 hover:bg-vouch-cyan/5 hover:text-white hover:shadow-[0_0_12px_rgba(0,240,255,0.08)]'
                      : 'text-white/25 cursor-not-allowed opacity-70',
                ].join(' ')}
              >
                <span className="text-sm leading-none">{sport.emoji}</span>
                <span className="hidden xl:inline">{sport.label}</span>
                {!sport.enabled && (
                  <span className={`hidden xl:inline-flex items-center bg-white/[0.04] px-1.5 py-0.5 text-[9px] tracking-widest text-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${Z8_LABEL}`}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <nav className="space-y-2.5" id="sidebar-nav-container" aria-label="Main navigation">
          {ungrouped.length > 0 && (
            <div className="space-y-1">
              {ungrouped.map(f => (
                <NavItem
                  key={f.id}
                  id={f.id}
                  label={f.label}
                  icon={f.icon}
                  isActive={activeSection === f.id}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}

          {grouped.map(({ group, items }) => (
            <SidebarGroup
              key={group}
              group={group}
              items={items}
              activeSection={activeSection}
              onNavigate={handleNavigate}
              collapsed={!!collapsed[group]}
              onToggle={() => toggleGroup(group)}
            />
          ))}
        </nav>
      </div>

      <div className="relative z-10 mt-4 space-y-2.5">
        <div className={`hidden xl:flex items-center justify-between gap-2 px-3.5 py-2.5 ${Z8_SIDEBAR_SURFACE}`}>
          <div>
            <p className={`${Z8_LABEL} text-[9px] tracking-[0.28em] text-vouch-cyan`}>
              Sync
            </p>
            <p className={`mt-0.5 ${Z8_LABEL} text-white/40`}>
              Live data connected
            </p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 bg-vouch-cyan/10 px-2 py-0.5 text-[9px] tracking-widest text-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.1)] ${Z8_LABEL}`}>
            <span className="h-1.5 w-1.5 bg-vouch-cyan animate-pulse" />
            Online
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
          <button
            onClick={() => handleNavigate('customize')}
            className={[
              'flex items-center justify-center xl:justify-start gap-2 px-3 py-2 transition-all',
              Z8_LABEL, 'tracking-[0.12em]',
              activeSection === 'customize' ? Z8_SIDEBAR_ACTIVE : Z8_SIDEBAR_IDLE,
            ].join(' ')}
            aria-label="Customize layout"
          >
            <Palette className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">Customize</span>
          </button>
          <button
            onClick={() => handleNavigate('settings')}
            className={[
              'flex items-center justify-center xl:justify-start gap-2 px-3 py-2 transition-all',
              Z8_LABEL, 'tracking-[0.12em]',
              activeSection === 'settings' ? Z8_SIDEBAR_ACTIVE : Z8_SIDEBAR_IDLE,
            ].join(' ')}
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">Settings</span>
          </button>
        </div>

        <button
          onClick={() => handleNavigate('profile')}
          className={`relative w-full flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-vouch-cyan/5 hover:shadow-[0_0_16px_rgba(0,240,255,0.06)] ${Z8_SIDEBAR_SURFACE}`}
          id="sidebar-profile-footer"
          aria-label={`View profile of ${profile.displayName}`}
        >
          <ProfileAvatarBorder
            borderId={profile.profileBorderId}
            displayName={profile.displayName}
            initials={profileInitials}
            size="md"
            winRate={profile.winRate}
            isVerified={profile.verified}
          />
          <div className="hidden xl:block min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h4 className={`${Z8_LABEL} text-sm text-white truncate leading-none`}>
                {profile.displayName}
              </h4>
              {profile.verified && (
                <Shield className="h-3 w-3 shrink-0 text-vouch-cyan fill-vouch-cyan/85" />
              )}
            </div>
            <p className={`mt-0.5 ${Z8_LABEL} text-white/40 truncate`}>
              {profile.winRate != null
                ? `${Math.round(profile.winRate * 100)}% win rate`
                : 'View profile'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className={[
            'w-full flex items-center justify-center xl:justify-start gap-2 px-3 py-2.5 transition-all',
            Z8_SIDEBAR_SURFACE,
            Z8_LABEL,
            'tracking-[0.12em] text-white/45 hover:bg-rose-500/10 hover:text-rose-200 hover:shadow-[0_0_16px_rgba(244,63,94,0.12)] disabled:opacity-50',
          ].join(' ')}
          aria-label="Sign out"
          id="sidebar-logout-footer"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden xl:inline">{signingOut ? 'Leaving…' : 'Log out'}</span>
        </button>
      </div>
    </aside>
  );
}

export default React.memo(FeedSidebar);
