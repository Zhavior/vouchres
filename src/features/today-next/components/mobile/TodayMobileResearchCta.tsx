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
    <section className="px-4 md:hidden" aria-label="Full research board">
      <div className="rounded-xl border-2 border-[var(--aurora-max-emerald)]/35 bg-[var(--aurora-max-panel-strong)] p-4 shadow-[4px_4px_0_0_rgba(0,217,160,0.18)]">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--aurora-max-emerald)]">
          Deep research terminal
        </p>
        <h2 className="mt-1.5 text-[17px] font-bold leading-snug text-white">
          Explore {remaining} remaining slate bats
        </h2>
        <p className="mt-1.5 text-[13px] leading-5 text-white/50">
          Full layer breakdowns, pitcher arsenals and the ranked matrix — the whole board, not just tonight's top
          collisions.
        </p>
        <button
          type="button"
          onClick={() => onRoute('hr_max')}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--aurora-max-emerald)]/45 bg-[var(--aurora-max-emerald)]/15 text-[13px] font-bold text-[var(--aurora-max-emerald)] transition active:bg-[var(--aurora-max-emerald)]/30"
        >
          Launch full research board ({remaining})
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
