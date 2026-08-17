import { Sparkles } from 'lucide-react';
import { AuroraMaxCommandHeader } from '../../../components/aurora-max/AuroraMaxPrimitives';

/*
 * One skeleton, one shimmer, one paint.
 * Mirrors the command desk's geometry so the swap to real data causes no
 * layout shift and nothing arrives in visible pieces.
 */
export function TodayNextSkeleton() {
  return (
    <main className="today-next relative z-10 min-h-screen min-w-0 flex-1 overscroll-none" aria-busy="true" aria-live="polite">
      <div className="sticky top-0 z-30 space-y-3 border-b border-white/5 bg-ve-obsidian/95 px-4 py-4 backdrop-blur-md sm:px-8">
        {/* Same Aurora Max command header as the loaded desk, so the identity
            block is already in place and does not shift when data lands. */}
        <AuroraMaxCommandHeader
          compact
          eyebrow={
            <span className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Aurora Max
            </span>
          }
          title="TodayNext Terminal"
          description="v1.0 Command · Syncing sources"
          meta={
            <div className="flex items-center gap-2">
              <div className="tn-skeleton h-7 w-36 rounded" />
              <div className="tn-skeleton h-7 w-20 rounded-lg" />
              <div className="tn-skeleton h-7 w-28 rounded-lg" />
            </div>
          }
        />
        <div className="tn-skeleton h-[58px] rounded-xl" />
      </div>

      <div className="mx-auto w-full max-w-[1240px] space-y-5 px-4 py-5 sm:px-8 sm:py-6">
        <div className="tn-skeleton h-[212px] rounded-2xl" />

        <div>
          <div className="tn-skeleton mb-2.5 h-3 w-36 rounded" />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="tn-skeleton h-[124px] rounded-xl" />
            ))}
          </div>
        </div>

        {/* Research Command Desk */}
        <div className="tn-skeleton h-[420px]" />

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="tn-skeleton mb-2.5 h-3 w-40 rounded" />
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="tn-skeleton h-[74px] rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div className="tn-skeleton h-[152px] rounded-2xl" />
            <div className="tn-skeleton h-[168px] rounded-2xl" />
          </div>
        </div>

        <div>
          <div className="tn-skeleton mb-2.5 h-3 w-28 rounded" />
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="tn-skeleton h-[84px] rounded-xl" />
            ))}
          </div>
        </div>

        <div className="tn-skeleton h-[104px] rounded-2xl" />
      </div>
    </main>
  );
}
