import React from 'react';

type LazyChunkSkeletonProps = {
  height?: number;
  label?: string;
};

/** Stable placeholder for inline lazy chunks (graphs, panels) — prevents layout jump. */
export function LazyChunkSkeleton({ height = 320, label = 'Loading content' }: LazyChunkSkeletonProps) {
  return (
    <div
      className="ve-lazy-chunk-skeleton rounded-2xl border border-white/[0.06] bg-black/20 p-4"
      style={{ minHeight: height }}
      aria-busy="true"
      aria-label={label}
    >
      <div className="mb-3 h-3 max-w-[10rem] animate-pulse rounded bg-white/[0.06]" />
      <div
        className="animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.03]"
        style={{ minHeight: Math.max(height - 56, 120) }}
      />
    </div>
  );
}

export default LazyChunkSkeleton;
