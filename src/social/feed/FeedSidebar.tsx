import React, { useState, useEffect } from 'react';
import { Home, Sliders, ClipboardCheck, BarChart3, User, Settings, Shield, Edit3, Sparkles, Compass, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag, MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Eye, Zap, Palette, Users, UserRoundSearch, Swords, LineChart } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { loadFeatureLayout, getEnabledFeatures, saveFeatureLayout, setViewMode, FeatureLayout } from '../../lib/featureConfig';
import { canAccessThemeStore } from '../../lib/adminDevAccess';
import { SPORT_LIST, getActiveSport, setActiveSport, onSportChange, SportId } from '../../sports/registry';

/** Sidebar section order. Ungrouped items (e.g. Welcome) render first, headerless. */
const GROUP_ORDER = ['Daily', 'Pro Labs', 'Build & Track', 'Social', 'Account'] as const;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Radio, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles,
  MessageSquare, ShoppingBag, User, Settings, Users,
  UserRoundSearch, Swords, LineChart,
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
  });

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
        className={`group relative w-full flex items-center justify-center xl:justify-start gap-3 pl-2 xl:pl-3.5 pr-2 xl:pr-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none ${
          isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-100'
        }`}
        id={`sidebar-link-${f.id}`}
      >
        {/* Active gradient fill + glow */}
        {isActive && (
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/20 via-sky-500/[0.07] to-transparent border border-sky-400/25 shadow-[0_0_20px_-6px_rgba(56,189,248,0.55)]" />
        )}
        {/* Hover fill (inactive only) */}
        {!isActive && (
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.045] transition-colors duration-200" />
        )}
        {/* Left accent indicator */}
        <span
          className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${
            isActive ? 'h-5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]' : 'h-0 bg-transparent group-hover:h-3 group-hover:bg-slate-600'
          }`}
        />
        {/* Icon chip */}
        <span
          className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-sky-500/15 text-sky-300'
              : 'text-slate-400 group-hover:text-slate-100 group-hover:bg-white/[0.04]'
          }`}
        >
          <IconComponent className="w-[18px] h-[18px]" />
        </span>
        <span className="relative z-10 hidden xl:inline truncate">{f.label}</span>
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
    <aside className="hidden md:flex flex-col h-screen sticky top-0 px-2 xl:px-4 py-6 border-r border-white/[0.06] w-[70px] xl:w-[264px] text-slate-100 justify-between select-none bg-gradient-to-b from-[#0b1120] via-[#080c15] to-[#06090f] backdrop-blur-xl z-40 flex-shrink-0 overflow-y-auto scrollbar-none">
      <div className="space-y-6">
        {/* VouchEdge BRAND Logo with Epic Cinematic Star Wars crawler styling and Trust Badge */}
        <div 
          onClick={() => onSectionChange('feed')}
          className="flex items-center gap-2.5 px-1 relative group cursor-pointer"
          id="brand-logo-id"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-950/40 border-2 border-[#FFE81F]/70 flex items-center justify-center text-[#FFE81F] font-extrabold text-sm shadow-[0_0_15px_rgba(255,232,31,0.25)] shrink-0 select-none transform group-hover:rotate-12 transition-transform duration-300">
            ★
          </div>
          <span className="hidden xl:inline starwars-font-crawl text-xl tracking-wider select-none leading-none nav-link3d-crawl hover:scale-[1.03] transition-all">
            VOUCH<span className="text-[#FFE81F] starwars-font-solid">EDGE</span>
          </span>
        </div>

        {/* Sport Switcher */}
        <div className="flex flex-col xl:flex-row gap-1 rounded-2xl border border-white/[0.06] bg-black/30 p-1 shadow-inner shadow-black/40" id="sidebar-sport-switcher">
          {SPORT_LIST.map((sport) => {
            const isActive = activeSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => handleSportClick(sport.id)}
                disabled={!sport.enabled}
                title={sport.enabled ? `Switch to ${sport.label}` : `${sport.label} — coming soon`}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-black transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-sky-500/25 to-indigo-500/15 text-sky-200 border border-sky-400/40 shadow-[0_0_14px_-3px_rgba(56,189,248,0.5)]'
                    : sport.enabled
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                      : 'text-slate-600 cursor-not-allowed border border-transparent opacity-70'
                }`}
                id={`sidebar-sport-${sport.id}`}
              >
                <span className="text-sm leading-none">{sport.emoji}</span>
                <span className="hidden xl:inline">{sport.label}</span>
                {!sport.enabled && <span className="hidden xl:inline rounded-full bg-white/5 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-500">Soon</span>}
              </button>
            );
          })}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1" id="sidebar-nav-container">
          {/* Ungrouped (e.g. Welcome) */}
          {ungrouped.map(renderItem)}

          {/* Grouped sections */}
          {grouped.map((section, idx) => (
            <div
              key={section.group}
              className={`space-y-0.5 ${idx === 0 && ungrouped.length === 0 ? 'pt-1' : 'mt-2 pt-3 border-t border-white/[0.05]'}`}
            >
              <p className="hidden xl:block px-3.5 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
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
            className="group/cta w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(79,70,229,0.7)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-sky-400/30"
            id="sidebar-cta-build-parlay"
          >
            <Sliders className="w-4 h-4 transition-transform duration-300 group-hover/cta:rotate-90" />
            <span className="hidden xl:inline">Build Parlay</span>
          </button>
        </div>
      </div>

      {/* Mini Profile Footer */}
      <div
        onClick={() => onSectionChange('profile')}
        className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.02] cursor-pointer transition-all duration-200 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
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
            <h4 className="font-semibold text-slate-200 text-xs truncate leading-none">{profile.displayName}</h4>
            {profile.verified && <Shield className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
          </div>
          <p className="text-slate-400 text-[10px] truncate leading-none mt-0.5">@{profile.username}</p>
        </div>
      </div>

      {/* Mode toggle + Customize link */}
      <div className="space-y-2 pt-2">
        <button
          onClick={toggleMode}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border"
          style={{
            background: layout.mode === "pro" ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.02)",
            borderColor: layout.mode === "pro" ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)",
            color: layout.mode === "pro" ? "#22d3ee" : "#64748b",
          }}
        >
          {layout.mode === "pro" ? <Zap className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span className="hidden xl:inline">{layout.mode === "pro" ? "Pro Mode" : "Beginner"}</span>
          <span className="hidden xl:inline ml-auto text-[8px] opacity-50">click to switch</span>
        </button>
        <button
          onClick={() => onSectionChange("customize")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <Palette className="w-3 h-3" />
          <span className="hidden xl:inline">Customize Layout</span>
        </button>
      </div>
    </aside>
  );
}
