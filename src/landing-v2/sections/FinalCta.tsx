/**
 * Aurora Final CTA + Footer
 * Closing invitation and the legal footer. Short, confident, human.
 */
interface FinalCtaProps {
  onGetStarted: () => void;
  onAuthIntent: () => void;
}

export function FinalCta({ onGetStarted, onAuthIntent }: FinalCtaProps) {
  return (
    <section className="relative bg-[var(--color-ve-graphite)] px-4 pt-20 pb-10">
      <div className="aurora-container max-w-3xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Today&apos;s board is ready.
        </h2>
        <p className="font-ui mx-auto mt-3 max-w-md text-white/60">
          Start with the free board. No credit card required.
        </p>
        <button
          type="button"
          onClick={onGetStarted}
          onMouseEnter={onAuthIntent}
          onFocus={onAuthIntent}
          className="aurora-button-press aurora-focus aurora-touch-target font-ui mt-8 inline-flex items-center justify-center rounded-lg bg-[var(--color-ve-ion)] px-8 py-4 font-semibold text-[var(--color-ve-obsidian)] transition-colors hover:bg-[var(--color-ve-ion)]/90"
        >
          Create a free account
        </button>
      </div>

      {/* Footer */}
      <footer className="aurora-container mt-20 border-t border-white/5 pt-8 pb-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img src="/vouchedge-icon.svg" alt="" width={22} height={22} aria-hidden="true" />
            <span className="font-ui text-sm text-white/50">
              VouchEdge · MLB research, trust first
            </span>
          </div>
          <nav className="font-ui flex items-center gap-6 text-sm text-white/50" aria-label="Legal">
            <a href="/terms" className="aurora-focus rounded transition-colors hover:text-white">
              Terms
            </a>
            <a href="/privacy" className="aurora-focus rounded transition-colors hover:text-white">
              Privacy
            </a>
          </nav>
        </div>
        <p className="font-ui mt-6 text-center text-xs leading-relaxed text-white/30 sm:text-left">
          VouchEdge is a research tool, not a sportsbook. No wagers are placed here. You must be of
          legal age in your jurisdiction.
        </p>
      </footer>
    </section>
  );
}
