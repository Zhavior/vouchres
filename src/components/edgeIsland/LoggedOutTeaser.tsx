import { Lock, ShieldCheck, Sparkles } from 'lucide-react';
import type { EdgeIslandSectionProps } from './edgeIslandTypes';

export function LoggedOutTeaser({ onSectionChange }: EdgeIslandSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.08] via-black/20 to-cyan-400/[0.06] p-4 backdrop-blur-2xl sm:p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" aria-hidden />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-vouch-emerald">
            <Sparkles className="h-3.5 w-3.5" />
            Public preview
          </div>
          <h2 className="text-lg font-black text-white sm:text-xl">
            Sign in to unlock your personal morning board.
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Preview today&apos;s public edge board now. A signed-in account adds saved slips, tracked players, personal record context, alerts, and premium lab shortcuts.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSectionChange('vouchedge_intro')}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/12 px-4 py-2.5 text-xs font-black text-vouch-emerald transition hover:border-emerald-400/50 hover:bg-emerald-400/18"
          >
            <ShieldCheck className="h-4 w-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => onSectionChange('premium')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white/75 transition hover:border-vouch-cyan/30 hover:text-white"
          >
            <Lock className="h-4 w-4" />
            Premium tools
          </button>
        </div>
      </div>
    </section>
  );
}
