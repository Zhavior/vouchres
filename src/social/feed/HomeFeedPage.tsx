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

  const FEED_BATCH_SIZE = 8;
  const feedSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const [visiblePostCount, setVisiblePostCount] = React.useState(FEED_BATCH_SIZE);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = React.useState(false);

  const getPostAlgorithmScore = (post: FeedPost, index: number) => {
    const createdAt = new Date(post.timestamp).getTime();
    const ageHours = Number.isFinite(createdAt)
      ? Math.max(0, (Date.now() - createdAt) / 36e5)
      : 72;

    const recencyScore = Math.max(0, 120 - ageHours * 4);
    const vouchScore = Math.min(40, (post.vouchesCount || 0) * 8);
    const commentScore = Math.min(22, (post.commentsCount || 0) * 4);
    const verifiedScore = post.isVerified ? 26 : 0;
    const sourceScore =
      post.sourceBadge === 'AI Pick'
        ? 18
        : post.sourceBadge === 'Partner Slips'
          ? 14
          : 0;

    const sportScore =
      selectedSport !== 'ALL' && post.sportBadge?.toUpperCase() === selectedSport.toUpperCase()
        ? 20
        : post.sportBadge?.toUpperCase() === 'MLB'
          ? 8
          : 0;

    const postTypeScore =
      post.postType === 'RESULT'
        ? 16
        : post.postType === 'PARLAY'
          ? 12
          : post.postType === 'VOUCH'
            ? 9
            : 4;

    const followingScore = followingList.includes(post.username) ? 18 : 0;
    const smallRandomizer = Math.max(0, 8 - index * 0.05);

    return (
      recencyScore +
      vouchScore +
      commentScore +
      verifiedScore +
      sourceScore +
      sportScore +
      postTypeScore +
      followingScore +
      smallRandomizer
    );
  };

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
  // For You becomes algorithmic; other tabs stay closer to chronological.
  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const algorithmPosts =
    activeTab === 'for-you'
      ? [...sortedPosts].sort((a, b) => getPostAlgorithmScore(b, 0) - getPostAlgorithmScore(a, 0))
      : sortedPosts;

  const visiblePosts = algorithmPosts.slice(0, visiblePostCount);
  const hasMorePosts = visiblePostCount < algorithmPosts.length;

  React.useEffect(() => {
    setVisiblePostCount(FEED_BATCH_SIZE);
  }, [activeTab, selectedSport, selectedPostType, searchQuery, proOnlyMode, posts.length]);

  React.useEffect(() => {
    const node = feedSentinelRef.current;
    if (!node || !hasMorePosts || isLoadingMorePosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        setIsLoadingMorePosts(true);
        window.setTimeout(() => {
          setVisiblePostCount((count) => Math.min(count + FEED_BATCH_SIZE, algorithmPosts.length));
          setIsLoadingMorePosts(false);
        }, 220);
      },
      {
        root: null,
        rootMargin: '720px 0px 900px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMorePosts, isLoadingMorePosts, algorithmPosts.length]);

  const totalStreamPosts = posts.length;
  const verifiedStreamPosts = posts.filter((post) => post.isVerified || post.sourceBadge === 'AI Pick' || post.sourceBadge === 'Partner Slips').length;
  const parlayStreamPosts = posts.filter((post) => post.postType === 'PARLAY').length;
  const resultStreamPosts = posts.filter((post) => post.postType === 'RESULT').length;
  const currentStreamLabel = activeTab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');


  // Hand off to the real App-level handler (builds the post from the actual
  // signed-in profile and persists via syncPosts -> localStorage), then jump
  // to "For You" so the new post is immediately visible.
  const handleComposerPostCreated = React.useCallback(
    (postData: Partial<FeedPost>) => {
      onPostCreated(postData);
      setActiveTab('for-you');
    },
    [onPostCreated]
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
          <h1 className="text-lg md:text-xl font-black text-[hsl(var(--ve-text-primary))] flex items-center gap-1.5 uppercase tracking-wide">
            Vouch<span className="text-[hsl(var(--ve-accent-cyan))]">Edge</span> Home Feed
            {proOnlyMode && (
              <span className="text-[9px] bg-[hsl(var(--ve-accent-gold)/0.14)] text-[hsl(var(--ve-accent-gold))] border border-[hsl(var(--ve-accent-gold)/0.35)] font-black px-2 py-0.5 rounded-full tracking-wider animate-pulse ml-1.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> PRO STREAM
              </span>
            )}
          </h1>
          <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
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
              className="w-full text-xs bg-[hsl(var(--ve-surface-raised)/0.44)] backdrop-blur-xl text-[hsl(var(--ve-text-primary))] border border-[hsl(var(--ve-border)/0.32)] pl-8 pr-3 py-1.5 rounded-xl focus:border-[hsl(var(--ve-accent-cyan)/0.75)] outline-none transition-all font-medium placeholder:text-[hsl(var(--ve-text-muted))]"
              id="search-input-field-id"
            />
            <Search className="w-3.5 h-3.5 text-[hsl(var(--ve-text-muted))] absolute left-2.5 top-2.5" />
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

        {/* Composer first — Twitter/X style, always the top action */}
        <FeedComposer
          onPostCreated={handleComposerPostCreated}
          savedSlips={savedSlips}
          profileName={profileName || 'VouchEdge Creator'}
        />

        <section className="ve-social-stream-command" aria-label="VouchEdge social stream summary">
          <div className="ve-social-stream-command__header">
            <div>
              <span className="ve-social-stream-kicker">Community Feed</span>
              <h2>VouchEdge Social Stream</h2>
              <p>Real posts, verified vouches, saved slips, creator updates, and public pick history in one timeline.</p>
            </div>

            <div className="ve-social-stream-mode">
              <span>Viewing</span>
              <strong>{currentStreamLabel}</strong>
            </div>
          </div>

          <div className="ve-social-stream-metrics">
            <div>
              <span>Total Posts</span>
              <strong>{totalStreamPosts}</strong>
            </div>
            <div>
              <span>Verified</span>
              <strong>{verifiedStreamPosts}</strong>
            </div>
            <div>
              <span>Parlays</span>
              <strong>{parlayStreamPosts}</strong>
            </div>
            <div>
              <span>Results</span>
              <strong>{resultStreamPosts}</strong>
            </div>
          </div>
        </section>

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
            className="p-10 text-center bg-[hsl(var(--ve-surface)/0.72)] rounded-3xl border border-[hsl(var(--ve-border)/0.34)] flex flex-col items-center justify-center gap-3.5 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl"
            id="empty-following-placeholder-slate"
          >
            <div className="w-12 h-12 bg-[hsl(var(--ve-accent-pink)/0.13)] rounded-full flex items-center justify-center border border-[hsl(var(--ve-accent-pink)/0.30)] text-xl">
              🔑
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xs text-[hsl(var(--ve-text-secondary))] uppercase tracking-widest">Not tailing anyone yet!</h3>
              <p className="text-[11px] text-[hsl(var(--ve-text-muted))] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Go to the <strong>"For You"</strong> feed tab, find verified sports partners, and click <strong>"Follow"</strong> or <strong>"Tail"</strong> to populate your private subscribed ledger deck right here.
              </p>
            </div>
          </div>
        ) : algorithmPosts.length === 0 && posts.length === 0 ? (
          /* Genuinely no posts anywhere yet (no filter/search at play) */
          <div
            className="p-10 text-center bg-[hsl(var(--ve-surface)/0.72)] rounded-3xl border border-[hsl(var(--ve-border)/0.34)] flex flex-col items-center justify-center gap-3.5 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl"
            id="empty-feed-placeholder-slate"
          >
            <AlertTriangle className="w-8 h-8 text-[hsl(var(--ve-text-muted))]" />
            <div className="text-center">
              <h3 className="font-bold text-sm text-[hsl(var(--ve-text-secondary))] uppercase">No posts yet</h3>
              <p className="text-xs text-[hsl(var(--ve-text-muted))] mt-1 max-w-sm mx-auto">
                Be the first to post a pick, vouch, parlay, result, or research note.
              </p>
            </div>
          </div>
        ) : algorithmPosts.length === 0 ? (
          /* Posts exist, but the current filter/search/tab matches none of them */
          <div
            className="p-10 text-center bg-[hsl(var(--ve-surface)/0.72)] rounded-3xl border border-[hsl(var(--ve-border)/0.34)] flex flex-col items-center justify-center gap-3.5 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl"
            id="empty-feed-placeholder-slate"
          >
            <AlertTriangle className="w-8 h-8 text-[hsl(var(--ve-text-muted))] animate-pulse" />
            <div className="text-center">
              <h3 className="font-bold text-sm text-[hsl(var(--ve-text-secondary))] uppercase">No Matches Found</h3>
              <p className="text-xs text-[hsl(var(--ve-text-muted))] mt-1 max-w-sm mx-auto">
                No active VouchEdge plays match your "{activeTab}" filter or search query. Create a post above to populate the feed!
              </p>
            </div>
          </div>
        ) : (
          /* List of Posts */
          <div className="space-y-4" id="posts-feed-stream-container">
            {visiblePosts.map((post) => (
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
        {/* Infinite Scroll Loader */}
        <div ref={feedSentinelRef} className="ve-feed-infinite-sentinel" aria-hidden="true" />

        {/* The dedicated empty-state card above already covers the zero-posts
            case, so this loader only needs to handle the non-empty states —
            avoids showing "No posts yet" twice on the same screen. */}
        {algorithmPosts.length > 0 && (
          <div className="ve-feed-load-state">
            {isLoadingMorePosts ? (
              <>
                <span className="ve-feed-loader-dot" />
                <strong>Loading more vouches...</strong>
              </>
            ) : hasMorePosts ? (
              <span>Keep scrolling for more picks, slips, and results.</span>
            ) : (
              <span>You're caught up for this stream.</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
