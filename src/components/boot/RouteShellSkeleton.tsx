import React, { useEffect, useState } from 'react';

/** Delayed fallback: fast cached chunks transition without flashing a skeleton. */
export default function RouteShellSkeleton({ delayMs = 140 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (visible) return;
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, visible]);

  if (!visible) {
    return <div className="ve-route-suspense-fallback" aria-hidden="true" />;
  }

  return (
    <div
      className="ve-route-suspense-fallback px-4 py-6 md:px-6"
      aria-busy="true"
      aria-label="Loading view"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-8 max-w-xs flex-1 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="mb-4 h-4 max-w-sm animate-pulse rounded bg-white/[0.04]" />
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
