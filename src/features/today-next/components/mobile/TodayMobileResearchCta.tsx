import { ArrowRight } from 'lucide-react';

interface TodayMobileResearchCtaProps {
  remaining: number;
  onRoute: (section: string) => void;
}

/*
 * The handoff to the research terminal.
 *
 * Today used to render the whole board — a 254-row list that duplicated the HR
 * Max route and made the two surfaces answer the same question. Today now
 * answers "what should I do in the next hour"; the full board stays where it
 * belongs and this card is the door to it.
 */
export function TodayMobileResearchCta({ remaining, onRoute }: TodayMobileResearchCtaProps) {
  if (remaining <= 0) return null;

  return (
    <section className="px-4 md:hidden font-mono" aria-label="Full research board">
      <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-5 shadow-2xl space-y-2">
        <p className="font-mono text-[9px] font-medium uppercase tracking-wider text-emerald-400">
          Deep research terminal
        </p>
        <h2 className="text-base sm:text-lg font-bold leading-snug text-white font-sans">
          Explore {remaining} remaining slate bats
        </h2>
        <p className="text-xs leading-relaxed text-zinc-400 font-sans">
          Full layer breakdowns, pitcher arsenals and the ranked matrix — the whole board, not just tonight's top collisions.
        </p>
        <button
          type="button"
          onClick={() => onRoute('hr_max')}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-mono font-semibold uppercase hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
        >
          <span>Launch full research board ({remaining})</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
