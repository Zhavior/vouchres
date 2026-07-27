import { ArrowRight } from 'lucide-react';

/**
 * Aurora Hero Section
 * Cinematic stadium background with slow Ken Burns drift.
 * Left-aligned composition — dense information beside beautiful whitespace.
 * Copy follows Aurora rules: short, confident, human. No AI marketing.
 */
interface HeroProps {
  onNavigate: (section: string) => void;
  onGetStarted: () => void;
  onAuthIntent: () => void;
}

export function Hero({ onNavigate, onGetStarted, onAuthIntent }: HeroProps) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Cinematic stadium background with Ken Burns drift */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="aurora-ken-burns absolute inset-0 bg-gradient-to-br from-[var(--color-ve-graphite)] via-[var(--color-ve-storm)] to-[var(--color-ve-surface-panel)]">
          <img
            src="/stadium-hero.jpg"
            alt=""
            width={1792}
            height={1024}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
            onError={(e) => {
              // Designed gradient fallback — the parent already paints obsidian.
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        {/* Readability scrim — heavier on the copy side, fades to the field */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ve-obsidian)]/95 via-[var(--color-ve-obsidian)]/70 to-[var(--color-ve-obsidian)]/25" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--color-ve-obsidian)] to-transparent" />
      </div>

      {/* Hero content — left aligned */}
      <div className="aurora-container relative z-10 w-full pt-24 pb-16">
        <div className="aurora-stagger max-w-2xl">
          {/* Status chip */}
          <div
            className="aurora-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-ve-charged)] bg-[var(--color-ve-graphite)]/80 px-4 py-2"
            role="status"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--color-ve-voltage)]" aria-hidden="true" />
            <span className="font-mono text-xs tracking-wide text-white/80">
              Today&apos;s board is ready
            </span>
          </div>

          {/* Headline */}
          <h1 className="aurora-fade-in font-display mb-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Know the next home run.
            <br />
            <span className="text-[var(--color-ve-ion)]">Before everyone else.</span>
          </h1>

          {/* Subheadline */}
          <p className="aurora-fade-in font-ui mb-10 max-w-lg text-lg leading-relaxed text-white/70 sm:text-xl">
            Research before the first pitch. Evidence behind every score.
          </p>

          {/* CTA */}
          <div className="aurora-fade-in flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => onNavigate('hr_board')}
              className="aurora-button-press aurora-focus aurora-touch-target font-ui flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-ve-ion)] px-8 py-4 font-semibold text-[var(--color-ve-obsidian)] transition-colors hover:bg-[var(--color-ve-ion)]/90 sm:w-auto"
            >
              View today&apos;s board
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              onMouseEnter={onAuthIntent}
              onFocus={onAuthIntent}
              className="aurora-surface-1 aurora-button-press aurora-focus aurora-touch-target font-ui w-full rounded-lg px-8 py-4 font-semibold text-white transition-colors hover:bg-[var(--color-ve-storm)] sm:w-auto"
            >
              Create account
            </button>
          </div>

          {/* Grounding line */}
          <p className="aurora-fade-in font-mono mt-8 text-[11px] uppercase tracking-[0.16em] text-white/40">
            MLB official data · Free to research
          </p>
        </div>
      </div>
    </section>
  );
}
