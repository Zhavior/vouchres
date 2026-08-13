/**
 * FeedSidebar — flat Z8 Obsidian sidebar
 *
 * Design rules:
 *  - Z8 tokens only: vouch-emerald (primary), vouch-cyan (secondary), borderless depth
 *  - Single fixed width from tablet up (no icon-only middle state, no xl: label toggle)
 *  - Collapsible nav groups (Daily open; Pro Labs / AI / etc. collapsed by default)
 *  - Sport pill switcher (MLB / NBA / NFL) at top
 *  - Notifications: one bell in sidebar brand row (desktop) / drawer header (mobile)
 *  - Logout: sidebar footer (desktop) / drawer footer (mobile) only
 *  - Cmd+K hint at top for power users
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AURORA_LABEL, AURORA_SIDEBAR_SHELL, AURORA_SIDEBAR_SURFACE,
  AURORA_SIDEBAR_ICON_BOX, AURORA_SIDEBAR_ACTIVE, AURORA_SIDEBAR_IDLE,
} from '../../theme/auroraTokens';
import {
  UserCircle, Home, ClipboardCheck, BarChart3, User, Settings, Shield,
  Sparkles, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag,
  MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Sliders,
  Palette, Users, UserRoundSearch, Swords, LineChart, Bell,
  Command, CalendarDays, Grid3x3, Crown, LogOut, Crosshair, ChevronDown, LayoutTemplate,
} from 'lucide-react';
import { loadFeatureLayout, getSidebarFeatures } from '../../lib/featureConfig';
import { preloadSection } from '../../lib/routePreload';
import { NotificationBellButton } from '../../components/notifications/UnifiedNotificationCenter';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, SportId } from '../../sports/registry';
import { useProfileStore } from '../../stores/profileStore';
import { useShallow } from 'zustand/react/shallow';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { performAppLogout } from '../../lib/appLogout';
import { SECTIONS_USING_LIVE_GAMES } from '../../app/sectionNavigation';
import { hasLiveGames, useLiveGames } from '../../hooks/queries/useLiveGames';
import { SidebarLiveOnAirBadge } from './SidebarLiveOnAirBadge';
import { formatProfileWinRate } from '../../lib/profileWinRateDisplay';
import { useSidebarGroupCollapse } from './useSidebarGroupCollapse';
import { FOCUSED_BETA_SHELL_ENABLED, isBetaDestinationActive } from '../../app/betaNavigation';
import VouchEdgeLogo from '../../components/brand/VouchEdgeLogo';
import '../../styles/aurora-sidebar.css';
import '../../styles/shell-surfaces-aurora-max.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIDEBAR_GROUPS = ['Daily', 'Pro Labs', 'AI', 'Build & Track', 'Social', 'Account'] as const;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles, MessageSquare,
  ShoppingBag, User, UserCircle, Settings, Users, UserRoundSearch, Swords, LineChart, Bell,
  CalendarDays, Grid3x3, Crown, Crosshair, Shield, LayoutTemplate,
};

/** HR nav items use Flame per featureConfig — ensure icon resolves even if registry drifts. */
const HR_NAV_IDS = new Set(['hr_board']);

const selectSidebarProfile = (state: ReturnType<typeof useProfileStore.getState>) => {
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

function isSidebarItemActive(activeSection: string, featureId: string): boolean {
  if (!FOCUSED_BETA_SHELL_ENABLED) return activeSection === featureId;
  if (featureId === 'today') return isBetaDestinationActive(activeSection, 'today');
  if (featureId === 'hr_aurora_max') return activeSection === 'hr_aurora_max';
  if (featureId === 'hr_board') return isBetaDestinationActive(activeSection, 'research') && activeSection !== 'hr_aurora_max';
  if (featureId === 'results') return isBetaDestinationActive(activeSection, 'track_record');
  return activeSection === featureId;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface NavItemProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  onNavigate: (id: string) => void;
  showLiveOnAir?: boolean;
}

function NavBadge({ id }: { id: string }) {
  if (id !== 'hr_aurora_max') return null;
  return (
    <span className="relative z-10 ml-auto shrink-0 rounded-full bg-vouch-cyan/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-vouch-cyan">
      New
    </span>
  );
}

const NavItem = React.memo(function NavItem({ id, label, icon, isActive, onNavigate, showLiveOnAir = false }: NavItemProps) {
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
      aria-label={label}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      className={[
        've-aurora-nav-item group relative flex w-full items-center gap-3 rounded-xl',
        'py-2.5 pl-3 pr-2 text-sm tracking-wide transition-all outline-none font-z8',
        isActive ? AURORA_SIDEBAR_ACTIVE : AURORA_SIDEBAR_IDLE,
      ].join(' ')}
      data-active={isActive ? 'true' : 'false'}
    >
      {isActive && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-200 via-vouch-cyan to-vouch-emerald"
        />
      )}
      <span
        className={[
          'relative z-10 h-8 w-8 shrink-0 rounded-lg transition-all',
          isActive
            ? 'flex items-center justify-center border border-vouch-cyan/25 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_18px_rgba(79,184,220,0.12)]'
            : `${AURORA_SIDEBAR_ICON_BOX} group-hover:text-vouch-cyan`,
        ].join(' ')}
      >
        <IconComponent className="h-4 w-4" />
      </span>
      <span className="relative z-10 min-w-0 flex-1 truncate text-left text-[12px] font-bold leading-none">
        {label}
      </span>
      <NavBadge id={id} />
      {showLiveOnAir && (
        <span className="relative z-10 ml-auto shrink-0">
          <SidebarLiveOnAirBadge />
        </span>
      )}
    </button>
  );
});

