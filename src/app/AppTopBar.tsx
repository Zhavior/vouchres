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
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`ve-topbar-tab group inline-flex h-9 shrink-0 items-center gap-1.5 border px-3 font-sans text-xs font-semibold tracking-normal transition-all cursor-pointer ${
        isActive
          ? 'border-amber-400 bg-[#181B22] text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
          : 'border-white/[0.08] bg-[#111318]/90 text-zinc-400 hover:border-zinc-700 hover:bg-[#181B22] hover:text-zinc-200'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
      <span className="whitespace-nowrap">{label}</span>
      {liveOnAir ? <SidebarLiveOnAirBadge compact={liveOnAir === 'dot'} /> : null}
      {shortcut ? (
        <span className={`hidden 2xl:inline-block px-1 text-[9px] font-mono border ${
          isActive ? 'border-amber-400/40 bg-amber-950/40 text-amber-300' : 'border-white/10 bg-zinc-900/80 text-zinc-500'
        }`}>
          {shortcut}
        </span>
      ) : null}
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
      className="ve-app-topbar sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#090A0F]/95 px-4 backdrop-blur-xl sm:px-6"
    >
      {/* Left — brand + quick search */}
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => handleNavigate(FOCUSED_BETA_SHELL_ENABLED ? 'today' : 'feed')}
          className="ve-topbar-brand flex shrink-0 items-center outline-none transition-opacity hover:opacity-85 cursor-pointer"
          aria-label="VouchEdge home"
          title="VouchEdge home"
        >
          <VouchEdgeLogo emeraldMark markClassName="h-7 w-7 shrink-0" className="min-w-0" />
        </button>

        <button
          type="button"
          onClick={onOpenCmdK}
          className="group hidden h-9 items-center gap-2 border border-white/[0.08] bg-[#111318] px-3 font-sans text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-[#181B22] hover:text-zinc-200 md:flex cursor-pointer"
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500 group-hover:text-zinc-300" />
          <span className="hidden lg:inline font-medium">Search…</span>
          <span className="ml-1 inline-flex items-center gap-0.5 border border-white/10 bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] font-medium text-zinc-400">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenCmdK}
          className="grid h-9 w-9 shrink-0 place-items-center border border-white/[0.08] bg-[#111318] text-zinc-400 hover:border-zinc-700 hover:text-white md:hidden cursor-pointer"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Centre — route tabs */}
      <nav
        className="ve-topbar-tabs hidden min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto md:flex"
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
          className={`hidden items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider xl:inline-flex ${
            liveGamesError
              ? 'border-rose-500/30 bg-rose-950/30 text-rose-400'
              : liveGamesLoading
                ? 'border-white/[0.08] bg-[#111318] text-zinc-500'
                : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
          }`}
          title={`MLB feed: ${liveDataState}`}
        >
          <span className="flex h-1.5 w-1.5 relative shrink-0">
            {!liveGamesError && !liveGamesLoading && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              liveGamesError ? 'bg-rose-400' : liveGamesLoading ? 'bg-zinc-500' : 'bg-emerald-400'
            }`}></span>
          </span>
          MLB {liveDataState}
        </span>

        <button
          type="button"
          onClick={toggle3D}
          aria-pressed={is3DEnabled}
          title={`Ambient 3D layer: ${is3DEnabled ? 'on' : 'off'}`}
          className={`hidden h-9 items-center gap-1.5 border px-2.5 font-mono text-[10px] font-medium tracking-wide transition-all cursor-pointer sm:inline-flex ${
            is3DEnabled
              ? 'border-amber-400/40 bg-amber-950/30 text-amber-300'
              : 'border-white/[0.08] bg-[#111318] text-zinc-400 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <Box className={`h-3.5 w-3.5 ${is3DEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
          3D {is3DEnabled ? 'ON' : 'OFF'}
        </button>

        <NotificationBellButton size="sm" className="shrink-0" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${profile.displayName}`}
            className="flex h-9 items-center gap-1.5 border border-white/[0.08] bg-[#111318] px-2 transition-colors hover:border-zinc-700 cursor-pointer"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden border border-white/10 bg-zinc-900">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserCircle className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />
              )}
            </span>
            <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-50 w-64 overflow-hidden border border-white/[0.08] bg-[#111318] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-100 font-sans"
            >
              <div className="flex items-center gap-2.5 p-2.5 border border-white/[0.08] bg-[#181B22] mb-2">
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
                  <p className="flex items-center gap-1 truncate text-xs font-bold text-white">
                    {profile.displayName}
                    {profile.verified && <Shield className="h-3 w-3 shrink-0 fill-amber-400/85 text-amber-400" />}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-400 font-medium">
                    {formatProfileWinRate(profile, { suffix: 'win rate' })}
                  </p>
                </div>
              </div>

              {!FOCUSED_BETA_SHELL_ENABLED && (
                <div className="my-1.5 flex items-center gap-1 border border-white/[0.08] bg-[#181B22] p-1" role="group" aria-label="Sport selector">
                  {SPORT_LIST.map((sport) => (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => handleSportClick(sport.id)}
                      disabled={!sport.enabled}
                      className={`flex flex-1 items-center justify-center gap-1 border px-1.5 py-1 font-sans text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        activeSport === sport.id
                          ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                          : sport.enabled
                            ? 'border-transparent text-zinc-400 hover:text-white'
                            : 'cursor-not-allowed border-transparent text-zinc-700'
                      }`}
                    >
                      {sport.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="my-1.5 h-px bg-white/[0.08]" />

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate('profile')}
                className="flex w-full items-center justify-between border border-transparent px-2.5 py-1.5 text-left text-xs font-medium text-zinc-300 transition-colors hover:border-white/[0.08] hover:bg-[#181B22] hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UserCircle className="h-3.5 w-3.5 text-zinc-500" /> Profile & Stats
                </span>
                <kbd className="font-mono text-[9px] text-zinc-500">[P]</kbd>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate('settings')}
                className="flex w-full items-center justify-between border border-transparent px-2.5 py-1.5 text-left text-xs font-medium text-zinc-300 transition-colors hover:border-white/[0.08] hover:bg-[#181B22] hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-zinc-500" /> Settings
                </span>
                <kbd className="font-mono text-[9px] text-zinc-500">[S]</kbd>
              </button>

              {!FOCUSED_BETA_SHELL_ENABLED && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('customize')}
                  className="flex w-full items-center justify-between border border-transparent px-2.5 py-1.5 text-left text-xs font-medium text-zinc-300 transition-colors hover:border-white/[0.08] hover:bg-[#181B22] hover:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-zinc-500" /> Customize
                  </span>
                  <kbd className="font-mono text-[9px] text-zinc-500">[C]</kbd>
                </button>
              )}

              <div className="my-1.5 h-px bg-white/[0.08]" />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={signingOut}
                className="flex w-full items-center justify-between border border-transparent px-2.5 py-1.5 text-left text-xs font-medium text-rose-400 transition-colors hover:border-rose-500/20 hover:bg-rose-950/30 hover:text-rose-300 disabled:opacity-50 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="h-3.5 w-3.5" /> {signingOut ? 'Signing out…' : 'Log Out'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

export default AppTopBar;
