/**
 * MobileProfileDrawer — Twitter/X-style slide-in navigation drawer (mobile).
 *
 * Opened via the Menu FAB in AppNav. Avatar ring is driven by profile.subscriptionTier.
 * Notifications and logout each appear once here (no duplicate top header chrome).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from '../../lib/motion';
import {
  X, Settings, Sparkles, Trophy, LayoutDashboard, Home, Award, Tv, Radio,
  Sliders, Cpu, Activity, Flame, ScanLine, Search, ClipboardCheck, BarChart3,
  MessageSquare, ShoppingBag, User, Users, UserRoundSearch, Swords, LineChart,
  Bell, Grid3x3, Palette, CalendarDays, Crown, UserCircle, Shield, LogOut, Scale,
} from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import { getPrimaryProductNavigation } from '../../app/productNavigation';
import {
  Z8_LABEL, Z8_SIDEBAR_SHELL, Z8_SIDEBAR_PANEL, Z8_SIDEBAR_SURFACE,
  Z8_SIDEBAR_ICON_BOX, Z8_SIDEBAR_ACTIVE, Z8_SIDEBAR_IDLE,
} from '../../theme/z8Tokens';
import { performAppLogout } from '../../lib/appLogout';
import { NotificationBellButton } from '../../components/notifications/UnifiedNotificationCenter';
import { hasLiveGames, useLiveGames } from '../../hooks/queries/useLiveGames';
import { SidebarLiveOnAirBadge } from './SidebarLiveOnAirBadge';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles, MessageSquare,
  ShoppingBag, User, UserCircle, Settings, Users, UserRoundSearch, Swords, LineChart,
  Bell, Grid3x3, Palette, CalendarDays, Crown, Scale,
};

/** HR nav items use Flame per featureConfig. */
const HR_NAV_IDS = new Set(['hr_board']);

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
  const { data: liveGamesPayload } = useLiveGames({ enabled: open });
  const liveGamesActive = hasLiveGames(liveGamesPayload);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const groups = useMemo(() => {
    if (!open) return [];
    const icons = { today: 'CalendarDays', intelligence: 'Flame', players: 'UserRoundSearch', parlays: 'Radio', profile: 'UserCircle' } as const;
    return [
      {
        group: 'Shortcuts',
        items: [
          { id: 'judge_home', label: 'Judge Home', icon: 'Scale' },
          { id: 'hr_board', label: 'HR Board', icon: 'Flame' },
          { id: 'board', label: 'Vouch Board', icon: 'ClipboardCheck' },
          { id: 'feed', label: 'Home Feed', icon: 'Home' },
        ],
      },
      {
        group: 'Navigate',
        items: getPrimaryProductNavigation().map((item) => ({ id: item.section, label: item.label, icon: icons[item.id] })),
      },
    ];
  }, [open]);

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
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`absolute inset-y-0 left-0 flex w-[82vw] max-w-[320px] flex-col ${Z8_SIDEBAR_SHELL} shadow-[4px_0_40px_rgba(0,0,0,0.45)]`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Profile header — real token-identity data only */}
            <div className="px-4 pb-4 pt-[max(env(safe-area-inset-top),16px)] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-start justify-between pt-1">
                <TierAvatar profile={profile} size={52} onClick={() => go('profile')} ariaLabel="Open profile" />
                <div className="flex items-center gap-1.5">
                  <NotificationBellButton size="sm" />
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close menu"
                    className={`flex h-11 w-11 items-center justify-center text-white/40 transition hover:bg-vouch-cyan/8 hover:text-white ${Z8_SIDEBAR_SURFACE}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => go('profile')} className="mt-2.5 block text-left">
                <p className="flex items-center gap-1.5 text-base font-black text-white">
                  {profile.displayName}
                  {profile.verified && <Shield className="h-3.5 w-3.5 text-vouch-cyan fill-vouch-cyan/85" />}
                </p>
                <p className="text-xs text-white/40">@{profile.username}</p>
              </button>
              <div className="z8-accent-line mt-3 w-full" aria-hidden />
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.chipBg} ${meta.text}`}>
                  {meta.label}
                </span>
                {profile.subscriptionTier !== 'SELLER_PRO' && (
                  <button
                    type="button"
                    onClick={() => go('premium')}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/50 transition hover:bg-vouch-emerald/10 hover:text-vouch-emerald hover:shadow-[0_0_10px_rgba(0,255,148,0.12)]"
                  >
                    Upgrade
                  </button>
                )}
              </div>
              {/* Real proof stats (like X's follower row, but ours are graded numbers) */}
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span><strong className="text-white">{profile.totalPicks}</strong> <span className="text-white/40">picks</span></span>
                <span><strong className="text-white">{profile.winRate.toFixed(1)}%</strong> <span className="text-white/40">win rate</span></span>
                <span>
                  <strong className={profile.unitsNetProfit >= 0 ? 'text-vouch-emerald' : 'text-rose-300'}>
                    {profile.unitsNetProfit >= 0 ? '+' : ''}{profile.unitsNetProfit.toFixed(1)}u
                  </strong>
                </span>
              </div>
            </div>

            {/* Nav groups — same registry as the desktop sidebar */}
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {groups.map(({ group, items }) => (
                <div key={group} className={`mb-3 overflow-hidden ${Z8_SIDEBAR_PANEL}`}>
                  <p className={`px-3 py-2 ${Z8_LABEL} text-[9px] tracking-[0.18em] text-vouch-cyan`}>{group}</p>
                  <div className="px-1.5 py-1.5 space-y-0.5">
                    {items.map((item) => {
                      const resolvedIcon = HR_NAV_IDS.has(item.id) ? 'Flame' : item.icon;
                      const Icon = ICON_MAP[resolvedIcon] || Settings;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => go(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={[
                            'relative flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-all font-z8',
                            isActive ? Z8_SIDEBAR_ACTIVE : Z8_SIDEBAR_IDLE,
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
                              'h-7 w-7 shrink-0 transition-all',
                              isActive
                                ? 'flex items-center justify-center bg-ve-ion/20 text-ve-ion shadow-[0_0_14px_rgba(0,229,255,0.35)]'
                                : Z8_SIDEBAR_ICON_BOX,
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
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-2 py-2 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] space-y-1">
              <button
                type="button"
                onClick={() => go('settings')}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-all ${Z8_SIDEBAR_IDLE} ${Z8_LABEL}`}
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className={`flex w-full min-h-[44px] items-center gap-3 px-3 py-2.5 text-sm transition-all ${Z8_SIDEBAR_IDLE} ${Z8_LABEL} text-white/45 hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50`}
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
