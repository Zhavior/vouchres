import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  ChevronRight,
  FlaskConical,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Users,
} from '../components/landing/LandingIcons';
import {
  Z8_CYAN_HEX,
  Z8_INTERACTIVE,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PANEL_PREMIUM,
  Z8_BTN_TERMINAL_HEADER_LOGIN,
  Z8_BTN_TERMINAL_HEADER_SIGNUP,
} from '../components/landing/LandingTokens';
import LandingLiveGamesCenter from '../components/landing/LandingLiveGamesCenter';
import LandingFeatureSlideshow from '../components/landing/LandingFeatureSlideshow';
import LandingJudgesDeck from '../components/landing/LandingJudgesDeck';
import LandingStatusTicker from '../components/landing/LandingStatusTicker';
import '../styles/public-landing.css';
import '../styles/legacy/welcome-layout.css';
import '../components/landing/LandingMobileShell.css';

type SignupPlan = 'free' | 'pro' | 'capper';

const AuthModal = lazy(() => import('../components/auth/AuthModal'));
const preloadAuthModal = () => {
  void import('../components/auth/AuthModal');
};

const pricingPlans: Array<{
  id: SignupPlan;
  name: string;
  price: string;
  descriptor: string;
  bullets: string[];
  featured?: boolean;
}> = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    descriptor: 'Start the terminal',
    bullets: ['Public ledger', 'Daily slate preview', 'Community vouch actions'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19.99 USD',
    descriptor: 'Research command',
    bullets: ['All Pro Labs', 'Signal graphs', 'Verified profile tools'],
    featured: true,
  },
  {
    id: 'capper',
    name: 'Capper',
    price: '$34.99 USD',
    descriptor: 'Monetize proof',
    bullets: ['Everything in Pro', 'Subscriber club tools', 'Creator storefront'],
  },
];

const FEATURES = [
  {
    icon: BarChart3,
    eyebrow: 'HR Board',
    title: 'Verified home run intelligence',
    copy: 'Trust-first HR board with confirmed lineups only. Projected previews are clearly labeled — never sold as confirmed.',
    route: 'hr_board',
  },
  {
    icon: LayoutGrid,
    eyebrow: 'Edge Island',
    title: 'Your command center',
    copy: 'Live slate navigation, matchup context, and edge signals in one obsidian workspace — built for speed on game day.',
    route: 'island',
  },
  {
    icon: FlaskConical,
    eyebrow: 'AI Edge Lab',
    title: 'Judge-powered research room',
    copy: 'Four AI judges rank today\'s pool with parlay-ready legs, trust scores, and honest availability checks.',
    route: 'mlb_intelligence',
  },
  {
    icon: Users,
    eyebrow: 'Daily Players',
    title: 'Slate-wide player research',
    copy: 'Deep player cards, headshots, and stat context across the full daily player pool — live when signed in.',
    route: 'daily_players',
  },
] as const;

const TRUST_PILLARS = [
  { label: 'No Hype', detail: 'No inflated edges' },
  { label: 'Truth', detail: 'Verified lineups only' },
  { label: 'Research', detail: 'Judge-backed reads' },
  { label: 'Play', detail: 'Prove your record' },
] as const;

function JudgesPlaceholder() {
  return (
    <section
      className={`ve-judges-placeholder rounded-2xl ${Z8_PANEL_PREMIUM} p-6 text-center`}
      aria-label="AI Judge Council preview"
    >
      <p className={`${Z8_LABEL} text-vouch-cyan`}>AI Judge Council</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Four judges on standby</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/45">
        Interactive judge profiles load as you scroll — hover or click each AI to explore.
      </p>
      <div className="mx-auto mt-6 flex max-w-md justify-center gap-2" aria-hidden="true">
        {['DS', 'PH', 'MR', 'RA'].map((code) => (
          <div key={code} className="h-12 w-12 rounded-xl border border-white/10 bg-black/30" />
        ))}
      </div>
    </section>
  );
}

function AuthModalFallback() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <div className={`w-full max-w-sm rounded-2xl ${Z8_PANEL_PREMIUM} p-6 text-center`}>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-vouch-cyan" />
        <p className={`${Z8_LABEL} mt-4 text-vouch-cyan`}>Opening secure access</p>
      </div>
    </div>
  );
}

function DeferredLandingJudgesDeck() {
  const [ready, setReady] = useState(false);
  const markerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const marker = markerRef.current;

    if (!marker || !('IntersectionObserver' in window)) {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '360px 0px' },
    );

    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  if (!ready) {
    return (
      <div ref={markerRef}>
        <JudgesPlaceholder />
      </div>
    );
  }

  return <LandingJudgesDeck />;
}

