import React, { useEffect, useMemo, useState } from 'react';
import { UserCircle, Home, ClipboardCheck, BarChart3, User, Settings, Shield, Sparkles, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag, MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Sliders, Eye, Zap, Palette, Users, UserRoundSearch, Swords, LineChart, Bell } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { ALL_FEATURES, getSidebarFeatures, loadFeatureLayout, saveFeatureLayout, setViewMode, FeatureLayout } from '../../lib/featureConfig';
import { canAccessThemeStore } from '../../lib/adminDevAccess';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, SportId } from '../../sports/registry';

const SIDEBAR_GROUPS = ['Daily', 'Pro Labs', 'Build & Track', 'Social', 'Account'] as const;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  LayoutDashboard,
  Home,
  Award,
  Tv,
  Radio,
  Sliders,
  Cpu,
  Activity,
  Flame,
  ScanLine,
  Search,
  ClipboardCheck,
  BarChart3,
  Sparkles,
  MessageSquare,
  ShoppingBag,
  User,
  Settings,
  Users,
  UserRoundSearch,
  Swords,
  LineChart,
  Bell,
};

interface FeedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: CreatorProofProfile;
}

export default function FeedSidebar({ activeSection, onSectionChange, profile }: FeedSidebarProps) {
  const [layout, setLayout] = useState<FeatureLayout>(() => loadFeatureLayout());
  const [activeSport, setActiveSportState] = useState<SportId>(() => getActiveSport());

  // Reload layout when profile changes (e.g. after CustomizePage saves)
  useEffect(() => {
    setLayout(loadFeatureLayout());
  }, [activeSection]);

  // Keep the sidebar in sync when the active sport changes anywhere in the app
  useEffect(() => onSportChange(setActiveSportState), []);

  const handleSportClick = (id: SportId) => {
    setActiveSport(id);
    setActiveSportState(id);
  };

  const sidebarFeatures = useMemo(() => {
    const items = getSidebarFeatures(layout, {
      canAccessThemeStore: canAccessThemeStore(profile),
      activeSport,
    });

    if (!items.some((feature) => feature.id === 'hr_board')) {
      const hrBoardFeature = ALL_FEATURES.find((feature) => feature.id === 'hr_board');
      if (hrBoardFeature) items.push(hrBoardFeature);
    }

    return items.sort((a, b) => a.order - b.order);
  }, [layout, profile, activeSport]);

  const ungrouped = useMemo(() => sidebarFeatures.filter((f) => !f.group), [sidebarFeatures]);
  const grouped = useMemo(
    () => SIDEBAR_GROUPS.map((group) => ({
      group,
      items: sidebarFeatures.filter((f) => f.group === group),
    })).filter((section) => section.items.length > 0),
    [sidebarFeatures],
  );

  const renderItem = (f: { id: string; label: string; icon: string }) => {
    const IconComponent = ICON_MAP[f.icon] || Settings;
    const sectionId = f.id;
    const isActive = activeSection === f.id;
    return (
      <button
        key={f.id}
        onClick={() => onSectionChange(sectionId)}
        className={`group relative w-full flex items-center justify-center xl:justify-start gap-3 pl-2 xl:pl-3.5 pr-2 xl:pr-3 py-2.5 rounded-2xl border text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-[hsl(var(--ve-accent-cyan)/0.28)] ${
          isActive
            ? 'border-[hsl(var(--ve-accent-cyan)/0.35)] bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-text-primary))] font-black shadow-lg shadow-[hsl(var(--ve-shadow)/0.24)]'
            : 'border-transparent text-[hsl(var(--ve-text-muted))] hover:-translate-y-0.5 hover:border-[hsl(var(--ve-accent-cyan)/0.24)] hover:bg-[hsl(var(--ve-accent-cyan)/0.06)] hover:text-[hsl(var(--ve-text-primary))]'
        }`}
        id={`sidebar-link-${f.id}`}
      >
        {/* Active gradient fill + glow */}
        {isActive && (
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,hsl(var(--ve-text-primary)/0.16),hsl(var(--ve-accent-cyan)/0.12),transparent)] border border-[hsl(var(--ve-accent-cyan)/0.32)] shadow-[0_0_24px_-7px_hsl(var(--ve-accent-cyan)/0.70)]" />
        )}
        {/* Hover fill (inactive only) */}
        {!isActive && (
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-transparent group-hover:bg-[hsl(var(--ve-accent-cyan)/0.07)] transition-colors duration-200" />
        )}
        {/* Left accent indicator */}
        <span
          className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${
            isActive ? 'h-5 bg-[hsl(var(--ve-accent-cyan))] shadow-[0_0_10px_hsl(var(--ve-accent-cyan)/0.65)]' : 'h-0 bg-transparent group-hover:h-3 group-hover:bg-[hsl(var(--ve-text-muted)/0.45)]'
          }`}
        />
        {/* Icon chip */}
        <span
          className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-[hsl(var(--ve-accent-cyan)/0.14)] text-[hsl(var(--ve-accent-cyan))]'
              : 'text-[hsl(var(--ve-text-muted))] group-hover:text-[hsl(var(--ve-text-primary))] group-hover:bg-[hsl(var(--ve-accent-cyan)/0.06)]'
          }`}
        >
          <IconComponent className="w-[18px] h-[18px]" />
        </span>
        <span className="relative z-10 hidden xl:inline truncate">{f.label}</span>
      </button>
    );
  };

  const topIconButton = (
    section: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
  ) => {
    const isActive = activeSection === section;
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => onSectionChange(section)}
        className={`grid h-11 w-11 place-items-center rounded-2xl border transition ${
          isActive
            ? 'border-[hsl(var(--ve-accent-cyan)/0.50)] bg-[hsl(var(--ve-accent-cyan)/0.15)] text-[hsl(var(--ve-accent-cyan))] shadow-[0_0_18px_-8px_hsl(var(--ve-accent-cyan)/0.9)]'
            : 'border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.30)] text-[hsl(var(--ve-text-secondary))] hover:border-[hsl(var(--ve-accent-cyan)/0.42)] hover:bg-[hsl(var(--ve-accent-cyan)/0.10)] hover:text-[hsl(var(--ve-accent-cyan))]'
        }`}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  };

  const toggleMode = () => {
    const newMode = layout.mode === "beginner" ? "pro" : "beginner";
    const next = setViewMode(layout, newMode);
    setLayout(next);
    saveFeatureLayout(next);
  };

  return (
    <aside className="ve-sidebar relative hidden md:flex flex-col h-screen sticky top-0 w-[76px] xl:w-[286px] border-r border-[hsl(var(--ve-border)/0.28)] bg-transparent px-2.5 xl:px-4 py-5 text-[hsl(var(--ve-text-primary))] justify-between select-none backdrop-blur-sm z-40 flex-shrink-0 overflow-y-auto scrollbar-none shadow-none">
      <div className="pointer-events-none absolute inset-y-4 right-0 w-px bg-[linear-gradient(180deg,transparent,hsl(var(--ve-accent-cyan)/0.24),hsl(var(--ve-border)/0.26),transparent)]" />
      <div className="relative z-10 space-y-6">
        {/* Premium VouchEdge Brand */}
        <div
          onClick={() => onSectionChange('feed')}
          className="group relative flex items-center gap-3 rounded-2xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-bg-panel)/0.34)] p-2.5 shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] cursor-pointer transition hover:border-[hsl(var(--ve-accent-cyan)/0.38)] hover:bg-[hsl(var(--ve-accent-cyan)/0.06)]"
          id="brand-logo-id"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[hsl(var(--ve-accent-cyan)/0.38)] bg-[hsl(var(--ve-accent-cyan)/0.13)] text-[hsl(var(--ve-accent-cyan))] shadow-[0_0_26px_-10px_hsl(var(--ve-accent-cyan)/0.9)]">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_32%)]" />
            <span className="relative text-sm font-black tracking-tight">VE</span>
          </div>

          <div className="hidden xl:block min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-lg font-black tracking-tight text-[hsl(var(--ve-text-primary))]">
                VouchEdge
              </span>
              <span className="rounded-full border border-[hsl(var(--ve-accent-cyan)/0.24)] bg-[hsl(var(--ve-accent-cyan)/0.09)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[hsl(var(--ve-accent-cyan))]">
                Live
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[hsl(var(--ve-text-muted))]">
              MLB Intelligence Command
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3" aria-label="Primary shortcuts">
          {topIconButton('feed', 'Home Feed', Home)}
          {topIconButton('profile', 'Profile', UserCircle)}
        </div>

        {/* Sport Switcher */}
        <div className="relative overflow-hidden flex flex-col xl:flex-row gap-1 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.26)] p-1.5 shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]" id="sidebar-sport-switcher">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--ve-accent-cyan)/0.55)] to-transparent" />
          {SPORT_LIST.filter((sport) => sport.id === 'mlb').map((sport) => {
            const isActive = activeSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => handleSportClick(sport.id)}
                disabled={!sport.enabled}
                title={sport.enabled ? `Switch to ${sport.label}` : `${sport.label} — coming soon`}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-black transition-all duration-200 ${
                  isActive
                    ? 'bg-[hsl(var(--ve-accent-cyan)/0.12)] text-[hsl(var(--ve-accent-cyan))] border border-[hsl(var(--ve-accent-cyan)/0.45)] shadow-[0_0_22px_-5px_hsl(var(--ve-accent-cyan)/0.65)]'
                    : sport.enabled
                      ? 'text-[hsl(var(--ve-text-muted))] hover:-translate-y-0.5 hover:text-[hsl(var(--ve-text-primary))] hover:bg-[hsl(var(--ve-surface-raised)/0.38)] hover:border-[hsl(var(--ve-accent-cyan)/0.24)] border border-transparent'
                      : 'text-[hsl(var(--ve-text-muted)/0.75)] cursor-not-allowed border border-[hsl(var(--ve-accent-gold)/0.18)] bg-[hsl(var(--ve-accent-gold)/0.06)] opacity-90'
                }`}
                id={`sidebar-sport-${sport.id}`}
              >
                <span className="text-sm leading-none">{sport.emoji}</span>
                <span className="hidden xl:inline">{sport.label}</span>
                {!sport.enabled && (
                  <span className="hidden xl:inline-flex items-center rounded-full border border-[hsl(var(--ve-accent-gold)/0.36)] bg-[hsl(var(--ve-accent-gold)/0.12)] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-accent-gold))] shadow-lg shadow-[hsl(var(--ve-shadow)/0.22)]">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-4" id="sidebar-nav-container">
          <div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/85 p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.75)]">
            <div className="mb-4 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span>Quick tools</span>
              <span className="text-[10px] text-slate-500">{sidebarFeatures.length}</span>
            </div>
            <div className="space-y-3">
              {ungrouped.map(renderItem)}
            </div>
          </div>

          {grouped.map((section) => (
            <div key={section.group} className="rounded-[2rem] border border-slate-800/70 bg-slate-900/85 p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.75)]">
              <div className="mb-3 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                <span>{section.group}</span>
                <span className="text-[10px] text-slate-500">{section.items.length} items</span>
              </div>
              <div className="space-y-2">
                {section.items.map(renderItem)}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="hidden xl:block rounded-[2rem] border border-slate-800/70 bg-slate-900/85 p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.75)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Sync status</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Online
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
            Ledger, results, and parlay tracking are connected.
          </p>
        </div>

        <div
          onClick={() => onSectionChange('profile')}
          className="flex items-center gap-3 p-4 rounded-[2rem] bg-slate-900/85 border border-slate-800/70 cursor-pointer transition-all duration-200 hover:border-slate-600 hover:bg-slate-900 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.75)]"
          id="sidebar-profile-footer"
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
              <h4 className="font-semibold text-sm text-slate-100 truncate leading-none">{profile.displayName}</h4>
              {profile.verified && <Shield className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400 truncate leading-none mt-0.5">@{profile.username}</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={toggleMode}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-3xl text-[10px] font-black uppercase tracking-[0.14em] text-slate-100 transition-all border border-slate-700 bg-slate-900/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.75)]"
            style={{
              background: layout.mode === "pro" ? "rgba(34,211,238,0.12)" : "rgba(148,163,184,0.12)",
              borderColor: layout.mode === "pro" ? "rgba(34,211,238,0.35)" : "rgba(148,163,184,0.24)",
              color: layout.mode === "pro" ? "#22d3ee" : "#cbd5e1",
            }}
          >
            {layout.mode === "pro" ? <Zap className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span className="hidden xl:inline">{layout.mode === "pro" ? "Pro Mode" : "Beginner"}</span>
            <span className="hidden xl:inline ml-auto text-[8px] opacity-60">click to switch</span>
          </button>
          <button
            onClick={() => onSectionChange("customize")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-3xl text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 hover:bg-slate-900/80 transition-all border border-slate-700 bg-slate-900/80"
          >
            <Palette className="w-3 h-3" />
            <span className="hidden xl:inline">Customize Layout</span>
          </button>
          <button
            type="button"
            onClick={() => onSectionChange("settings")}
            aria-label="Settings"
            title="Settings"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-3xl text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
              activeSection === 'settings'
                ? 'border border-cyan-300/40 bg-cyan-400/10 text-cyan-200'
                : 'text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 hover:bg-slate-900/80'
            }`}
            style={{ background: activeSection === 'settings' ? undefined : 'rgba(148,163,184,0.08)', border: activeSection === 'settings' ? undefined : '1px solid rgba(148,163,184,0.14)' }}
          >
            <Settings className="w-3 h-3" />
            <span className="hidden xl:inline">Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

