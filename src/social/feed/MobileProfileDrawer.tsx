/**
 * MobileProfileDrawer — Twitter/X-style slide-in navigation drawer (mobile).
 *
 * Opened via the Menu FAB in AppNav. Avatar ring is driven by profile.subscriptionTier.
 * Notifications and logout each appear once here (no duplicate top header chrome).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from '../../lib/motion';
import {
  X, Settings, Sparkles, Trophy, LayoutDashboard, Home, Award, Tv, Radio,
  Sliders, Cpu, Activity, Flame, ScanLine, Search, ClipboardCheck, BarChart3,
  MessageSquare, ShoppingBag, User, Users, UserRoundSearch, Swords, LineChart,
  Bell, Grid3x3, Palette, CalendarDays, Crown, UserCircle, Shield, LogOut, Crosshair, ChevronDown,
} from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import { loadFeatureLayout, getSidebarFeatures, FeatureGroup } from '../../lib/featureConfig';
import {
  AURORA_LABEL, AURORA_SIDEBAR_SHELL, AURORA_SIDEBAR_PANEL, AURORA_SIDEBAR_SURFACE,
  AURORA_SIDEBAR_ICON_BOX, AURORA_SIDEBAR_ACTIVE, AURORA_SIDEBAR_IDLE,
} from '../../theme/auroraTokens';
import { performAppLogout } from '../../lib/appLogout';
import { NotificationBellButton } from '../../components/notifications/UnifiedNotificationCenter';
import { hasLiveGames, useLiveGames } from '../../hooks/queries/useLiveGames';
import { useBodyScrollLock } from '../../lib/scroll/useBodyScrollLock';
import { SidebarLiveOnAirBadge } from './SidebarLiveOnAirBadge';
import { profileHasGradedPicks } from '../../lib/profileWinRateDisplay';
import { useSidebarGroupCollapse } from './useSidebarGroupCollapse';
import VouchEdgeLogo from '../../components/brand/VouchEdgeLogo';
import { getActiveSport } from '../../sports/registry';
import { FOCUSED_BETA_SHELL_ENABLED, isBetaDestinationActive } from '../../app/betaNavigation';
import '../../styles/aurora-sidebar.css';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles, MessageSquare,
  ShoppingBag, User, UserCircle, Settings, Users, UserRoundSearch, Swords, LineChart,
  Bell, Grid3x3, Palette, CalendarDays, Crown, Crosshair, Shield,
};

/** HR nav items use Flame per featureConfig. */
const HR_NAV_IDS = new Set(['hr_board']);

function isDrawerItemActive(activeSection: string, featureId: string): boolean {
  if (!FOCUSED_BETA_SHELL_ENABLED) return activeSection === featureId;
  if (featureId === 'today') return isBetaDestinationActive(activeSection, 'today');
  if (featureId === 'hr_board') return isBetaDestinationActive(activeSection, 'research');
  if (featureId === 'results') return isBetaDestinationActive(activeSection, 'track_record');
  return activeSection === featureId;
}

export interface TierMeta {
  label: string;
  ring: string;
  text: string;
  chipBg: string;
}

/** Subscription tier → display identity. Single source for header avatar + drawer. */
export function tierMeta(tier: CreatorProofProfile['subscriptionTier']): TierMeta {
  switch (tier) {
    case 'GOLD':
      return { label: 'Pro', ring: '#00FF94', text: 'text-vouch-emerald', chipBg: 'bg-vouch-emerald/10 shadow-[0_0_10px_rgba(0,255,148,0.15)]' };
    case 'SELLER_PRO':
      return { label: 'Capper', ring: '#00F0FF', text: 'text-vouch-cyan', chipBg: 'bg-vouch-cyan/10 shadow-[0_0_10px_rgba(0,240,255,0.15)]' };
    default:
      return { label: 'Basic', ring: 'rgba(255,255,255,0.25)', text: 'text-white/40', chipBg: 'bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' };
  }
}

