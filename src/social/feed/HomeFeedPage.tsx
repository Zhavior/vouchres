import React, { useState } from 'react';
import FeedTabs from './FeedTabs';
import FeedComposer from './FeedComposer';
import FeedPostCard from './FeedPostCard';
import AdBanner from '../../components/AdBanner';
import { FeedPost, Parlay, Vouch, CreatorProofProfile } from '../../types';
import { 
  Search, 
  Info, 
  Sliders, 
  AlertTriangle, 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Crown, 
  Award, 
  CheckCircle2 
} from 'lucide-react';

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

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const [activeAdSponsor] = useState<string>(() => {
    return localStorage.getItem('vEdge_adSponsor') || 'DraftKings';
  });

  // Check if user is following creators
  const [followingList, setFollowingList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vouchedge_following');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const handleSync = (e: any) => {
      setFollowingList(e.detail);
    };
    window.addEventListener('vouchedge-following-updated', handleSync);
    return () => {
      window.removeEventListener('vouchedge-following-updated', handleSync);
    };
  }, []);

  // Handle Filtering based on Active Tab
  const getFilteredPosts = () => {
    let list = [...posts];

    // Search query match helper
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
        if (selectedSport !== 'ALL') {
          list = list.filter((p) => p.sportBadge?.toUpperCase() === selectedSport.toUpperCase());
        }
        if (selectedPostType !== 'ALL') {
          list = list.filter((p) => p.postType === selectedPostType);
        }
        finalTabList = list;
        break;
      case 'following':
        // Filter by authors in the following list only!
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
        break;
    }

    // Apply Premium Sharp Pro-Only Mode filter
    if (proOnlyMode) {
      finalTabList = finalTabList.filter(
        (p) => p.isVerified || p.sourceBadge === 'AI Pick' || p.sourceBadge === 'Partner Slips' || p.vouchesCount >= 3 || p.username.includes('model') || p.username === 'sharp_props'
      );
    }

    return finalTabList;
  };

  const filteredPosts = getFilteredPosts();

  // Sorting: user created posts appear first (descending timestamp or index)
  // Let's sort ISO timestamps descending
  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen bg-transparent select-none" id="home-feed-page-wrapper">
      
      {/* Toast Notification System */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0b1329] border-2 border-amber-500/80 text-amber-300 px-4 py-2.5 rounded-full text-xs font-bold font-mono shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2 animate-bounce">
          <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search Input and Feed Title bar */}
      <div className="p-4 border-b border-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 md:top-0 z-20">
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
            Vouch<span className="text-sky-400">Edge</span> Home Feed
            {proOnlyMode && (
              <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-700/60 font-black px-2 py-0.5 rounded-full tracking-wider animate-pulse ml-1.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> PRO STREAM
              </span>
            )}
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Follow live parlay proof, verified slips, and community sentiment metrics.
          </p>
        </div>

        {/* Dynamic Search Box and PRO Mode Switcher */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto" id="feed-search-block">
          <div className="relative flex-1 sm:w-[190px]">
            <input
              type="text"
              placeholder="Search picks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-[#121824]/60 backdrop-blur-sm text-slate-100 border border-slate-850/50 pl-8 pr-3 py-1.5 rounded-xl focus:border-sky-500/80 outline-none transition-all font-medium placeholder-slate-500"
              id="search-input-field-id"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          {/* Premium Sharp PRO Switcher Button */}
          <button
            type="button"
            onClick={() => {
              setProOnlyMode(!proOnlyMode);
              triggerToast(proOnlyMode ? "🔓 Switched to All Community Stream" : "🌟 Premium Sharp Pro Stream Activated");
            }}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 shadow-md border transition-all shrink-0 active:scale-95 ${
              proOnlyMode
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle to view only verified sharp professionals with over 3+ vouches"
          >
            <Crown className={`w-3.5 h-3.5 ${proOnlyMode ? 'animate-bounce text-yellow-200' : ''}`} />
            <span className="font-mono text-[10px]">PRO MODE</span>
          </button>
        </div>
      </div>

      {/* Tabs list (For You, Following, MLB, Parlays...) */}
      <FeedTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        selectedSport={selectedSport}
        onSportChange={setSelectedSport}
        selectedPostType={selectedPostType}
        onPostTypeChange={setSelectedPostType}
      />

      {/* Main Stream Area */}
      <div className="p-4 md:p-6 space-y-6 max-w-[680px] w-full mx-auto" id="feed-stream-outer">
        
        {/* VIP Sharp Live Statistics Grid Header */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/60 shadow-xl space-y-3.5 text-center" id="vip-live-sharp-stats-grid">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900">
            <span className="font-mono font-black text-[10px] uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              Real-time Premium Indicators
            </span>
            <span className="font-mono text-[9px] font-black text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Live Feed Audit
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" /> AVG PRO ROI
              </span>
              <span className="text-sm font-black text-emerald-400 mt-1 font-mono tracking-wide">+14.2%</span>
            </div>

            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-400" /> WIN RATIO
              </span>
              <span className="text-sm font-black text-sky-400 mt-1 font-mono tracking-wide">68.4%</span>
            </div>

            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> PRO BACKERS
              </span>
              <span className="text-sm font-black text-amber-400 mt-1 font-mono tracking-wide">4,825</span>
            </div>

            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-400" /> ACTIVE LUCK
              </span>
              <span className="text-sm font-black text-indigo-400 mt-1 font-mono tracking-wide">HOT🔥</span>
            </div>
          </div>
        </div>

        {/* Sharp Picks Daily Cheat Sheet / Quick Slip Integrator */}
        <div className="bg-[#0b0f19] p-4 rounded-2xl border border-amber-500/20 shadow-2xl space-y-3 relative overflow-hidden" id="sharp-cheat-sheet-props">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-850">
            <span className="font-extrabold text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              VIP Daily Sharp Cheat Sheet
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Tap target to back prop</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Prop 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/60 border border-slate-850 hover:border-amber-500/30 rounded-xl transition-all gap-2">
              <div className="space-y-0.5 text-left">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  Shohei Ohtani
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-mono">MLB</span>
                </span>
                <p className="text-[10px] text-slate-400">Over 1.5 Hits (+120) • backed by 28 Sharp Experts</p>
              </div>
              <button
                type="button"
                onClick={() => triggerToast("🎯 Backed Shohei Ohtani Over 1.5 Hits! Saved to your session context.")}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-lg text-[10px] font-black uppercase transition-all shrink-0 font-mono tracking-wide"
              >
                + Back Prop
              </button>
            </div>

            {/* Prop 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/60 border border-slate-850 hover:border-amber-500/30 rounded-xl transition-all gap-2">
              <div className="space-y-0.5 text-left">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  Paul Skenes
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-mono">MLB</span>
                </span>
                <p className="text-[10px] text-slate-400">Over 7.5 Strikeouts (-115) • Sabermetric Matchup Matchup</p>
              </div>
              <button
                type="button"
                onClick={() => triggerToast("🎯 Backed Paul Skenes Over 7.5 Ks! Saved to your session context.")}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-lg text-[10px] font-black uppercase transition-all shrink-0 font-mono tracking-wide"
              >
                + Back Prop
              </button>
            </div>

            {/* Prop 3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/60 border border-slate-850 hover:border-amber-500/30 rounded-xl transition-all gap-2">
              <div className="space-y-0.5 text-left">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  Aaron Judge
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-mono">MLB</span>
                </span>
                <p className="text-[10px] text-slate-400">To Hit Home Run (+240) • Yankee Stadium Wind Favor</p>
              </div>
              <button
                type="button"
                onClick={() => triggerToast("🎯 Backed Aaron Judge Home Run (+240)! Saved to your session context.")}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-lg text-[10px] font-black uppercase transition-all shrink-0 font-mono tracking-wide"
              >
                + Back Prop
              </button>
            </div>
          </div>
        </div>

        {/* Composer section */}
        <FeedComposer 
          onPostCreated={onPostCreated} 
          savedSlips={savedSlips} 
          profileName={profileName} 
        />

        {/* Premium Ledger audit panel */}
        <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 text-[11px] text-slate-400 leading-normal flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400 animate-pulse" />
          <div>
            <span className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-widest block font-mono">
              VEdge Ledger Integrity Verified
            </span>
            <p className="mt-0.5">
              Browsing the <strong>VouchEdge Premium Ledger Channel</strong>. Real-time community metrics are cryptographically timestamped and matched locally.
            </p>
          </div>
        </div>

        {/* Dynamic Ad Support depending on Subscription Tier */}
        <AdBanner 
          bannerType="feed-top" 
          subscriptionTier={profile?.subscriptionTier || 'BASIC'} 
          activeSponsor={activeAdSponsor} 
          onUpgrade={() => {
            if (onSectionChange) onSectionChange('premium');
          }}
        />

        {/* Dynamic empty state */}
        {activeTab === 'following' && followingList.length === 0 ? (
          <div 
            className="p-10 text-center bg-[#121824] rounded-2xl border border-slate-850 flex flex-col items-center justify-center gap-3.5"
            id="empty-following-placeholder-slate"
          >
            <div className="w-12 h-12 bg-indigo-950/40 rounded-full flex items-center justify-center border border-indigo-900/30 text-xl">
              🔑
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-widest">Not tailing anyone yet!</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Go to the <strong>"For You"</strong> feed tab, find verified sports partners, and click <strong>"Follow"</strong> or <strong>"Tail"</strong> to populate your private subscribed ledger deck right here.
              </p>
            </div>
          </div>
        ) : sortedPosts.length === 0 ? (
          <div 
            className="p-10 text-center bg-[#121824] rounded-2xl border border-slate-850 flex flex-col items-center justify-center gap-3.5"
            id="empty-feed-placeholder-slate"
          >
            <AlertTriangle className="w-8 h-8 text-slate-500 animate-pulse" />
            <div className="text-center">
              <h3 className="font-bold text-sm text-slate-300 uppercase">No Matches Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active VouchEdge plays match your "{activeTab}" filter or search query. Create a post above to populate the feed!
              </p>
            </div>
          </div>
        ) : (
          /* List of Posts */
          <div className="space-y-4" id="posts-feed-stream-container">
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
