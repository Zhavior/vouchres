/**
 * Aurora Navigation
 * Floating glass navigation with VouchEdge logo, BETA badge, and auth entry.
 * Restrained, premium, accessible — mobile shows logo + one CTA only.
 */
interface AuroraNavProps {
  onNavigate: (section: string) => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  /** Warm the AuthModal chunk on hover/focus intent. */
  onAuthIntent: () => void;
}

export function AuroraNav({ onNavigate, onSignIn, onGetStarted, onAuthIntent }: AuroraNavProps) {
  return (
    <nav className="aurora-glass fixed top-0 left-0 right-0 z-50" aria-label="Main navigation">
      <div className="aurora-container">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo with BETA badge */}
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onNavigate('vouchedge_intro');
            }}
            className="aurora-hover aurora-button-press aurora-focus flex items-center gap-2.5 rounded-lg"
            aria-label="VouchEdge home"
          >
            <img src="/vouchedge-icon.svg" alt="" width={30} height={30} aria-hidden="true" />
            <span className="font-display hidden text-lg font-semibold text-white sm:block">
              VouchEdge
            </span>
            <span className="font-mono rounded-sm border border-[var(--aurora-gold)]/40 bg-[var(--aurora-gold)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--aurora-gold)]">
              Beta
            </span>
          </a>

          {/* Section links — desktop only */}
          <div className="hidden items-center gap-1 md:flex" role="list">
            <NavLink onClick={() => onNavigate('hr_board')}>Today</NavLink>
            <NavLink onClick={() => onNavigate('daily_players')}>Research</NavLink>
            <NavLink onClick={() => onNavigate('most_vouched')}>Track record</NavLink>
          </div>

          {/* Auth entry */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSignIn}
              onMouseEnter={onAuthIntent}
              onFocus={onAuthIntent}
              className="aurora-touch-target aurora-hover aurora-button-press aurora-focus font-ui hidden rounded-lg px-4 text-sm text-white/70 hover:text-white sm:block"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              onMouseEnter={onAuthIntent}
              onFocus={onAuthIntent}
              className="aurora-touch-target aurora-button-press aurora-focus font-ui rounded-lg bg-[var(--color-ve-ion)] px-4 text-sm font-semibold text-[var(--color-ve-obsidian)] transition-colors hover:bg-[var(--color-ve-ion)]/90"
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aurora-touch-target aurora-hover aurora-button-press aurora-focus font-ui rounded-lg px-4 text-sm text-white/70 hover:text-white"
    >
      {children}
    </button>
  );
}
