/**
 * FeedSidebar — Z8 Obsidian rebuild
 *
 * Design rules:
 *  - Z8 tokens only: glass-panel/glass-border, vouch-emerald (primary), vouch-cyan (secondary)
 *  - No per-group rainbow colors — every group and nav item shares the same two-accent system
 *  - Collapsible group sections (open by default, user preference persisted in localStorage)
 *  - Sport pill switcher (MLB / NBA / NFL) at top
 *  - BEGINNER/PRO toggle removed → lives in Settings
 *  - Notifications removed from sidebar → header bell icon
 *  - Cmd+K hint at top for power users
 *  - All 18+ features preserved, just 2-level hierarchy
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Z8_ACTIVE, Z8_IDLE, Z8_ICON_BOX, Z8_LABEL, Z8_PANEL, Z8_SURFACE, Z8_SIDEBAR_SHELL,
} from '../../theme/z8Tokens';
import {
  UserCircle, Home, ClipboardCheck, BarChart3, User, Settings, Shield,
  Sparkles, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag,
  MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Sliders,
  Eye, Zap, Palette, Users, UserRoundSearch, Swords, LineChart, Bell,
  ChevronDown, Command, ChevronRight, CalendarDays, Grid3x3, Crown,
} from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import {
  ALL_FEATURES, getSidebarFeatures, loadFeatureLayout, saveFeatureLayout,
  setViewMode, FeatureLayout,
} from '../../lib/featureConfig';
import { canAccessThemeStore } from '../../lib/adminDevAccess';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, SportId } from '../../sports/registry';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIDEBAR_GROUPS = ['Daily', 'Pro Labs', 'Build & Track', 'Social', 'Account'] as const;

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
  'Build & Track': 'text-vouch-cyan',
  Social: 'text-vouch-cyan',
  Account: 'text-white/40',
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
  onClick: () => void;
  badge?: React.ReactNode;
}

function NavItem({ id, label, icon, isActive, onClick, badge }: NavItemProps) {
  const resolvedIcon = HR_NAV_IDS.has(id) ? 'Flame' : icon;
  const IconComponent = ICON_MAP[resolvedIcon] || Settings;

  return (
    <button
      key={id}
      onClick={onClick}
      id={`sidebar-link-${id}`}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'group relative w-full flex items-center justify-center xl:justify-start gap-3',
        'border pl-2 xl:pl-3.5 pr-2 xl:pr-3 py-2.5 text-sm uppercase tracking-wide transition-all outline-none font-z8',
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
          'relative z-10 h-7 w-7 shrink-0 transition-all',
          isActive
            ? 'flex items-center justify-center border border-vouch-cyan/60 bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_14px_rgba(0,240,255,0.35)]'
            : `${Z8_ICON_BOX} group-hover:border-vouch-cyan/45 group-hover:text-vouch-cyan group-hover:shadow-[0_0_10px_rgba(0,240,255,0.15)]`,
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
}

interface SidebarGroupProps {
  group: string;
  items: Array<{ id: string; label: string; icon: string }>;
  activeSection: string;
  onSectionChange: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarGroup({ group, items, activeSection, onSectionChange, collapsed, onToggle }: SidebarGroupProps) {
  const accentClass = GROUP_ACCENT[group] || 'text-white/40';
  const hasActive = items.some(i => i.id === activeSection);

  return (
    <div className={['glass-panel-strong glass-border transition-all overflow-hidden', Z8_PANEL, hasActive ? 'border-vouch-cyan/45 shadow-[0_0_24px_rgba(0,240,255,0.08)]' : ''].join(' ')}>
      {/* Group header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3 transition-colors hover:bg-vouch-cyan/5 outline-none ${Z8_LABEL}`}
        aria-expanded={!collapsed}
      >
        <span className={['hidden xl:block', accentClass].join(' ')}>
          {group}
        </span>
        {/* Collapsed icon-only indicator */}
        <span className="xl:hidden flex items-center justify-center w-5 h-5 border border-white/10 bg-black/30">
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

      {/* Items */}
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
              onClick={() => onSectionChange(f.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FeedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: CreatorProofProfile;
  onOpenCmdK?: () => void;
  unreadNotifications?: number;
}

export default function FeedSidebar({
  activeSection,
  onSectionChange,
  profile,
  onOpenCmdK,
  unreadNotifications = 0,
}: FeedSidebarProps) {
  const [layout, setLayout] = useState<FeatureLayout>(() => loadFeatureLayout());
  const [activeSport, setActiveSportState] = useState<SportId>(() => getActiveSport());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedState);

  // Reload layout when section changes (e.g. after CustomizePage saves)
  useEffect(() => { setLayout(loadFeatureLayout()); }, [activeSection]);

  // Sync active sport from anywhere in the app
  useEffect(() => onSportChange(setActiveSportState), []);

  const handleSportClick = (id: SportId) => {
    setActiveSport(id);
    setActiveSportState(id);
  };

  const toggleGroup = useCallback((group: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [group]: !prev[group] };
      saveCollapsedState(next);
      return next;
    });
  }, []);

  const sidebarFeatures = useMemo(() => {
    const items = getSidebarFeatures(layout, {
      canAccessThemeStore: canAccessThemeStore(profile),
      activeSport,
    });
    // Always include core Daily nav items even if a stale layout disabled them
    for (const id of ['today', 'hr_board', 'mlb_stats'] as const) {
      if (!items.some(f => f.id === id)) {
        const feature = ALL_FEATURES.find(f => f.id === id);
        if (feature) items.push(feature);
      }
    }
    return items
      // Notifications live in the header — exclude from sidebar
      .filter(f => f.id !== 'notifications')
      // BEGINNER/PRO toggle lives in Settings — exclude from sidebar
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
      {/* ── Top section ───────────────────────────────────────────── */}
      <div className="relative z-10 space-y-4 flex-1">

        {/* Brand logo */}
        <div className="relative">
          <button
            onClick={() => onSectionChange('feed')}
            className={`group relative w-full flex items-center gap-3 ${Z8_SURFACE} p-2.5 cursor-pointer transition-all hover:border-vouch-cyan/55 hover:bg-vouch-cyan/8 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]`}
            id="brand-logo-id"
            aria-label="Go to Home Feed"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-vouch-cyan/50 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_16px_rgba(0,240,255,0.25)]">
              <span className={`${Z8_LABEL} text-[13px] font-black tracking-tight text-vouch-cyan`}>VE</span>
            </div>
            <div className="hidden xl:block min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[15px] font-black uppercase italic tracking-tight text-white">
                  VouchEdge
                </span>
                <span className={`${Z8_LABEL} border border-vouch-cyan/35 bg-vouch-cyan/15 px-2 py-0.5 text-[9px] tracking-widest text-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]`}>
                  Live
                </span>
              </div>
              <p className={`mt-0.5 truncate ${Z8_LABEL} text-white/40`}>
                MLB Intelligence Command
              </p>
            </div>
          </button>
          <div className="z8-accent-line mt-2.5 w-full" aria-hidden />
        </div>

        {/* Cmd+K hint — desktop only */}
        <button
          onClick={onOpenCmdK}
          className={`hidden xl:flex w-full items-center gap-2 px-3 py-2 transition-all hover:border-vouch-cyan/35 hover:bg-vouch-cyan/5 hover:text-white ${Z8_SURFACE} ${Z8_LABEL} tracking-widest text-white/40`}
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Quick search…</span>
          <span className={`flex items-center gap-0.5 border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white/40 ${Z8_LABEL}`}>
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        {/* Sport Switcher pills */}
        <div
          className={`flex flex-col xl:flex-row gap-1 p-1.5 ${Z8_SURFACE}`}
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
                  'flex-1 flex items-center justify-center gap-1.5 border px-2 py-2 text-xs font-black uppercase tracking-wide transition-all',
                  isActive
                    ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                    : sport.enabled
                      ? 'border-transparent text-white/40 hover:border-vouch-cyan/30 hover:bg-vouch-cyan/5 hover:text-white'
                      : 'text-white/25 cursor-not-allowed opacity-70',
                ].join(' ')}
              >
                <span className="text-sm leading-none">{sport.emoji}</span>
                <span className="hidden xl:inline">{sport.label}</span>
                {!sport.enabled && (
                  <span className={`hidden xl:inline-flex items-center border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] tracking-widest text-white/30 ${Z8_LABEL}`}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <nav className="space-y-2.5" id="sidebar-nav-container" aria-label="Main navigation">
          {/* Ungrouped (Edge Island, etc.) */}
          {ungrouped.length > 0 && (
            <div className="space-y-1">
              {ungrouped.map(f => (
                <NavItem
                  key={f.id}
                  id={f.id}
                  label={f.label}
                  icon={f.icon}
                  isActive={activeSection === f.id}
                  onClick={() => onSectionChange(f.id)}
                />
              ))}
            </div>
          )}

          {/* Grouped sections */}
          {grouped.map(({ group, items }) => (
            <SidebarGroup
              key={group}
              group={group}
              items={items}
              activeSection={activeSection}
              onSectionChange={onSectionChange}
              collapsed={!!collapsed[group]}
              onToggle={() => toggleGroup(group)}
            />
          ))}
        </nav>
      </div>

      {/* ── Bottom section ────────────────────────────────────────── */}
      <div className="relative z-10 mt-4 space-y-2.5">
        {/* Sync status pill — desktop only */}
        <div className={`hidden xl:flex items-center justify-between gap-2 px-3.5 py-2.5 ${Z8_SURFACE}`}>
          <div>
            <p className={`${Z8_LABEL} text-[9px] tracking-[0.28em] text-vouch-cyan`}>
              Sync
            </p>
            <p className={`mt-0.5 ${Z8_LABEL} text-white/40`}>
              Live data connected
            </p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 border border-vouch-cyan/25 bg-vouch-cyan/10 px-2 py-0.5 text-[9px] tracking-widest text-vouch-cyan ${Z8_LABEL}`}>
            <span className="h-1.5 w-1.5 bg-vouch-cyan animate-pulse" />
            Online
          </span>
        </div>

        {/* Quick-action row: Customize + Settings */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
          <button
            onClick={() => onSectionChange('customize')}
            className={[
              'flex items-center justify-center xl:justify-start gap-2 border px-3 py-2 transition-all',
              Z8_LABEL, 'tracking-[0.12em]',
              activeSection === 'customize' ? Z8_ACTIVE : Z8_IDLE,
            ].join(' ')}
            aria-label="Customize layout"
          >
            <Palette className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">Customize</span>
          </button>
          <button
            onClick={() => onSectionChange('settings')}
            className={[
              'flex items-center justify-center xl:justify-start gap-2 border px-3 py-2 transition-all',
              Z8_LABEL, 'tracking-[0.12em]',
              activeSection === 'settings' ? Z8_ACTIVE : Z8_IDLE,
            ].join(' ')}
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">Settings</span>
          </button>
        </div>

        {/* Profile card */}
        <button
          onClick={() => onSectionChange('profile')}
          className={`w-full flex items-center gap-3 p-3 cursor-pointer transition-all hover:border-vouch-cyan/35 hover:bg-vouch-cyan/5 ${Z8_SURFACE}`}
          id="sidebar-profile-footer"
          aria-label={`View profile of ${profile.displayName}`}
        >
          <ProfileAvatarBorder
            borderId={profile.profileBorderId}
            displayName={profile.displayName}
            initials={profile.displayName.split(' ').map(n => n[0]).join('')}
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
          {/* Notification badge on avatar when collapsed */}
          {unreadNotifications > 0 && (
            <span className="xl:hidden absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-vouch-cyan text-[8px] font-black text-black">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
