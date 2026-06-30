import React, { useState } from 'react';
import FeedTabs from './FeedTabs';
import FeedComposer from './FeedComposer';
import FeedPostCard from './FeedPostCard';
import AdBanner from '../../components/AdBanner';
import { FeedPost, Parlay, Vouch, CreatorProofProfile } from '../../types';
import { Search, Crown, Zap, Users, MessageSquare } from 'lucide-react';

interface HomeFeedPageProps {
  posts: FeedPost[];
  savedSlips: Parlay[];
  profileName: string;
  onPostCreated: (postData: Partial<FeedPost>) => void;
  onLikePost: (postId: string) => void;
  onVouchPost: (postId: string) => void;
  onRepostPost: (postId: string) => void;
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  onAddComment: (postId: string, comment: string) => void;
  profile?: CreatorProofProfile;
  onSectionChange?: (section: string) => void;
}

export default function HomeFeedPage({
  posts,
  savedSlips,
  profileName,
  onPostCreated,
  onLikePost,
  onVouchPost,
  onRepostPost,
  onSaveVouch,
  savedVouchIds,
  onAddComment,
  profile,
  onSectionChange,
}: HomeFeedPageProps) {
  const [activeTab, setActiveTab] = useState('for-you');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedPostType, setSelectedPostType] = useState('ALL');
  const [proOnlyMode, setProOnlyMode] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [activeAdSponsor] = useState<string>(() =>
    localStorage.getItem('vEdge_adSponsor') || 'DraftKings'
  );

  const [followingList, setFollowingList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vouchedge_following');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const handleSync = (e: any) => setFollowingList(e.detail);
    window.addEventListener('vouchedge-following-updated', handleSync);
    return () => window.removeEventListener('vouchedge-following-updated', handleSync);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const getFilteredPosts = () => {
    let list = [...posts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          (p.sportBadge && p.sportBadge.toLowerCase().includes(q))
      );
    }

    let finalTabList: FeedPost[] = [];

    switch (activeTab) {
      case 'for-you':
        if (selectedSport !== 'ALL') list = list.filter((p) => p.sportBadge?.toUpperCase() === selectedSport.toUpperCase());
        if (selectedPostType !== 'ALL') list = list.filter((p) => p.postType === selectedPostType);
        finalTabList = list;
        break;
      case 'following':
        finalTabList = list.filter((p) => followingList.includes(p.username));
        break;
      case 'mlb':
        finalTabList = list.filter((p) => p.sportBadge?.toUpperCase() === 'MLB');
        break;
      case 'parlays':
        finalTabList = list.filter((p) => p.postType === 'PARLAY');
        break;
      case 'vouches':
        finalTabList = list.filter((p) => p.postType === 'VOUCH');
        break;
      case 'results':
        finalTabList = list.filter((p) => p.postType === 'RESULT');
        break;
      default:
        finalTabList = list;
    }

    if (proOnlyMode) {
      finalTabList = finalTabList.filter(
        (p) =>
          p.isVerified ||
          p.sourceBadge === 'AI Pick' ||
          p.sourceBadge === 'Partner Slips' ||
          p.vouchesCount >= 3 ||
          p.username.includes('model') ||
          p.username === 'sharp_props'
      );
    }

    return finalTabList;
  };

  const sortedPosts = [...getFilteredPosts()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen bg-transparent select-none">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0b1329] border border-amber-500/60 text-amber-300 px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          {toastMsg}
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-[680px] mx-auto px-4 py-3 flex items-center gap-3">

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black text-white tracking-tight leading-none">
              Home Feed
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              Parlay proof · verified slips · community picks
            </p>
          </div>

          {/* Search */}
          <div className="relative w-[160px] shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-900 text-slate-100 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl focus:border-sky-500/70 outline-none placeholder-slate-600 transition-colors"
            />
          </div>

          {/* PRO Mode */}
          <button
            type="button"
            onClick={() => {
              setProOnlyMode(!proOnlyMode);
              triggerToast(proOnlyMode ? 'Showing all posts' : 'PRO stream — verified picks only');
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
              proOnlyMode
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Crown className={`w-3.5 h-3.5 ${proOnlyMode ? 'text-amber-400' : ''}`} />
            PRO
          </button>
        </div>
      </div>

      {/* Tabs */}
      <FeedTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedSport={selectedSport}
        onSportChange={setSelectedSport}
        selectedPostType={selectedPostType}
        onPostTypeChange={setSelectedPostType}
      />

      {/* Feed content */}
      <div className="max-w-[680px] w-full mx-auto px-4 py-5 space-y-4">

        {/* Composer */}
        <FeedComposer
          onPostCreated={onPostCreated}
          savedSlips={savedSlips}
          profileName={profileName}
        />

        {/* Ad */}
        <AdBanner
          bannerType="feed-top"
          subscriptionTier={profile?.subscriptionTier || 'BASIC'}
          activeSponsor={activeAdSponsor}
          onUpgrade={() => onSectionChange?.('premium')}
        />

        {/* Empty: not following anyone */}
        {activeTab === 'following' && followingList.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">Not following anyone yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Go to <strong className="text-slate-400">For You</strong> and follow verified cappers to see their picks here.
              </p>
            </div>
          </div>

        /* Empty: no posts match */
        ) : sortedPosts.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">No posts yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'Be the first — drop a pick or parlay above.'}
              </p>
            </div>
          </div>

        /* Posts */
        ) : (
          <div className="space-y-3">
            {sortedPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onLike={onLikePost}
                onVouchAction={onVouchPost}
                onRepost={onRepostPost}
                onSaveVouch={onSaveVouch}
                savedVouchIds={savedVouchIds}
                onAddComment={onAddComment}
                onPostCreated={onPostCreated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
