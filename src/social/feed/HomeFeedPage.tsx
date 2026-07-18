import React, { useState, lazy, Suspense, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import FeedTabs from './FeedTabs';
import FeedComposer from './FeedComposer';
import FeedPostCard from './FeedPostCard';
import AdBanner from '../../components/AdBanner';
import { useFeedScrollRoot } from '../../context/FeedScrollContext';
import {
  FEED_BATCH_SIZE,
  nextVisiblePostCount,
  shouldPrefetchServerFeedPage,
} from './feedVirtualizerConfig';
import LazyChunkSkeleton from '../../components/system/LazyChunkSkeleton';
import FeedPostCardSkeleton from './FeedPostCardSkeleton';

// Lazy: pulls in cytoscape (~300KB+) — keep it out of this already-lazy
// page's initial chunk too, since HomeFeedPage itself can render before
// the "Following" tab (where this graph lives) is ever opened.
const CapperNetworkGraph = lazy(() => import('./CapperNetworkGraph'));
import { FeedPost, Parlay, Vouch, CreatorProofProfile } from '../../types';
import { useOptionalSocialGraph, type SocialGraphBucket } from '../../hooks/SocialGraphProvider';
import { useAuth } from '../../lib/useAuth';
import {
  Search,
  AlertTriangle,
  Zap,
  Crown,
  Users,
  Feather,
} from 'lucide-react';

function FeedEmptyState({
  id,
  icon,
  title,
  body,
  actions,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  actions?: Array<{ label: string; onClick: () => void; primary?: boolean }>;
}) {
  return (
    <div className="feed-empty-state px-6 py-12 text-center flex flex-col items-center justify-center gap-3" id={id}>
      <div className="w-12 h-12 rounded-full bg-white/[0.04] text-white/50 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-center">
        <h3 className="font-bold text-[15px] text-white">{title}</h3>
        <p className="text-[13px] text-white/45 mt-1.5 max-w-sm mx-auto leading-relaxed">{body}</p>
      </div>
      {actions && actions.length > 0 ? (
        <div className="mt-2 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`ve-touch-target rounded-xl px-3 py-2.5 text-[13px] font-bold active:scale-[0.98] ${
                action.primary
                  ? 'border border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
                  : 'border border-white/15 bg-white/[0.04] text-white/75'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
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
  hasMoreServer?: boolean;
  isFetchingServer?: boolean;
  onLoadMoreServer?: () => void;
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
  hasMoreServer = false,
  isFetchingServer = false,
  onLoadMoreServer,
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

  const { user } = useAuth();
  const socialGraph = useOptionalSocialGraph();
  const [followingFilter, setFollowingFilter] = useState<SocialGraphBucket>('following');

  const followingList = socialGraph?.followingUsernames ?? [];
  const tailingList = socialGraph?.tailingUsernames ?? [];
  const friendList = socialGraph?.friendUsernames ?? [];
  const subscriberList = socialGraph?.subscriberUsernames ?? [];

  const activeFollowingUsernames = followingFilter === 'tailing'
    ? tailingList
    : followingFilter === 'friends'
      ? friendList
      : followingFilter === 'subscribers'
        ? subscriberList
        : followingList;

  const feedScrollRoot = useFeedScrollRoot();
  const feedListRef = useRef<HTMLDivElement | null>(null);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);
  const [visiblePostCount, setVisiblePostCount] = useState(FEED_BATCH_SIZE);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  const getFeedScrollElement = useCallback(() => feedScrollRoot?.current ?? null, [feedScrollRoot]);

  const getPostAlgorithmScore = useCallback((post: FeedPost, index: number) => {
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
  }, [followingList, selectedSport]);

  const filteredPosts = useMemo(() => {
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
        if (selectedSport !== 'ALL') {
          list = list.filter((p) => p.sportBadge?.toUpperCase() === selectedSport.toUpperCase());
        }
        if (selectedPostType !== 'ALL') {
          list = list.filter((p) => p.postType === selectedPostType);
        }
        finalTabList = list;
        break;
      case 'following':
        finalTabList = list.filter((p) => activeFollowingUsernames.includes(p.username));
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

    if (proOnlyMode) {
      finalTabList = finalTabList.filter(
        (p) => p.isVerified || p.sourceBadge === 'AI Pick' || p.sourceBadge === 'Partner Slips' || p.vouchesCount >= 3 || p.username.includes('model') || p.username === 'sharp_props'
      );
    }

    return finalTabList;
  }, [posts, searchQuery, activeTab, selectedSport, selectedPostType, proOnlyMode, activeFollowingUsernames, followingFilter]);

  const algorithmPosts = useMemo(() => {
    const chronological = [...filteredPosts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    if (activeTab !== 'for-you') {
      return chronological;
    }

    const scored = chronological.map((post, index) => ({
      post,
      score: getPostAlgorithmScore(post, index),
    }));

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.post.id.localeCompare(b.post.id);
    });

    return scored.map((entry) => entry.post);
  }, [filteredPosts, activeTab, getPostAlgorithmScore]);

  const visiblePosts = algorithmPosts.slice(0, visiblePostCount);
  const hasMorePosts = visiblePostCount < algorithmPosts.length || hasMoreServer;

  const rowVirtualizer = useVirtualizer({
    count: visiblePosts.length,
    getScrollElement: getFeedScrollElement,
    estimateSize: () => 320,
    overscan: 4,
  });

  React.useEffect(() => {
    setVisiblePostCount(FEED_BATCH_SIZE);
  }, [activeTab, selectedSport, selectedPostType, searchQuery, proOnlyMode, posts.length]);

  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [activeTab, selectedSport, selectedPostType, searchQuery, proOnlyMode, visiblePosts.length]);

  React.useEffect(() => {
    const node = feedSentinelRef.current;
    if (!node || !hasMorePosts || isLoadingMorePosts) return;

    const scrollRoot = getFeedScrollElement();

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        setIsLoadingMorePosts(true);
        window.setTimeout(() => {
          setVisiblePostCount((count) => nextVisiblePostCount(count, algorithmPosts.length));
          setIsLoadingMorePosts(false);
        }, 220);
      },
      {
        root: scrollRoot,
        rootMargin: '720px 0px 900px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [algorithmPosts.length, feedScrollRoot, hasMorePosts, isLoadingMorePosts, visiblePostCount]);

  React.useEffect(() => {
    if (!shouldPrefetchServerFeedPage({
      visiblePostCount,
      loadedPostCount: algorithmPosts.length,
      hasMoreServer,
      isFetchingServer,
    })) {
      return;
    }
    onLoadMoreServer?.();
  }, [
    algorithmPosts.length,
    hasMoreServer,
    isFetchingServer,
    onLoadMoreServer,
    visiblePostCount,
  ]);

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
    <div className="home-feed-shell flex min-h-full min-w-0 max-w-full flex-col overflow-x-hidden bg-ve-obsidian text-ve-flash font-z8" id="home-feed-page-wrapper">

      {/* Toast Notification System */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ve-obsidian/95 border border-ve-fuse text-vouch-emerald px-4 py-2 rounded-full text-[13px] font-semibold flex items-center gap-2 shadow-lg">
          <Zap className="w-4 h-4 text-vouch-emerald" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* X-style sticky header */}
      <header className="home-feed-header sticky top-0 z-20 min-w-0 border-b border-ve-fuse/60 bg-ve-obsidian/90 backdrop-blur-md">
        <div className="flex h-[53px] min-w-0 items-center justify-between gap-3 px-4">
          <h1 className="text-[20px] font-extrabold text-ve-flash leading-none">
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
      <div className="feed-main mx-auto w-full min-w-0 max-w-full" id="feed-stream-outer">

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

        {activeTab === 'following' && user && (
          <div className="px-4 py-3 border-b border-white/[0.08] flex flex-wrap gap-2">
            {([
              ['following', 'Following'],
              ['tailing', 'Tailing'],
              ['friends', 'Friends'],
              ['subscribers', 'Subscribers'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFollowingFilter(id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold border transition-colors ${
                  followingFilter === id
                    ? 'bg-vouch-emerald/15 border-vouch-emerald/40 text-vouch-emerald'
                    : 'bg-white/[0.03] border-white/10 text-white/55 hover:text-white/80'
                }`}
              >
                {label}
                {socialGraph?.summary && (
                  <span className="ml-1 opacity-70">
                    ({id === 'following' ? socialGraph.summary.following
                      : id === 'tailing' ? socialGraph.summary.tailing
                        : id === 'friends' ? socialGraph.summary.friends
                          : socialGraph.summary.subscribers})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'following' && activeFollowingUsernames.length > 0 && (
          <div className="px-4 py-3 border-b border-white/[0.08]">
            <Suspense fallback={<LazyChunkSkeleton height={320} label="Loading network graph" />}>
              <CapperNetworkGraph posts={posts} followingList={activeFollowingUsernames} />
            </Suspense>
          </div>
        )}

        {/* Dynamic empty state — one shared card, three copy variants */}
        {activeTab === 'following' && activeFollowingUsernames.length === 0 ? (
          <FeedEmptyState
            id="empty-following-placeholder-slate"
            icon={<Users className="w-6 h-6" />}
            title={
              followingFilter === 'tailing'
                ? 'Not tailing anyone yet'
                : followingFilter === 'friends'
                  ? 'No friends yet'
                  : followingFilter === 'subscribers'
                    ? 'No subscriber clubs yet'
                    : 'Not following anyone yet'
            }
            body={<>Go to the <strong className="text-white/70">"For You"</strong> feed tab, find verified sports partners, and click <strong className="text-white/70">"Follow"</strong> or <strong className="text-white/70">"Tail"</strong>. Notifications turn on automatically when you follow someone.</>}
          />
        ) : algorithmPosts.length === 0 && posts.length === 0 ? (
          /* Genuinely no posts anywhere yet (no filter/search at play) */
          <FeedEmptyState
            id="empty-feed-placeholder-slate"
            icon={<AlertTriangle className="w-6 h-6" />}
            title="No posts yet"
            body="Start with today's research, then post a pick, vouch, parlay, result, or note."
            actions={[
              {
                label: 'Open Judge Home',
                primary: true,
                onClick: () => onSectionChange?.('judge_home'),
              },
              {
                label: 'Today slate',
                onClick: () => onSectionChange?.('today'),
              },
              {
                label: 'HR Board',
                onClick: () => onSectionChange?.('hr_board'),
              },
            ]}
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
          /* List of Posts — virtualized X-style stream */
          <div
            ref={feedListRef}
            className="relative border-t border-white/[0.08]"
            id="posts-feed-stream-container"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const post = visiblePosts[virtualRow.index];
              if (!post) return null;
              return (
                <div
                  key={post.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 top-0 w-full border-b border-white/[0.08]"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <FeedPostCard
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
                </div>
              );
            })}
          </div>
        )}
        {/* Infinite Scroll Loader */}
        <div ref={feedSentinelRef} className="h-px" aria-hidden="true" />

        {algorithmPosts.length > 0 && (
          <div className="ve-feed-load-state flex flex-col items-center justify-center gap-2 py-4 px-4 text-[13px] text-white/40">
            {isLoadingMorePosts ? (
              <>
                <FeedPostCardSkeleton />
                <FeedPostCardSkeleton />
                <span className="flex items-center gap-2 pt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald animate-pulse" />
                  <span>Loading more...</span>
                </span>
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
