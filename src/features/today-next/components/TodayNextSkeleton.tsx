import React from 'react';

/**
 * High-contrast neobrutalist skeleton layout fallback.
 * Mirrors the command desk's 12-column tactical geometry so the swap to live data
 * causes zero layout shift.
 */
export function TodayNextSkeleton() {
  return (
    <main
      className="today-next relative z-10 min-h-screen min-w-0 flex-1 overscroll-none font-mono text-white"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Sticky Header Skeleton */}
      <div className="sticky top-0 z-30 space-y-3 border-b-2 border-white/15 bg-black/85 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 bg-[#00FF87] animate-pulse" />
            <div className="space-y-1">
              <div className="tn-skeleton h-4 w-48" />
              <div className="tn-skeleton h-2.5 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="tn-skeleton h-8 w-28" />
            <div className="tn-skeleton h-8 w-16" />
          </div>
        </div>

        {/* Vitals rail skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-2 border-white/15 bg-[#0A0D0E]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 sm:p-4 space-y-2 border-r border-white/10 last:border-r-0">
              <div className="tn-skeleton h-3 w-16" />
              <div className="tn-skeleton h-6 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Skeleton */}
      <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 py-6 sm:px-8">
        {/* Hero Intel Callout Skeleton */}
        <div className="border-2 border-white/15 bg-[#131B1E] p-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-8">
              <div className="tn-skeleton h-4 w-40" />
              <div className="tn-skeleton h-8 w-3/4" />
              <div className="tn-skeleton h-4 w-full" />
              <div className="tn-skeleton h-11 w-52 mt-4" />
            </div>
            <div className="lg:col-span-4">
              <div className="tn-skeleton h-36 w-full border border-white/10" />
            </div>
          </div>
        </div>

        {/* Tactical Intel Wire Skeleton */}
        <div className="border-2 border-white/15 bg-[#131B1E] p-5 space-y-4">
          <div className="tn-skeleton h-4 w-48" />
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="tn-skeleton h-56 lg:col-span-7" />
            <div className="space-y-2.5 lg:col-span-5">
              <div className="tn-skeleton h-16 w-full" />
              <div className="tn-skeleton h-16 w-full" />
              <div className="tn-skeleton h-16 w-full" />
            </div>
          </div>
        </div>

        {/* Primary Research Command Desk Skeleton */}
        <div className="border-2 border-white/15 bg-[#131B1E] h-[440px]">
          <div className="tn-skeleton h-full w-full" />
        </div>

        {/* Quick Table & Open Slip Skeleton */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="border-2 border-white/15 bg-[#131B1E] p-4 lg:col-span-7 h-[280px]">
            <div className="tn-skeleton h-full w-full" />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <div className="border-2 border-white/15 bg-[#131B1E] p-4 h-[130px]">
              <div className="tn-skeleton h-full w-full" />
            </div>
            <div className="border-2 border-white/15 bg-[#131B1E] p-4 h-[130px]">
              <div className="tn-skeleton h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
