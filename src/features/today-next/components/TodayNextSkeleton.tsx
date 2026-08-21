import React from 'react';

/**
 * TodayNextSkeleton — Zero-CLS Loading Skeleton for the Today Command Desk.
 * Accurately mirrors both the desktop 12-column tactical geometry and the
 * mobile single-column telemetry ladder to ensure zero layout shift when
 * live data arrives.
 */
export function TodayNextSkeleton() {
  return (
    <div
      className="today-next relative z-10 min-h-screen min-w-0 flex-1 overscroll-none font-mono text-white"
      aria-busy="true"
      aria-live="polite"
    >
      {/* ============================================================
         DESKTOP SKELETON (md:block)
         ============================================================ */}
      <div className="hidden md:block">
        {/* Pinned HUD Telemetry Top Bar Skeleton */}
        <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3 backdrop-blur-xl sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="space-y-1">
                <div className="tn-skeleton h-4 w-56" />
                <div className="tn-skeleton h-2.5 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="tn-skeleton h-7 w-28 rounded-md" />
              <div className="tn-skeleton h-7 w-32 rounded-md" />
              <div className="tn-skeleton h-7 w-20 rounded-md" />
              <div className="tn-skeleton h-7 w-20 rounded-md" />
            </div>
          </div>
        </header>

        {/* Main 12-Column Tactical Canvas Skeleton */}
        <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 py-6 sm:px-8">
          {/* 0. Summary Vitals Rail Skeleton (5 Obsidian Cards) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#111113] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between h-[104px]"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="tn-skeleton h-3 w-20" />
                  <div className="tn-skeleton h-3.5 w-12 rounded" />
                </div>
                <div className="tn-skeleton h-7 sm:h-8 w-14 mt-1" />
              </div>
            ))}
          </div>

          {/* 1. Hero Intel Callout Skeleton */}
          <div className="border border-white/[0.08] bg-[#111113] p-6 font-mono space-y-4 rounded-xl shadow-2xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
              <div className="min-w-0 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="tn-skeleton h-6 w-48 rounded-md" />
                  <div className="tn-skeleton h-6 w-32 rounded-md" />
                </div>
                <div className="tn-skeleton h-8 sm:h-9 w-3/4" />
                <div className="space-y-1.5 max-w-2xl">
                  <div className="tn-skeleton h-4 w-full" />
                  <div className="tn-skeleton h-4 w-2/3" />
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <div className="tn-skeleton h-10 w-52 rounded-lg" />
                  <div className="tn-skeleton h-10 w-40 rounded-lg" />
                </div>
              </div>
              <div className="w-full">
                <div className="border border-white/[0.08] bg-[#111113] p-4 space-y-3 rounded-lg shadow-md">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <div className="tn-skeleton h-3 w-28" />
                    <div className="tn-skeleton h-4 w-16 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="tn-skeleton h-3 w-32" />
                    <div className="tn-skeleton h-9 w-44" />
                  </div>
                  <div className="tn-skeleton h-20 w-full rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Curated MLB Tactical Intel Wire Skeleton */}
          <div className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 font-mono rounded-xl shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <div className="tn-skeleton h-4 w-56" />
              </div>
              <div className="tn-skeleton h-5 w-32 rounded" />
            </div>
            <div className="grid gap-4 lg:grid-cols-12 items-stretch">
              <div className="tn-skeleton h-72 rounded-lg lg:col-span-7" />
              <div className="flex flex-col justify-between gap-2.5 lg:col-span-5">
                <div className="tn-skeleton h-[80px] rounded-lg" />
                <div className="tn-skeleton h-[80px] rounded-lg" />
                <div className="tn-skeleton h-[80px] rounded-lg" />
              </div>
            </div>
          </div>

          {/* 3. Primary Research Command Desk Skeleton */}
          <div className="border border-white/[0.08] bg-[#111113] overflow-hidden font-mono shadow-2xl rounded-xl">
            <div className="border-b border-white/[0.08] bg-[#0A0A0C] px-4 sm:px-5 py-2.5 flex items-center justify-between">
              <div className="tn-skeleton h-4 w-48" />
              <div className="flex gap-2">
                <div className="tn-skeleton h-5 w-16 rounded" />
                <div className="tn-skeleton h-5 w-16 rounded" />
              </div>
            </div>
            <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
              <div className="p-4 sm:p-5 space-y-4 min-h-[380px]">
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <div className="tn-skeleton h-3 w-40" />
                  <div className="tn-skeleton h-4 w-20 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="space-y-1.5">
                    <div className="tn-skeleton h-3 w-28" />
                    <div className="tn-skeleton h-7 w-48" />
                  </div>
                  <div className="tn-skeleton h-14 w-20 rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="tn-skeleton h-12 rounded" />
                  <div className="tn-skeleton h-12 rounded" />
                  <div className="tn-skeleton h-12 rounded" />
                </div>
                <div className="tn-skeleton h-24 rounded-lg" />
              </div>
              <div className="p-4 space-y-3 bg-[#0A0A0C]">
                <div className="flex justify-between pb-2 border-b border-white/[0.08]">
                  <div className="tn-skeleton h-3 w-32" />
                  <div className="tn-skeleton h-5 w-24 rounded" />
                </div>
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="tn-skeleton h-14 w-full rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* 4. Signal Quick Table & Open Slip Skeleton */}
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <div className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 rounded-xl shadow-xl space-y-3 lg:col-span-7">
              <div className="flex justify-between border-b border-white/[0.06] pb-2.5">
                <div className="tn-skeleton h-4 w-52" />
                <div className="tn-skeleton h-4 w-24" />
              </div>
              {[0, 1, 2, 3, 4].map((k) => (
                <div key={k} className="tn-skeleton h-14 w-full rounded-lg" />
              ))}
            </div>
            <div className="space-y-4 lg:col-span-5">
              <div className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 space-y-3 rounded-xl shadow-lg">
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <div className="tn-skeleton h-3 w-28" />
                  <div className="tn-skeleton h-3 w-20" />
                </div>
                <div className="tn-skeleton h-5 w-40" />
                <div className="tn-skeleton h-3 w-full" />
                <div className="tn-skeleton h-9 w-36 rounded-lg" />
              </div>
              <div className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 space-y-3 rounded-xl shadow-lg">
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <div className="tn-skeleton h-3 w-36" />
                  <div className="tn-skeleton h-3 w-24" />
                </div>
                <div className="tn-skeleton h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
         MOBILE SKELETON (md:hidden)
         ============================================================ */}
      <div className="pt-[52px] pb-[100px] md:hidden font-mono text-white min-h-screen px-3 space-y-4">
        {/* Sticky Mobile Top Chrome Skeleton */}
        <div className="fixed top-0 inset-x-0 z-30 border-b border-white/[0.08] bg-[#050505]/95 px-3 py-2.5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="tn-skeleton h-3.5 w-32" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="tn-skeleton h-6 w-16 rounded-md" />
              <div className="tn-skeleton h-6 w-16 rounded-md" />
            </div>
          </div>
        </div>

        {/* Mobile Hero Intel Brief Skeleton */}
        <div className="border border-white/[0.08] bg-[#111113] p-4 space-y-3 rounded-xl shadow-2xl mt-3">
          <div className="flex items-center justify-between">
            <div className="tn-skeleton h-5 w-36 rounded-md" />
            <div className="tn-skeleton h-4 w-20" />
          </div>
          <div className="tn-skeleton h-6 w-3/4" />
          <div className="tn-skeleton h-3.5 w-full" />
          <div className="tn-skeleton h-11 w-full rounded-lg mt-2" />
        </div>

        {/* Mobile Spotlight Dossier Deck Skeleton */}
        <div className="border border-white/[0.08] bg-[#111113] p-3.5 space-y-2.5 rounded-xl shadow-md">
          <div className="flex justify-between">
            <div className="tn-skeleton h-3 w-28" />
            <div className="tn-skeleton h-3 w-16" />
          </div>
          <div className="tn-skeleton h-28 w-full rounded-lg" />
        </div>

        {/* Mobile Daily Slate Queue Carousel Skeleton */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="tn-skeleton h-3 w-36" />
            <div className="tn-skeleton h-3 w-20" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            <div className="w-[72vw] max-w-[260px] shrink-0 border border-white/[0.08] bg-[#111113] p-3.5 h-36 rounded-xl" />
            <div className="w-[72vw] max-w-[260px] shrink-0 border border-white/[0.08] bg-[#111113] p-3.5 h-36 rounded-xl" />
          </div>
        </div>

        {/* Mobile Tactical Intel Wire Skeleton */}
        <div className="border border-white/[0.08] bg-[#111113] p-3.5 space-y-2.5 rounded-xl shadow-md">
          <div className="tn-skeleton h-3.5 w-40" />
          <div className="tn-skeleton h-24 w-full rounded-lg" />
          <div className="tn-skeleton h-16 w-full rounded-lg" />
        </div>

        {/* Floating Action Hub Skeleton (Fixed bottom bar) */}
        <aside
          aria-label="Loading action hub"
          className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-2 rounded-2xl border border-white/[0.12] bg-[#111113]/95 p-2 backdrop-blur-xl shadow-2xl"
        >
          <div className="tn-skeleton h-11 flex-1 rounded-xl" />
          <div className="tn-skeleton h-11 w-11 rounded-xl" />
        </aside>
      </div>
    </div>
  );
}

export default TodayNextSkeleton;
