import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Terminal } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
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
  Z8_INTERACTIVE,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PANEL_PREMIUM,
  Z8_SURFACE,
} from '../theme/z8Tokens';

const Z8_BTN_TERMINAL_HEADER_LOGIN = `z8-control ${Z8_INTERACTIVE} border border-white/15 bg-black/30 px-4 py-2.5 font-mono text-[11px] font-bold text-white/65 transition hover:border-vouch-emerald/40 hover:text-white`;
const Z8_BTN_TERMINAL_HEADER_SIGNUP = `z8-control ${Z8_INTERACTIVE} border border-vouch-emerald/55 bg-vouch-emerald px-4 py-2.5 font-mono text-[11px] font-bold text-black transition hover:brightness-110`;

import LandingLiveGamesCenter from '../components/landing/LandingLiveGamesCenter';
import LandingFeatureSlideshow from '../components/landing/LandingFeatureSlideshow';
import LandingDeviceShowcase from '../components/landing/LandingDeviceShowcase';
import LandingStatusTicker from '../components/landing/LandingStatusTicker';
import LandingDynamicBackground from '../components/landing/LandingDynamicBackground';
import LandingFAQ from '../components/landing/LandingFAQ';
import ScrollReveal from '../components/landing/ScrollReveal';
import '../styles/public-landing.css';
import '../styles/legacy/welcome-layout.css';
import '../components/landing/LandingMobileShell.css';

type SignupPlan = 'free' | 'pro' | 'capper';

const AuthModal = lazy(() => import('../components/auth/AuthModal'));
const LandingVouchCardShowcase = lazy(() => import('../components/landing/LandingVouchCardShowcase'));
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
  { label: 'Lineups', detail: 'Official status shown' },
  { label: 'Sources', detail: 'Evidence, not hype' },
  { label: 'Reasoning', detail: 'Every score explained' },
  { label: 'Record', detail: 'Results stay visible' },
] as const;

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

function VouchCardShowcasePlaceholder() {
  return <div className={`rounded-2xl ${Z8_PANEL_PREMIUM} h-96 animate-pulse`} aria-hidden="true" />;
}

function DeferredVouchCardShowcase() {
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
        <VouchCardShowcasePlaceholder />
      </div>
    );
  }

  return (
    <Suspense fallback={<VouchCardShowcasePlaceholder />}>
      <LandingVouchCardShowcase />
    </Suspense>
  );
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

