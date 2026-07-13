import React from 'react';
import { ArrowLeft, MessageSquare, X } from 'lucide-react';
import type { FeedPost } from '../../types';
import ProfileAvatarBorder from '../../components/profile/ProfileAvatarBorder';
import CommentThread from './CommentThread';

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recent' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PostThreadModal({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/75 p-0 backdrop-blur-sm sm:p-6">
      <section className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden bg-[var(--ve-glass-modal)] shadow-2xl sm:h-[min(760px,92vh)] sm:rounded-3xl sm:border sm:border-white/10">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Post
          </button>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/55 hover:bg-white/[0.06] hover:text-white" aria-label="Close post">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <article className="border-b border-white/10 px-4 py-5 sm:px-6">
            <div className="flex gap-3">
              <ProfileAvatarBorder
                avatarUrl={post.avatarUrl}
                displayName={post.displayName}
                initials={post.displayName.split(' ').map((part) => part[0]).join('')}
                size="md"
                isVerified={post.isVerified}
              />
              <div className="min-w-0">
                <p className="font-bold text-white">{post.displayName}</p>
                <p className="text-sm text-white/45">@{post.username}</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[17px] leading-relaxed text-white">{post.content}</p>
            {post.mediaType === 'audio' && post.mediaUrl && (
              <audio className="mt-4 w-full" controls src={post.mediaUrl} preload="metadata" />
            )}
            <p className="mt-4 border-b border-white/[0.07] pb-4 text-sm text-white/45">{formatTimestamp(post.timestamp)}</p>
            <div className="mt-3 flex items-center gap-5 text-sm text-white/60">
              <span>{post.likesCount} likes</span>
              <span>{post.commentsCount} replies</span>
              <span>{post.viewsCount ?? 0} views</span>
            </div>
          </article>

          <div className="px-4 py-4 sm:px-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <MessageSquare className="h-4 w-4 text-vouch-cyan" />
              Conversation
            </div>
            <CommentThread post={post} open autoFocus onCountChange={() => undefined} />
          </div>
        </div>
      </section>
    </div>
  );
}