function PricingGrid({
  onSelectPlan,
  onPlanIntent,
}: {
  onSelectPlan: (plan: SignupPlan) => void;
  onPlanIntent: () => void;
}) {
  return (
    <section className={`rounded-2xl ${Z8_PANEL_PREMIUM} p-5 sm:p-6`}>
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className={`${Z8_LABEL} text-vouch-cyan`}>Beta Pricing</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Terminal Access</h2>
        </div>
        <p className="max-w-sm font-mono text-[10px] uppercase leading-relaxed text-white/35">
          Early VouchEdge pricing in USD. No fake trials, no bait-and-switch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelectPlan(plan.id)}
            onFocus={onPlanIntent}
            onMouseEnter={onPlanIntent}
            className={`group flex min-h-[190px] flex-col justify-between rounded-xl border p-4 text-left ${Z8_INTERACTIVE} ${
              plan.featured
                ? 'border-vouch-cyan/50 bg-vouch-cyan/10 shadow-[0_0_24px_rgba(0,240,255,0.12)]'
                : 'border-white/10 bg-black/30 hover:border-vouch-cyan/40'
            }`}
          >
            <span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">{plan.descriptor}</span>
              <span className="mt-1 block text-lg font-black uppercase text-white">{plan.name}</span>
              <span
                className={
                  plan.featured
                    ? 'mt-3 block text-2xl font-black text-vouch-cyan'
                    : 'mt-3 block text-2xl font-black text-white'
                }
              >
                {plan.price}
              </span>
            </span>
            <span className="mt-4 space-y-1.5">
              {plan.bullets.map((bullet) => (
                <span key={bullet} className="block font-mono text-[10px] uppercase tracking-wide text-white/45">
                  / {bullet}
                </span>
              ))}
            </span>
            <span className="mt-4 flex items-center gap-1 border-t border-white/10 pt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan group-hover:text-white">
              Select {plan.name}
              <ChevronRight size={12} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function VouchEdgeTerminalPage({ onAuthed }: { onAuthed?: () => void }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authPlan, setAuthPlan] = useState<SignupPlan>('free');

  const openSignup = (plan: SignupPlan = 'free') => {
    preloadAuthModal();
    setAuthMode('signup');
    setAuthPlan(plan);
    setAuthOpen(true);
  };

  const openLogin = () => {
    preloadAuthModal();
    setAuthMode('login');
    setAuthPlan('free');
    setAuthOpen(true);
  };

  return (
    <>
      <LandingStatusTicker position="top" />
      <LandingStatusTicker />

      <main className={`ve-terminal-page ${Z8_PAGE} relative min-h-screen overflow-x-hidden pb-28 lg:pb-32`}>
        {/* Ambient obsidian glow */}
        <div
          className="pointer-events-none absolute left-[-10%] top-0 h-full w-[80%] opacity-50"
          style={{
            background: `radial-gradient(circle at 30% 20%, rgba(0,240,255,0.14), transparent 32%), linear-gradient(135deg, rgba(255,255,255,0.04), transparent 42%)`,
          }}
        />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full opacity-30 blur-3xl max-md:opacity-15"
          style={{ background: `radial-gradient(circle, rgba(0,255,148,0.12), transparent 70%)` }}
        />
        <div className="ve-terminal-scanlines pointer-events-none absolute inset-0 z-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:100%_4px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-black via-black/95 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-none px-3 py-4 sm:max-w-6xl sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <header className="ve-terminal-header ve-terminal-sticky-header flex items-center justify-between gap-3 md:mb-6 md:justify-end">
            <div className="flex min-w-0 items-center gap-2.5 md:hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vouch-cyan/25 bg-vouch-cyan/10">
                <Activity size={16} className="text-vouch-cyan" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-tight text-white">
                  VouchEdge<span className="text-vouch-cyan">.Terminal</span>
                </p>
                <p className="truncate font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                  MLB · Trust First
                </p>
              </div>
            </div>
            <div
              className={`ve-terminal-header-actions shrink-0 items-center gap-2 md:fixed md:right-6 md:top-9 md:z-20 ${authOpen ? 'pointer-events-none opacity-0' : ''}`}
            >
              <button
                type="button"
                onClick={openLogin}
                onFocus={preloadAuthModal}
                onMouseEnter={preloadAuthModal}
                className={Z8_BTN_TERMINAL_HEADER_LOGIN}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openSignup('free')}
                onFocus={preloadAuthModal}
                onMouseEnter={preloadAuthModal}
                className={Z8_BTN_TERMINAL_HEADER_SIGNUP}
              >
                Sign Up
              </button>
            </div>
          </header>

          <div className="space-y-8 sm:space-y-16 md:space-y-20">
            <section className="ve-terminal-hero mx-auto flex w-full max-w-none flex-col items-stretch space-y-5 text-center sm:max-w-5xl sm:items-center sm:space-y-8">
              <div className="ve-terminal-hero-badge mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-vouch-cyan/20 bg-vouch-cyan/8 px-3 py-1.5 sm:px-4 sm:py-1.5">
                <ShieldCheck size={13} className="shrink-0 text-vouch-cyan" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-vouch-cyan/90 sm:text-[10px] sm:tracking-widest">
                  Verified HR Board · AI Judges
                </span>
              </div>

              <h1 className="text-[1.75rem] font-black leading-[1.08] tracking-tight text-white sm:text-5xl sm:leading-[1.05] sm:tracking-tighter lg:text-6xl">
                MLB edge research with{' '}
                <span className="bg-gradient-to-r from-vouch-cyan to-vouch-emerald bg-clip-text text-transparent">
                  pristine
                </span>{' '}
                intelligence.
              </h1>

              <p className="ve-terminal-hero-lead mx-auto max-w-md px-1 sm:max-w-2xl sm:text-base">
                Trust-first HR boards, four AI judges, and honest slate data — no fake lineups or inflated edges.
              </p>

              <div className="ve-terminal-trust-strip px-0.5">
                {TRUST_PILLARS.map((pillar) => (
                  <div key={pillar.label} className="ve-terminal-trust-strip-item">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-vouch-cyan">
                      {pillar.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-white/40">{pillar.detail}</p>
                  </div>
                ))}
              </div>

              <div className="ve-terminal-trust-grid grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
                {TRUST_PILLARS.map((pillar) => (
                  <div key={pillar.label} className="bg-black/40 px-3 py-4 text-center backdrop-blur-sm">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-vouch-cyan">
                      {pillar.label}
                    </p>
                    <p className="mt-1 text-[10px] text-white/35">{pillar.detail}</p>
                  </div>
                ))}
              </div>

              <div className="ve-terminal-cta-row flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <button
                  type="button"
                  onClick={() => openSignup('free')}
                  onFocus={preloadAuthModal}
                  onMouseEnter={preloadAuthModal}
                  className={`ve-terminal-cta-primary flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-vouch-cyan/55 bg-vouch-cyan/10 font-mono text-[11px] font-bold uppercase tracking-widest text-vouch-cyan shadow-[0_0_24px_rgba(0,240,255,0.1)] ${Z8_INTERACTIVE} hover:border-vouch-cyan hover:bg-vouch-cyan hover:text-black sm:h-14 sm:max-w-[220px]`}
                >
                  <Sparkles size={14} />
                  Enter the Edge
                </button>

                <div className="ve-terminal-cta-secondary-row">
                  <button
                    type="button"
                    onClick={openLogin}
                    className="text-white/55 transition hover:text-white"
                  >
                    Sign in
                  </button>
                  <span className="text-white/15" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => openSignup('pro')}
                    className="text-vouch-emerald/80 transition hover:text-vouch-emerald"
                  >
                    Explore Pro
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openLogin}
                  onFocus={preloadAuthModal}
                  onMouseEnter={preloadAuthModal}
                  className={`ve-terminal-cta-desktop-only hidden h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/30 font-mono text-[11px] font-bold uppercase tracking-widest text-white/70 sm:flex sm:max-w-[220px] ${Z8_INTERACTIVE} hover:border-vouch-cyan/40 hover:text-white`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openSignup('pro')}
                  onFocus={preloadAuthModal}
                  onMouseEnter={preloadAuthModal}
                  className={`ve-terminal-cta-desktop-only hidden h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-vouch-emerald/35 bg-vouch-emerald/8 font-mono text-[11px] font-bold uppercase tracking-widest text-vouch-emerald sm:flex sm:max-w-[220px] ${Z8_INTERACTIVE} hover:border-vouch-emerald/60`}
                >
                  Explore Pro
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>

            <LandingLiveGamesCenter />

            {/* 4 Judges */}
            <DeferredLandingJudgesDeck />

            {/* Platform strengths slideshow */}
            <LandingFeatureSlideshow features={FEATURES} />

            {/* Pricing */}
            <PricingGrid onSelectPlan={openSignup} onPlanIntent={preloadAuthModal} />

            {/* Footer CTA */}
            <section
              className={`rounded-2xl ${Z8_PANEL_PREMIUM} p-8 text-center`}
              style={{ boxShadow: `0 0 48px rgba(0,240,255,0.06)` }}
            >
              <p className={`${Z8_LABEL} text-vouch-cyan`}>Ready when you are</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Command the board. Prove your edge.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-white/45">
                Sign in to load today&apos;s verified HR board, judge picks, and live slate intelligence.
              </p>
              <button
                type="button"
                onClick={() => openSignup('free')}
                onFocus={preloadAuthModal}
                onMouseEnter={preloadAuthModal}
                className={`mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-vouch-cyan/55 bg-vouch-cyan px-8 font-mono text-[11px] font-bold uppercase tracking-widest text-black shadow-[0_0_32px_rgba(0,240,255,0.2)] ${Z8_INTERACTIVE}`}
                style={{ ['--tw-shadow-color' as string]: Z8_CYAN_HEX }}
              >
                Enter the Edge
                <ChevronRight size={14} />
              </button>
            </section>
          </div>
        </div>
      </main>

      {authOpen && (
        <Suspense fallback={<AuthModalFallback />}>
          <AuthModal
            open={authOpen}
            initialMode={authMode}
            initialPlan={authPlan}
            onClose={() => setAuthOpen(false)}
            onAuthed={() => {
              setAuthOpen(false);
              onAuthed?.();
            }}
            onGuest={() => setAuthOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