function TerminalChatDemo() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'system', text: string }[]>([
    { role: 'system', text: 'VouchEdge Terminal Ready. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const submitPrompt = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    const userMsg = prompt;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setPrompt('');
    setIsLoading(true);
    try {
      await apiClient.get<any>('/api/mlb/hr-board/today');
      setMessages(prev => [...prev, { role: 'system', text: `Fetched data from hr-board. Terminal access secured.` }]);
    } catch {
      setMessages(prev => [...prev, { role: 'system', text: 'Error connecting to Edge OS. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`mx-auto w-full max-w-2xl rounded-2xl ${Z8_PANEL_PREMIUM} p-4 mt-8 mb-8 flex flex-col gap-4 text-left border border-white/10 shadow-[0_0_48px_rgba(0,240,255,0.06)]`}>
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Terminal className="h-4 w-4 text-vouch-cyan" />
        <span className={Z8_LABEL}>AI Edge Terminal Chat</span>
      </div>
      
      {/* chat window */}
      <div className={`flex flex-col gap-3 overflow-y-auto p-4 rounded-xl h-64 ${Z8_SURFACE} ${Z8_INTERACTIVE}`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
            <span className={`${Z8_LABEL} ${m.role === 'user' ? 'text-white/40' : 'text-vouch-cyan'}`}>
              {m.role === 'user' ? 'You' : 'System'}
            </span>
            <div className={`p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-vouch-cyan/20 text-white' : 'bg-black/40 text-white/70 border border-white/5'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="self-start flex items-center gap-2 mt-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-vouch-cyan" />
            <span className="text-xs text-white/40 font-mono">Processing...</span>
          </div>
        )}
      </div>

      {/* prompt input area */}
      <form onSubmit={submitPrompt} className={`relative flex items-center gap-2 rounded-xl ${Z8_SURFACE} p-1 ${Z8_INTERACTIVE}`}>
        <input 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)}
          placeholder="Query the terminal..."
          className="flex-1 bg-transparent text-sm text-white outline-none min-h-[44px] px-3 font-mono placeholder:text-white/30"
        />
        <button 
          type="submit" 
          disabled={!prompt.trim() || isLoading}
          className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black bg-vouch-cyan rounded-lg min-h-[44px] disabled:opacity-50 transition-opacity"
        >
          Execute
        </button>
      </form>
    </section>
  );
}

export default function VouchEdgeTerminalPage({
  onAuthed,
  onGuest,
}: {
  onAuthed?: () => void;
  onGuest?: () => void;
}) {
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
      <LandingStatusTicker />

      <main className={`ve-terminal-page ${Z8_PAGE} relative min-h-screen overflow-x-hidden pb-28 lg:pb-32`}>
        <LandingDynamicBackground />
        
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
          <header className="ve-terminal-header ve-terminal-sticky-header flex items-center justify-between gap-3 md:mb-6">
            <div className="flex min-w-0 items-center gap-2.5">
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

          <div className="space-y-8 sm:space-y-16 md:space-y-20 overflow-hidden">
            <ScrollReveal animation="scale-up">
              <section className="ve-terminal-hero mx-auto flex w-full max-w-none flex-col items-stretch space-y-5 text-center sm:max-w-5xl sm:items-center sm:space-y-8">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="ve-terminal-hero-badge inline-flex items-center gap-2 rounded-full border border-vouch-cyan/20 bg-vouch-cyan/8 px-3 py-1.5 sm:px-4 sm:py-1.5">
                  <ShieldCheck size={13} className="shrink-0 text-vouch-cyan" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-vouch-cyan/90 sm:text-[10px] sm:tracking-widest">
                    MLB Official Data
                  </span>
                </div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md sm:px-4 sm:py-1.5">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/50 sm:text-[10px] sm:tracking-widest">
                    NFL <span className="text-vouch-emerald ml-1">Soon</span>
                  </span>
                </div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md sm:px-4 sm:py-1.5">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/50 sm:text-[10px] sm:tracking-widest">
                    NBA <span className="text-vouch-emerald ml-1">Soon</span>
                  </span>
                </div>
              </div>

              <h1 className="text-[1.75rem] font-black leading-[1.08] tracking-tight text-white sm:text-5xl sm:leading-[1.05] sm:tracking-tighter lg:text-6xl">
                Understand today&apos;s home run candidates{' '}
                <span className="text-vouch-emerald">before you save a pick.</span>
              </h1>

              <p className="ve-terminal-hero-lead mx-auto max-w-md px-1 sm:max-w-2xl sm:text-base">
                Compare power, pitcher risk, park context, lineup status, and model confidence in one research workflow.
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

              <div className="ve-terminal-cta-row flex w-full max-w-xl flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => openSignup('free')}
                  onFocus={preloadAuthModal}
                  onMouseEnter={preloadAuthModal}
                  className={`ve-terminal-cta-primary z8-control flex h-14 w-full max-w-[280px] items-center justify-center gap-2 border border-vouch-emerald/55 bg-vouch-emerald px-5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-black ${Z8_INTERACTIVE}`}
                >
                  <Sparkles size={14} />
                  Start researching free
                </button>
                <p className="-mt-2 text-xs text-white/45">No credit card required</p>
                <button
                  type="button"
                  onClick={openLogin}
                  onFocus={preloadAuthModal}
                  onMouseEnter={preloadAuthModal}
                  className="z8-control px-3 font-mono text-[11px] font-bold text-white/55 transition hover:text-white"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </section>
            </ScrollReveal>

            <ScrollReveal delayMs={100}>
              <LandingDeviceShowcase />
            </ScrollReveal>

            <ScrollReveal delayMs={100}>
              <LandingLiveGamesCenter />
            </ScrollReveal>

            <ScrollReveal delayMs={100}>
              <TerminalChatDemo />
            </ScrollReveal>

            <ScrollReveal>
              <LandingFeatureSlideshow features={FEATURES} />
            </ScrollReveal>

            <ScrollReveal>
              <DeferredVouchCardShowcase />
            </ScrollReveal>

            <ScrollReveal>
              <PricingGrid onSelectPlan={openSignup} onPlanIntent={preloadAuthModal} />
            </ScrollReveal>

            <ScrollReveal>
              <LandingFAQ />
            </ScrollReveal>

            <ScrollReveal>
              <section
              className={`rounded-2xl ${Z8_PANEL_PREMIUM} p-8 text-center`}
              style={{ boxShadow: `0 0 48px rgba(0,240,255,0.06)` }}
            >
              <p className={`${Z8_LABEL} text-vouch-emerald`}>Research with visible evidence</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Build a record you can verify later.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-white/45">
                Start with the free board. Upgrade only when the deeper research tools become useful to you.
              </p>
              <button
                type="button"
                onClick={() => openSignup('free')}
                onFocus={preloadAuthModal}
                onMouseEnter={preloadAuthModal}
                className={`z8-control mt-6 inline-flex h-14 items-center justify-center gap-2 border border-vouch-emerald/55 bg-vouch-emerald px-8 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-black ${Z8_INTERACTIVE}`}
              >
                Create a free account
                <ChevronRight size={14} />
              </button>
            </section>
            </ScrollReveal>
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
            onGuest={() => {
              setAuthOpen(false);
              onGuest?.();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
