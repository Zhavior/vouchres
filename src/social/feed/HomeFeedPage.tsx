import React, { useState, lazy, Suspense } from 'react';
import FeedTabs from './FeedTabs';
import FeedComposer from './FeedComposer';
import FeedPostCard from './FeedPostCard';
import AdBanner from '../../components/AdBanner';

// Lazy: pulls in cytoscape (~300KB+) — keep it out of this already-lazy
// page's initial chunk too, since HomeFeedPage itself can render before
// the "Following" tab (where this graph lives) is ever opened.
const CapperNetworkGraph = lazy(() => import('./CapperNetworkGraph'));
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
  CheckCircle2,
  Users,
} from 'lucide-react';

function FeedEmptyState({ id, icon, title, body }: { id: string; icon: React.ReactNode; title: string; body: React.ReactNode }) {
  return (
    <div className="glass-panel glass-border p-10 text-center rounded-3xl flex flex-col items-center justify-center gap-3.5" id={id}>
      <div className="w-11 h-11 rounded-full bg-vouch-emerald/10 text-vouch-emerald flex items-center justify-center">
        {icon}
      </div>
      <div className="text-center">
        <h3 className="font-bold text-xs text-white uppercase tracking-widest">{title}</h3>
        <p className="text-[11px] text-white/40 mt-1.5 max-w-sm mx-auto leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col min-h-screen bg-transparent select-none font-z8" id="home-feed-page-wrapper">

      {/* Toast Notification System */}
      {toastMsg && (
        <div className="glass-panel glass-border fixed top-5 left-1/2 -translate-x-1/2 z-50 text-vouch-emerald px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-vouch-emerald animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search Input and Feed Title bar */}
      <div className="glass-panel glass-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-20">
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
            Home Feed
            {proOnlyMode && (
              <span className="terminal-text bg-vouch-emerald/10 text-vouch-emerald px-2 py-0.5 rounded-full ml-1.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> PRO STREAM
              </span>
            )}
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">
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
              className="w-full text-xs bg-white/[0.02] text-white border border-white/10 pl-8 pr-3 py-1.5 rounded-xl focus:border-vouch-cyan/30 outline-none transition-all font-medium placeholder:text-white/30"
              id="search-input-field-id"
            />
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-2.5" />
          </div>

          {/* Premium Sharp PRO Switcher Button */}
          <button
            type="button"
            onClick={() => {
              setProOnlyMode(!proOnlyMode);
              triggerToast(proOnlyMode ? 'Switched to all-community stream' : 'Pro stream activated — verified only');
            }}
            className={[
              'py-1.5 px-3.5 rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 transition-all shrink-0',
              proOnlyMode ? 'bg-vouch-emerald text-black' : 'bg-white/[0.03] text-white/40 hover:text-white',
            ].join(' ')}
            title="Toggle to view only verified sharp professionals with over 3+ vouches"
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="text-[10px]">PRO MODE</span>
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

        <section className="glass-panel glass-border rounded-3xl p-5" aria-label="VouchEdge social stream summary">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <span className="terminal-text text-vouch-cyan">Community Feed</span>
              <h2 className="text-lg font-black text-white mt-1">VouchEdge Social Stream</h2>
              <p className="text-xs text-white/40 mt-1 max-w-md">Real posts, verified vouches, saved slips, creator updates, and public pick history in one timeline.</p>
            </div>

            <div className="shrink-0 text-right">
              <span className="terminal-text text-white/30 block">Viewing</span>
              <strong className="text-sm font-bold text-vouch-emerald">{currentStreamLabel}</strong>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <span className="block text-[10px] text-white/30">Total Posts</span>
              <strong className="text-lg font-black text-white">{totalStreamPosts}</strong>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <span className="block text-[10px] text-white/30">Verified</span>
              <strong className="text-lg font-black text-vouch-emerald">{verifiedStreamPosts}</strong>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <span className="block text-[10px] text-white/30">Parlays</span>
              <strong className="text-lg font-black text-vouch-cyan">{parlayStreamPosts}</strong>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <span className="block text-[10px] text-white/30">Results</span>
              <strong className="text-lg font-black text-white">{resultStreamPosts}</strong>
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

        {activeTab === 'following' && followingList.length > 0 && (
          <Suspense fallback={null}>
            <CapperNetworkGraph posts={posts} followingList={followingList} />
          </Suspense>
        )}

        {/* Dynamic empty state — one shared card, three copy variants */}
        {activeTab === 'following' && followingList.length === 0 ? (
          <FeedEmptyState
            id="empty-following-placeholder-slate"
            icon={<Users className="w-6 h-6" />}
            title="Not tailing anyone yet"
            body={<>Go to the <strong className="text-white/70">"For You"</strong> feed tab, find verified sports partners, and click <strong className="text-white/70">"Follow"</strong> or <strong className="text-white/70">"Tail"</strong> to populate your private subscribed ledger deck right here.</>}
          />
        ) : algorithmPosts.length === 0 && posts.length === 0 ? (
          /* Genuinely no posts anywhere yet (no filter/search at play) */
          <FeedEmptyState
            id="empty-feed-placeholder-slate"
            icon={<AlertTriangle className="w-6 h-6" />}
            title="No posts yet"
            body="Be the first to post a pick, vouch, parlay, result, or research note."
          />
        ) : algorithmPosts.length === 0 ? (
          /* Posts exist, but the current filter/search/tab matches none of them */
          <FeedEmptyState
            id="empty-feed-placeholder-slate"
            icon={<AlertTriangle className="w-6 h-6" />}
            title="No matches found"
            body={`No active VouchEdge plays match your "${activeTab}" filter or search query. Create a post above to populate the feed!`}
          />
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
        <div ref={feedSentinelRef} className="h-px" aria-hidden="true" />

        {/* The dedicated empty-state card above already covers the zero-posts
            case, so this loader only needs to handle the non-empty states —
            avoids showing "No posts yet" twice on the same screen. */}
        {algorithmPosts.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 text-[11px] text-white/30">
            {isLoadingMorePosts ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald animate-pulse" />
                <strong className="text-white/50">Loading more vouches...</strong>
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
