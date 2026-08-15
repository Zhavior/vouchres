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
  Command, CalendarDays, Grid3x3, Crown, LogOut, Crosshair, ChevronDown, LayoutTemplate, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { loadFeatureLayout, getSidebarFeatures } from '../../lib/featureConfig';
import { isEagerHrSection, preloadSection } from '../../lib/routePreload';
import { NotificationBellButton } from '../../components/notifications/UnifiedNotificationCenter';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, SportId } from '../../sports/registry';
import { useProfileStore } from '../../stores/profileStore';
import { useNavUiStore } from '../../stores/navUiStore';
import { useShallow } from 'zustand/react/shallow';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { performAppLogout } from '../../lib/appLogout';
import { SECTIONS_USING_LIVE_GAMES } from '../../app/sectionNavigation';
import { hasLiveGames, useLiveGames } from '../../hooks/queries/useLiveGames';
import { SidebarLiveOnAirBadge } from './SidebarLiveOnAirBadge';
import { formatProfileWinRate } from '../../lib/profileWinRateDisplay';
import { useSidebarGroupCollapse } from './useSidebarGroupCollapse';
import { FOCUSED_BETA_SHELL_ENABLED, isAuroraHqFamilySection, isBetaDestinationActive } from '../../app/betaNavigation';
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
  if (featureId === 'aurora_hr_hq') return isAuroraHqFamilySection(activeSection);
  if (featureId === 'hr_board') return activeSection === 'hr_board' || activeSection === 'daily_hr_watch_new';
  if (featureId === 'brain_picks') return activeSection === 'brain_picks' || activeSection === 'brain_performance';
  return activeSection === featureId;
}

function isEditingText(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
  return false;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface NavItemProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  onNavigate: (id: string) => void;
  showLiveOnAir?: boolean;
  shortcut?: string;
  isSidebarCollapsed?: boolean;
}

