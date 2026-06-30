import React, { useState, useEffect } from 'react';
import { Home, Sliders, ClipboardCheck, BarChart3, User, Settings, Shield, Edit3, Sparkles, Compass, Trophy, Search, Cpu, Tv, Radio, Award, ShoppingBag, MessageSquare, Target, Scan, ChevronDown, ChevronUp, Check, SlidersHorizontal } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';

interface FeedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: CreatorProofProfile;
}

export default function FeedSidebar({ activeSection, onSectionChange, profile }: FeedSidebarProps) {
  const menuItems = [
    { id: 'welcome', label: 'Welcome Portal', icon: Trophy },
    { id: 'nba_nfl', label: 'Coming soon 🏀🏈', icon: Target },
    { id: 'vouchscan', label: 'VouchScan AI Audit ⚡', icon: Scan },
    { id: 'feed', label: 'Home Feed', icon: Home },
    { id: 'leaderboard', label: 'Top Cappers 🏆', icon: Award },
    { id: 'streams', label: 'Live Streams 🔴', icon: Radio },
    { id: 'live_games', label: 'Live Projections', icon: Tv },
    { id: 'build', label: 'Build Parlay', icon: Sliders },
    { id: 'ai_engine', label: 'V.A.I Smart Picks', icon: Cpu },
    { id: 'research', label: 'Player Research', icon: Search },
    { id: 'board', label: 'Vouch Board', icon: ClipboardCheck },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'premium', label: 'PRO Premium Tiers', icon: Sparkles },
    { id: 'subscriber_hub', label: 'Subscriber Clubs 💬', icon: MessageSquare },
    { id: 'themestore', label: 'Theme Store 🎨', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Map each item to a module category
  const itemCategoryMap: Record<string, 'required' | 'recommended' | 'optional'> = {
    vouchscan: 'required',
    feed: 'required',
    build: 'required',
    results: 'required',
    settings: 'required',

    ai_engine: 'recommended',
    leaderboard: 'recommended',
    board: 'recommended',
    research: 'recommended',

    welcome: 'optional',
    nba_nfl: 'optional',
    streams: 'optional',
    live_games: 'optional',
    premium: 'optional',
    subscriber_hub: 'optional',
    themestore: 'optional',
    profile: 'optional',
  };

  // Check if logged in / signed up
  const isRegistered = profile.username && profile.username !== 'anonymous_capper' && profile.username !== '';

  // Workspace configuration state
  const [showConfig, setShowConfig] = useState(false);
  const [enabledOptional, setEnabledOptional] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vouchedge_optional_nav');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    // Default: all optional features are shown initially
    return ['welcome', 'nba_nfl', 'streams', 'live_games', 'premium', 'subscriber_hub', 'themestore', 'profile'];
  });

  const [customCategories, setCustomCategories] = useState<Record<string, 'required' | 'recommended' | 'optional' | 'hidden'>>(() => {
    try {
      const saved = localStorage.getItem('vouchedge_custom_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('vouchedge_custom_categories');
        if (saved) {
          setCustomCategories(JSON.parse(saved));
        } else {
          setCustomCategories({});
        }
      } catch (e) {}
    };
    window.addEventListener('vouchedge-workspace-updated', handleUpdate);
    return () => window.removeEventListener('vouchedge-workspace-updated', handleUpdate);
  }, []);

  const toggleOptionalItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEnabledOptional(prev => {
      const next = prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id];
      localStorage.setItem('vouchedge_optional_nav', JSON.stringify(next));
      return next;
    });
  };

  const getItemCategory = (id: string): 'required' | 'recommended' | 'optional' | 'hidden' => {
    if (customCategories[id]) {
      return customCategories[id];
    }
    const def = itemCategoryMap[id];
    return def || 'optional';
  };

  // Dynamic visible menus
  const visibleRequired = menuItems.filter(item => {
    const cat = getItemCategory(item.id);
    return cat === 'required';
  });

  const visibleRecommended = menuItems.filter(item => {
    const cat = getItemCategory(item.id);
    return cat === 'recommended';
  });

  const visibleOptional = menuItems.filter(item => {
    const cat = getItemCategory(item.id);
    return cat === 'optional' && enabledOptional.includes(item.id);
  });

  // Helper to render navigation buttons
  const renderNavButton = (item: typeof menuItems[0]) => {
    const IconComponent = item.icon;
    const isActive = activeSection === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onSectionChange(item.id)}
        className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 outline-none ${
          isActive
            ? 'bg-sky-950/40 text-sky-400 border border-sky-850/40 font-semibold'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
        }`}
        id={`sidebar-link-${item.id}`}
      >
        <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
        <span className="hidden xl:inline truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 px-2 xl:px-4 py-6 border-r border-[#1e293b]/70 w-[70px] xl:w-[260px] text-slate-100 justify-between select-none bg-[#090d16]/95 backdrop-blur-xl z-40 flex-shrink-0 overflow-y-auto scrollbar-none">
      <div className="space-y-5">
        {/* VouchEdge BRAND Logo */}
        <div 
          onClick={() => onSectionChange('feed')}
          className="flex items-center gap-2.5 px-1 relative group cursor-pointer"
          id="brand-logo-id"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-950/40 border-2 border-[#FFE81F]/70 flex items-center justify-center text-[#FFE81F] font-extrabold text-sm shadow-[0_0_15px_rgba(255,232,31,0.25)] shrink-0 select-none transform group-hover:rotate-12 transition-transform duration-300">
            ★
          </div>
          <span className="hidden xl:inline starwars-font-crawl text-lg tracking-wider select-none leading-none nav-link3d-crawl hover:scale-[1.03] transition-all">
            VOUCH<span className="text-[#FFE81F] starwars-font-solid">EDGE</span>
          </span>
        </div>

        {/* Modular workspace configurator button at top of feed sidebar when logged-in */}
        {isRegistered && (
          <div className="px-1 hidden xl:block">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-900 text-[10px] text-slate-450 hover:text-slate-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFE81F]" />
                <span className="font-extrabold uppercase">MODULAR SIDEBAR</span>
              </div>
              {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showConfig && (
              <div className="bg-slate-950/90 border border-slate-900 rounded-xl p-3 mt-1.5 space-y-2 text-left animate-fadeIn">
                <span className="text-[8px] font-mono font-black text-[#FFE81F] uppercase tracking-wider block">
                  TOGGLE OPTIONAL TABS
                </span>
                <p className="text-[8px] text-slate-500 font-sans leading-tight">
                  Enable or disable optional viewports in real-time.
                </p>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                  {menuItems.filter(item => itemCategoryMap[item.id] === 'optional').map(item => {
                    const isChecked = enabledOptional.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-2 cursor-pointer group" 
                        onClick={(e) => toggleOptionalItem(item.id, e)}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-[#FFE81F] border-yellow-500 text-slate-950' : 'bg-slate-900 border-slate-850'
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3] text-slate-950" />}
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors truncate">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Items - Segmented Modular Sections if logged-in */}
        <nav className="space-y-4" id="sidebar-nav-container">
          {isRegistered ? (
            /* Modular segments */
            <>
              {/* Category 1: MUST-HAVE REQUIRED FEATURES */}
              {visibleRequired.length > 0 && (
                <div className="space-y-1">
                  <span className="hidden xl:inline-block text-[9px] font-bold text-emerald-400/90 tracking-wider uppercase px-2 mb-1">
                    ⚡ REQUIRED (MUST)
                  </span>
                  <div className="space-y-0.5">
                    {visibleRequired.map(item => renderNavButton(item))}
                  </div>
                </div>
              )}

              {/* Category 2: RECOMMENDED FEATURES */}
              {visibleRecommended.length > 0 && (
                <div className="space-y-1">
                  <span className="hidden xl:inline-block text-[9px] font-bold text-sky-400/95 tracking-wider uppercase px-2 mb-1">
                    ⭐ RECOMMENDED
                  </span>
                  <div className="space-y-0.5">
                    {visibleRecommended.map(item => renderNavButton(item))}
                  </div>
                </div>
              )}

              {/* Category 3: OPTIONAL FEATURES (Filtered by user preference toggles!) */}
              {visibleOptional.length > 0 && (
                <div className="space-y-1">
                  <span className="hidden xl:inline-block text-[9px] font-bold text-purple-400/90 tracking-wider uppercase px-2 mb-1">
                    ⚙️ OPTIONAL WORKSPACES
                  </span>
                  <div className="space-y-0.5">
                    {visibleOptional.map(item => renderNavButton(item))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Legacy flat layout with custom filter support for guests */
            <div className="space-y-1">
              {menuItems
                .filter(item => {
                  const cat = getItemCategory(item.id);
                  return cat !== 'hidden';
                })
                .map((item) => renderNavButton(item))}
            </div>
          )}
        </nav>

        {/* Primary CTA: Build Parlay */}
        <div className="px-1 pt-1">
          <button
            onClick={() => onSectionChange('build')}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-100 font-semibold py-2.5 px-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] text-xs flex items-center justify-center gap-2 focus:ring-2 focus:ring-sky-500/20"
            id="sidebar-cta-build-parlay"
          >
            <Sliders className="w-3.5 h-3.5" />
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
    </aside>
  );
}
