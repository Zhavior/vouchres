/**
 * Aurora How It Works Section
 * Three steps, restrained. No icon soup — numbers set in Geist Mono.
 */
const STEPS = [
  {
    number: '01',
    title: 'Research the slate',
    copy: 'Open the board. Compare power, pitcher risk, park context, and lineup status in one place.',
  },
  {
    number: '02',
    title: 'Weigh the evidence',
    copy: 'Read the reasoning behind each score. Decide what you actually believe.',
  },
  {
    number: '03',
    title: 'Track the record',
    copy: 'Save your calls. The ledger keeps the results — good and bad.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="relative bg-[var(--color-ve-obsidian)] px-4 py-20">
      <div className="aurora-container max-w-5xl">
        <div className="mb-12 max-w-xl">
          <p className="font-mono mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-ve-ion)]">
            How it works
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Decisions, not guesses.
          </h2>
        </div>

        <div className="aurora-stagger grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="aurora-slide-up aurora-surface-2 rounded-xl border border-white/5 p-6"
            >
              <p className="font-mono mb-4 text-2xl font-semibold text-[var(--color-ve-ion)]/60">
                {step.number}
              </p>
              <h3 className="font-display mb-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="font-ui text-sm leading-relaxed text-white/50">{step.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
