import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Loader, MessageCircle, Trash2, X } from 'lucide-react';
import type { FeedComment, FeedPost } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import { useAuth } from '../../lib/useAuth';
import { useProfileStore } from '../../stores/profileStore';
import { INITIAL_PROFILE } from '../../data/mockData';
import {
  deletePostComment,
  fetchPostComments,
  submitPostComment,
  toggleCommentLike,
} from '../../domain/commentActions';

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function linkifyContent(text: string): React.ReactNode {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={`${part}-${index}`} className="text-vouch-cyan hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

type ReplyTarget = {
  commentId: string;
  userId: string;
  username: string;
  displayName: string;
};

interface CommentThreadProps {
  post: FeedPost;
  open: boolean;
  autoFocus?: boolean;
  onCountChange?: (count: number) => void;
}

function CommentRow({
  comment,
  depth,
  currentUserId,
  onReply,
  onLike,
  onDelete,
}: {
  comment: FeedComment;
  depth: number;
  currentUserId?: string | null;
  onReply: (target: ReplyTarget) => void;
  onLike: (comment: FeedComment) => void;
  onDelete: (comment: FeedComment) => void;
}) {
  const isOwn = Boolean(currentUserId && comment.userId === currentUserId);

  return (
    <div className="relative" id={`comment-item-${comment.id}`}>
      <div
        className="flex gap-3 py-3"
        style={{ paddingLeft: depth > 0 ? `${Math.min(depth, 2) * 16}px` : undefined }}
      >
        {depth > 0 && (
          <div
            className="absolute left-2 top-0 bottom-0 w-px bg-white/10"
            aria-hidden
          />
        )}

        <div className="shrink-0 pt-0.5">
          <ProfileAvatarBorder
            avatarUrl={comment.avatarUrl}
            displayName={comment.displayName}
            initials={comment.displayName.slice(0, 2).toUpperCase()}
            size="sm"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[13px] leading-none">
            <span className="font-bold text-white hover:underline cursor-pointer truncate">
              {comment.displayName}
            </span>
            <span className="text-white/45 truncate">@{comment.username}</span>
            <span className="text-white/35">·</span>
            <span className="text-white/45 text-[12px]">{timeAgo(comment.timestamp)}</span>
          </div>

          {comment.replyToUsername && (
            <p className="mt-1 text-[12px] text-white/45">
              Replying to{' '}
              <span className="text-vouch-cyan">@{comment.replyToUsername}</span>
            </p>
          )}

          <p className="mt-1.5 text-[15px] leading-snug text-white/85 whitespace-pre-wrap break-words">
            {linkifyContent(comment.content)}
          </p>

          <div className="mt-2 flex items-center gap-5 text-white/45">
            <button
              type="button"
              onClick={() =>
                onReply({
                  commentId: comment.id,
                  userId: comment.userId,
                  username: comment.username,
                  displayName: comment.displayName,
                })
              }
              className="group flex items-center gap-1.5 text-[12px] hover:text-vouch-cyan transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="sr-only">Reply</span>
            </button>

            <button
              type="button"
              onClick={() => onLike(comment)}
              className={`group flex items-center gap-1.5 text-[12px] transition-colors ${
                comment.isLiked ? 'text-rose-400' : 'hover:text-rose-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>

            {isOwn && (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="group flex items-center gap-1.5 text-[12px] hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          currentUserId={currentUserId}
          onReply={onReply}
          onLike={onLike}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function CommentThread({
  post,
  open,
  autoFocus = false,
  onCountChange,
}: CommentThreadProps) {
  const { user } = useAuth();
  const profile = useProfileStore((state) => state.profile) ?? INITIAL_PROFILE;
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const comments = post.comments ?? [];

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tree = await fetchPostComments(post.id);
      onCountChange?.(tree.reduce((count, node) => {
        const walk = (items: FeedComment[]): number =>
          items.reduce((acc, item) => acc + 1 + (item.replies ? walk(item.replies) : 0), 0);
        return count + walk([node]);
      }, 0));
    } catch (err: any) {
      setError(err?.message ?? 'Could not load replies.');
    } finally {
      setLoading(false);
    }
  }, [post.id, onCountChange]);

  useEffect(() => {
    if (!open) return;
    void loadComments();
  }, [open, loadComments]);

  useEffect(() => {
    if (open && autoFocus) {
      inputRef.current?.focus();
    }
  }, [open, autoFocus, replyTarget]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError('Sign in to reply.');
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) return;

    setPosting(true);
    setError(null);
    try {
      await submitPostComment({
        postId: post.id,
        body: trimmed,
        parentId: replyTarget?.commentId ?? null,
        replyToUserId: replyTarget?.userId ?? null,
      });
      setDraft('');
      setReplyTarget(null);
      await loadComments();
    } catch (err: any) {
      setError(err?.message ?? 'Could not post reply.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (comment: FeedComment) => {
    if (!user) {
      setError('Sign in to like replies.');
      return;
    }
    try {
      await toggleCommentLike({
        postId: post.id,
        commentId: comment.id,
        liked: Boolean(comment.isLiked),
      });
    } catch (err: any) {
      setError(err?.message ?? 'Could not update like.');
    }
  };

  const handleDelete = async (comment: FeedComment) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await deletePostComment({ postId: post.id, commentId: comment.id });
      await loadComments();
    } catch (err: any) {
      setError(err?.message ?? 'Could not delete reply.');
    }
  };

  const emptyCopy = useMemo(
    () => (user ? 'Be the first to reply.' : 'Sign in to join the conversation.'),
    [user],
  );

  if (!open) return null;

  return (
    <div className="mt-3 border-t border-white/10 pt-3" id={`comments-expanded-${post.id}`}>
      {replyTarget && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-vouch-cyan/20 bg-vouch-cyan/5 px-3 py-2 text-[12px] text-white/70">
          <span>
            Replying to <strong className="text-vouch-cyan">@{replyTarget.username}</strong>
          </span>
          <button
            type="button"
            onClick={() => setReplyTarget(null)}
            className="rounded-full p-1 hover:bg-white/10 text-white/45 hover:text-white"
            aria-label="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="flex gap-3 items-start">
        <div className="shrink-0 pt-1">
          <ProfileAvatarBorder
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            initials={profile.displayName.slice(0, 2).toUpperCase()}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={user ? 'Post your reply' : 'Sign in to reply'}
            rows={replyTarget ? 3 : 2}
            disabled={!user || posting}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-[15px] text-white outline-none transition-colors placeholder:text-white/35 focus:border-vouch-cyan/40 disabled:opacity-60"
            id={`comment-input-${post.id}`}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-white/35">
              {user ? 'Everyone can view this reply.' : 'Replies are public on the feed.'}
            </p>
            <button
              type="submit"
              disabled={!user || posting || !draft.trim()}
              className="rounded-full bg-vouch-cyan px-4 py-1.5 text-[13px] font-bold text-obsidian-900 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              id={`comment-submit-${post.id}`}
            >
              {posting ? 'Posting…' : 'Reply'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-[12px] text-rose-300">{error}</p>
      )}

      <div className="mt-2 divide-y divide-white/[0.06]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-white/45 text-sm">
            <Loader className="w-4 h-4 animate-spin" />
            Loading replies…
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              depth={0}
              currentUserId={user?.id ?? null}
              onReply={(target) => {
                setReplyTarget(target);
                inputRef.current?.focus();
              }}
              onLike={(item) => void handleLike(item)}
              onDelete={(item) => void handleDelete(item)}
            />
          ))
        ) : (
          <p className="py-6 text-center text-[13px] text-white/45">{emptyCopy}</p>
        )}
      </div>
    </div>
  );
}