export function TierAvatar({ profile, size = 40, onClick, ariaLabel, priority = false }: {
  profile: CreatorProofProfile;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
  priority?: boolean;
}) {
  const meta = tierMeta(profile.subscriptionTier);
  const initials = (profile.displayName || profile.username || '?')
    .trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const inner = profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt={profile.displayName}
      width={size}
      height={size}
      className="h-full w-full rounded-full object-cover"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-obsidian-800 text-[11px] font-black text-white/70">
      {initials}
    </span>
  );

  const el = (
    <span
      className="block shrink-0 rounded-full p-[2px]"
      style={{ width: size, height: size, boxShadow: `0 0 0 2px ${meta.ring}`, background: '#0A0A0A' }}
    >
      {inner}
    </span>
  );

  if (!onClick) return el;
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? 'Open menu'} className="shrink-0 rounded-full active:scale-95 transition-transform">
      {el}
    </button>
  );
}

interface MobileProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: CreatorProofProfile;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogoutComplete?: () => void;
}

function MobileProfileDrawer({
  open,
  onClose,
  profile,
  activeSection,
  onSectionChange,
  onLogoutComplete,
}: MobileProfileDrawerProps) {
  const meta = tierMeta(profile.subscriptionTier);
  const [signingOut, setSigningOut] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const { data: liveGamesPayload } = useLiveGames({ enabled: open });
  const liveGamesActive = hasLiveGames(liveGamesPayload);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const handleResize = () => { if (window.innerWidth >= 768) onClose(); };
    window.addEventListener('keydown', handler);
    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('resize', handleResize);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  const [featureLayout] = useState(() => loadFeatureLayout());
  const groups = useMemo(() => {
    if (!open) return [];
    const features = getSidebarFeatures(featureLayout, {
      activeSport: getActiveSport(),
      canAccessAdmin: Boolean(profile.isAdmin || profile.admin),
    }).map((feature) => {
      if (feature.id !== 'premium') return feature;
      const managesPlan = profile.subscriptionTier === 'GOLD' || profile.subscriptionTier === 'SELLER_PRO';
      return { ...feature, label: managesPlan ? 'Plan & Billing' : 'Upgrade' };
    });
    const SIDEBAR_GROUPS: FeatureGroup[] = ["Daily", "Pro Labs", "AI", "Build & Track", "Social", "Account"];
    return SIDEBAR_GROUPS.map(group => ({
      group,
      items: features.filter(f => f.group === group),
    })).filter(g => g.items.length > 0);
  }, [open, featureLayout, profile.admin, profile.isAdmin, profile.subscriptionTier]);

  const sectionIdsByGroup = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const { group, items } of groups) {
      map.set(group, items.map((item) => item.id));
    }
    return map;
  }, [groups]);

  const { isCollapsed, toggleGroup } = useSidebarGroupCollapse(activeSection, sectionIdsByGroup);

  const go = useCallback((section: string) => {
    onSectionChange(section);
    onClose();
  }, [onClose, onSectionChange]);

  const handleLogout = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await performAppLogout(onLogoutComplete);
      onClose();
    } finally {
      setSigningOut(false);
    }
  }, [onClose, onLogoutComplete, signingOut]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={drawerRef}
            className={`ve-aurora-mobile-drawer absolute inset-y-0 left-0 flex w-[88vw] max-w-[340px] flex-col ${AURORA_SIDEBAR_SHELL} shadow-[4px_0_50px_rgba(0,0,0,0.58)]`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Aurora brand and account identity — real profile data only */}
            <div className="border-b border-white/[0.07] px-4 pb-4 pt-[max(env(safe-area-inset-top),16px)]">
              <div className="flex items-center justify-between gap-3 pt-1">
                <button type="button" onClick={() => go('today')} aria-label="Go to Today" className="min-w-0 rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-vouch-cyan">
                  <VouchEdgeLogo markClassName="h-10 w-10" />
                </button>
                <div className="flex items-center gap-1.5">
                  <NotificationBellButton size="sm" />
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close menu"
                    className={`flex h-11 w-11 items-center justify-center text-white/40 transition hover:bg-vouch-cyan/8 hover:text-white ${AURORA_SIDEBAR_SURFACE}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="ve-aurora-mobile-account mt-4 rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <TierAvatar profile={profile} size={48} onClick={() => go('profile')} ariaLabel="Open profile" />
                  <button type="button" onClick={() => go('profile')} className="min-w-0 flex-1 text-left">
                    <p className="flex items-center gap-1.5 truncate text-base font-black text-white">
                      {profile.displayName}
                      {profile.verified && <Shield className="h-3.5 w-3.5 shrink-0 fill-vouch-cyan/85 text-vouch-cyan" />}
                    </p>
                    <p className="truncate text-xs text-white/40">@{profile.username}</p>
                  </button>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${meta.chipBg} ${meta.text}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="ve-aurora-mobile-proof mt-3 flex items-center gap-4 border-t border-white/[0.07] pt-3 text-xs">
                  <span><strong className="text-white">{profile.totalPicks}</strong> <span className="text-white/40">picks</span></span>
                  <span>
                    {profileHasGradedPicks(profile) ? (
                      <><strong className="text-white">{profile.winRate.toFixed(1)}%</strong>{' '}<span className="text-white/40">win rate</span></>
                    ) : (
                      <span className="text-white/50">No graded picks yet</span>
                    )}
                  </span>
                  <span>
                    <strong className={profile.unitsNetProfit >= 0 ? 'text-vouch-emerald' : 'text-rose-300'}>
                      {profile.unitsNetProfit >= 0 ? '+' : ''}{profile.unitsNetProfit.toFixed(1)}u
                    </strong>
                  </span>
                </div>

                {profile.subscriptionTier !== 'GOLD' && profile.subscriptionTier !== 'SELLER_PRO' && (
                  <button
                    type="button"
                    onClick={() => go('premium')}
                    className="ve-aurora-mobile-upgrade mt-3 w-full rounded-xl border border-vouch-emerald/15 bg-vouch-emerald/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-vouch-emerald"
                  >
                    Explore VouchEdge Beta
                  </button>
                )}
              </div>
            </div>

            {/* Nav groups — same registry as the desktop sidebar */}
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {groups.map(({ group, items }) => {
                const sectionId = `mobile-drawer-group-${group.replace(/\s+/g, '-').toLowerCase()}`;
                const collapsed = isCollapsed(group);
                return (
                <div key={group} className={`mb-3 overflow-hidden rounded-2xl border border-white/[0.06] ${AURORA_SIDEBAR_PANEL}`}>
                  <button
                    type="button"
                    aria-expanded={!collapsed}
                    aria-controls={`${sectionId}-items`}
                    onClick={() => toggleGroup(group)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 ${AURORA_LABEL} text-[11px] tracking-[0.16em] text-vouch-cyan`}
                  >
                    <span>{group}</span>
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 text-white/30 transition-transform ${collapsed ? '-rotate-90' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {!collapsed && (
                  <div id={`${sectionId}-items`} className="px-1.5 py-1.5 space-y-0.5">
                    {items.map((item) => {
                      const resolvedIcon = HR_NAV_IDS.has(item.id) ? 'Flame' : item.icon;
                      const Icon = ICON_MAP[resolvedIcon] || Settings;
                      const isActive = isDrawerItemActive(activeSection, item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => go(item.id)}
                          aria-label={item.label}
                          title={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          className={[
                            've-aurora-nav-item relative flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all font-z8',
                            isActive ? AURORA_SIDEBAR_ACTIVE : AURORA_SIDEBAR_IDLE,
                          ].join(' ')}
                          data-active={isActive ? 'true' : 'false'}
                        >
                          {isActive && (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-1 left-0 w-[3px] bg-vouch-cyan"
                            />
                          )}
                          <span
                            className={[
                              'h-7 w-7 shrink-0 transition-all',
                              isActive
                                ? 'flex items-center justify-center bg-vouch-cyan/15 text-vouch-cyan'
                                : AURORA_SIDEBAR_ICON_BOX,
                            ].join(' ')}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate text-[12px] font-bold uppercase tracking-wide">{item.label}</span>
                          {liveGamesActive && item.id === 'live_games' && (
                            <span className="ml-auto shrink-0">
                              <SidebarLiveOnAirBadge />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              );})}
            </nav>

            {/* Footer */}
            <div className="px-2 py-2 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] space-y-1">
              <button
                type="button"
                onClick={() => go('settings')}
                aria-current={activeSection === 'settings' ? 'page' : undefined}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-all ${AURORA_SIDEBAR_IDLE} ${AURORA_LABEL}`}
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className={`flex w-full min-h-[44px] items-center gap-3 px-3 py-2.5 text-sm transition-all ${AURORA_SIDEBAR_IDLE} ${AURORA_LABEL} text-white/45 hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50`}
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Leaving…' : 'Log out'}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

const MobileProfileDrawerMemo = React.memo(MobileProfileDrawer);
export default MobileProfileDrawerMemo;
