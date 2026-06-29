import React, { useState } from 'react';
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
  Eye,
  BarChart2,
  Share,
  Check,
  ExternalLink,
  Quote,
  Plus,
  Award,
  Twitter
} from 'lucide-react';
import { FeedPost, Vouch } from '../../types';
import { StatusBadge } from '../../components/ui/primitives';
import ParlayFeedPostCard from './ParlayFeedPostCard';

const POST_TYPE_META: Record<string, { label: string; color: string }> = {
  PARLAY:        { label: 'Parlay',     color: '#22d3ee' },
  VOUCH:         { label: 'Pick',       color: '#34d399' },
  AI_PICK:       { label: 'HR Alert',   color: '#fb923c' },
  RESULT:        { label: 'Result',     color: '#a78bfa' },
  RESEARCH_NOTE: { label: 'Lesson',     color: '#60a5fa' },
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

const QuotedPostEmbed = ({ quotedPost }: { quotedPost: FeedPost | undefined }) => {
  if (!quotedPost) return null;
  return (
    <div className="mt-2 text-left p-3 rounded-xl border border-slate-800/80 bg-[#070b13]/60 hover:border-slate-700 transition-colors flex flex-col gap-1.5 max-w-full mb-3 shadow-sm select-none">
      <div className="flex items-center gap-1.5 text-[11px]">
        <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 font-bold text-[9px] text-slate-300 flex items-center justify-center shrink-0">
          {quotedPost.displayName.split(' ').map(n => n[0]).join('')}
        </div>
        <span className="font-bold text-slate-200 truncate">{quotedPost.displayName}</span>
        <span className="text-slate-500 text-[10px]">@{quotedPost.username}</span>
      </div>
      <p className="text-xs text-slate-300 leading-normal line-clamp-3">
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
}

export default function FeedPostCard({
  post,
  onLike,
  onVouchAction,
  onRepost,
  onSaveVouch,
  savedVouchIds,
  onAddComment,
  onPostCreated,
}: FeedPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Simulated Views count
  const simulatedViews = React.useMemo(() => {
    const seed = post.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const multiplier = 15 + (seed % 85);
    const base = (post.likesCount * 14) + (post.commentsCount * 28) + (post.vouchesCount * 22) + 5;
    const finalVal = base * multiplier + (seed % 140) + 24;
    if (finalVal >= 1000) {
      return (finalVal / 1000).toFixed(1) + 'K';
    }
    return finalVal.toString();
  }, [post.id, post.likesCount, post.commentsCount, post.vouchesCount]);

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

  // Check if user is following this creator
  const [followingList, setFollowingList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vouchedge_following');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [userProfile, setUserProfile] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('vouchedge_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const handleSync = (e: any) => {
      setFollowingList(e.detail);
    };
    window.addEventListener('vouchedge-following-updated', handleSync);
    
    const handleProfileSync = () => {
      try {
        const stored = localStorage.getItem('vouchedge_profile');
        if (stored) {
          setUserProfile(JSON.parse(stored));
        }
      } catch {}
    };
    window.addEventListener('vouchedge-profile-updated', handleProfileSync);

    return () => {
      window.removeEventListener('vouchedge-following-updated', handleSync);
      window.removeEventListener('vouchedge-profile-updated', handleProfileSync);
    };
  }, []);

  const isFollowing = followingList.includes(post.username);

  const handleFollowToggle = () => {
    if (!userProfile) return;

    const isUpgraded = userProfile.subscriptionTier === 'GOLD' || userProfile.subscriptionTier === 'SELLER_PRO';

    if (!isUpgraded) {
      // User is BASIC, so trigger the custom upgrade modal!
      setShowUpgradeModal(true);
      return;
    }

    // Upgraded users can follow / tail!
    let updated: string[];
    if (isFollowing) {
      updated = followingList.filter(u => u !== post.username);
    } else {
      updated = [...followingList, post.username];
    }

    setFollowingList(updated);
    localStorage.setItem('vouchedge_following', JSON.stringify(updated));
    
    // Dispatch custom event to sync other feed cards instantly
    window.dispatchEvent(new CustomEvent('vouchedge-following-updated', { detail: updated }));
  };

  const handleInstantUpgrade = () => {
    try {
      const stored = localStorage.getItem('vouchedge_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.subscriptionTier = 'SELLER_PRO';
        parsed.verified = true;
        localStorage.setItem('vouchedge_profile', JSON.stringify(parsed));
        setUserProfile(parsed);
        
        // Dispatch event for other components to know we upgraded!
        window.dispatchEvent(new CustomEvent('vouchedge-profile-updated'));
        
        // Follow automatically since they upgraded!
        const updated = [...followingList, post.username];
        setFollowingList(updated);
        localStorage.setItem('vouchedge_following', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('vouchedge-following-updated', { detail: updated }));

        setShowUpgradeModal(false);
        alert(`💎 Congratulations! You upgraded to SELLER PRO. You are now subscribing & following (tailing) @${post.username}!`);
      }
    } catch {}
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  // Check if saved
  const isPostVouchSaved = post.vouch ? savedVouchIds.includes(post.vouch.id) : false;

  const isSelf = userProfile && post.username === userProfile.username;
  const showFollowAction = !isSelf && post.userId !== 've-alg-1';

  const isProTarget = post.subscriptionTier === 'SELLER_PRO';
  const followButtonText = isFollowing 
    ? (isProTarget ? '✓ Tailing' : '✓ Following')
    : (isProTarget ? 'Tail' : 'Follow');

  if (post.boardConfig && post.boardConfig.gradient) {
    return (
      <div 
        className="bg-[#121824] rounded-3xl border border-slate-850 p-3 hover:border-slate-800 transition-all duration-200 animate-slide-up flex flex-col gap-1.5" 
        id={`feed-post-card-${post.id}`}
      >
        <VouchCircleFeedCard post={post} />
        
        {/* Reaction Bar */}
        <div className="flex items-center justify-between pt-1 pb-1 text-slate-450 text-xs font-mono">
          {/* Comment icon button */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`group flex items-center gap-1.5 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-950/20 ${
              showComments ? 'text-sky-450' : ''
            }`}
            title="Toggle comments"
            id={`comment-btn-${post.id}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="font-mono">{post.commentsCount}</span>
          </button>

          {/* Repost button */}
          <button 
            onClick={() => onRepost(post.id)}
            className={`flex items-center gap-1.5 hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-indigo-950/20 ${
              post.isReposted ? 'text-indigo-400 font-bold' : ''
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
            className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-950/20 ${
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
            className={`flex items-center gap-1.5 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-amber-950/20 ${
              post.isVouched ? 'text-amber-400 font-semibold' : ''
            }`}
            title="Vouch / Tail pick"
            id={`vouch-action-btn-${post.id}`}
          >
            <Zap className={`w-4 h-4 ${post.isVouched ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="font-mono font-bold">Vouch</span>
            <span className="font-mono text-[10px] text-slate-500">({post.vouchesCount})</span>
          </button>
        </div>

        {/* Comments drawer */}
        {showComments && (
          <div className="pt-2 border-t border-slate-850 space-y-3.5" id={`comments-expanded-${post.id}`}>
            {/* Create comment form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-center">
              <input 
                type="text" 
                placeholder="Post your reply..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-sky-500/80 transition-all font-medium placeholder-slate-500"
                required
                id={`comment-input-${post.id}`}
              />
              <button 
                type="submit"
                className="p-2 bg-sky-500/20 hover:bg-sky-500 text-sky-450 hover:text-slate-950 rounded-xl transition-all font-bold text-[10px] tracking-widest uppercase flex items-center justify-center cursor-pointer shadow-md"
                id={`comment-submit-${post.id}`}
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>

            {/* List and render of comments */}
            {post.comments && post.comments.length > 0 && (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1.5 scrollbar-thin mt-2" id={`comments-feed-${post.id}`}>
                {post.comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 flex flex-col gap-1 text-left animate-slide-up">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span className="font-bold text-slate-300">
                        {comment.displayName} <span className="text-slate-500">@{comment.username}</span>
                      </span>
                      <span className="font-mono text-slate-550">
                        {comment.timestamp && new Date(comment.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-normal pl-0.5">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <article 
      className="bg-[#121824] rounded-2xl border border-slate-850 p-4 hover:border-slate-800 transition-all duration-200 animate-slide-up relative overflow-hidden"
      id={`feed-post-card-${post.id}`}
    >
      {/* Upper header segment: User details & metadata badges */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex gap-3">
          {/* Avatar or custom initials */}
          <ProfileAvatarBorder 
            borderId={post.profileBorderId}
            displayName={post.displayName}
            initials={post.displayName.split(' ').map(n=>n[0]).join('')}
            size="md"
            winRate={post.winRate || 58.3}
            isVerified={post.isVerified}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-100 hover:underline cursor-pointer text-sm leading-tight truncate">
                {post.displayName}
              </span>
              {post.subscriptionTier === 'SELLER_PRO' ? (
                <span className="text-[9px] bg-indigo-950 font-extrabold text-indigo-455 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-indigo-900/40 text-indigo-400">
                  💎 SELLER PRO
                </span>
              ) : post.subscriptionTier === 'GOLD' ? (
                <span className="text-[9px] bg-sky-950 font-extrabold text-sky-455 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-sky-900/40 text-sky-400">
                  ✨ GOLD VERIFIED
                </span>
              ) : post.isVerified ? (
                <span className="text-[9px] bg-emerald-955 font-extrabold text-emerald-455 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-900/40 text-emerald-400">
                  <Shield className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                  PRO
                </span>
              ) : null}
              <PostTypeBadge post={post} />
              <ResultStatusBadge post={post} />
              <span className="text-slate-400 text-xs">@{post.username}</span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">{formatTime(post.timestamp)}</span>
            </div>

            {/* Badges bar */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {post.sportBadge && (
                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                  {post.sportBadge}
                </span>
              )}
              {post.sourceBadge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase ${
                  post.sourceBadge.includes('AI') 
                    ? 'bg-purple-950/70 text-purple-400 border border-purple-900/50' 
                    : post.sourceBadge.includes('Vouch') 
                    ? 'bg-emerald-955/70 text-emerald-400 border border-emerald-900/50' 
                    : 'bg-slate-900 text-slate-400 border border-slate-805'
                }`}>
                  {post.sourceBadge}
                </span>
              )}
              <span className="text-[10px] text-slate-500 bg-slate-900/60 font-semibold border border-slate-850 px-1.5 py-0.2 rounded font-mono">
                {post.postType.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggle Follow/Tail & more menu buttons */}
        <div className="flex items-center gap-2">
          {showFollowAction && (
            <button
              onClick={handleFollowToggle}
              className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all flex items-center gap-1 ${
                isFollowing
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'
                  : isProTarget
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-widest hover:scale-[1.03] active:scale-95'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 border border-sky-900/45 hover:border-sky-800 hover:scale-[1.03]'
              }`}
              id={`follow-tail-btn-${post.id}`}
            >
              {followButtonText}
            </button>
          )}

          <button className="text-slate-500 hover:text-slate-350 p-1 rounded-full hover:bg-slate-850 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main post text content */}
      <p className="text-slate-200 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Attached Media Render container with Hover Navigation Slides */}
      {post.mediaUrl && !post.boardConfig && (
        <div className="mb-3.5 bg-slate-950/40 rounded-xl overflow-hidden border border-slate-850 p-1 flex justify-center max-w-full relative group shadow-lg">
          {post.mediaType === 'video' ? (
            <video 
              src={post.mediaUrl} 
              controls 
              muted 
              playsInline
              className="max-h-[380px] w-full object-contain rounded-lg shadow-inner" 
            />
          ) : (
            <div className="relative w-full flex flex-col items-center">
              {/* Show active slide */}
              <img 
                src={activeSlide === 1 && post.mediaUrl2 ? post.mediaUrl2 : post.mediaUrl} 
                alt={`Attached proof slide ${activeSlide + 1}`} 
                className="max-h-[380px] w-full object-contain rounded-lg hover:scale-[1.005] transition-all duration-200 cursor-pointer shadow-inner animate-fade-in" 
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 text-slate-200 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-xl cursor-pointer z-20 flex items-center justify-center hover:scale-105"
                      title="Previous Image"
                      id={`slide-left-btn-${post.id}`}
                    >
                      <ChevronLeft className="w-5.5 h-5.5 text-sky-400" />
                    </button>
                  )}

                  {/* Right Arrow */}
                  {activeSlide === 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 text-slate-200 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-xl cursor-pointer z-20 flex items-center justify-center hover:scale-105"
                      title="Next Image"
                      id={`slide-right-btn-${post.id}`}
                    >
                      <ChevronRight className="w-5.5 h-5.5 text-sky-450" />
                    </button>
                  )}

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 flex gap-1.5 z-10 bg-slate-950/70 px-2.5 py-1 rounded-full border border-slate-800/40">
                    <span 
                      onClick={() => setActiveSlide(0)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-150 ${activeSlide === 0 ? 'bg-sky-400 scale-125 shadow-glow' : 'bg-slate-500 hover:bg-slate-350'}`}
                    />
                    <span 
                      onClick={() => setActiveSlide(1)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-155 ${activeSlide === 1 ? 'bg-sky-450 scale-125 shadow-glow' : 'bg-slate-500 hover:bg-slate-350'}`}
                    />
                  </div>

                  {/* Page indicator tag (e.g. 1/2, 2/2) */}
                  <div className="absolute top-3 right-3 bg-slate-900/90 text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-800/60 z-10">
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
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0b0f19] border border-sky-500/30 text-sky-400 rounded-full text-[10px] font-black tracking-wide shadow-2xl z-50 animate-bounce flex items-center gap-1.5">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Twitter Poll Render */}
      {localPoll && (
        <div className="mb-3.5 bg-[#080c14]/80 border border-slate-850/80 rounded-xl p-3.5 space-y-3 font-sans text-xs text-left animate-slide-up">
          <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
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
                    <div className="w-full flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-850/40 rounded-lg relative overflow-hidden">
                      {/* Animated Percentage background fill */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 ${hasVotedThis ? 'bg-sky-500/10' : 'bg-slate-800/15'} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="font-semibold text-slate-300 z-10 flex items-center gap-1.5">
                        {opt.text}
                        {hasVotedThis && (
                          <span className="text-[9px] bg-sky-950 font-extrabold text-sky-455 px-1.5 py-0.2 rounded-full border border-sky-900/60 flex items-center gap-0.5">
                            ✓ Your Vote
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-black text-slate-200 z-10">{percentage}%</span>
                    </div>
                  ) : (
                    // Active voting mode button
                    <button
                      type="button"
                      onClick={() => handleVote(idx)}
                      className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-sky-400 hover:text-sky-300 font-bold rounded-lg text-xs transition-all hover:translate-x-0.5"
                    >
                      {opt.text}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono pt-1">
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

      {/* 4. Social interaction reaction bar */}
      <div className="flex items-center justify-between pt-3 mt-1.5 border-t border-slate-850 text-slate-400 text-xs relative select-none">
        {/* Comment icon button */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`group flex items-center gap-1.5 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-950/20 ${
            showComments ? 'text-sky-450 font-bold' : ''
          }`}
          title="Toggle comments"
          id={`comment-btn-${post.id}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="font-mono">{post.commentsCount}</span>
        </button>

        {/* Repost button with dropdown Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowRepostMenu(!showRepostMenu)}
            className={`flex items-center gap-1.5 hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-indigo-950/20 ${
              post.isReposted ? 'text-indigo-400 font-bold' : ''
            }`}
            title="Repost options"
            id={`repost-btn-${post.id}`}
          >
            <Repeat2 className={`w-4 h-4 ${post.isReposted ? 'rotate-180 transition-transform duration-300' : ''}`} />
            <span className="font-mono">{post.repostsCount}</span>
          </button>

          {showRepostMenu && (
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-36 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-xl p-1.5 z-40 animate-slide-up">
              <button
                onClick={() => {
                  onRepost(post.id);
                  setShowRepostMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-slate-900 rounded-lg text-slate-300 hover:text-slate-100 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Repeat2 className="w-3.5 h-3.5 text-indigo-455" />
                <span>{post.isReposted ? 'Undo Repost' : 'Repost'}</span>
              </button>
              <button
                onClick={() => {
                  setShowRepostMenu(false);
                  setShowQuoteModal(true);
                }}
                className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-slate-900 rounded-lg text-slate-300 hover:text-slate-100 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Quote className="w-3.5 h-3.5 text-sky-455" />
                <span>Quote Vouch</span>
              </button>
            </div>
          )}
        </div>

        {/* Like button */}
        <button 
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-950/20 ${
            post.isLiked ? 'text-rose-500 font-bold' : ''
          }`}
          title="Like"
          id={`like-btn-${post.id}`}
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-500 text-rose-500 animate-pulse' : ''}`} />
          <span className="font-mono">{post.likesCount}</span>
        </button>

        {/* Vouch / Zap Action */}
        <button 
          onClick={() => onVouchAction(post.id)}
          className={`flex items-center gap-1.5 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-amber-950/20 ${
            post.isVouched ? 'text-amber-400 font-semibold' : ''
          }`}
          title="Vouch / Tail pick"
          id={`vouch-action-btn-${post.id}`}
        >
          <Zap className={`w-4 h-4 ${post.isVouched ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span className="font-mono font-bold">Vouch</span>
          <span className="font-mono text-[10px] text-slate-500">({post.vouchesCount})</span>
        </button>

        {/* Simulated Views indicator */}
        <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px] select-none" title="Views">
          <Eye className="w-3.5 h-3.5" />
          <span>{simulatedViews}</span>
        </div>

        {/* Bookmark button */}
        <button
          onClick={handleBookmarkToggle}
          className={`p-1.5 rounded-lg hover:bg-slate-950/40 transition-colors ${
            isBookmarked ? 'text-sky-400' : 'text-slate-500 hover:text-slate-350'
          }`}
          title="Bookmark"
        >
          {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-sky-400 text-sky-400" /> : <Bookmark className="w-4 h-4" />}
        </button>

        {/* Share Copy button */}
        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-lg hover:bg-slate-950/40 text-slate-500 hover:text-slate-350 transition-colors"
          title="Copy Link to Clipboard"
        >
          <Share className="w-4 h-4" />
        </button>

        {/* Share to X button */}
        {(() => {
          const bodyText = post.vouch 
            ? `Backed ${post.vouch.playerOrTeam} - ${post.vouch.market} (${post.vouch.odds})`
            : post.content;
          const tweetText = `Just verified a sports vouch on VouchEdge! 🎯\n\n"${bodyText.substring(0, 110)}${bodyText.length > 110 ? '...' : ''}"\n\nCheck it out here:`;
          const tweetUrl = `${window.location.origin}/post/${post.id}`;
          const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
          return (
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-slate-950/40 text-slate-500 hover:text-[#38bdf8] transition-colors flex items-center justify-center"
              title="Share on X (Twitter)"
              id={`share-to-x-${post.id}`}
            >
              <Twitter className="w-4 h-4 fill-current" />
            </a>
          );
        })()}
      </div>

      {/* Quote Vouch Modal overlay */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleQuoteSubmit} 
            className="w-full max-w-lg bg-[#0e131f] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-slide-up text-left"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
              <span className="font-bold text-slate-200 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-sky-400" />
                Quote Vouch Play
              </span>
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="text-slate-500 hover:text-rose-450 font-mono text-xs font-black"
              >
                [CLOSE]
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Your commentary / feedback analysis</label>
              <textarea
                placeholder="Why are you tailing/quoting this? Share your custom verified analysis..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-sky-500 transition-colors resize-none placeholder-slate-600 font-medium"
                required
              />
            </div>

            {/* Quoted play embedded preview */}
            <div className="border border-slate-850 rounded-xl p-3 bg-slate-950/50">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                <span className="font-bold text-slate-300">{post.displayName}</span>
                <span>@{post.username}</span>
              </div>
              <p className="text-slate-400 text-xs leading-normal line-clamp-2">{post.content}</p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-500 hover:bg-sky-450 rounded-xl text-xs font-bold text-white transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Quote</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Extensible Comments area */}
      {showComments && (
        <div className="mt-4 pt-3.5 border-t border-slate-850 space-y-3.5" id={`comments-expanded-${post.id}`}>
          {/* Create comment form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-center">
            <input 
              type="text" 
              placeholder="Post your reply..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-sky-500/80 transition-all font-medium placeholder-slate-500"
              required
              id={`comment-input-${post.id}`}
            />
            <button 
              type="submit" 
              className="p-2 bg-sky-500 hover:bg-sky-450 text-white rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-md active:scale-95"
              id={`comment-submit-${post.id}`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Comments list */}
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-2.5">
              {post.comments.map((comm) => (
                <div key={comm.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50 text-xs flex gap-2.5 leading-normal" id={`comment-item-${comm.id}`}>
                  <div className="w-7 h-7 bg-slate-800 rounded-full font-bold text-[11px] text-slate-400 flex items-center justify-center shrink-0">
                    {comm.displayName.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="font-bold text-slate-200">{comm.displayName}</span>
                      <span className="text-slate-500 text-[10px]">@{comm.username}</span>
                      <span className="text-slate-500 text-[9px]">• {formatTime(comm.timestamp)}</span>
                    </div>
                    <p className="text-slate-300 font-medium">{comm.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 py-1 font-mono text-center">No comments yet. Start the conversation!</p>
          )}
        </div>
      )}

      {/* 5. Custom premium tail-lock subscription upgrade modal */}
      {showUpgradeModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-indigo-950 rounded-full flex items-center justify-center border border-indigo-900/60 mb-3 animate-pulse">
            <span className="text-xl">🛡️</span>
          </div>
          
          <h4 className="font-bold text-slate-100 text-sm uppercase tracking-wide">
            Lock: Subscribe & Tail Tier Required
          </h4>
          <p className="text-[11px] text-slate-400 max-w-xs mt-1.5 leading-relaxed font-semibold">
            To subscribe and tail @{post.username}'s transparent sports plays, you must upgrade your tracking account to a Premium Partner tier first!
          </p>

          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center font-bold">
            <button
              onClick={handleInstantUpgrade}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-505 text-white font-black rounded-lg text-[10.5px] uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              💎 Instant Upgrade (Seller Pro)
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-205 border border-slate-852 rounded-lg text-[10px] font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
