/**
 * FeedSidebar — Pro rebuild
 *
 * Design rules:
 *  - Zero hardcoded hex/rgba — every color goes through a --ve-* CSS custom property
 *  - Collapsible group sections (open by default, user preference persisted in localStorage)
 *  - Sport pill switcher (MLB / NBA / NFL) at top
 *  - BEGINNER/PRO toggle removed → lives in Settings
 *  - Notifications removed from sidebar → header bell icon
 *  - Cmd+K hint at top for power users
 *  - All 18+ features preserved, just 2-level hierarchy
 *  - Theme-ready: swap data-ve-theme on <html> and the entire sidebar repaints
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

/** Group → accent token key used for the group header label colour. */
const GROUP_ACCENT: Record<string, string> = {
  Daily: '--ve-accent-cyan',
  'Pro Labs': '--ve-accent-pink',
  'Build & Track': '--ve-accent-gold',
  Social: '--ve-accent-cyan',
  Account: '--ve-text-muted',
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
        've-nav-item group relative w-full flex items-center justify-center xl:justify-start gap-3',
        'pl-2 xl:pl-3.5 pr-2 xl:pr-3 py-2.5 rounded-2xl border text-sm',
        'transition-all duration-[var(--ve-duration-normal)] outline-none',
        'focus-visible:ring-2 focus-visible:ring-[hsl(var(--ve-accent-cyan)/0.35)]',
        isActive
          ? 've-nav-item-active border-[hsl(var(--ve-accent-cyan)/0.38)] bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-text-primary))] font-black shadow-lg shadow-[hsl(var(--ve-shadow)/0.22)]'
          : 'border-transparent text-[hsl(var(--ve-text-muted))] hover:-translate-y-px hover:border-[hsl(var(--ve-accent-cyan)/0.22)] hover:bg-[hsl(var(--ve-accent-cyan)/0.06)] hover:text-[hsl(var(--ve-text-primary))]',
      ].join(' ')}
    >
      {/* Active glow overlay */}
      {isActive && (
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,hsl(var(--ve-text-primary)/0.12),hsl(var(--ve-accent-cyan)/0.10),transparent)] border border-[hsl(var(--ve-accent-cyan)/0.30)] shadow-[0_0_22px_-7px_hsl(var(--ve-accent-cyan)/0.65)]" />
      )}
      {/* Hover fill */}
      {!isActive && (
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-transparent group-hover:bg-[hsl(var(--ve-accent-cyan)/0.05)] transition-colors duration-[var(--ve-duration-fast)]" />
      )}
      {/* Left accent bar */}
      <span
        className={[
          'pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-[var(--ve-duration-normal)]',
          isActive
            ? 'h-5 bg-[hsl(var(--ve-accent-cyan))] shadow-[0_0_10px_hsl(var(--ve-accent-cyan)/0.60)]'
            : 'h-0 bg-transparent group-hover:h-3 group-hover:bg-[hsl(var(--ve-text-muted)/0.40)]',
        ].join(' ')}
      />
      {/* Icon chip */}
      <span
        className={[
          'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-all duration-[var(--ve-duration-fast)]',
          isActive
            ? 'border-[hsl(var(--ve-accent-cyan)/0.45)] bg-[hsl(var(--ve-accent-cyan)/0.16)] text-[hsl(var(--ve-accent-cyan))] shadow-[0_0_14px_-4px_hsl(var(--ve-accent-cyan)/0.60)]'
            : 'border-[hsl(var(--ve-border)/0.42)] bg-[hsl(var(--ve-surface)/0.46)] text-[hsl(var(--ve-text-muted))] group-hover:border-[hsl(var(--ve-accent-cyan)/0.28)] group-hover:text-[hsl(var(--ve-accent-cyan)/0.85)]',
        ].join(' ')}
      >
        <IconComponent className="h-3.5 w-3.5" />
      </span>
      {/* Label */}
      <span className="relative z-10 hidden xl:block truncate text-[13px] font-semibold leading-none">
        {label}
      </span>
      {/* Badge slot */}
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
  const accentVar = GROUP_ACCENT[group] || '--ve-text-muted';
  const hasActive = items.some(i => i.id === activeSection);

  return (
    <div
      className={[
        've-sidebar-group rounded-[1.4rem] border transition-all duration-[var(--ve-duration-slow)]',
        hasActive
          ? 'border-[hsl(var(--ve-accent-cyan)/0.22)] bg-[hsl(var(--ve-bg-panel)/0.46)]'
          : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.28)]',
        'shadow-[0_8px_28px_-12px_hsl(var(--ve-shadow)/0.35)]',
      ].join(' ')}
    >
      {/* Group header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.28em] transition-colors duration-[var(--ve-duration-fast)] hover:bg-[hsl(var(--ve-surface-raised)/0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ve-accent-cyan)/0.30)]"
        aria-expanded={!collapsed}
      >
        <span
          className="hidden xl:block"
          style={{ color: `hsl(var(${accentVar}))` }}
        >
          {group}
        </span>
        {/* Collapsed icon-only indicator */}
        <span className="xl:hidden flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--ve-surface)/0.60)] border border-[hsl(var(--ve-border)/0.40)]">
          <span style={{ color: `hsl(var(${accentVar}))` }} className="block w-1.5 h-1.5 rounded-full bg-current" />
        </span>
        <span className="hidden xl:flex items-center gap-1.5">
          <span className="text-[9px] text-[hsl(var(--ve-text-muted)/0.55)]">
            {items.length}
          </span>
          <ChevronDown
            className={[
              'h-3 w-3 text-[hsl(var(--ve-text-muted)/0.60)] transition-transform duration-[var(--ve-duration-normal)]',
              collapsed ? '-rotate-90' : 'rotate-0',
            ].join(' ')}
          />
        </span>
      </button>

      {/* Items */}
      <div
        className={[
          'overflow-hidden transition-all duration-[var(--ve-duration-normal)]',
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
        've-sidebar relative hidden md:flex flex-col h-screen sticky top-0',
        'w-[72px] xl:w-[280px]',
        'border-r border-[hsl(var(--ve-border)/0.26)]',
        'bg-transparent px-2 xl:px-3.5 py-4',
        'text-[hsl(var(--ve-text-primary))]',
        'justify-between select-none backdrop-blur-sm',
        'z-40 flex-shrink-0 overflow-y-auto scrollbar-none',
      ].join(' ')}
    >
      {/* Right edge gradient line */}
      <div className="pointer-events-none absolute inset-y-4 right-0 w-px bg-[linear-gradient(180deg,transparent,hsl(var(--ve-accent-cyan)/0.22),hsl(var(--ve-border)/0.24),transparent)]" />

      {/* ── Top section ───────────────────────────────────────────── */}
      <div className="relative z-10 space-y-4 flex-1">

        {/* Brand logo */}
        <button
          onClick={() => onSectionChange('feed')}
          className="group relative w-full flex items-center gap-3 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.32)] p-2.5 shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)] cursor-pointer transition-all duration-[var(--ve-duration-normal)] hover:border-[hsl(var(--ve-accent-cyan)/0.35)] hover:bg-[hsl(var(--ve-accent-cyan)/0.06)]"
          id="brand-logo-id"
          aria-label="Go to Home Feed"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[hsl(var(--ve-accent-cyan)/0.36)] bg-[hsl(var(--ve-accent-cyan)/0.12)] text-[hsl(var(--ve-accent-cyan))] shadow-[0_0_24px_-10px_hsl(var(--ve-accent-cyan)/0.85)]">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--ve-text-primary)/0.24),transparent_32%)]" />
            <span className="relative text-[13px] font-black tracking-tight">VE</span>
          </div>
          <div className="hidden xl:block min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-black tracking-tight text-[hsl(var(--ve-text-primary))]">
                VouchEdge
              </span>
              <span className="rounded-full border border-[hsl(var(--ve-accent-cyan)/0.24)] bg-[hsl(var(--ve-accent-cyan)/0.09)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[hsl(var(--ve-accent-cyan))]">
                Live
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium text-[hsl(var(--ve-text-muted))]">
              MLB Intelligence Command
            </p>
          </div>
        </button>

        {/* Cmd+K hint — desktop only */}
        <button
          onClick={onOpenCmdK}
          className="hidden xl:flex w-full items-center gap-2 rounded-xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-bg-panel)/0.20)] px-3 py-2 text-[11px] text-[hsl(var(--ve-text-muted))] transition-all duration-[var(--ve-duration-fast)] hover:border-[hsl(var(--ve-accent-cyan)/0.30)] hover:bg-[hsl(var(--ve-surface)/0.38)] hover:text-[hsl(var(--ve-text-primary))]"
          aria-label="Open command palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Quick search…</span>
          <span className="flex items-center gap-0.5 rounded-md border border-[hsl(var(--ve-border)/0.50)] bg-[hsl(var(--ve-surface)/0.40)] px-1.5 py-0.5 text-[9px] font-black tracking-wider text-[hsl(var(--ve-text-muted)/0.70)]">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        {/* Sport Switcher pills */}
        <div
          className="relative overflow-hidden flex flex-col xl:flex-row gap-1 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.24)] p-1.5 shadow-[0_4px_16px_-6px_hsl(var(--ve-shadow)/0.28)]"
          id="sidebar-sport-switcher"
          role="group"
          aria-label="Sport selector"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-accent-cyan)/0.50),transparent)]" />
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
                  'flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-black transition-all duration-[var(--ve-duration-normal)]',
                  isActive
                    ? 'bg-[hsl(var(--ve-accent-cyan)/0.12)] text-[hsl(var(--ve-accent-cyan))] border border-[hsl(var(--ve-accent-cyan)/0.45)] shadow-[0_0_20px_-5px_hsl(var(--ve-accent-cyan)/0.60)]'
                    : sport.enabled
                      ? 'border border-transparent text-[hsl(var(--ve-text-muted))] hover:-translate-y-px hover:text-[hsl(var(--ve-text-primary))] hover:bg-[hsl(var(--ve-surface-raised)/0.35)] hover:border-[hsl(var(--ve-accent-cyan)/0.22)]'
                      : 'border border-[hsl(var(--ve-accent-gold)/0.16)] bg-[hsl(var(--ve-accent-gold)/0.05)] text-[hsl(var(--ve-text-muted)/0.60)] cursor-not-allowed opacity-80',
                ].join(' ')}
              >
                <span className="text-sm leading-none">{sport.emoji}</span>
                <span className="hidden xl:inline">{sport.label}</span>
                {!sport.enabled && (
                  <span className="hidden xl:inline-flex items-center rounded-full border border-[hsl(var(--ve-accent-gold)/0.34)] bg-[hsl(var(--ve-accent-gold)/0.10)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-[hsl(var(--ve-accent-gold))]">
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
        <div className="hidden xl:flex items-center justify-between gap-2 rounded-2xl border border-[hsl(var(--ve-border)/0.24)] bg-[hsl(var(--ve-bg-panel)/0.22)] px-3.5 py-2.5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted)/0.65)]">
              Sync
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-[hsl(var(--ve-text-muted)/0.55)]">
              Live data connected
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[hsl(var(--ve-success)/0.28)] bg-[hsl(var(--ve-success)/0.10)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.10em] text-[hsl(var(--ve-success))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--ve-success))] animate-pulse" />
            Online
          </span>
        </div>

        {/* Quick-action row: Customize + Settings */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
          <button
            onClick={() => onSectionChange('customize')}
            className={[
              'flex items-center justify-center xl:justify-start gap-2 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-[var(--ve-duration-fast)]',
              activeSection === 'customize'
                ? 'border-[hsl(var(--ve-accent-pink)/0.40)] bg-[hsl(var(--ve-accent-pink)/0.10)] text-[hsl(var(--ve-accent-pink))]'
                : 'border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel)/0.22)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-accent-pink)/0.28)] hover:bg-[hsl(var(--ve-accent-pink)/0.07)] hover:text-[hsl(var(--ve-text-primary))]',
            ].join(' ')}
            aria-label="Customize layout"
          >
            <Palette className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">Customize</span>
          </button>
          <button
            onClick={() => onSectionChange('settings')}
            className={[
              'flex items-center justify-center xl:justify-start gap-2 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-[var(--ve-duration-fast)]',
              activeSection === 'settings'
                ? 'border-[hsl(var(--ve-accent-cyan)/0.40)] bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-accent-cyan))]'
                : 'border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel)/0.22)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-accent-cyan)/0.28)] hover:bg-[hsl(var(--ve-accent-cyan)/0.06)] hover:text-[hsl(var(--ve-text-primary))]',
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
          className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.28)] cursor-pointer transition-all duration-[var(--ve-duration-normal)] hover:border-[hsl(var(--ve-accent-cyan)/0.30)] hover:bg-[hsl(var(--ve-surface-raised)/0.28)] shadow-[0_4px_16px_-6px_hsl(var(--ve-shadow)/0.22)]"
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
              <h4 className="font-semibold text-sm text-[hsl(var(--ve-text-primary))] truncate leading-none">
                {profile.displayName}
              </h4>
              {profile.verified && (
                <Shield className="h-3 w-3 shrink-0 text-[hsl(var(--ve-success))] fill-[hsl(var(--ve-success)/0.85)]" />
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-[hsl(var(--ve-text-muted))] truncate">
              {profile.winRate != null
                ? `${Math.round(profile.winRate * 100)}% win rate`
                : 'View profile'}
            </p>
          </div>
          {/* Notification badge on avatar when collapsed */}
          {unreadNotifications > 0 && (
            <span className="xl:hidden absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--ve-accent-pink))] text-[8px] font-black text-[hsl(var(--ve-bg))]">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
