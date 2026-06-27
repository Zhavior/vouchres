import React, { useState, useEffect } from 'react';
import { Home, Sliders, ClipboardCheck, BarChart3, User, Settings, Shield, Edit3, Sparkles, Compass, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag, MessageSquare, Activity, Flame, ScanLine, LayoutDashboard, Eye, Zap, Palette } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { loadFeatureLayout, getEnabledFeatures, saveFeatureLayout, setViewMode, FeatureLayout } from '../../lib/featureConfig';
import { canAccessThemeStore } from '../../lib/adminDevAccess';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles,
  MessageSquare, ShoppingBag, User, Settings,
};

interface FeedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: CreatorProofProfile;
}

export default function FeedSidebar({ activeSection, onSectionChange, profile }: FeedSidebarProps) {
  const [layout, setLayout] = useState<FeatureLayout>(() => loadFeatureLayout());

  // Reload layout when profile changes (e.g. after CustomizePage saves)
  useEffect(() => {
    setLayout(loadFeatureLayout());
  }, [activeSection]);

  // Build menu items from the feature config
  const enabledFeatures = getEnabledFeatures(layout, {
    canAccessThemeStore: canAccessThemeStore(profile),
  });
  const menuItems = enabledFeatures.map((f) => ({
    id: f.id,
    label: f.label,
    icon: ICON_MAP[f.icon] || Settings,
  }));

  const toggleMode = () => {
    const newMode = layout.mode === "beginner" ? "pro" : "beginner";
    const next = setViewMode(layout, newMode);
    setLayout(next);
    saveFeatureLayout(next);
  };

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 px-2 xl:px-4 py-6 border-r border-[#1e293b]/70 w-[70px] xl:w-[260px] text-slate-100 justify-between select-none bg-[#090d16]/95 backdrop-blur-xl z-40 flex-shrink-0 overflow-y-auto scrollbar-none">
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

        {/* Navigation Items */}
        <nav className="space-y-1.5" id="sidebar-nav-container">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-sky-950/40 text-sky-400 border border-sky-800/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                }`}
                id={`sidebar-link-${item.id}`}
              >
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="hidden xl:inline truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Primary CTA: Build Parlay */}
        <div className="px-2 pt-2">
          <button
            onClick={() => onSectionChange('build')}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-100 font-semibold py-3 px-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] text-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-sky-500/20"
            id="sidebar-cta-build-parlay"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden xl:inline font-bold">Build Parlay</span>
          </button>
        </div>
      </div>

      {/* Mini Profile Footer */}
      <div 
        onClick={() => onSectionChange('profile')}
        className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors border border-transparent hover:border-slate-800"
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
