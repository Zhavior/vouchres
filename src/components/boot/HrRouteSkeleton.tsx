import React from 'react';
import { AURORA_PAGE, AURORA_PAGE_PAD_X, AURORA_PAGE_PAD_Y } from '../../theme/auroraTokens';

/**
 * Route fallback shaped like Home Run Intelligence.
 *
 * The generic route shell is a three-card panel, so swapping it for the HR page
 * redrew the whole column and read as the screen loading twice. This mirrors the
 * page's own container, header block and four tier columns, so the real page
 * fills the same frame in place instead of replacing a different-looking one.
 *
 * Deliberately standalone: importing the page's skeleton would pull the page
 * chunk it is meant to be waiting on.
 */
/** Same footprint as a player card: avatar, name lines, matchup strip, action row. */
function PlayerCardHold() {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-white/10 bg-black/35 p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-3/4 animate-pulse bg-white/[0.08]" />
          <div className="h-2.5 w-1/2 animate-pulse bg-white/[0.06]" />
        </div>
        <div className="h-9 w-12 shrink-0 animate-pulse bg-white/[0.07]" />
      </div>
      <div className="h-9 animate-pulse rounded-xl bg-white/[0.04]" />
      <div className="grid grid-cols-[1fr_auto] gap-1.5">
        <div className="h-9 animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.05]" />
      </div>
    </div>
  );
}

export default function HrRouteSkeleton() {
  return (
    <div
      className={`${AURORA_PAGE} hr-deck min-h-0 w-full max-w-full overflow-x-hidden ${AURORA_PAGE_PAD_Y}`}
      aria-busy="true"
      aria-label="Loading Home Run Intelligence"
    >
      <div className={`mx-auto flex w-full max-w-[1720px] flex-col space-y-3 sm:space-y-4 ${AURORA_PAGE_PAD_X}`}>
        {/* Mirrors the header's headline block and four-cell slate strip so the
            board below starts at the same offset it will hold once mounted. */}
        <div className="glass-command border border-ve-fuse/40 p-4 sm:p-6">
          <div className="h-2.5 w-56 animate-pulse bg-white/[0.08]" />
          <div className="mt-5 space-y-3">
            <div className="h-7 w-[80%] animate-pulse bg-white/[0.07] sm:h-9 sm:w-[55%]" />
            <div className="h-7 w-[70%] animate-pulse bg-white/[0.07] sm:h-9 sm:w-[45%]" />
            <div className="h-7 w-[45%] animate-pulse bg-white/[0.07] sm:h-9 sm:w-[30%]" />
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 w-[65%] animate-pulse bg-white/[0.05] sm:w-[40%]" />
            <div className="h-3 w-[55%] animate-pulse bg-white/[0.05] sm:w-[34%]" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-px border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2 bg-[hsl(var(--ve-bg-deep)/0.9)] p-4">
                <div className="h-2 w-16 animate-pulse bg-white/[0.07]" />
                <div className="h-4 w-24 animate-pulse bg-white/[0.05]" />
              </div>
            ))}
          </div>
        </div>

        {/* Spotlight deck — four cards across, same grid as HrSpotlightDeck. */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-40 animate-pulse bg-white/[0.08]" />
            <div className="h-9 w-40 animate-pulse bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <PlayerCardHold key={index} />
            ))}
          </div>
        </section>

        {/* Signal grid — same breakpoints as HrSignalGrid. */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-36 animate-pulse bg-white/[0.08]" />
            <div className="h-3 w-48 animate-pulse bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <PlayerCardHold key={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
