/**
 * AppTopBar — the global route bar.
 *
 * Replaces the left navigation rail (FeedSidebar). Brand and quick search sit
 * left, the route tabs centre, and the live-feed status, ambient-3D toggle,
 * notifications and profile menu sit right. Retiring the rail is what gives the
 * dense board routes the full desktop width; everything the rail carried that
 * is not a route — sport switcher, customize, settings, logout — moves into the
 * profile menu rather than being dropped.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Command, LogOut, Settings, Palette, Box, ChevronDown, Shield, UserCircle,
} from 'lucide-react';
import VouchEdgeLogo from '../components/brand/VouchEdgeLogo';
import ProfileAvatarBorder from '../components/profile/ProfileAvatarBorder';
import { NotificationBellButton } from '../components/notifications/UnifiedNotificationCenter';
import { SidebarLiveOnAirBadge } from '../social/feed/SidebarLiveOnAirBadge';
import { loadFeatureLayout, getSidebarFeatures } from '../lib/featureConfig';
import { isEagerHrSection, preloadSection } from '../lib/routePreload';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, type SportId } from '../sports/registry';
import { useProfileStore } from '../stores/profileStore';
import { useShallow } from 'zustand/react/shallow';
import { performAppLogout } from '../lib/appLogout';
import { SECTIONS_USING_LIVE_GAMES } from './sectionNavigation';
import { hasLiveGames, useLiveGames } from '../hooks/queries/useLiveGames';
import { formatProfileWinRate } from '../lib/profileWinRateDisplay';
import { FOCUSED_BETA_SHELL_ENABLED } from './betaNavigation';
import { canAccessAdminSurfaces } from '../lib/adminDevAccess';
import { useAmbient3dEnabled, useAmbient3dStore } from '../stores/ambient3dStore';
import { ICON_MAP, LIVE_ON_AIR_SECTIONS, isNavItemActive, selectShellProfile } from './appNavModel';
import { useAppShellShortcuts } from './useAppShellShortcuts';
import '../styles/app-topbar.css';

export interface AppTopBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenCmdK: () => void;
  onLogoutComplete?: () => void;
}

const RouteTab = React.memo(function RouteTab({
  id,
  label,
  icon,
  isActive,
  liveOnAir,
  shortcut,
  onNavigate,
}: {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  liveOnAir?: 'pill' | 'dot';
  shortcut?: string;
  onNavigate: (id: string) => void;
}) {
  const Icon = ICON_MAP[icon] ?? ICON_MAP.LayoutDashboard;
  return (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      onMouseEnter={() => { if (!isEagerHrSection(id)) preloadSection(id); }}
      aria-current={isActive ? 'page' : undefined}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`ve-topbar-tab group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
        isActive
          ? 'bg-[var(--aurora-max-emerald)]/12 text-[var(--aurora-max-emerald)] shadow-[inset_0_0_0_1px_rgba(0,217,160,0.28)]'
          : 'text-white/45 hover:bg-white/[0.04] hover:text-white/85'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
      {liveOnAir ? <SidebarLiveOnAirBadge compact={liveOnAir === 'dot'} /> : null}
    </button>
  );
});

export const AppTopBar = React.memo(function AppTopBar({
  activeSection,
  onSectionChange,
  onOpenCmdK,
  onLogoutComplete,
}: AppTopBarProps) {
  const profile = useProfileStore(useShallow(selectShellProfile));
  const [activeSport, setActiveSportState] = useState<SportId>(() => getActiveSport());
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const is3DEnabled = useAmbient3dEnabled();
  const toggle3D = useAmbient3dStore((state) => state.toggle);

  useEffect(() => onSportChange(setActiveSportState), []);

  const handleNavigate = useCallback((id: string) => {
    if (!isEagerHrSection(id)) preloadSection(id);
    setMenuOpen(false);
    onSectionChange(id);
  }, [onSectionChange]);

  const handleSportClick = useCallback((id: SportId) => {
    setActiveSport(id);
    setActiveSportState(id);
  }, []);

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
  const routeTabs = useMemo(() => {
    return getSidebarFeatures(featureLayout, {
      activeSport,
      canAccessAdmin: canAccessAdminSurfaces(profile),
    }).map((feature) => {
      if (feature.id !== 'premium') return feature;
      const managesPlan = profile.subscriptionTier === 'GOLD' || profile.subscriptionTier === 'SELLER_PRO';
      return { ...feature, label: managesPlan ? 'Plan & Billing' : feature.label };
    });
  }, [
    featureLayout, activeSport, profile.admin, profile.isAdmin, profile.isStaff,
    profile.staff, profile.role, profile.subscriptionTier,
  ]);

  const shortcutMap = useMemo(() => {
    const map = new Map<string, string>();
    routeTabs.forEach((feature, idx) => {
      if (idx < 9) map.set(feature.id, String(idx + 1));
    });
    return map;
  }, [routeTabs]);

  useAppShellShortcuts({
    activeSection,
    features: routeTabs,
    onNavigate: handleNavigate,
    onOpenCmdK,
  });

  // Close the profile menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const needsFastLivePoll = SECTIONS_USING_LIVE_GAMES.has(activeSection) || activeSection === 'today';
  const { data: liveGamesPayload, isError: liveGamesError, isLoading: liveGamesLoading } = useLiveGames({
    refetchInterval: needsFastLivePoll ? undefined : 45_000,
  });
  const liveGamesActive = hasLiveGames(liveGamesPayload);
  const liveDataState = liveGamesError ? 'Unavailable' : liveGamesLoading ? 'Checking' : 'Connected';

  const profileInitials = useMemo(
    () => profile.displayName.split(' ').map((n) => n[0]).join(''),
    [profile.displayName],
  );

  return (
    <header
      id="ve-app-topbar"
      className="ve-app-topbar sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-emerald-950/80 bg-[#070b11]/90 px-4 backdrop-blur-md sm:px-6"
    >
      {/* Left — brand + quick search */}
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => handleNavigate(FOCUSED_BETA_SHELL_ENABLED ? 'today' : 'feed')}
          className="ve-topbar-brand flex shrink-0 items-center rounded-lg outline-none transition-opacity hover:opacity-85"
          aria-label="VouchEdge home"
          title="VouchEdge home"
        >
          <VouchEdgeLogo emeraldMark markClassName="h-7 w-7 shrink-0" className="min-w-0" />
        </button>

        <button
          type="button"
          onClick={onOpenCmdK}
          className="group hidden h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 font-mono text-[11px] text-white/40 transition-colors hover:border-[var(--aurora-max-emerald)]/30 hover:text-white/70 md:flex"
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden lg:inline">Quick search…</span>
          <span className="ml-1 inline-flex items-center gap-0.5 rounded border border-white/10 bg-black/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white/40">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenCmdK}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/40 text-white/45 md:hidden"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Centre — route tabs. Scrolls rather than wraps: the bar is a fixed
          14-unit strip and a wrapped second row would push the board down. */}
      <nav
        className="ve-topbar-tabs hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto md:flex"
        aria-label="Main navigation"
      >
        {routeTabs.map((feature) => (
          <RouteTab
            key={feature.id}
            id={feature.id}
            label={feature.label}
            icon={feature.icon}
            isActive={isNavItemActive(activeSection, feature.id)}
            liveOnAir={liveGamesActive ? LIVE_ON_AIR_SECTIONS.get(feature.id) : undefined}
            shortcut={shortcutMap.get(feature.id)}
            onNavigate={handleNavigate}
          />
        ))}
      </nav>

      {/* Right — feed status, ambient 3D, notifications, profile */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] xl:inline-flex ${
            liveGamesError
              ? 'bg-rose-300/10 text-rose-200'
              : liveGamesLoading
                ? 'bg-white/5 text-white/45'
                : 'bg-emerald-300/10 text-emerald-200'
          }`}
          title={`MLB feed: ${liveDataState}`}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
          MLB {liveDataState}
        </span>

        <button
          type="button"
          onClick={toggle3D}
          aria-pressed={is3DEnabled}
          title={`Ambient 3D layer: ${is3DEnabled ? 'on' : 'off'}`}
          className={`hidden h-9 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors sm:inline-flex ${
            is3DEnabled
              ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/12 text-[var(--aurora-max-emerald)]'
              : 'border-white/10 bg-black/40 text-white/40 hover:text-white/70'
          }`}
        >
          <Box className="h-3.5 w-3.5" />
          3D {is3DEnabled ? 'On' : 'Off'}
        </button>

        <NotificationBellButton size="sm" className="shrink-0" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${profile.displayName}`}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-1.5 transition-colors hover:border-white/20"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <UserCircle className="h-5 w-5 text-white/50" strokeWidth={1.8} />
              )}
            </span>
            <ChevronDown className={`h-3 w-3 text-white/35 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-emerald-950/90 bg-[#070b11] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
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
                  <p className="flex items-center gap-1 truncate font-mono text-xs font-bold text-white">
                    {profile.displayName}
                    {profile.verified && <Shield className="h-3 w-3 shrink-0 fill-vouch-cyan/85 text-vouch-cyan" />}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-white/40">
                    {formatProfileWinRate(profile, { suffix: 'win rate' })}
                  </p>
                </div>
              </div>

              {!FOCUSED_BETA_SHELL_ENABLED && (
                <div className="my-1 flex items-center gap-1 rounded-lg bg-black/40 p-1" role="group" aria-label="Sport selector">
                  {SPORT_LIST.map((sport) => (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => handleSportClick(sport.id)}
                      disabled={!sport.enabled}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 font-mono text-[10px] font-black uppercase transition-colors ${
                        activeSport === sport.id
                          ? 'bg-vouch-cyan/10 text-vouch-cyan'
                          : sport.enabled
                            ? 'text-white/40 hover:text-white'
                            : 'cursor-not-allowed text-white/20'
                      }`}
                    >
                      {sport.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="my-1 h-px bg-white/5" />

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate('profile')}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[11px] text-white/65 transition-colors hover:bg-white/5 hover:text-white"
              >
                <UserCircle className="h-3.5 w-3.5" /> Profile
                <kbd className="ml-auto rounded border border-white/10 bg-black/50 px-1 text-[9px] text-white/30">P</kbd>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate('settings')}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[11px] text-white/65 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
                <kbd className="ml-auto rounded border border-white/10 bg-black/50 px-1 text-[9px] text-white/30">S</kbd>
              </button>
              {!FOCUSED_BETA_SHELL_ENABLED && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('customize')}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[11px] text-white/65 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Palette className="h-3.5 w-3.5" /> Customize
                  <kbd className="ml-auto rounded border border-white/10 bg-black/50 px-1 text-[9px] text-white/30">C</kbd>
                </button>
              )}

              <div className="my-1 h-px bg-white/5" />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[11px] text-white/50 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" /> {signingOut ? 'Leaving…' : 'Log out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

export default AppTopBar;
