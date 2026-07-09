/**
 * MobileProfileDrawer — Twitter/X-style slide-in navigation drawer (mobile).
 *
 * Opened by tapping the profile avatar in the mobile header (which replaced
 * the old bottom nav bar). The avatar's ring — here and in the header — is
 * driven by the real subscription tier on the backend-hydrated profile
 * (profile.subscriptionTier, resolved from the auth token identity):
 *   BASIC → muted · GOLD (Pro) → vouch-emerald · SELLER_PRO (Capper) → vouch-cyan
 *
 * Nav items come from the same featureConfig registry the desktop sidebar
 * uses, so the two menus can never drift apart.
 */
import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '../../lib/motion';
import {
  X, Settings, Sparkles, Trophy, LayoutDashboard, Home, Award, Tv, Radio,
  Sliders, Cpu, Activity, Flame, ScanLine, Search, ClipboardCheck, BarChart3,
  MessageSquare, ShoppingBag, User, Users, UserRoundSearch, Swords, LineChart,
  Bell, Grid3x3, ShieldCheck, Palette,
} from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import {
  getSidebarFeatures, loadFeatureLayout, FeatureGroup,
} from '../../lib/featureConfig';
import { canAccessThemeStore } from '../../lib/adminDevAccess';
import { getActiveSport } from '../../sports/registry';
import {
  Z8_ACTIVE, Z8_IDLE, Z8_ICON_BOX, Z8_LABEL, Z8_PANEL, Z8_SURFACE, Z8_SIDEBAR_SHELL,
} from '../../theme/z8Tokens';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles, MessageSquare,
  ShoppingBag, User, Settings, Users, UserRoundSearch, Swords, LineChart,
  Bell, Grid3x3, Palette,
};

/** HR nav items use Flame per featureConfig. */
const HR_NAV_IDS = new Set(['hr_board']);

const GROUP_ORDER: FeatureGroup[] = ['Daily', 'Pro Labs', 'Build & Track', 'Social', 'Account'];

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
      return { label: 'Pro', ring: '#00FF94', text: 'text-vouch-emerald', chipBg: 'bg-vouch-emerald/10 border-vouch-emerald/30' };
    case 'SELLER_PRO':
      return { label: 'Capper', ring: '#00F0FF', text: 'text-vouch-cyan', chipBg: 'bg-vouch-cyan/10 border-vouch-cyan/30' };
    default:
      return { label: 'Basic', ring: 'rgba(255,255,255,0.25)', text: 'text-white/40', chipBg: 'bg-white/5 border-white/10' };
  }
}

export function TierAvatar({ profile, size = 40, onClick, ariaLabel }: {
  profile: CreatorProofProfile;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const meta = tierMeta(profile.subscriptionTier);
  const initials = (profile.displayName || profile.username || '?')
    .trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const inner = profile.avatarUrl ? (
    <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full rounded-full object-cover" />
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
}

export default function MobileProfileDrawer({ open, onClose, profile, activeSection, onSectionChange }: MobileProfileDrawerProps) {
  const meta = tierMeta(profile.subscriptionTier);

  // Lock body scroll while the drawer is open.
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
    const features = getSidebarFeatures(loadFeatureLayout(), {
      canAccessThemeStore: canAccessThemeStore(profile),
      activeSport: getActiveSport(),
    });
    return GROUP_ORDER
      .map((group) => ({ group, items: features.filter((f) => f.group === group) }))
      .filter((g) => g.items.length > 0);
  }, [profile, open]);

  const go = (section: string) => {
    onSectionChange(section);
    onClose();
  };

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
            className={`absolute inset-y-0 left-0 flex w-[82vw] max-w-[320px] flex-col ${Z8_SIDEBAR_SHELL} shadow-[4px_0_48px_rgba(0,0,0,0.95)]`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Profile header — real token-identity data only */}
            <div className="glass-border border-b border-vouch-cyan/20 px-4 pb-4 pt-[max(env(safe-area-inset-top),16px)]">
              <div className="flex items-start justify-between pt-1">
                <TierAvatar profile={profile} size={52} onClick={() => go('profile')} ariaLabel="Open profile" />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className={`flex h-8 w-8 items-center justify-center border border-white/10 text-white/40 transition hover:border-vouch-cyan/45 hover:bg-vouch-cyan/8 hover:text-white ${Z8_SURFACE}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <button type="button" onClick={() => go('profile')} className="mt-2.5 block text-left">
                <p className="flex items-center gap-1.5 text-base font-black text-white">
                  {profile.displayName}
                  {profile.verified && <ShieldCheck className="h-3.5 w-3.5 text-vouch-cyan" />}
                </p>
                <p className="text-xs text-white/40">@{profile.username}</p>
              </button>
              <div className="z8-accent-line mt-3 w-full" aria-hidden />
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.chipBg} ${meta.text}`}>
                  {meta.label}
                </span>
                {profile.subscriptionTier !== 'SELLER_PRO' && (
                  <button
                    type="button"
                    onClick={() => go('premium')}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50 transition hover:border-vouch-emerald/40 hover:text-vouch-emerald"
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
                <div key={group} className={`mb-3 overflow-hidden glass-panel-strong ${Z8_PANEL}`}>
                  <p className={`border-b border-vouch-cyan/20 px-3 py-2 ${Z8_LABEL} text-[9px] tracking-[0.18em] text-vouch-cyan`}>{group}</p>
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
                            'relative flex w-full items-center gap-3 border px-3 py-2.5 text-left text-sm transition-all font-z8',
                            isActive ? Z8_ACTIVE : Z8_IDLE,
                          ].join(' ')}
                        >
                          {isActive && (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-1 left-0 w-px bg-vouch-cyan/80 shadow-[0_0_10px_rgba(0,240,255,0.9)]"
                            />
                          )}
                          <span
                            className={[
                              'h-7 w-7 shrink-0 transition-all',
                              isActive
                                ? 'flex items-center justify-center border border-vouch-cyan/60 bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_14px_rgba(0,240,255,0.35)]'
                                : Z8_ICON_BOX,
                            ].join(' ')}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate text-[12px] font-bold uppercase tracking-wide">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="glass-border border-t border-vouch-cyan/20 px-2 py-2 pb-[max(env(safe-area-inset-bottom),8px)]">
              <button
                type="button"
                onClick={() => go('settings')}
                className={`flex w-full items-center gap-3 border px-3 py-2.5 text-sm transition-all ${Z8_IDLE} ${Z8_LABEL}`}
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
