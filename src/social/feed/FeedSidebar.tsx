import React, { useState, useEffect } from 'react';
import { UserCircle, Home, Sliders, ClipboardCheck, BarChart3, User, Settings, Shield, Edit3, Sparkles, Compass, Trophy, Crown, Search, Cpu, Tv, Radio, Award, ShoppingBag, MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Eye, Zap, Palette, Users, UserRoundSearch, Swords, LineChart, Bell } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { loadFeatureLayout, getEnabledFeatures, saveFeatureLayout, setViewMode, FeatureLayout } from '../../lib/featureConfig';
import { canAccessThemeStore } from '../../lib/adminDevAccess';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, SportId } from '../../sports/registry';

/** Sidebar section order. Ungrouped items (e.g. The Edge) render first, headerless. */
const GROUP_ORDER = ['Daily', 'Pro Labs', 'Build & Track', 'Social', 'Account'] as const;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles,
  MessageSquare, ShoppingBag, User, Settings, Users,
  UserRoundSearch, Swords, LineChart, Bell,
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

  // Build menu items from the feature config, filtered by the active sport
  const enabledFeatures = getEnabledFeatures(layout, {
    canAccessThemeStore: canAccessThemeStore(profile),
    activeSport,
  }).filter((feature) => !['feed', 'profile', 'settings', 'ai_engine'].includes(feature.id));

  // Split into ungrouped (top) + grouped sections, preserving order
  const ungrouped = enabledFeatures.filter((f) => !f.group);
  const grouped = GROUP_ORDER
    .map((group) => ({
      group,
      items: enabledFeatures.filter((f) => f.group === group),
    }))
    .filter((section) => section.items.length > 0);

  const renderItem = (f: { id: string; label: string; icon: string }) => {
    const IconComponent = ICON_MAP[f.icon] || Settings;
    const isActive = activeSection === f.id;
    return (
      <button
        key={f.id}
        onClick={() => onSectionChange(f.id)}
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
        <nav className="space-y-1" id="sidebar-nav-container">
          {/* Ungrouped (e.g. The Edge) */}
          {ungrouped.map(renderItem)}

          {/* Grouped sections */}
          {grouped.map((section, idx) => (
              <div
                key={section.group}
                className={`space-y-0.5 ${idx === 0 && ungrouped.length === 0 ? 'pt-1' : 'mt-2 pt-3 border-t border-[hsl(var(--ve-border)/0.20)]'}`}
              >
                <p className="hidden xl:block px-3.5 pb-1 text-[10px] font-black uppercase tracking-[0.24em] text-[hsl(var(--ve-text-muted)/0.72)]">
                  {section.group}
                </p>
                {section.items.map(renderItem)}
              </div>
            ))}
        </nav>

        {/* Primary CTA: Build Parlay */}
        <div className="px-1 pt-1">
          <button
            onClick={() => onSectionChange('build')}
            className="group/cta relative w-full overflow-hidden border border-[hsl(var(--ve-accent-cyan)/0.38)] bg-[hsl(var(--ve-accent-cyan))] hover:brightness-110 text-[hsl(var(--ve-bg-deep))] font-black py-3 px-4 rounded-2xl shadow-[0_18px_45px_-18px_hsl(var(--ve-accent-cyan)/0.9)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-[hsl(var(--ve-accent-cyan)/0.30)]"
            id="sidebar-cta-build-parlay"
          >
            <Sliders className="w-4 h-4 transition-transform duration-300 group-hover/cta:rotate-90" />
            <span className="hidden xl:inline">Build Parlay</span>
          </button>
        </div>
      </div>

      {/* Mini Profile Footer */}
      <div className="hidden xl:block rounded-2xl border border-[hsl(var(--ve-border)/0.26)] bg-[hsl(var(--ve-bg-panel)/0.26)] p-3 shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-secondary))]">VAI Sync</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Online
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[hsl(var(--ve-text-muted))]">
          Ledger, results, and AI parlay tracking are connected.
        </p>
      </div>

      <div
        onClick={() => onSectionChange('profile')}
        className="flex items-center gap-3 p-2 rounded-2xl bg-[hsl(var(--ve-bg-panel)/0.26)] cursor-pointer transition-all duration-200 border border-[hsl(var(--ve-border)/0.26)] hover:border-[hsl(var(--ve-accent-cyan)/0.38)] hover:bg-[hsl(var(--ve-accent-cyan)/0.07)] shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]"
        id="sidebar-profile-footer"
      >
        <ProfileAvatarBorder 
          borderId={profile.profileBorderId}
          displayName={profile.displayName}
          initials={profile.displayName.split(' ').map(n=>n[0]).join('')}
          size="md"
          winRate={profile.winRate}
          isVerified={profile.verified}
        />
        <div className="hidden xl:block min-w-0 flex-1 ml-0.5">
          <div className="flex items-center gap-1">
            <h4 className="font-semibold text-[hsl(var(--ve-text-primary))] text-xs truncate leading-none">{profile.displayName}</h4>
            {profile.verified && <Shield className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
          </div>
          <p className="text-[hsl(var(--ve-text-muted))] text-[10px] truncate leading-none mt-0.5">@{profile.username}</p>
        </div>
      </div>

      {/* Mode toggle + Customize link */}
      <div className="space-y-2 pt-2">
        <button
          onClick={toggleMode}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.14em] transition-all border shadow-lg shadow-black/10"
          style={{
            background: layout.mode === "pro" ? "hsl(var(--ve-accent-cyan) / 0.10)" : "hsl(var(--ve-surface-raised) / 0.28)",
            borderColor: layout.mode === "pro" ? "hsl(var(--ve-accent-cyan) / 0.35)" : "hsl(var(--ve-border) / 0.22)",
            color: layout.mode === "pro" ? "hsl(var(--ve-accent-cyan))" : "hsl(var(--ve-text-muted))",
          }}
        >
          {layout.mode === "pro" ? <Zap className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span className="hidden xl:inline">{layout.mode === "pro" ? "Pro Mode" : "Beginner"}</span>
          <span className="hidden xl:inline ml-auto text-[8px] opacity-50">click to switch</span>
        </button>
        <button
          onClick={() => onSectionChange("customize")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.14em] text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-accent-cyan))] hover:border-[hsl(var(--ve-accent-cyan)/0.28)] hover:bg-[hsl(var(--ve-accent-cyan)/0.07)] transition-all"
          style={{ background: "hsl(var(--ve-surface-raised) / 0.28)", border: "1px solid hsl(var(--ve-border) / 0.22)" }}
        >
          <Palette className="w-3 h-3" />
          <span className="hidden xl:inline">Customize Layout</span>
        </button>
        <button
          type="button"
          onClick={() => onSectionChange("settings")}
          aria-label="Settings"
          title="Settings"
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
            activeSection === 'settings'
              ? 'border border-[hsl(var(--ve-accent-cyan)/0.35)] bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-accent-cyan))]'
              : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-accent-cyan))] hover:border-[hsl(var(--ve-accent-cyan)/0.28)] hover:bg-[hsl(var(--ve-accent-cyan)/0.07)]'
          }`}
          style={{ background: activeSection === 'settings' ? undefined : "hsl(var(--ve-surface-raised) / 0.28)", border: activeSection === 'settings' ? undefined : "1px solid hsl(var(--ve-border) / 0.22)" }}
        >
          <Settings className="w-3 h-3" />
          <span className="hidden xl:inline">Settings</span>
        </button>
      </div>
    </aside>
  );
}