const NavItem = React.memo(function NavItem({
  id,
  label,
  icon,
  isActive,
  onNavigate,
  showLiveOnAir = false,
  shortcut,
  isSidebarCollapsed,
}: NavItemProps) {
  const resolvedIcon = icon;
  const IconComponent = ICON_MAP[resolvedIcon] || Settings;

  const handleClick = useCallback(() => {
    if (!isEagerHrSection(id)) preloadSection(id);
    onNavigate(id);
  }, [id, onNavigate]);

  const handleIntent = useCallback(() => {
    if (!isEagerHrSection(id)) preloadSection(id);
  }, [id]);

  const titleWithShortcut = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      key={id}
      type="button"
      onClick={handleClick}
      onPointerDown={handleIntent}
      onMouseEnter={handleIntent}
      onFocus={handleIntent}
      id={`sidebar-link-${id}`}
      aria-label={titleWithShortcut}
      title={titleWithShortcut}
      aria-keyshortcuts={shortcut}
      aria-current={isActive ? 'page' : undefined}
      className={[
        've-aurora-nav-item group relative flex w-full items-center gap-3 rounded-xl',
        'transition-all outline-none font-z8',
        isSidebarCollapsed ? 'justify-center py-2 !px-0' : 'py-2.5 pl-3 pr-2 text-sm tracking-wide',
        !isSidebarCollapsed && isActive ? AURORA_SIDEBAR_ACTIVE : !isSidebarCollapsed ? AURORA_SIDEBAR_IDLE : '',
      ].join(' ')}
      data-active={isActive ? 'true' : 'false'}
    >
      {isActive && !isSidebarCollapsed && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-200 via-vouch-cyan to-vouch-emerald"
        />
      )}
      <span
        className={[
          'relative z-10 shrink-0 transition-all flex items-center justify-center',
          isSidebarCollapsed ? 'h-9 w-9 rounded-xl' : 'h-8 w-8 rounded-lg',
          isActive && isSidebarCollapsed
            ? 'text-vouch-cyan bg-cyan-500/10'
            : isActive && !isSidebarCollapsed
              ? 'border border-vouch-cyan/25 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_18px_rgba(79,184,220,0.12)]'
              : isSidebarCollapsed
                ? 'text-slate-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-300'
                : `${AURORA_SIDEBAR_ICON_BOX} group-hover:text-vouch-cyan`,
        ].join(' ')}
      >
        <IconComponent className={isSidebarCollapsed ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <span className={`relative z-10 min-w-0 flex-1 truncate text-left text-[12px] font-bold leading-none overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[200px]'}`}>
        {label}
      </span>
      <span className={`relative z-10 ml-auto flex items-center gap-1.5 shrink-0 overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[100px]'}`}>
        {showLiveOnAir && <SidebarLiveOnAirBadge />}
        {shortcut && (
          <kbd
            className={[
              'pointer-events-none hidden md:inline-flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1 text-[9px] font-mono font-medium rounded transition-all select-none',
              isActive
                ? 'bg-vouch-cyan/15 text-vouch-cyan border border-vouch-cyan/25 shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                : 'bg-white/[0.03] text-white/30 border border-white/[0.06] group-hover:border-white/15 group-hover:text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
            ].join(' ')}
            aria-hidden="true"
          >
            {shortcut}
          </kbd>
        )}
      </span>
      {isSidebarCollapsed && (
        <div className="fixed left-[76px] z-[9999] bg-[#0c121e]/95 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-md text-xs font-mono text-cyan-200 shadow-[0_10px_30px_rgba(0,0,0,0.8)] whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
          {titleWithShortcut}
        </div>
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
  shortcutMap?: Map<string, string>;
  isSidebarCollapsed?: boolean;
}

const SidebarSection = React.memo(function SidebarSection({
  group,
  items,
  activeSection,
  onNavigate,
  liveGamesActive = false,
  collapsed,
  onToggle,
  shortcutMap,
  isSidebarCollapsed,
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
        className={`ve-aurora-group-label flex w-full items-center justify-between gap-2 px-3 pb-1 pt-2 ${AURORA_LABEL} text-[10px] tracking-[0.18em] text-white/35 transition hover:text-white/65 overflow-hidden duration-200 ${isSidebarCollapsed ? 'opacity-0 max-h-0 !p-0 pointer-events-none' : 'opacity-100 max-h-[30px]'}`}
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
              shortcut={shortcutMap?.get(f.id)}
              isSidebarCollapsed={isSidebarCollapsed}
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
  const isSidebarCollapsed = useNavUiStore(s => s.isSidebarCollapsed);
  const toggleSidebar = useNavUiStore(s => s.toggleSidebar);
  const [activeSport, setActiveSportState] = useState<SportId>(() => getActiveSport());
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => onSportChange(setActiveSportState), []);

  const handleSportClick = useCallback((id: SportId) => {
    setActiveSport(id);
    setActiveSportState(id);
  }, []);

  const handleNavigate = useCallback((id: string) => {
    if (!isEagerHrSection(id)) preloadSection(id);
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

  const shortcutMap = useMemo(() => {
    const map = new Map<string, string>();
    sidebarFeatures.forEach((feature, idx) => {
      if (idx < 9) {
        map.set(feature.id, String(idx + 1));
      }
    });
    return map;
  }, [sidebarFeatures]);

  // ─── Global Keyboard Shortcuts for Sidebar ─────────────────────────────────
  useEffect(() => {
    let chordTimer: number | null = null;
    let pendingChord: string | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow browser shortcuts (Cmd+C, Cmd+R, Cmd+T, Cmd+W, etc.)
      if (e.metaKey && e.key.toLowerCase() !== 'k') return;
      if (e.ctrlKey && !/^[1-9]$/.test(e.key) && e.key.toLowerCase() !== 'k') return;

      // Ignore when typing in input/textarea/select/contenteditable
      if (isEditingText(e.target)) return;

      const key = e.key;

      // Handle chord continuation (e.g. g then t/h/l/r/u/s/p/c/a)
      if (pendingChord === 'g') {
        pendingChord = null;
        if (chordTimer) window.clearTimeout(chordTimer);
        const lowerKey = key.toLowerCase();
        const chordDestinations: Record<string, string> = {
          t: 'today',
          h: 'hr_board',
          l: 'live_games',
          r: 'results',
          u: 'premium',
          b: 'premium',
          s: 'settings',
          p: 'profile',
          c: 'customize',
          a: 'admin',
        };
        const dest = chordDestinations[lowerKey];
        if (dest) {
          e.preventDefault();
          handleNavigate(dest);
          return;
        }
      }

      // Start 'g' chord
      if (key.toLowerCase() === 'g' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        pendingChord = 'g';
        if (chordTimer) window.clearTimeout(chordTimer);
        chordTimer = window.setTimeout(() => {
          pendingChord = null;
        }, 800);
        return;
      }

      // Quick Search / CmdK
      if ((key === '/' || key === '?') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenCmdK?.();
        return;
      }

      // Toggle Sidebar
      if ((key.toLowerCase() === 'b' && (e.metaKey || e.ctrlKey)) || key === '[') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Settings shortcut
      if ((key.toLowerCase() === 's' || key === ',') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleNavigate('settings');
        return;
      }

      // Profile shortcut
      if (key.toLowerCase() === 'p' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleNavigate('profile');
        return;
      }

      // Customize shortcut
      if (!FOCUSED_BETA_SHELL_ENABLED && key.toLowerCase() === 'c' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleNavigate('customize');
        return;
      }

      // Step Previous / Next ( [ and ] )
      if ((key === '[' || key === ']') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (sidebarFeatures.length === 0) return;
        const currentIndex = sidebarFeatures.findIndex(f => isSidebarItemActive(activeSection, f.id));
        let nextIndex = 0;
        if (key === ']') {
          nextIndex = currentIndex === -1 || currentIndex >= sidebarFeatures.length - 1 ? 0 : currentIndex + 1;
        } else {
          nextIndex = currentIndex <= 0 ? sidebarFeatures.length - 1 : currentIndex - 1;
        }
        handleNavigate(sidebarFeatures[nextIndex].id);
        return;
      }

      // Number keys 1..9 or Alt+1..9 or Ctrl+1..9
      if (/^[1-9]$/.test(key)) {
        const num = parseInt(key, 10);
        if (num >= 1 && num <= sidebarFeatures.length) {
          e.preventDefault();
          handleNavigate(sidebarFeatures[num - 1].id);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (chordTimer) window.clearTimeout(chordTimer);
    };
  }, [activeSection, handleNavigate, onOpenCmdK, sidebarFeatures]);

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
          <div className={`flex items-start gap-2 ${isSidebarCollapsed ? 'flex-col items-center' : ''}`}>
            <button
              onClick={() => handleNavigate(FOCUSED_BETA_SHELL_ENABLED ? 'today' : 'feed')}
              className={`ve-aurora-sidebar-brand group relative flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl text-left transition-all outline-none ${!isSidebarCollapsed ? `p-3 ${AURORA_SIDEBAR_SURFACE}` : 'justify-center p-0 mt-1'}`}
              id="sidebar-brand-home"
              aria-label="VouchEdge Home (H)"
              title="Home (H)"
              aria-keyshortcuts="h"
            >
              <VouchEdgeLogo emeraldMark markClassName={`h-10 w-10 shrink-0 ${isSidebarCollapsed ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'}`} className={`min-w-0 transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : ''}`} />
              {isSidebarCollapsed && (
                <div className="flex w-9 h-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-z8 text-xl font-black italic shadow-[0_0_12px_rgba(79,184,220,0.5)]">
                  V
                </div>
              )}
              <div className={`ve-aurora-brand-status absolute bottom-2.5 right-3 flex items-center gap-1.5 overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[200px]'}`}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.65)]" />
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-white/30 whitespace-nowrap">Open Beta · Aurora Max</span>
              </div>
            </button>
            {!isSidebarCollapsed && <NotificationBellButton size="sm" className="shrink-0 mt-0.5" />}
            <button onClick={toggleSidebar} className={`shrink-0 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300 p-1.5 rounded-lg transition-all ${isSidebarCollapsed ? 'mt-2 mx-auto' : 'mt-0.5'}`} aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
          <div className="ve-aurora-accent-line mt-2.5 w-full" aria-hidden />
        </div>

        <button
          onClick={onOpenCmdK}
          className={`ve-aurora-sidebar-search group flex w-full items-center gap-2 rounded-xl transition-all outline-none ${!isSidebarCollapsed ? `px-3 py-2.5 hover:text-white ${AURORA_SIDEBAR_SURFACE} ${AURORA_LABEL} tracking-widest text-white/40` : 'justify-center py-2 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300'}`}
          aria-label="Open command palette (⌘K)"
        >
          <Search className={isSidebarCollapsed ? "h-5 w-5 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
          <span className={`flex-1 text-left overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[200px]"}`}>Quick search…</span>
          <span className={`flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${AURORA_LABEL} transition-all duration-200 ${isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none p-0 overflow-hidden border-none" : "opacity-100 max-w-[50px]"}`}>
            <Command className="h-2 w-2" />K
          </span>
          {isSidebarCollapsed && (
            <div className="fixed left-[76px] z-[9999] bg-[#0c121e]/95 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-md text-xs font-mono text-cyan-200 shadow-[0_10px_30px_rgba(0,0,0,0.8)] whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
              Search <kbd className="ml-1 opacity-60">⌘K</kbd>
            </div>
          )}
        </button>

        {!FOCUSED_BETA_SHELL_ENABLED && (
          <div
            className="ve-aurora-sport-switcher flex items-center justify-between gap-1 rounded-[14px] bg-black/20 p-1 ring-1 ring-inset ring-white/5"
            id="sidebar-sport-switcher"
            style={{ display: isSidebarCollapsed ? "none" : "flex" }}
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
            <span className={`${AURORA_LABEL} text-[9px] tracking-[0.2em] text-white/35 overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[200px]"}`}>
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
                <span className={`overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[100px]"}`}>All tools</span>
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
                  shortcut={shortcutMap.get(f.id)}
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
                      isActive={isSidebarItemActive(activeSection, f.id)}
                      onNavigate={handleNavigate}
                      shortcut={shortcutMap.get(f.id)}
                      isSidebarCollapsed={isSidebarCollapsed}
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
                  shortcutMap={shortcutMap}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              ))}
            </>
          )}
        </nav>
      </div>

      <div className="z8-sidebar-dock ve-aurora-sidebar-dock relative z-10 -mx-3 -mb-4 mt-2 space-y-2 px-3 pb-3 pt-2.5">
        <div className={`flex items-center gap-2 px-1 transition-all duration-200 ${isSidebarCollapsed ? 'justify-center py-2' : 'justify-between'}`}>
          {!isSidebarCollapsed ? (
            <>
              <span className={`inline-flex min-w-0 items-center gap-2 ${AURORA_LABEL} text-white/40`}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-vouch-cyan/80" aria-hidden />
                <span className="truncate tracking-[0.18em]">MLB feed</span>
              </span>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] tracking-widest ${AURORA_LABEL} ${
                liveGamesError ? 'bg-rose-300/10 text-rose-200' : liveGamesLoading ? 'bg-white/5 text-white/45' : 'bg-emerald-300/10 text-emerald-200'
              }`}>
                {liveDataState}
              </span>
            </>
          ) : (
            <div className="group relative flex items-center justify-center w-full h-8">
              <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor] animate-pulse ${liveGamesError ? 'bg-rose-400 text-rose-400' : liveGamesLoading ? 'bg-white/40 text-white/40' : 'bg-emerald-400 text-emerald-400'}`} />
              <div className="fixed left-[76px] z-[9999] bg-[#0c121e]/95 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-md text-xs font-mono text-cyan-200 shadow-[0_10px_30px_rgba(0,0,0,0.8)] whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
                MLB FEED: {liveDataState.toUpperCase()}
              </div>
            </div>
          )}
        </div>

        <div className={`grid gap-1.5 ${FOCUSED_BETA_SHELL_ENABLED || isSidebarCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!FOCUSED_BETA_SHELL_ENABLED && (
            <button
              onClick={() => handleNavigate('customize')}
              className={[
                'group flex items-center justify-center gap-2 rounded-xl transition-all outline-none',
                isSidebarCollapsed ? 'py-2 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300' : `px-3 py-2 ${AURORA_LABEL} tracking-[0.12em] ${activeSection === 'customize' ? AURORA_SIDEBAR_ACTIVE : AURORA_SIDEBAR_IDLE}`,
              ].join(' ')}
              aria-label="Customize layout (C)"
              aria-keyshortcuts="C"
              aria-current={activeSection === 'customize' ? 'page' : undefined}
            >
              <Palette className={isSidebarCollapsed ? "h-5 w-5 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
              <span className={`flex items-center gap-1.5 overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[150px]"}`}>
                <span>Customize</span>
                <kbd className={`pointer-events-none hidden md:inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[8px] font-mono font-medium rounded transition-all select-none ${
                  activeSection === 'customize'
                    ? 'bg-vouch-cyan/15 text-vouch-cyan border border-vouch-cyan/25'
                    : 'bg-white/[0.03] text-white/30 border border-white/[0.06] group-hover:text-white/60'
                }`}>
                  C
                </kbd>
              </span>
              {isSidebarCollapsed && (
                <div className="fixed left-[76px] z-[9999] bg-[#0c121e]/95 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-md text-xs font-mono text-cyan-200 shadow-[0_10px_30px_rgba(0,0,0,0.8)] whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
                  Customize <kbd className="ml-1 opacity-60">C</kbd>
                </div>
              )}
            </button>
          )}
          <button
            onClick={() => handleNavigate('settings')}
            className={[
              'group flex items-center justify-center gap-2 rounded-xl transition-all outline-none',
              isSidebarCollapsed ? 'py-2 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300' : `px-3 py-2 ${AURORA_LABEL} tracking-[0.12em] ${activeSection === 'settings' ? AURORA_SIDEBAR_ACTIVE : AURORA_SIDEBAR_IDLE}`,
            ].join(' ')}
            aria-label="Settings (S)"
            aria-keyshortcuts="S"
            aria-current={activeSection === 'settings' ? 'page' : undefined}
          >
            <Settings className={isSidebarCollapsed ? "h-5 w-5 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
            <span className={`flex items-center gap-1.5 overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[150px]"}`}>
              <span>Settings</span>
              <kbd className={`pointer-events-none hidden md:inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[8px] font-mono font-medium rounded transition-all select-none ${
                activeSection === 'settings'
                  ? 'bg-vouch-cyan/15 text-vouch-cyan border border-vouch-cyan/25'
                  : 'bg-white/[0.03] text-white/30 border border-white/[0.06] group-hover:text-white/60'
              }`}>
                S
              </kbd>
            </span>
            {isSidebarCollapsed && (
              <div className="fixed left-[76px] z-[9999] bg-[#0c121e]/95 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-md text-xs font-mono text-cyan-200 shadow-[0_10px_30px_rgba(0,0,0,0.8)] whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
                Settings <kbd className="ml-1 opacity-60">S</kbd>
              </div>
            )}
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => handleNavigate('profile')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigate('profile');
            }
          }}
          className={`ve-aurora-profile-card group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all ${AURORA_SIDEBAR_SURFACE} ${isSidebarCollapsed ? 'justify-center !px-0' : 'text-left'}`}
          id="sidebar-profile-footer"
          aria-label={`View profile of ${profile.displayName} (P)`}
          aria-keyshortcuts="P"
          aria-current={activeSection === 'profile' ? 'page' : undefined}
          data-active={activeSection === 'profile' ? 'true' : 'false'}
        >
          <div className={`shrink-0 relative flex items-center justify-center ${isSidebarCollapsed ? 'w-8 h-8 rounded-full border border-slate-700 group-hover:border-cyan-400 transition-colors bg-slate-800' : ''}`}>
            {!isSidebarCollapsed ? (
              <ProfileAvatarBorder
                borderId={profile.profileBorderId}
                avatarUrl={profile.avatarUrl}
                displayName={profile.displayName}
                initials={profileInitials}
                size="md"
                winRate={profile.winRate}
                isVerified={profile.verified}
              />
            ) : (
              profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white tracking-widest">{profileInitials}</span>
              )
            )}
          </div>
          <div className={`min-w-0 flex-1 overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[200px]'}`}>
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
          {!isSidebarCollapsed && (
            <kbd className={`pointer-events-none hidden md:inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-mono font-medium rounded transition-all select-none ${
              activeSection === 'profile'
                ? 'bg-vouch-cyan/15 text-vouch-cyan border border-vouch-cyan/25'
                : 'bg-white/[0.03] text-white/30 border border-white/[0.06] group-hover:text-white/60'
            }`}>
              P
            </kbd>
          )}
          {isSidebarCollapsed && (
            <div className="fixed left-[76px] bottom-4 z-[9999] bg-[#0c121e]/95 backdrop-blur-md border border-cyan-500/30 text-xs text-white rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-3 py-2 whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto flex flex-col gap-2 text-left min-w-[140px]">
              <div className="font-bold flex items-center gap-1.5">
                {profile.displayName}
                {profile.verified && <Shield className="h-3 w-3 text-vouch-cyan fill-vouch-cyan/85" />}
              </div>
              <div className="text-cyan-200 font-mono text-[10px] pb-2 border-b border-white/5">{formatProfileWinRate(profile, { suffix: 'win rate' })}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                disabled={signingOut}
                className="flex items-center gap-2 text-white/50 hover:text-rose-400 transition-colors w-full text-left mt-0.5"
              >
                <LogOut className="h-3 w-3" />
                <span>{signingOut ? 'Leaving…' : 'Log out'}</span>
              </button>
            </div>
          )}
        </div>

        {!isSidebarCollapsed && (
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
            <span className={`overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[150px]"}`}>{signingOut ? 'Leaving…' : 'Log out'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export default FeedSidebar;
