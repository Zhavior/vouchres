import React from 'react';

/** Feed stream placeholder — matches FeedPostCard footprint to avoid scroll jank. */
export function FeedPostCardSkeleton() {
  return (
    <div className="ve-feed-post-skeleton border-b border-white/[0.08] px-4 py-4" aria-hidden="true">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-14 animate-pulse rounded bg-white/[0.04]" />
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
          <div className="h-3 w-[82%] animate-pulse rounded bg-white/[0.04]" />
          <div className="mt-3 h-24 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

export default FeedPostCardSkeleton;
