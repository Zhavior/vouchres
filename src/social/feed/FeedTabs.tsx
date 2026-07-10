import React from 'react';
import { SlidersHorizontal, Trophy, Layers } from 'lucide-react';

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
    <nav className="home-feed-tabs feed-tabs border-b border-white/[0.08] bg-transparent font-z8" id="feed-navigation-tabs-composite">
      <div className="flex w-full snap-x snap-mandatory overflow-x-auto no-scrollbar scroll-smooth select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="feed-tab-btn relative flex min-h-11 min-w-[88px] shrink-0 snap-start flex-1 touch-manipulation items-center justify-center py-3 text-center text-[15px] font-semibold transition-colors hover:bg-white/[0.03]"
              id={`tab-btn-${tab.id}`}
              aria-selected={isActive}
              role="tab"
            >
              <span className={isActive ? 'text-white' : 'text-white/50'}>
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[4px] w-14 bg-vouch-emerald rounded-full"
                  id={`active-tab-indicator-${tab.id}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'for-you' && (
        <div
          className="home-feed-filters px-3 py-2.5 border-t border-white/[0.06] flex flex-col gap-2.5 text-xs bg-black/30 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4"
          id="for-you-filters-panel"
        >
          <div className="flex items-center gap-1.5 text-white/40 text-[12px] shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap sm:overflow-visible">
            <div className="flex shrink-0 items-center gap-1.5" id="sport-selector-container">
              <Trophy className="w-3.5 h-3.5 text-vouch-emerald shrink-0" />
              <select
                value={selectedSport}
                onChange={(e) => onSportChange(e.target.value)}
                className="ve-touch-target min-h-11 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-white outline-none focus:border-vouch-cyan/40 sm:min-h-0"
                id="sport-filter-select"
              >
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>{sport.label}</option>
                ))}
              </select>
            </div>

            <div className="flex shrink-0 items-center gap-1.5" id="posttype-selector-container">
              <Layers className="w-3.5 h-3.5 text-vouch-cyan shrink-0" />
              <select
                value={selectedPostType}
                onChange={(e) => onPostTypeChange(e.target.value)}
                className="ve-touch-target min-h-11 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-white outline-none focus:border-vouch-cyan/40 sm:min-h-0"
                id="posttype-filter-select"
              >
                {postTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            {(selectedSport !== 'ALL' || selectedPostType !== 'ALL') && (
              <button
                onClick={() => {
                  onSportChange('ALL');
                  onPostTypeChange('ALL');
                }}
                className="text-[12px] text-rose-400 hover:text-rose-300 font-semibold hover:underline transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
