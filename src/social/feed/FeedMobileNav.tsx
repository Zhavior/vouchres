import React from 'react';
import { Home, Sliders, ClipboardCheck, BarChart3, User, Sparkles, Compass, Trophy, Search, Cpu, Tv, Radio, Award, Edit3, ShoppingBag, MessageSquare, Activity, Flame, ScanLine } from 'lucide-react';

interface FeedMobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function FeedMobileNav({ activeSection, onSectionChange }: FeedMobileNavProps) {
  const navItems = [
    { id: 'welcome', label: 'Welcome', icon: Trophy },
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'leaderboard', label: 'Cappers', icon: Award },
    { id: 'live_games', label: 'Live', icon: Tv },
    { id: 'build', label: 'Build', icon: Sliders },
    { id: 'ai_engine', label: 'V.A.I AI', icon: Cpu },
    { id: 'intel', label: 'Intel', icon: Activity },
    { id: 'hr_board', label: 'HR Board', icon: Flame },
    { id: 'vouchscan', label: 'Scan', icon: ScanLine },
    { id: 'research', label: 'Research', icon: Search },
    { id: 'board', label: 'Vouch', icon: ClipboardCheck },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'subscriber_hub', label: 'Premium', icon: MessageSquare },
    { id: 'themestore', label: 'Themes', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-850 py-2.5 px-4 flex items-center gap-5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory z-50 text-slate-400 select-none shadow-2xl safe-bottom"
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
              isActive ? 'text-sky-400 scale-105 font-black' : 'text-slate-400 active:text-slate-200'
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
