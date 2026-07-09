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
  AlertTriangle,
  Zap,
  Crown,
  Users,
  Feather,
} from 'lucide-react';

function FeedEmptyState({ id, icon, title, body }: { id: string; icon: React.ReactNode; title: string; body: React.ReactNode }) {
  return (
    <div className="feed-empty-state px-6 py-12 text-center flex flex-col items-center justify-center gap-3" id={id}>
      <div className="w-12 h-12 rounded-full bg-white/[0.04] text-white/50 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-center">
        <h3 className="font-bold text-[15px] text-white">{title}</h3>
        <p className="text-[13px] text-white/45 mt-1.5 max-w-sm mx-auto leading-relaxed">{body}</p>
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
  onDeletePost?: (postId: string) => void;
  profile?: CreatorProofProfile;
  onSectionChange?: (section: string) => void;
}

function HomeFeedPage({
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
  onDeletePost,
  profile,
  onSectionChange,
}: HomeFeedPageProps) {
  const [activeTab, setActiveTab] = useState('for-you');
  const [searchOpen, setSearchOpen] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);
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

  const composerInitials = (profileName || 'VE')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="home-feed-shell flex flex-col min-h-full bg-transparent font-z8" id="home-feed-page-wrapper">

      {/* Toast Notification System */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 border border-white/10 text-vouch-emerald px-4 py-2 rounded-full text-[13px] font-semibold flex items-center gap-2 shadow-lg">
          <Zap className="w-4 h-4 text-vouch-emerald" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* X-style sticky header */}
      <header className="home-feed-header sticky top-0 z-20 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 h-[53px]">
          <h1 className="text-[20px] font-extrabold text-white leading-none">
            Home
            {proOnlyMode && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-vouch-emerald/15 px-2 py-0.5 text-[10px] font-bold text-vouch-emerald">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="feed-icon-btn p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Search feed"
              aria-expanded={searchOpen}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setComposerExpanded(true);
                window.setTimeout(() => {
                  document.getElementById('feed-composer-textarea')?.focus();
                }, 80);
              }}
              className="feed-icon-btn p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors md:hidden"
              aria-label="Compose post"
            >
              <Feather className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setProOnlyMode(!proOnlyMode);
                triggerToast(proOnlyMode ? 'Showing all posts' : 'Pro stream — verified only');
              }}
              className={[
                'feed-icon-btn p-2 rounded-full transition-colors',
                proOnlyMode ? 'text-vouch-emerald bg-vouch-emerald/10' : 'text-white/60 hover:text-white hover:bg-white/[0.06]',
              ].join(' ')}
              title="Toggle verified-only stream"
              aria-label="Toggle pro stream"
            >
              <Crown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="px-4 pb-3 border-t border-white/[0.06]" id="feed-search-block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search picks, players, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[15px] bg-white/[0.04] text-white border border-white/10 pl-10 pr-3 py-2.5 rounded-full focus:border-vouch-cyan/40 outline-none transition-colors placeholder:text-white/35"
                id="search-input-field-id"
                autoFocus
              />
              <Search className="w-4 h-4 text-white/35 absolute left-3.5 top-3" />
            </div>
          </div>
        )}
      </header>

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
      <div className="feed-main w-full mx-auto" id="feed-stream-outer">

        {/* Inline composer — collapsed by default, expands on tap */}
        <FeedComposer
          onPostCreated={handleComposerPostCreated}
          savedSlips={savedSlips}
          profileName={profileName || 'VouchEdge Creator'}
          expanded={composerExpanded}
          onExpandedChange={setComposerExpanded}
          avatarInitials={composerInitials}
        />

        <div className="px-4 py-3 border-b border-white/[0.08]">
          <AdBanner
          bannerType="feed-top"
          subscriptionTier={profile?.subscriptionTier || 'BASIC'}
          activeSponsor={activeAdSponsor}
          onUpgrade={() => {
            if (onSectionChange) onSectionChange('premium');
          }}
          />
        </div>

        {activeTab === 'following' && followingList.length > 0 && (
          <div className="px-4 py-3 border-b border-white/[0.08]">
            <Suspense fallback={null}>
              <CapperNetworkGraph posts={posts} followingList={followingList} />
            </Suspense>
          </div>
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
          /* List of Posts — flat X-style stream */
          <div className="divide-y divide-white/[0.08]" id="posts-feed-stream-container">
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
                onDeletePost={onDeletePost}
                onPostCreated={onPostCreated}
              />
            ))}
          </div>
        )}
        {/* Infinite Scroll Loader */}
        <div ref={feedSentinelRef} className="h-px" aria-hidden="true" />

        {algorithmPosts.length > 0 && (
          <div className="ve-feed-load-state flex items-center justify-center gap-2 py-4 px-4 text-[13px] text-white/40">
            {isLoadingMorePosts ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald animate-pulse" />
                <span>Loading more...</span>
              </>
            ) : hasMorePosts ? (
              <span>Scroll for more</span>
            ) : (
              <span>You're all caught up</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default React.memo(HomeFeedPage);
