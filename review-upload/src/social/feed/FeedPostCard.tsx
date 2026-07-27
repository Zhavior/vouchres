import { Z8_SURFACE } from '../../theme/z8Tokens';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../lib/haptics';
import SwipeDrawer from '../../components/ui/SwipeDrawer';
import { 
  Heart, 
  MessageSquare, 
  Repeat2, 
  Bookmark, 
  BookmarkCheck, 
  Zap,
  MoreHorizontal,
  Shield,
  Send,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Share,
  Check,
  ExternalLink,
  Quote,
  Plus,
  Award,
  Trash2,
  Lock,
} from 'lucide-react';
import { FeedPost, Vouch } from '../../types';
import {
  canDeleteFeedPost,
  isParlayFeedPost,
  parlayPostDeleteLockedReason,
} from '../../lib/postDeletePolicy';
import { StatusBadge } from '../../components/ui/primitives';
import ParlayFeedPostCard from './ParlayFeedPostCard';

const POST_TYPE_META: Record<string, { label: string; color: string }> = {
  PARLAY:        { label: 'Parlay',     color: '#4FB8DC' },
  VOUCH:         { label: 'Pick',       color: '#31B583' },
  AI_PICK:       { label: 'HR Alert',   color: '#D99C4A' },
  RESULT:        { label: 'Result',     color: '#31B583' },
  RESEARCH_NOTE: { label: 'Lesson',     color: '#4FB8DC' },
  DISCUSSION:    { label: 'Discussion', color: '#94a3b8' },
};
function PostTypeBadge({ post }: { post: FeedPost }) {
  const meta = POST_TYPE_META[post.postType] ?? POST_TYPE_META.DISCUSSION;
  return (
    <span className="text-[9px] font-black font-mono uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
      style={{ color: meta.color, borderColor: meta.color + '55', background: meta.color + '15' }}>
      {meta.label}
    </span>
  );
}
function ResultStatusBadge({ post }: { post: FeedPost }) {
  if (!post.result) return null;
  const s = post.result.status;
  const map: Record<string, string> = { WON: 'Won', LOST: 'Lost', VOID: 'Void', PENDING: 'Pending', PUSH: 'Pushed' };
  return (
    <span className="inline-flex items-center gap-1">
      <StatusBadge status={map[s] || 'Pending'} />
      <StatusBadge status={post.isVerified ? 'Verified' : 'Unverified'} />
    </span>
  );
}
import ResearchNotePostCard from './ResearchNotePostCard';
import VouchCircleFeedCard from '../../components/VouchCircleFeedCard';
import VouchCard from '../../components/vouch-system/VouchCard';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import CommentThread from './CommentThread';
import { useFeedStore } from '../../stores/feedStore';
import { useAuth } from '../../lib/useAuth';
import { useOptionalSocialGraph } from '../../hooks/SocialGraphProvider';
import { useEntitlements } from '../../features/hr/hooks/useEntitlements';

const QuotedPostEmbed = ({ quotedPost }: { quotedPost: FeedPost | undefined }) => {
  if (!quotedPost) return null;
  return (
    <div className="mt-2 text-left p-3 rounded-2xl border border-white/28 bg-black/34 hover:border-vouch-cyan/34 transition-colors flex flex-col gap-1.5 max-w-full mb-3 shadow-sm shadow-black/12 select-none backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-[11px]">
        <div className="w-5 h-5 rounded-full bg-black/55 border border-white/30 font-bold text-[9px] text-white/70 flex items-center justify-center shrink-0">
          {quotedPost.displayName.split(' ').map(n => n[0]).join('')}
        </div>
        <span className="font-bold text-white truncate">{quotedPost.displayName}</span>
        <span className="text-white/45 text-[10px]">@{quotedPost.username}</span>
      </div>
      <p className="text-xs text-white/70 leading-normal line-clamp-3">
        {quotedPost.content}
      </p>
    </div>
  );
};

interface FeedPostCardProps {
  key?: string;
  post: FeedPost;
  onLike: (postId: string) => void;
  onVouchAction: (postId: string) => void;
  onRepost: (postId: string) => void;
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  onAddComment: (postId: string, commentContent: string) => void;
  onPostCreated?: (postData: Partial<FeedPost>) => void;
  onDeletePost?: (postId: string) => void;
  onSectionChange?: (section: string) => void;
}

