import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Reply, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  LogIn, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../lib/useAuth';
import { useProfileStore } from '../../../stores/profileStore';
import { 
  getCommentsForArticle, 
  addCommentToArticle, 
  toggleCommentLike, 
  countArticleComments,
  type NewsComment 
} from '../services/newsCommentStorage';

interface NewsDiscussionThreadProps {
  articleId: string;
  articleTitle: string;
  onRequireAuth?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsDiscussionThread({
  articleId,
  articleTitle,
  onRequireAuth,
}: NewsDiscussionThreadProps) {
  const { user } = useAuth();
  const profile = useProfileStore((state) => state.profile);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<NewsComment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [updateNonce, setUpdateNonce] = useState(0);

  const comments = useMemo(() => {
    return getCommentsForArticle(articleId);
  }, [articleId, updateNonce]);

  const totalCount = useMemo(() => {
    return countArticleComments(articleId);
  }, [articleId, updateNonce]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    const text = commentText.trim();
    if (!text) return;

    addCommentToArticle(articleId, {
      articleId,
      userId: user.id || 'anonymous',
      username: profile?.displayName?.toLowerCase().replace(/\s+/g, '_') || 'vouch_pro',
      displayName: profile?.displayName || 'VouchEdge Analyst',
      avatarUrl: profile?.avatarUrl,
      userRole: profile?.subscriptionTier || 'PRO_MEMBER',
      verified: Boolean(profile?.verified || profile?.isAdmin),
      content: text,
      parentId: null,
    });

    setCommentText('');
    setUpdateNonce((n) => n + 1);
  };

  const handlePostReply = (parentId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    const text = replyText.trim();
    if (!text) return;

    addCommentToArticle(articleId, {
      articleId,
      userId: user.id || 'anonymous',
      username: profile?.displayName?.toLowerCase().replace(/\s+/g, '_') || 'vouch_pro',
      displayName: profile?.displayName || 'VouchEdge Analyst',
      avatarUrl: profile?.avatarUrl,
      userRole: profile?.subscriptionTier || 'PRO_MEMBER',
      verified: Boolean(profile?.verified || profile?.isAdmin),
      content: text,
      parentId,
    });

    setReplyText('');
    setReplyTarget(null);
    setUpdateNonce((n) => n + 1);
  };

  const handleLike = (commentId: string) => {
    toggleCommentLike(articleId, commentId);
    setUpdateNonce((n) => n + 1);
  };

  return (
    <section 
      className="mt-8 border-t border-white/[0.10] pt-6 font-mono"
      aria-label="Discussion and Analyst Community"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-sans">
            Analyst Discussion &amp; Intel Feedback ({totalCount})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-300 rounded uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE PEER AUDIT
          </span>
        </div>
      </div>

      {/* Main Comment Input Box */}
      <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#111113] p-4 shadow-xl">
        {user ? (
          <form onSubmit={handlePostComment} className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white">{profile?.displayName || 'You'}</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                [{profile?.subscriptionTier || 'VERIFIED ANALYST'}]
              </span>
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Share quantitative insight or verify thesis for "${articleTitle.slice(0, 45)}..."`}
              rows={3}
              className="w-full resize-none rounded-lg border border-white/[0.10] bg-[#0A0A0C] p-3 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 font-sans"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-zinc-500 font-mono">
                Markdown syntax supported · Respect quantitative audit standards
              </span>
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2 text-xs font-bold uppercase text-black transition hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.3)]"
              >
                <Send className="h-3 w-3" />
                <span>POST INSIGHT</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase text-white font-mono">
                  Sign In to Join Peer Verification
                </h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Post breakdown notes, challenge statcast models, and engage directly with Boyd R. Santos &amp; analysts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRequireAuth ? onRequireAuth() : window.location.assign('/login')}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase text-black hover:bg-zinc-200 transition cursor-pointer shadow-md"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>LOG IN TO COMMENT</span>
            </button>
          </div>
        )}
      </div>

      {/* Comment List Stream */}
      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#111113]/50 p-8 text-center">
            <MessageSquare className="mx-auto h-6 w-6 text-zinc-600 mb-2" />
            <p className="text-xs font-bold uppercase text-zinc-400 font-mono">
              No Analyst Comments Yet
            </p>
            <p className="text-[11px] text-zinc-500 font-sans mt-1">
              Be the first to submit a peer audit or tactical reaction to this dispatch.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id}
              className="rounded-xl border border-white/[0.08] bg-[#111113] p-4 space-y-3 shadow-md"
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 border border-white/10 text-xs font-bold text-emerald-400">
                    {comment.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-white font-sans">
                        {comment.displayName}
                      </strong>
                      {comment.verified && (
                        <span title="Verified Creator/Analyst">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-zinc-400 border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.2 rounded">
                        @{comment.username}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {comment.userRole} · {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => handleLike(comment.id)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono transition cursor-pointer ${
                    comment.likedByMe
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                      : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Heart className={`h-3 w-3 ${comment.likedByMe ? 'fill-current' : ''}`} />
                  <span className="tabular-nums font-bold">{comment.likes}</span>
                </button>
              </div>

              {/* Comment Content */}
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans pl-1 border-l-2 border-emerald-500/30">
                {comment.content}
              </p>

              {/* Reply Trigger */}
              <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-zinc-400">
                <button
                  type="button"
                  onClick={() => setReplyTarget(replyTarget?.id === comment.id ? null : comment)}
                  className="flex items-center gap-1 hover:text-emerald-300 transition cursor-pointer"
                >
                  <Reply className="h-3 w-3" />
                  <span>REPLY</span>
                </button>
              </div>

              {/* Inline Reply Input */}
              {replyTarget?.id === comment.id && (
                <div className="mt-3 pl-4 border-l-2 border-white/10 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to @${comment.username}...`}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-[#0A0A0C] p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-400/50 font-sans"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setReplyTarget(null); setReplyText(''); }}
                      className="px-2.5 py-1 text-[10px] uppercase font-mono text-zinc-400 hover:text-white"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="rounded bg-emerald-400 px-3 py-1 text-[10px] font-bold uppercase text-black hover:bg-emerald-300 disabled:opacity-40"
                    >
                      SEND REPLY
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-2.5 pl-4 sm:pl-6 border-l-2 border-white/[0.08]">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="rounded-lg border border-white/[0.06] bg-[#0E0E10] p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-white font-sans">{reply.displayName}</strong>
                          {reply.verified && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          <span className="text-[9px] font-mono text-zinc-500">{timeAgo(reply.createdAt)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLike(reply.id)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border ${
                            reply.likedByMe
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                              : 'border-white/[0.06] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Heart className={`h-2.5 w-2.5 ${reply.likedByMe ? 'fill-current' : ''}`} />
                          <span>{reply.likes}</span>
                        </button>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
