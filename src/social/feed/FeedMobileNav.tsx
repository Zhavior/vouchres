import React from 'react';
import { Home, Sliders, ClipboardCheck, BarChart3, User, Sparkles, Compass, Trophy, Search, Cpu, Tv, Radio, Award, Edit3, ShoppingBag, MessageSquare, Activity, Flame, LayoutDashboard, Bell } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import { canAccessThemeStore } from '../../lib/adminDevAccess';

interface FeedMobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: CreatorProofProfile;
}

export default function FeedMobileNav({ activeSection, onSectionChange, profile }: FeedMobileNavProps) {
  const navItems = [
    // Primary mobile tabs (verdict): Today, HRs, My Parlays, Results, Profile
    { id: 'today', label: 'Today', icon: LayoutDashboard },
    { id: 'hr_board', label: 'Edge', icon: Flame },
    { id: 'build', label: 'My Parlays', icon: Sliders },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    // Secondary (still reachable in the scrollable bar)
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'live_games', label: 'Live', icon: Tv },
    { id: 'intel', label: 'Intel', icon: Activity },
    { id: 'research', label: 'Research', icon: Search },
    { id: 'leaderboard', label: 'Cappers', icon: Award },
    { id: 'board', label: 'Vouch', icon: ClipboardCheck },
    { id: 'subscriber_hub', label: 'Premium', icon: MessageSquare },
    ...(canAccessThemeStore(profile) ? [{ id: 'themestore', label: 'Themes', icon: ShoppingBag }] : []),
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[hsl(var(--ve-surface)/0.88)] backdrop-blur-2xl border-t border-[hsl(var(--ve-border)/0.45)] py-2.5 px-4 flex items-center gap-5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory z-50 text-[hsl(var(--ve-text-muted))] select-none shadow-2xl shadow-[hsl(var(--ve-shadow)/0.30)] safe-bottom"
      id="mobile-bottom-navigation-bar"
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-shrink-0 min-w-[58px] snap-center transition-all ${
              isActive ? 'text-[hsl(var(--ve-accent-cyan))] scale-105 font-black' : 'text-[hsl(var(--ve-text-muted))] active:text-[hsl(var(--ve-text-primary))]'
            }`}
            id={`mobile-nav-link-${item.id}`}
          >
            <IconComponent className="w-5 h-5 flex-shrink-0" />
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
