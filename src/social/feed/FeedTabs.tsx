import React from 'react';
import { SlidersHorizontal, Trophy, Layers } from 'lucide-react';
import { VECard } from '../../components/ui/ve';

interface FeedTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedSport: string;
  onSportChange: (sport: string) => void;
  selectedPostType: string;
  onPostTypeChange: (postType: string) => void;
}

export default function FeedTabs({ 
  activeTab, 
  onTabChange,
  selectedSport,
  onSportChange,
  selectedPostType,
  onPostTypeChange
}: FeedTabsProps) {
  const tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'mlb', label: 'MLB' },
    { id: 'parlays', label: 'Parlays' },
    { id: 'vouches', label: 'Vouches' },
    { id: 'results', label: 'Results' },
  ];

  const sports = [
    { id: 'ALL', label: 'All Sports' },
    { id: 'MLB', label: 'MLB' },
    { id: 'NBA', label: 'NBA' },
    { id: 'NFL', label: 'NFL' },
  ];

  const postTypes = [
    { id: 'ALL', label: 'All Post Types' },
    { id: 'PARLAY', label: 'Parlays' },
    { id: 'VOUCH', label: 'Vouches' },
    { id: 'RESULT', label: 'Results' },
    { id: 'RESEARCH_NOTE', label: 'Research Notes' },
  ];

  return (
    <VECard className="font-z8 flex flex-col sticky top-0 z-30 w-full rounded-none border-x-0" id="feed-navigation-tabs-composite">
      {/* Primary tabs scroll */}
      <div className="flex overflow-x-auto no-scrollbar scroll-smooth w-full select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 py-4 text-center font-bold text-xs select-none min-w-[80px] relative transition-colors shrink-0 uppercase tracking-wider"
              id={`tab-btn-${tab.id}`}
            >
              <span className={isActive ? 'text-vouch-emerald' : 'text-white/40 hover:text-white'}>
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-vouch-emerald rounded-t-full"
                  id={`active-tab-indicator-${tab.id}`}
                ></div>
              )}
            </button>
          );
        })}
      </div>

      {/* For You Filters Sub-bar */}
      {activeTab === 'for-you' && (
        <div
          className="px-4 py-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
          id="for-you-filters-panel"
        >
          <div className="terminal-text flex items-center gap-1.5 text-white/40">
            <SlidersHorizontal className="w-3.5 h-3.5 text-vouch-cyan" />
            <span>Refine 'For You' stream:</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sport Filter Dropdown */}
            <div className="flex items-center gap-1.5" id="sport-selector-container">
              <Trophy className="w-3.5 h-3.5 text-vouch-emerald shrink-0" />
              <select
                value={selectedSport}
                onChange={(e) => onSportChange(e.target.value)}
                className="bg-white/[0.02] border border-white/10 text-white text-[11px] font-bold py-1 px-2 rounded-lg focus:border-vouch-cyan/40 outline-none transition-all cursor-pointer"
                id="sport-filter-select"
              >
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>{sport.label}</option>
                ))}
              </select>
            </div>

            {/* Post Type Filter Dropdown */}
            <div className="flex items-center gap-1.5" id="posttype-selector-container">
              <Layers className="w-3.5 h-3.5 text-vouch-cyan shrink-0" />
              <select
                value={selectedPostType}
                onChange={(e) => onPostTypeChange(e.target.value)}
                className="bg-white/[0.02] border border-white/10 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg focus:border-vouch-cyan/40 outline-none transition-all cursor-pointer"
                id="posttype-filter-select"
              >
                {postTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Indicator */}
            {(selectedSport !== 'ALL' || selectedPostType !== 'ALL') && (
              <button
                onClick={() => {
                  onSportChange('ALL');
                  onPostTypeChange('ALL');
                }}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-extrabold uppercase hover:underline transition-colors leading-none"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      )}
    </VECard>
  );
}
