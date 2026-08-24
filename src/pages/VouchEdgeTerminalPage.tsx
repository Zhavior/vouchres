import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/landing-v4/Navbar';
import PublicFooter from '../components/landing-v4/PublicFooter';
import { lazyWithRetry } from '../lib/lazyWithRetry';

type AuthMode = 'login' | 'signup';
type SignupPlan = 'free' | 'pro';

const AuthModal = lazyWithRetry(() => import('../components/auth/AuthModal'), { label: 'AuthModal' });

const META = 'font-mono text-[10px] uppercase tracking-[0.24em] text-white/40';
const RULE = 'border-white/[0.08]';

function authModeFromPath(): AuthMode | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  if (path === '/login' || path === '/signin') return 'login';
  if (path === '/signup' || path === '/join') return 'signup';
  return null;
}

/**
 * The access surface behind the modal.
 *
 * This route only ever renders on /login, /signin, /signup and /join, and on
 * every one of them AuthModal opens from the URL at mount — so this composition
 * is what frames the modal and what remains once it is dismissed. It replaces
 * VouchEdgeLandingV3, which was serving as a propless backdrop and was the last
 * V3 surface a visitor could reach from the public system.
 *
 * The V4 constitution at console density: obsidian ground, one display
 * statement, mono state, hairline structure, square controls. Cyan rather than
 * emerald because signing in is a true interface action, which is the semantic
 * cyan is reserved for.
 */
function AccessSurface({
  mode,
  onOpen,
}: {
  mode: AuthMode;
  onOpen: (mode: AuthMode) => void;
}) {
  /**
   * Every row is either fixed truth about this route or live component state.
   * "Command Desk" is the name PublicFooter already gives /hr-board, and
   * "Account access" is AuthModal's own kicker — the surface borrows the
   * system's vocabulary rather than inventing a phrase for itself.
   */
  const ledger = [
    { label: 'Session', value: 'Not authenticated' },
    { label: 'Mode', value: mode === 'login' ? 'Sign in' : 'Create account' },
    { label: 'Destination', value: 'Command Desk' },
  ];

  return (
    <>
      <Navbar />

      <div className="flex min-h-screen flex-col bg-black pt-16 text-white">
        <main id="main" className="flex-grow px-6 py-24 sm:py-28 lg:px-10 lg:py-32">
          <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1440px]">
            <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b ${RULE} pb-5`}>
              <span className={`${META} text-ve-cyan`}>08 / Access</span>
              <span className={META}>Terminal // Standing by</span>
            </div>

            {/*
              Deliberately not a hero. On all four auth paths the modal opens over
              this at mount, so a display statement at hero scale competed with the
              thing it exists to frame. A compact, dense panel holds the frame and
              gives the dismissed state somewhere sane to land.
            */}
            <div className="mt-14 max-w-2xl">
              <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] font-bold italic leading-[1.02] tracking-tighter text-white">
                Account <span className="text-white/25">access.</span>
              </h1>

              <p className="mt-6 font-sans text-lg font-light leading-relaxed text-white/55">
                Sign in to continue, or create an account.
              </p>

              <dl className={`mt-12 border-t ${RULE}`}>
                {ledger.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-baseline justify-between gap-6 border-b ${RULE} py-3.5`}
                  >
                    <dt className={META}>{item.label}</dt>
                    <dd className="min-w-0 text-right font-mono text-xs text-white/70">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => onOpen('login')}
                  className="group inline-flex min-h-11 items-center justify-center gap-3 bg-ve-cyan px-8 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ve-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Sign in
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => onOpen('signup')}
                  className="inline-flex min-h-11 items-center justify-center gap-3 border border-white/15 px-8 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-ve-cyan hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-cyan"
                >
                  Create account
                </button>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}

export default function VouchEdgeTerminalPage({ onAuthed }: { onAuthed?: () => void }) {
  const initialMode = authModeFromPath();
  const [authOpen, setAuthOpen] = useState(Boolean(initialMode));
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode ?? 'signup');
  // Read once at mount. Nothing sets it any more — openAuth was the only writer
  // — but keeping it in state preserves the mount-time value rather than letting
  // it track the URL on re-render, which would be a behaviour change.
  const [authPlan] = useState<SignupPlan>(initialMode === 'login' ? 'free' : 'pro');

  const syncAuthPath = useCallback(() => {
    const mode = authModeFromPath();
    setAuthOpen(Boolean(mode));
    if (mode) setAuthMode(mode);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncAuthPath);
    return () => window.removeEventListener('popstate', syncAuthPath);
  }, [syncAuthPath]);

  useLayoutEffect(() => {
    // The product shell uses #inner-view-slot as its desktop scrollport. The
    // public landing deliberately does not: its sticky chapters must resolve
    // against the document viewport. Scope that contract to this route so a
    // future shell overflow rule cannot turn a non-scrolling ancestor into the
    // sticky containing block and strand the page at one viewport.
    document.documentElement.classList.add('ve-public-landing-scroll');
    document.body.classList.add('ve-public-landing-scroll');

    return () => {
      document.documentElement.classList.remove('ve-public-landing-scroll');
      document.body.classList.remove('ve-public-landing-scroll');
    };
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    if (!authModeFromPath()) return;
    if (window.history.state?.vouchedgeAuthOverlay) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, '', '/');
  }, []);

  /**
   * Re-open the modal from the surface. Dismissing used to leave the visitor on
   * a backdrop with no way back in — closeAuth replaceStates to '/' without a
   * re-render, so the page stayed put. This only drives the existing modal
   * through the state it already had; no auth call, session handling or plan
   * resolution changed.
   */
  const openAuth = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  return (
    <>
      <AccessSurface mode={authMode} onOpen={openAuth} />

      {authOpen && (
        <Suspense fallback={null}>
          <AuthModal
            open
            initialMode={authMode}
            initialPlan={authPlan}
            onClose={closeAuth}
            onAuthed={() => {
              closeAuth();
              onAuthed?.();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
