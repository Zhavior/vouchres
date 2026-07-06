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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  UserCircle, Home, ClipboardCheck, BarChart3, User, Settings, Shield,
  Sparkles, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag,
  MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Sliders,
  Eye, Zap, Palette, Users, UserRoundSearch, Swords, LineChart, Bell,
  ChevronDown, Command, ChevronRight,
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
  ShoppingBag, User, Settings, Users, UserRoundSearch, Swords, LineChart, Bell,
};

/** Group → Z8 accent class used for the group header label colour. Disciplined two-accent system: emerald for proof/action groups, cyan for everything else. */
const GROUP_ACCENT: Record<string, string> = {
  Daily: 'text-vouch-emerald',
  'Pro Labs': 'text-vouch-cyan',
  'Build & Track': 'text-vouch-emerald',
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
  const IconComponent = ICON_MAP[icon] || Settings;

  return (
    <button
      key={id}
      onClick={onClick}
      id={`sidebar-link-${id}`}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'glass-panel glass-border font-z8 group relative w-full flex items-center justify-center xl:justify-start gap-3',
        'pl-2 xl:pl-3.5 pr-2 xl:pr-3 py-2.5 rounded-2xl text-sm transition-all outline-none',
        isActive ? 'text-white font-black' : 'text-white/50 hover:text-white',
      ].join(' ')}
    >
      <span
        className={[
          'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-all',
          isActive ? 'bg-vouch-emerald/15 text-vouch-emerald' : 'bg-vouch-emerald/10 text-vouch-emerald/70 group-hover:text-vouch-emerald',
        ].join(' ')}
      >
        <IconComponent className="h-3.5 w-3.5" />
      </span>
      <span className="relative z-10 hidden xl:block truncate text-[13px] font-semibold leading-none">
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
    <div className={['glass-panel glass-border font-z8 rounded-[1.4rem] transition-all', hasActive ? 'border-vouch-emerald/20' : ''].join(' ')}>
      {/* Group header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.28em] transition-colors hover:bg-white/[0.03] outline-none"
        aria-expanded={!collapsed}
      >
        <span className={['hidden xl:block', accentClass].join(' ')}>
          {group}
        </span>
        {/* Collapsed icon-only indicator */}
        <span className="xl:hidden flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.04] border border-white/10">
          <span className={['block w-1.5 h-1.5 rounded-full bg-current', accentClass].join(' ')} />
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
        <div className="px-2 pb-2.5 space-y-1">
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
    // Always include HR board
    if (!items.some(f => f.id === 'hr_board')) {
      const hr = ALL_FEATURES.find(f => f.id === 'hr_board');
      if (hr) items.push(hr);
    }
    // Always include MLB Stat Hub
    if (!items.some(f => f.id === 'mlb_stats')) {
      const mlb = ALL_FEATURES.find(f => f.id === 'mlb_stats');
      if (mlb) items.push(mlb);
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
      className={[
        'relative hidden md:flex flex-col h-screen sticky top-0 font-z8',
        'w-[72px] xl:w-[280px]',
        'border-r border-white/10',
        'bg-obsidian-900/60 px-2 xl:px-3.5 py-4',
        'text-white',
        'justify-between select-none backdrop-blur-sm',
        'z-40 flex-shrink-0 overflow-y-auto scrollbar-none',
      ].join(' ')}
    >
      {/* ── Top section ───────────────────────────────────────────── */}
      <div className="relative z-10 space-y-4 flex-1">

        {/* Brand logo */}
        <button
          onClick={() => onSectionChange('feed')}
          className="glass-panel glass-border group relative w-full flex items-center gap-3 rounded-2xl p-2.5 cursor-pointer transition-all"
          id="brand-logo-id"
          aria-label="Go to Home Feed"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vouch-emerald/10 text-vouch-emerald">
            <span className="text-[13px] font-black tracking-tight">VE</span>
          </div>
          <div className="hidden xl:block min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-black tracking-tight text-white">
                VouchEdge
              </span>
              <span className="terminal-text rounded-full bg-vouch-emerald/10 px-2 py-0.5 text-vouch-emerald">
                Live
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium text-white/40">
              MLB Intelligence Command
            </p>
          </div>
        </button>

        {/* Cmd+K hint — desktop only */}
        <button
          onClick={onOpenCmdK}
          className="glass-panel glass-border hidden xl:flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-white/40 transition-all hover:text-white"
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Quick search…</span>
          <span className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white/40">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        {/* Sport Switcher pills */}
        <div
          className="glass-panel glass-border flex flex-col xl:flex-row gap-1 rounded-2xl p-1.5"
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
                  'flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-black transition-all',
                  isActive
                    ? 'bg-vouch-emerald/10 text-vouch-emerald'
                    : sport.enabled
                      ? 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                      : 'text-white/25 cursor-not-allowed opacity-70',
                ].join(' ')}
              >
                <span className="text-sm leading-none">{sport.emoji}</span>
                <span className="hidden xl:inline">{sport.label}</span>
                {!sport.enabled && (
                  <span className="terminal-text hidden xl:inline-flex items-center rounded-full bg-white/[0.04] px-1.5 py-0.5 text-white/30">
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
        <div className="glass-panel glass-border hidden xl:flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5">
          <div>
            <p className="terminal-text text-white/40">
              Sync
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-white/40">
              Live data connected
            </p>
          </div>
          <span className="terminal-text inline-flex shrink-0 items-center gap-1 rounded-full bg-vouch-emerald/10 px-2 py-0.5 text-vouch-emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald animate-pulse" />
            Online
          </span>
        </div>

        {/* Quick-action row: Customize + Settings */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
          <button
            onClick={() => onSectionChange('customize')}
            className={[
              'glass-panel glass-border flex items-center justify-center xl:justify-start gap-2 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all',
              activeSection === 'customize'
                ? 'text-vouch-emerald bg-vouch-emerald/10'
                : 'text-white/40 hover:text-white',
            ].join(' ')}
            aria-label="Customize layout"
          >
            <Palette className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">Customize</span>
          </button>
          <button
            onClick={() => onSectionChange('settings')}
            className={[
              'glass-panel glass-border flex items-center justify-center xl:justify-start gap-2 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all',
              activeSection === 'settings'
                ? 'text-vouch-cyan bg-vouch-cyan/10'
                : 'text-white/40 hover:text-white',
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
          className="glass-panel glass-border w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all"
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
              <h4 className="font-semibold text-sm text-white truncate leading-none">
                {profile.displayName}
              </h4>
              {profile.verified && (
                <Shield className="h-3 w-3 shrink-0 text-vouch-emerald fill-vouch-emerald/85" />
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-white/40 truncate">
              {profile.winRate != null
                ? `${Math.round(profile.winRate * 100)}% win rate`
                : 'View profile'}
            </p>
          </div>
          {/* Notification badge on avatar when collapsed */}
          {unreadNotifications > 0 && (
            <span className="xl:hidden absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-vouch-cyan text-[8px] font-black text-black">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
