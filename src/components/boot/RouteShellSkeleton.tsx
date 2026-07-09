import React from 'react';

/** Stable Suspense fallback — avoids blank flashes during lazy route loads. */
export default function RouteShellSkeleton() {
  return (
    <div
      className="ve-route-suspense-fallback px-4 py-6 md:px-6"
      aria-busy="true"
      aria-label="Loading view"
    >
      <div className="mb-6 h-8 max-w-xs animate-pulse rounded bg-white/[0.06]" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded border border-white/[0.06] bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}