interface SidebarSectionProps {
  group: string;
  items: Array<{ id: string; label: string; icon: string }>;
  activeSection: string;
  onNavigate: (id: string) => void;
  liveGamesActive?: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

const SidebarSection = React.memo(function SidebarSection({
  group,
  items,
  activeSection,
  onNavigate,
  liveGamesActive = false,
  collapsed,
  onToggle,
}: SidebarSectionProps) {
  const sectionId = `sidebar-group-${group.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-1">
      <button
        type="button"
        id={sectionId}
        aria-expanded={!collapsed}
        aria-controls={`${sectionId}-items`}
        onClick={onToggle}
        className={`ve-aurora-group-label flex w-full items-center justify-between gap-2 px-3 pb-1 pt-2 ${AURORA_LABEL} text-[10px] tracking-[0.18em] text-white/35 transition hover:text-white/65`}
      >
        <span>{group}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-white/30 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          aria-hidden
        />
      </button>
      {!collapsed && (
        <div id={`${sectionId}-items`} className="space-y-0.5">
          {items.map(f => (
            <NavItem
              key={f.id}
              id={f.id}
              label={f.label}
              icon={f.icon}
              isActive={isSidebarItemActive(activeSection, f.id)}
              onNavigate={onNavigate}
              showLiveOnAir={liveGamesActive && f.id === 'live_games'}
            />
          ))}
        </div>
      )}
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
  const [activeSport, setActiveSportState] = useState<SportId>(() => getActiveSport());
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => onSportChange(setActiveSportState), []);

  const handleSportClick = useCallback((id: SportId) => {
    setActiveSport(id);
    setActiveSportState(id);
  }, []);

  const handleNavigate = useCallback((id: string) => {
    preloadSection(id);
    onSectionChange(id);
  }, [onSectionChange]);

  const handleOpenAllTools = useCallback(() => {
    onOpenCmdK?.();
  }, [onOpenCmdK]);

  const handleLogout = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await performAppLogout(onLogoutComplete);
    } finally {
      setSigningOut(false);
    }
  }, [onLogoutComplete, signingOut]);

  const [featureLayout] = useState(() => loadFeatureLayout());
  const sidebarFeatures = useMemo(() => {
    return getSidebarFeatures(featureLayout, {
      activeSport,
      canAccessAdmin: Boolean(profile.isAdmin || profile.admin),
    }).map((feature) => {
      if (feature.id !== 'premium') return feature;
      const managesPlan = profile.subscriptionTier === 'GOLD' || profile.subscriptionTier === 'SELLER_PRO';
      return { ...feature, label: managesPlan ? 'Plan & Billing' : 'Upgrade' };
    });
  }, [featureLayout, activeSport, profile.admin, profile.isAdmin, profile.subscriptionTier]);

  const ungrouped = useMemo(() => sidebarFeatures.filter(f => !f.group), [sidebarFeatures]);
  const grouped = useMemo(
    () =>
      SIDEBAR_GROUPS.map(group => ({
        group,
        items: sidebarFeatures.filter(f => f.group === group),
      })).filter(s => s.items.length > 0),
    [sidebarFeatures],
  );

  const sectionIdsByGroup = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const { group, items } of grouped) {
      map.set(group, items.map((item) => item.id));
    }
    return map;
  }, [grouped]);

  const { isCollapsed, toggleGroup } = useSidebarGroupCollapse(activeSection, sectionIdsByGroup);

  const profileInitials = useMemo(
    () => profile.displayName.split(' ').map(n => n[0]).join(''),
    [profile.displayName],
  );

  const needsFastLivePoll =
    SECTIONS_USING_LIVE_GAMES.has(activeSection) || activeSection === 'today';

  const { data: liveGamesPayload, isError: liveGamesError, isLoading: liveGamesLoading } = useLiveGames({
    refetchInterval: needsFastLivePoll ? undefined : 45_000,
  });
  const liveGamesActive = hasLiveGames(liveGamesPayload);
  const liveDataState = liveGamesError ? 'Unavailable' : liveGamesLoading ? 'Checking' : 'Connected';

  return (
    <aside
      id="z8-feed-sidebar"
      className={[
        've-aurora-sidebar relative hidden md:flex h-full min-h-0 flex-col',
        'w-full min-w-0',
        AURORA_SIDEBAR_SHELL,
        'px-3 py-3.5',
        'justify-between select-none',
        'z-40 flex-shrink-0 overflow-hidden',
      ].join(' ')}
    >
      <div className="z8-sidebar-scroll relative z-10 flex-1 min-h-0 space-y-3 px-0.5 pb-7">
        <div className="relative">
          <div className="flex items-start gap-2">
            <button
              onClick={() => handleNavigate(FOCUSED_BETA_SHELL_ENABLED ? 'today' : 'feed')}
              className={`ve-aurora-sidebar-brand group relative flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition-all ${AURORA_SIDEBAR_SURFACE}`}
              id="brand-logo-id"
              aria-label={FOCUSED_BETA_SHELL_ENABLED ? 'Go to Today' : 'Go to Home Feed'}
            >
              <VouchEdgeLogo emeraldMark markClassName="h-10 w-10" className="min-w-0" />
              <div className="ve-aurora-brand-status absolute bottom-2.5 right-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.65)]" />
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">Open Beta · Aurora Max</span>
              </div>
            </button>
            <NotificationBellButton size="sm" className="shrink-0 mt-0.5" />
          </div>
          <div className="ve-aurora-accent-line mt-2.5 w-full" aria-hidden />
        </div>

        <button
          onClick={onOpenCmdK}
          className={`ve-aurora-sidebar-search flex w-full items-center gap-2 rounded-xl px-3 py-2.5 transition-all hover:text-white ${AURORA_SIDEBAR_SURFACE} ${AURORA_LABEL} tracking-widest text-white/40`}
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Quick search…</span>
          <span className={`flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${AURORA_LABEL}`}>
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        {!FOCUSED_BETA_SHELL_ENABLED && (
          <div
            className={`flex flex-row gap-1 p-1.5 ${AURORA_SIDEBAR_SURFACE}`}
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
                  aria-label={sport.enabled ? `Switch to ${sport.label}` : `${sport.label} — coming soon`}
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
                  <span>{sport.label}</span>
                  {!sport.enabled && (
                    <span className={`inline-flex items-center bg-white/[0.04] px-1.5 py-0.5 text-[9px] tracking-widest text-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${AURORA_LABEL}`}>
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <nav className="space-y-1" id="sidebar-nav-container" aria-label="Main navigation">
          <div className="flex items-center justify-between gap-2 px-3">
            <span className={`${AURORA_LABEL} text-[9px] tracking-[0.2em] text-white/35`}>
              Your workspace
            </span>
            {!FOCUSED_BETA_SHELL_ENABLED && (
              <button
                type="button"
                onClick={handleOpenAllTools}
                disabled={!onOpenCmdK}
                className={`${AURORA_LABEL} inline-flex items-center gap-1.5 px-2 py-1 text-[9px] tracking-[0.12em] text-vouch-cyan transition-colors hover:bg-vouch-cyan/10 disabled:cursor-default disabled:opacity-35`}
                aria-label="Explore all tools"
                title="Explore all tools"
              >
                <Grid3x3 className="h-3 w-3" />
                <span>All tools</span>
              </button>
            )}
          </div>
          {FOCUSED_BETA_SHELL_ENABLED ? (
            <div className="space-y-0.5">
              {sidebarFeatures.map(f => (
                <NavItem
                  key={f.id}
                  id={f.id}
                  label={f.label}
                  icon={f.icon}
                  isActive={isSidebarItemActive(activeSection, f.id)}
                  onNavigate={handleNavigate}
                  showLiveOnAir={liveGamesActive && f.id === 'live_games'}
                />
              ))}
            </div>
          ) : (
            <>
              {ungrouped.length > 0 && (
                <div className="space-y-1">
                  {ungrouped.map(f => (
                    <NavItem
                      key={f.id}
                      id={f.id}
                      label={f.label}
                      icon={f.icon}
                      isActive={f.id === 'brain_picks'
                        ? activeSection === 'brain_picks' || activeSection === 'brain_performance'
                        : isSidebarItemActive(activeSection, f.id)}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              )}

              {grouped.map(({ group, items }) => (
                <SidebarSection
                  key={group}
                  group={group}
                  items={items}
                  activeSection={activeSection}
                  onNavigate={handleNavigate}
                  liveGamesActive={liveGamesActive}
                  collapsed={isCollapsed(group)}
                  onToggle={() => toggleGroup(group)}
                />
              ))}
            </>
          )}
        </nav>
      </div>

      <div className="z8-sidebar-dock ve-aurora-sidebar-dock relative z-10 -mx-3 -mb-4 mt-2 space-y-2 px-3 pb-3 pt-2.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className={`inline-flex min-w-0 items-center gap-2 ${AURORA_LABEL} text-white/40`}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-vouch-cyan/80" aria-hidden />
            <span className="truncate tracking-[0.18em]">MLB feed</span>
          </span>
          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] tracking-widest ${AURORA_LABEL} ${
            liveGamesError ? 'bg-rose-300/10 text-rose-200' : liveGamesLoading ? 'bg-white/5 text-white/45' : 'bg-emerald-300/10 text-emerald-200'
          }`}>
            {liveDataState}
          </span>
        </div>

        <div className={`grid gap-1.5 ${FOCUSED_BETA_SHELL_ENABLED ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!FOCUSED_BETA_SHELL_ENABLED && (
            <button
              onClick={() => handleNavigate('customize')}
              className={[
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-all',
                AURORA_LABEL, 'tracking-[0.12em]',
                activeSection === 'customize' ? AURORA_SIDEBAR_ACTIVE : AURORA_SIDEBAR_IDLE,
              ].join(' ')}
              aria-label="Customize layout"
            >
              <Palette className="h-3.5 w-3.5 shrink-0" />
              <span>Customize</span>
            </button>
          )}
          <button
            onClick={() => handleNavigate('settings')}
            className={[
              'flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-all',
              AURORA_LABEL, 'tracking-[0.12em]',
              activeSection === 'settings' ? AURORA_SIDEBAR_ACTIVE : AURORA_SIDEBAR_IDLE,
            ].join(' ')}
              aria-label="Settings"
              aria-current={activeSection === 'settings' ? 'page' : undefined}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span>Settings</span>
          </button>
        </div>

        <button
          onClick={() => handleNavigate('profile')}
          className={`ve-aurora-profile-card relative flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition-all ${AURORA_SIDEBAR_SURFACE}`}
          id="sidebar-profile-footer"
          aria-label={`View profile of ${profile.displayName}`}
          aria-current={activeSection === 'profile' ? 'page' : undefined}
          data-active={activeSection === 'profile' ? 'true' : 'false'}
        >
          <ProfileAvatarBorder
            borderId={profile.profileBorderId}
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            initials={profileInitials}
            size="md"
            winRate={profile.winRate}
            isVerified={profile.verified}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h4 className={`${AURORA_LABEL} text-sm text-white truncate leading-none`}>
                {profile.displayName}
              </h4>
              {profile.verified && (
                <Shield className="h-3 w-3 shrink-0 text-vouch-cyan fill-vouch-cyan/85" />
              )}
            </div>
            <p className={`mt-0.5 ${AURORA_LABEL} text-white/40 truncate`}>
              {formatProfileWinRate(profile, { suffix: 'win rate' })}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className={[
            'w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-all',
            AURORA_SIDEBAR_SURFACE,
            AURORA_LABEL,
            'tracking-[0.12em] text-white/45 hover:bg-rose-500/10 hover:text-rose-200 hover:shadow-[0_0_16px_rgba(244,63,94,0.12)] disabled:opacity-50',
          ].join(' ')}
          aria-label="Sign out"
          id="sidebar-logout-footer"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>{signingOut ? 'Leaving…' : 'Log out'}</span>
        </button>
      </div>
    </aside>
  );
}

export default FeedSidebar;
