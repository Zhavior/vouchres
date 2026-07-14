import React from 'react';

/** Immediate route fallback so lazy imports never render a blank content column. */
export default function RouteShellSkeleton() {
  return (
    <div
      className="ve-route-suspense-fallback mx-auto w-full max-w-[1720px] px-4 py-6 md:px-6"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="overflow-hidden border border-white/10 bg-[hsl(var(--ve-bg-deep)/0.90)] shadow-[0_18px_70px_rgba(0,0,0,0.38)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3"><div className="h-8 w-8 animate-pulse bg-vouch-cyan/10" /><div><div className="h-2 w-20 animate-pulse bg-white/10" /><div className="mt-2 h-4 w-40 animate-pulse bg-white/[0.07]" /></div></div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Opening workspace</span>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="min-h-32 animate-pulse border border-white/[0.06] bg-white/[0.025]" />)}
        </div>
      </div>
    </div>
  );
}