function FeedPostCard({
  post,
  onLike,
  onVouchAction,
  onRepost,
  onSaveVouch,
  savedVouchIds,
  onAddComment,
  onPostCreated,
  onDeletePost,
  onSectionChange,
}: FeedPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [focusReply, setFocusReply] = useState(false);
  const syncPosts = useFeedStore((state) => state.syncPosts);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const postMenuRef = React.useRef<HTMLDivElement | null>(null);

  // Bookmarks
  const [isBookmarked, setIsBookmarked] = useState(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('vouchedge_bookmarks') || '[]');
      return bookmarks.includes(post.id);
    } catch {
      return false;
    }
  });

  // Poll state (Twitter poll)
  const [localPoll, setLocalPoll] = useState(() => {
    if (!post.poll) return undefined;
    try {
      const savedVote = localStorage.getItem(`poll_vote_${post.id}`);
      if (savedVote !== null) {
        const userVotedIndex = parseInt(savedVote, 10);
        const options = [...post.poll.options];
        if (post.poll.userVotedIndex === undefined) {
          options[userVotedIndex] = {
            ...options[userVotedIndex],
            votes: options[userVotedIndex].votes + 1
          };
          return {
            ...post.poll,
            options,
            totalVotes: post.poll.totalVotes + 1,
            userVotedIndex
          };
        }
      }
    } catch {}
    return post.poll;
  });

  // Repost menu and Quote modal
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');

  // Toast notifications inside the card
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleVote = (idx: number) => {
    if (!localPoll || localPoll.userVotedIndex !== undefined) return;
    try {
      const updatedOptions = [...localPoll.options];
      updatedOptions[idx] = {
        ...updatedOptions[idx],
        votes: updatedOptions[idx].votes + 1
      };
      
      const updatedPoll = {
        ...localPoll,
        options: updatedOptions,
        totalVotes: localPoll.totalVotes + 1,
        userVotedIndex: idx
      };
      
      setLocalPoll(updatedPoll);
      localStorage.setItem(`poll_vote_${post.id}`, String(idx));
      showToast('⚡ Vote registered successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmarkToggle = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('vouchedge_bookmarks') || '[]');
      let nextStatus = false;
      if (isBookmarked) {
        const filtered = bookmarks.filter((id: string) => id !== post.id);
        localStorage.setItem('vouchedge_bookmarks', JSON.stringify(filtered));
        nextStatus = false;
      } else {
        bookmarks.push(post.id);
        localStorage.setItem('vouchedge_bookmarks', JSON.stringify(bookmarks));
        nextStatus = true;
      }
      setIsBookmarked(nextStatus);
      showToast(nextStatus ? '🔖 Saved to bookmarks!' : '🔖 Removed from bookmarks');
    } catch {
      showToast('Error saving bookmark');
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      showToast('🔗 Post link copied to clipboard!');
    } catch {
      showToast('🔗 Link: vouchedge.ai/post/' + post.id);
    }
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim()) return;
    if (onPostCreated) {
      onPostCreated({
        content: quoteText.trim(),
        postType: 'RESEARCH_NOTE',
        sportBadge: post.sportBadge || 'MLB',
        sourceBadge: 'Quote Vouch',
        quotedPostId: post.id,
        quotedPost: post
      });
      setQuoteText('');
      setShowQuoteModal(false);
      showToast('💬 Published quote vouch successfully!');
    } else {
      alert('Local beta posting issue: missing callback');
    }
  };

  const { user } = useAuth();
  const socialGraph = useOptionalSocialGraph();
  const entitlements = useEntitlements();
  const [followBusy, setFollowBusy] = useState(false);

  const relationshipEntry = socialGraph?.findEntry({
    profileId: post.userId !== 'unknown' ? post.userId : null,
    username: post.username,
  });
  const isFollowing = Boolean(relationshipEntry);
  const isTailing = relationshipEntry?.relationshipType === 'tail';
  const isSubscribed = relationshipEntry?.relationshipType === 'subscribe';

  const handleFollowToggle = async () => {
    if (!user?.id || !socialGraph || followBusy) return;
    if (!post.userId || post.userId === 'unknown') return;

    setFollowBusy(true);
    try {
      const wantsTail = post.subscriptionTier === 'SELLER_PRO';
      if (isFollowing) {
        await socialGraph.unfollowProfile(post.userId);
        showToast(`Unfollowed @${post.username}`);
        return;
      }

      if (wantsTail && !entitlements.isPro) {
        setShowUpgradeModal(true);
        return;
      }

      const relationshipType = wantsTail
        ? (entitlements.isCreator ? 'subscribe' : 'tail')
        : 'follow';

      await socialGraph.followProfile({
        profileId: post.userId,
        relationshipType,
      });

      if (post.parlay?.id || post.parlay?.backendPickId) {
        const pickId = post.parlay.backendPickId ?? post.parlay.id;
        try {
          await socialGraph.tailParlay({ pickId, sourcePostId: post.backendPostId ?? post.id });
          showToast(`Notifications on — tailed @${post.username}'s parlay`);
        } catch {
          showToast(`Notifications on — now ${relationshipType === 'subscribe' ? 'subscribed to' : wantsTail ? 'tailing' : 'following'} @${post.username}`);
        }
      } else {
        showToast(`Notifications on — now ${relationshipType === 'subscribe' ? 'subscribed to' : wantsTail ? 'tailing' : 'following'} @${post.username}`);
      }
    } catch (err: any) {
      console.error('[FeedPostCard] follow failed', err);
      alert(err?.message ?? 'Could not update follow status.');
    } finally {
      setFollowBusy(false);
    }
  };

  const handleInstantUpgrade = () => {
    setShowUpgradeModal(false);
    alert('Upgrade to Gold or Seller Pro to tail verified creators.');
  };

  // Relative timestamp helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const openComments = (focus = false) => {
    setShowComments(true);
    setFocusReply(focus);
  };

  const handleCommentsCountChange = (count: number) => {
    syncPosts(
      useFeedStore.getState().posts.map((p) =>
        p.id === post.id ? { ...p, commentsCount: count } : p,
      ),
    );
  };

  // Check if saved
  const isPostVouchSaved = post.vouch ? savedVouchIds.includes(post.vouch.id) : false;

  const isSelf = Boolean(user?.id && post.userId && post.userId === user.id);
  const showFollowAction = !isSelf && post.userId !== 've-alg-1';
  const postDeleteAllowed = isSelf && canDeleteFeedPost(post);
  const parlayPostLocked = isSelf && isParlayFeedPost(post) && !canDeleteFeedPost(post);

  React.useEffect(() => {
    if (!showPostMenu) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setShowPostMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPostMenu]);

  const handleDeleteClick = () => {
    if (!postDeleteAllowed || !onDeletePost) return;
    triggerHaptic('heavy');
    setShowPostMenu(false);
    onDeletePost(post.id);
  };

  const handleProfileClick = () => {
    if (!document.startViewTransition) {
      if (onSectionChange) onSectionChange('profile');
      return;
    }
    document.startViewTransition(() => {
      if (onSectionChange) onSectionChange('profile');
    });
  };

  const renderPostActionsMenu = () => {
    if (!isSelf) return null;
    return (
      <div className="relative" ref={postMenuRef}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => setShowPostMenu((open) => {
            if (!open) triggerHaptic('light');
            return !open;
          })}
          className="feed-icon-btn p-1.5 rounded-full text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Post actions"
          aria-expanded={showPostMenu}
          id={`post-menu-btn-${post.id}`}
        >
          <MoreHorizontal className="w-5 h-5" />
        </motion.button>
        <SwipeDrawer isOpen={showPostMenu} onClose={() => setShowPostMenu(false)} title="Post Options">
          <div className="flex flex-col gap-2">
            {postDeleteAllowed && onDeletePost ? (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="w-full text-left px-4 py-3 text-[15px] bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl text-rose-400 font-medium flex items-center gap-3 transition-colors"
                id={`delete-post-btn-${post.id}`}
              >
                <Trash2 className="w-5 h-5" />
                Delete post
              </button>
            ) : parlayPostLocked ? (
              <div
                className="px-4 py-3 text-[14px] bg-white/[0.02] rounded-xl text-white/45 flex items-start gap-3"
                title={parlayPostDeleteLockedReason()}
                id={`locked-post-indicator-${post.id}`}
              >
                <Lock className="w-5 h-5 shrink-0 mt-0.5 text-white/35" />
                <span>{parlayPostDeleteLockedReason()}</span>
              </div>
            ) : null}
          </div>
        </SwipeDrawer>
      </div>
    );
  };

  const isProTarget = post.subscriptionTier === 'SELLER_PRO';
  const followButtonText = isFollowing
    ? (isTailing ? '✓ Tailing' : isSubscribed ? '✓ Subscribed' : '✓ Following')
    : (isProTarget ? 'Tail' : 'Follow');

  if (post.boardConfig && post.boardConfig.gradient) {
    return (
      <article 
        className="feed-post z8-feed-card px-4 py-3 hover:bg-white/[0.02] transition-colors flex flex-col gap-2"
        id={`feed-post-card-${post.id}`}
      >
        <VouchCircleFeedCard post={post} />
        
        {/* Reaction Bar */}
        <div className="feed-action-row flex items-center justify-between max-w-[425px] text-white/45 text-[13px] -ml-2">
          {/* Comment icon button */}
          <button 
            onClick={() => openComments(true)}
            className={`feed-action-btn group flex items-center gap-1 hover:text-vouch-cyan transition-colors ${
              showComments ? 'text-vouch-cyan' : ''
            }`}
            title="Reply"
            id={`comment-btn-${post.id}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="font-mono">{post.commentsCount}</span>
          </button>

          {/* Repost button */}
          <button 
            onClick={() => onRepost(post.id)}
            className={`feed-action-btn flex items-center gap-1 hover:text-vouch-emerald transition-colors ${
              post.isReposted ? 'text-vouch-emerald font-bold' : ''
            }`}
            title="Repost"
            id={`repost-btn-${post.id}`}
          >
            <Repeat2 className="w-4 h-4" />
            <span className="font-mono">{post.repostsCount}</span>
          </button>

          {/* Like button */}
          <button 
            onClick={() => onLike(post.id)}
            className={`feed-action-btn flex items-center gap-1 hover:text-rose-500 transition-colors ${
              post.isLiked ? 'text-rose-500 font-bold' : ''
            }`}
            title="Like"
            id={`like-btn-${post.id}`}
          >
            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="font-mono">{post.likesCount}</span>
          </button>

          {/* Vouch / Zap Action */}
          <button 
            onClick={() => onVouchAction(post.id)}
            className={`feed-action-btn flex items-center gap-1 hover:text-amber-400 transition-colors ${
              post.isVouched ? 'text-amber-400 font-semibold' : ''
            }`}
            title="Vouch / Tail pick"
            id={`vouch-action-btn-${post.id}`}
          >
            <Zap className={`w-4 h-4 ${post.isVouched ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="font-mono font-bold">Vouch</span>
            <span className="font-mono text-[10px] text-white/45">({post.vouchesCount})</span>
          </button>
        </div>

        <CommentThread
          post={post}
          open={showComments}
          autoFocus={focusReply}
          onCountChange={handleCommentsCountChange}
        />
      </article>
    );
  }

  return (
    <article
      className="feed-post z8-feed-card px-4 py-3 hover:bg-white/[0.02] transition-colors relative"
      id={`feed-post-card-${post.id}`}
    >
      {/* Upper header segment: User details & metadata badges */}
      <div className="flex items-start gap-3">
        <div 
          onClick={handleProfileClick}
          className="cursor-pointer"
          style={{ viewTransitionName: `avatar-${post.id}` } as any}
        >
          <ProfileAvatarBorder 
            borderId={post.profileBorderId}
            displayName={post.displayName}
            initials={post.displayName.split(' ').map(n=>n[0]).join('')}
            size="md"
            winRate={post.winRate || 58.3}
            isVerified={post.isVerified}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap leading-tight">
                <span 
                  className="font-bold text-[15px] text-white hover:underline cursor-pointer truncate"
                  onClick={handleProfileClick}
                >
                  {post.displayName}
                </span>
                {post.isVerified && (
                  <Shield className="w-4 h-4 text-vouch-emerald shrink-0" />
                )}
                <span className="text-white/45 text-[15px] truncate">@{post.username}</span>
                <span className="text-white/35 text-[15px]">·</span>
                <span className="text-white/45 text-[15px] hover:underline cursor-pointer shrink-0">{formatTime(post.timestamp)}</span>
              </div>

              {/* Compact badges */}
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <PostTypeBadge post={post} />
                <ResultStatusBadge post={post} />
                {parlayPostLocked && (
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-bold font-mono uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-white/20 text-white/45 bg-white/[0.04]"
                    title={parlayPostDeleteLockedReason()}
                  >
                    <Lock className="w-3 h-3" />
                    Locked
                  </span>
                )}
                {post.sportBadge && (
                  <span className="text-[11px] text-white/40 font-medium">
                    {post.sportBadge}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {showFollowAction && user && (
                <button
                  onClick={() => void handleFollowToggle()}
                  disabled={followBusy}
                  className={`rounded-full px-3 py-1 text-[13px] font-bold transition-colors ${
                    isFollowing
                      ? 'border border-white/20 text-white/70 hover:border-rose-500/50 hover:text-rose-400'
                      : 'bg-white text-black hover:bg-white/90'
                  } ${followBusy ? 'opacity-60 cursor-wait' : ''}`}
                  id={`follow-tail-btn-${post.id}`}
                >
                  {followButtonText}
                </button>
              )}
              {renderPostActionsMenu()}
            </div>
          </div>

          {/* Main post text content */}
          <p className="text-white text-[15px] leading-normal mt-1 mb-2 whitespace-pre-wrap">
            {post.content}
          </p>

      {/* Attached Media Render container with Hover Navigation Slides */}
      {post.mediaUrl && !post.boardConfig && (
        <div className="mb-3.5 bg-black/28 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/28 p-1 flex justify-center max-w-full relative group shadow-lg shadow-black/16">
          {post.mediaType === 'video' ? (
            <video 
              src={post.mediaUrl} 
              controls 
              muted 
              playsInline
              className="max-h-[380px] w-full object-contain rounded-lg shadow-inner" 
            />
          ) : (
            <div className="relative w-full aspect-[4/3] max-h-[380px] flex flex-col items-center">
              {/* Show active slide */}
              <img 
                src={activeSlide === 1 && post.mediaUrl2 ? post.mediaUrl2 : post.mediaUrl} 
                alt={`Attached proof slide ${activeSlide + 1}`}
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
                className="max-h-[380px] w-full h-full object-contain rounded-lg hover:scale-[1.005] transition-all duration-200 cursor-pointer shadow-inner animate-fade-in" 
                style={{ aspectRatio: '4 / 3' }}
                referrerPolicy="no-referrer"
              />

              {/* Slider Next/Prev Arrow On Hover */}
              {post.mediaUrl2 && (
                <>
                  {/* Left Arrow */}
                  {activeSlide === 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide(0);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/88 hover:bg-black/92 border border-white/34 text-white rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-xl shadow-black/20 cursor-pointer z-20 flex items-center justify-center hover:scale-105"
                      title="Previous Image"
                      id={`slide-left-btn-${post.id}`}
                    >
                      <ChevronLeft className="w-5.5 h-5.5 text-vouch-cyan" />
                    </button>
                  )}

                  {/* Right Arrow */}
                  {activeSlide === 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/88 hover:bg-black/92 border border-white/34 text-white rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-xl shadow-black/20 cursor-pointer z-20 flex items-center justify-center hover:scale-105"
                      title="Next Image"
                      id={`slide-right-btn-${post.id}`}
                    >
                      <ChevronRight className="w-5.5 h-5.5 text-vouch-cyan" />
                    </button>
                  )}

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 flex gap-1.5 z-10 bg-black/57 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/28">
                    <span 
                      onClick={() => setActiveSlide(0)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-150 ${activeSlide === 0 ? 'bg-vouch-cyan scale-125 shadow-glow' : 'bg-white/65 hover:bg-white/50'}`}
                    />
                    <span 
                      onClick={() => setActiveSlide(1)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-155 ${activeSlide === 1 ? 'bg-vouch-cyan scale-125 shadow-glow' : 'bg-white/65 hover:bg-white/50'}`}
                    />
                  </div>

                  {/* Page indicator tag (e.g. 1/2, 2/2) */}
                  <div className="absolute top-3 right-3 bg-black/88 text-white/70 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/35 z-10">
                    {activeSlide + 1} / 2
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/92 border border-vouch-cyan/34 text-vouch-cyan rounded-full text-[10px] font-black tracking-wide shadow-xl shadow-black/22 z-50 animate-bounce flex items-center gap-1.5">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Twitter Poll Render */}
      {localPoll && (
        <div className="mb-3.5 bg-black/72 border border-white/34 rounded-2xl p-3.5 space-y-3 font-sans text-xs text-left animate-slide-up shadow-lg shadow-black/14 backdrop-blur-xl">
          <p className="font-bold text-white text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            {localPoll.question || "Interactive Poll"}
          </p>
          
          <div className="space-y-2">
            {localPoll.options.map((opt, idx) => {
              const isVoted = localPoll.userVotedIndex !== undefined;
              const hasVotedThis = localPoll.userVotedIndex === idx;
              const percentage = localPoll.totalVotes > 0 
                ? Math.round((opt.votes / localPoll.totalVotes) * 100) 
                : 0;

              return (
                <div key={idx} className="relative overflow-hidden rounded-lg">
                  {isVoted ? (
                    // Voted / Show Results Mode
                    <div className="w-full flex items-center justify-between p-2.5 bg-black/30 backdrop-blur-xl border border-white/25 rounded-lg relative overflow-hidden">
                      {/* Animated Percentage background fill */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 ${hasVotedThis ? 'bg-vouch-cyan/10' : 'bg-black/20'} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="font-semibold text-white/70 z-10 flex items-center gap-1.5">
                        {opt.text}
                        {hasVotedThis && (
                          <span className="text-[9px] bg-vouch-cyan/12 font-extrabold text-vouch-cyan px-1.5 py-0.2 rounded-full border border-vouch-cyan/28 flex items-center gap-0.5">
                            ✓ Your Vote
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-black text-white z-10">{percentage}%</span>
                    </div>
                  ) : (
                    // Active voting mode button
                    <button
                      type="button"
                      onClick={() => handleVote(idx)}
                      className="w-full text-left p-2.5 bg-black/36 hover:bg-vouch-cyan/8 border border-white/28 text-vouch-cyan hover:text-vouch-cyan font-bold rounded-lg text-xs transition-all hover:translate-x-0.5"
                    >
                      {opt.text}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[9px] text-white/45 font-mono pt-1">
            <span>Total: {localPoll.totalVotes} votes</span>
            <span>Local Live Audit</span>
          </div>
        </div>
      )}

      {/* Embedded Quote Post if present */}
      {post.quotedPost && (
        <QuotedPostEmbed quotedPost={post.quotedPost} />
      )}

      {/* Specialty embed cards depending on type */}
      {post.boardConfig && (
        <VouchCircleFeedCard post={post} />
      )}

      {post.postType === 'PARLAY' && post.parlay && (
        <ParlayFeedPostCard parlay={post.parlay} />
      )}
      
      {post.postType === 'VOUCH' && post.vouch && !post.boardConfig && (
        <VouchCard 
          vouch={post.vouch} 
          onSaveVouch={onSaveVouch} 
          isSaved={isPostVouchSaved}
          profile={{
            displayName: post.displayName,
            username: post.username,
            trustScore: post.userId === 've-alg-1' ? 920 : 845,
            subscriptionTier: post.subscriptionTier,
            verified: post.isVerified
          }}
          onPostCreated={onPostCreated}
        />
      )}

      {post.postType === 'RESULT' && post.result && (
        <VouchCard 
          vouch={post.vouch || {
            id: post.id,
            vouchSource: post.sourceBadge || 'Grader Ledger',
            userNote: post.content,
            market: post.result.marketName,
            sport: post.sportBadge || 'MLB',
            gameName: post.result.details,
            odds: 'Settled',
            status: post.result.status,
            savedCount: 0,
            vouchedCount: post.vouchesCount || 0,
            createdAt: post.timestamp
          }}
          onSaveVouch={onSaveVouch}
          isSaved={isPostVouchSaved}
          profile={{
            displayName: post.displayName,
            username: post.username,
            trustScore: post.userId === 've-alg-1' ? 920 : 845,
            subscriptionTier: post.subscriptionTier,
            verified: post.isVerified
          }}
          layout="result-proof"
          onPostCreated={onPostCreated}
        />
      )}

      {post.postType === 'RESEARCH_NOTE' && post.researchNote && (
        <ResearchNotePostCard researchNote={post.researchNote} />
      )}

      {post.postType === 'AI_PICK' && post.researchNote && (
        <ResearchNotePostCard researchNote={post.researchNote} />
      )}
        </div>
      </div>

      {/* Social interaction reaction bar — X-style */}
      <div className="feed-action-row flex items-center justify-between max-w-[425px] mt-2 text-white/45 text-[13px] -ml-2 relative select-none">
        <button 
          onClick={() => openComments(true)}
          className={`feed-action-btn group flex items-center gap-1 hover:text-vouch-cyan transition-colors ${
            showComments ? 'text-vouch-cyan font-bold' : ''
          }`}
          title="Reply"
          id={`comment-btn-${post.id}`}
        >
          <MessageSquare className="w-[18px] h-[18px]" />
          {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
        </button>

        <div className="relative">
          <motion.button 
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              triggerHaptic('light');
              setShowRepostMenu(!showRepostMenu);
            }}
            className={`feed-action-btn flex items-center gap-1 hover:text-vouch-emerald transition-colors ${
              post.isReposted ? 'text-vouch-emerald font-bold' : ''
            }`}
            title="Repost"
            id={`repost-btn-${post.id}`}
          >
            <Repeat2 className={`w-[18px] h-[18px] ${post.isReposted ? 'rotate-180' : ''}`} />
            {post.repostsCount > 0 && <span>{post.repostsCount}</span>}
          </motion.button>

          <SwipeDrawer isOpen={showRepostMenu} onClose={() => setShowRepostMenu(false)} title="Repost Options">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  triggerHaptic('success');
                  onRepost(post.id);
                  setShowRepostMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-[15px] bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl text-white font-medium flex items-center gap-3 transition-colors"
              >
                <Repeat2 className="w-5 h-5 text-vouch-emerald" />
                {post.isReposted ? 'Undo Repost' : 'Repost'}
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowRepostMenu(false);
                  setShowQuoteModal(true);
                }}
                className="w-full text-left px-4 py-3 text-[15px] bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl text-white font-medium flex items-center gap-3 transition-colors"
              >
                <Quote className="w-5 h-5 text-vouch-cyan" />
                Quote
              </button>
            </div>
          </SwipeDrawer>
        </div>

        <motion.button 
          whileTap={{ scale: 0.85 }}
          onClick={() => {
            triggerHaptic('success');
            onLike(post.id);
          }}
          className={`feed-action-btn flex items-center gap-1 hover:text-rose-500 transition-colors ${
            post.isLiked ? 'text-rose-500 font-bold' : ''
          }`}
          title="Like"
          id={`like-btn-${post.id}`}
        >
          <Heart className={`w-[18px] h-[18px] ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          {post.likesCount > 0 && <span>{post.likesCount}</span>}
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.85 }}
          onClick={() => {
            triggerHaptic('success');
            onVouchAction(post.id);
          }}
          className={`feed-action-btn flex items-center gap-1 hover:text-amber-400 transition-colors ${
            post.isVouched ? 'text-amber-400 font-semibold' : ''
          }`}
          title="Vouch"
          id={`vouch-action-btn-${post.id}`}
        >
          <Zap className={`w-[18px] h-[18px] ${post.isVouched ? 'fill-amber-400 text-amber-400' : ''}`} />
          {post.vouchesCount > 0 && <span>{post.vouchesCount}</span>}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => {
            triggerHaptic('light');
            handleBookmarkToggle();
          }}
          className={`feed-action-btn transition-colors ${
            isBookmarked ? 'text-vouch-cyan' : 'hover:text-vouch-cyan'
          }`}
          title="Bookmark"
        >
          {isBookmarked ? <BookmarkCheck className="w-[18px] h-[18px] fill-vouch-cyan text-vouch-cyan" /> : <Bookmark className="w-[18px] h-[18px]" />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleCopyLink}
          className="feed-action-btn hover:text-vouch-cyan transition-colors"
          title="Share"
        >
          <Share className="w-[18px] h-[18px]" />
        </motion.button>
      </div>

      {/* Quote Vouch Modal overlay */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-obsidian-900/55 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleQuoteSubmit} 
            className="w-full max-w-lg bg-black/92 border border-white/36 rounded-3xl p-5 shadow-2xl shadow-black/28 space-y-4 animate-slide-up text-left backdrop-blur-xl"
          >
            <div className="flex justify-between items-center border-b border-white/28 pb-2.5">
              <span className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-vouch-cyan" />
                Quote Vouch Play
              </span>
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="text-white/45 hover:text-rose-300 font-mono text-xs font-black"
              >
                [CLOSE]
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-white/45 font-mono">Your commentary / feedback analysis</label>
              <textarea
                placeholder="Why are you tailing/quoting this? Share your custom verified analysis..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                rows={3}
                className="w-full bg-black/44 border border-white/30 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-vouch-cyan/75 transition-colors resize-none placeholder:text-white/45 font-medium"
                required
              />
            </div>

            {/* Quoted play embedded preview */}
            <div className="border border-white/28 rounded-2xl p-3 bg-black/34">
              <div className="flex items-center gap-1.5 text-[10px] text-white/45 mb-1">
                <span className="font-bold text-white/70">{post.displayName}</span>
                <span>@{post.username}</span>
              </div>
              <p className="text-white/45 text-xs leading-normal line-clamp-2">{post.content}</p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 bg-black/42 hover:bg-black/62 rounded-xl text-xs font-bold text-white/45 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-vouch-cyan hover:brightness-110 rounded-xl text-xs font-bold text-obsidian-900 transition-all shadow-lg shadow-vouch-cyan/22 active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Quote</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <CommentThread
        post={post}
        open={showComments}
        autoFocus={focusReply}
        onCountChange={handleCommentsCountChange}
      />

      {/* 5. Custom premium tail-lock subscription upgrade modal */}
      {showUpgradeModal && (
        <div className="absolute inset-0 bg-obsidian-900/94 backdrop-blur-md rounded-3xl z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-vouch-emerald/13 rounded-full flex items-center justify-center border border-vouch-emerald/30 mb-3 animate-pulse">
            <span className="text-xl">🛡️</span>
          </div>
          
          <h4 className="font-bold text-white text-sm uppercase tracking-wide">
            Lock: Subscribe & Tail Tier Required
          </h4>
          <p className="text-[11px] text-white/45 max-w-xs mt-1.5 leading-relaxed font-semibold">
            To subscribe and tail @{post.username}'s transparent sports plays, you must upgrade your tracking account to a Premium Partner tier first!
          </p>

          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center font-bold">
            <button
              onClick={handleInstantUpgrade}
              className="px-4 py-1.5 bg-vouch-emerald hover:brightness-110 border border-vouch-emerald/45 text-obsidian-900 font-black rounded-lg text-[10.5px] uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              💎 Instant Upgrade (Seller Pro)
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="px-3.5 py-1.5 bg-black/42 hover:bg-black/62 text-white/45 hover:text-white border border-white/28 rounded-lg text-[10px] font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function feedPostCardPropsAreEqual(prev: FeedPostCardProps, next: FeedPostCardProps): boolean {
  const prevPost = prev.post;
  const nextPost = next.post;

  if (prevPost !== nextPost) {
    if (prevPost.id !== nextPost.id) return false;
    if (
      prevPost.isLiked !== nextPost.isLiked ||
      prevPost.likesCount !== nextPost.likesCount ||
      prevPost.isVouched !== nextPost.isVouched ||
      prevPost.vouchesCount !== nextPost.vouchesCount ||
      prevPost.isReposted !== nextPost.isReposted ||
      prevPost.repostsCount !== nextPost.repostsCount ||
      prevPost.commentsCount !== nextPost.commentsCount ||
      prevPost.comments !== nextPost.comments
    ) {
      return false;
    }
  }

  if (
    prev.onLike !== next.onLike ||
    prev.onVouchAction !== next.onVouchAction ||
    prev.onRepost !== next.onRepost ||
    prev.onSaveVouch !== next.onSaveVouch ||
    prev.onAddComment !== next.onAddComment ||
    prev.onPostCreated !== next.onPostCreated ||
    prev.onDeletePost !== next.onDeletePost
  ) {
    return false;
  }

  const vouchId = prevPost.vouch?.id;
  if (vouchId) {
    const prevSaved = prev.savedVouchIds.includes(vouchId);
    const nextSaved = next.savedVouchIds.includes(vouchId);
    if (prevSaved !== nextSaved) return false;
  }

  return true;
}

export default React.memo(FeedPostCard, feedPostCardPropsAreEqual);
