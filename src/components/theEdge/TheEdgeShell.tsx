import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Code2,
  Eye,
  Home,
  Layers3,
  Lock,
  LogIn,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Waves,
  X,
} from 'lucide-react';
import '../edgePortal/edgePortalTheme.css';

type TheEdgeMode = 'public' | 'dashboard';
type TheEdgePresentation = 'page' | 'overlay';

type EdgeLayer =
  | 'videoIntro'
  | 'welcome'
  | 'login'
  | 'signupFeatures'
  | 'signupDetails'
  | 'membership'
  | 'welcomeBack'
  | 'dashboard';

type TheEdgeShellProps = {
  mode: TheEdgeMode;
  presentation: TheEdgePresentation;
  activeSection?: string;
  slateLabel?: string;
  onClose?: () => void;
  onSectionChange: (section: string) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

const bootLines = [
  'const edge = createPortal("The Edge");',
  'edge.layer("welcome").sell(proof, research, social);',
  'edge.auth.login(() => transform("The Island"));',
  'edge.signup.trial({ days: 14, cancelAnytime: true });',
  'edge.dashboard.mount(widgets, alerts, results);',
  'edge.ready("Enter VouchEdge when you choose");',
];

const featureCards = [
  {
    title: 'Proof Ledger',
    body: 'Save picks, grade results, and build trust with receipts.',
    icon: ShieldCheck,
  },
  {
    title: 'Today’s Board',
    body: 'Daily players, matchup context, HR board, and live slate flow.',
    icon: Waves,
  },
  {
    title: 'Social Proof',
    body: 'Follow members by proof, not hype.',
    icon: Users,
  },
];

// Route keys verified against src/App.tsx renderMainView switch cases.
const islandCards = [
  ['Today’s Board', 'today', Waves],
  ['Live Parlays', 'live_parlays', Bell],
  ['Parlay Lab', 'build', Layers3],
  ['Results Ledger', 'results', Trophy],
] as const;

export default function TheEdgeShell({
  mode,
  presentation,
  onClose,
  onSectionChange,
}: TheEdgeShellProps) {
  const [edgeLayer, setEdgeLayer] = useState<EdgeLayer>(mode === 'public' ? 'videoIntro' : 'welcomeBack');

  useEffect(() => {
    if (mode === 'dashboard') {
      setEdgeLayer('welcomeBack');
      const t = window.setTimeout(() => setEdgeLayer('dashboard'), 950);
      return () => window.clearTimeout(t);
    }
  }, [mode]);

  function enterSite(section = 'feed') {
    onSectionChange(section);
    if (presentation === 'overlay') onClose?.();
  }

  function completeAuth() {
    localStorage.setItem('vouchedge_after_auth_mode', 'island');
    setEdgeLayer('welcomeBack');
    window.setTimeout(() => setEdgeLayer('dashboard'), 950);
  }

  const shellClass =
    presentation === 'page'
      ? 'min-h-screen overflow-hidden bg-slate-950 text-white'
      : 'relative mx-auto flex h-[92vh] max-w-7xl flex-col overflow-hidden rounded-[2.2rem] border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-black/60';

  const isAuthLayer = edgeLayer === 'login' || edgeLayer === 'signupFeatures' || edgeLayer === 'signupDetails' || edgeLayer === 'membership';

  return (
    <motion.main
      className={`ve-theme-root ${shellClass}`}
      initial={{ opacity: 0, y: presentation === 'overlay' ? 60 : 0, scale: presentation === 'overlay' ? 0.96 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: presentation === 'overlay' ? 60 : 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 0%, rgba(56,189,248,.24), transparent 30%), radial-gradient(circle at 88% 8%, rgba(168,85,247,.24), transparent 30%), linear-gradient(180deg,#020617,#050816 50%,#020617)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(148,163,184,.55)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="border-b border-white/[0.08] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                {edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack' ? 'The Island' : edgeLayer === 'videoIntro' ? 'Video Sell Layer' : 'Welcome Portal'}
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
                The <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">Edge</span>
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                {edgeLayer === 'dashboard'
                  ? 'Your rich dashboard layer: widgets, notifications, saved picks, results, AI tools, and the doorway into the full VouchEdge site.'
                  : edgeLayer === 'welcomeBack'
                    ? 'Welcome back. The portal is transforming into your Island dashboard.'
                    : edgeLayer === 'videoIntro'
                      ? 'The product video layer sells the dream first. Then users enter the Welcome Portal, login, or start their trial.'
                      : 'A live code-style welcome portal. Login or sign up, then The Edge transforms into The Island.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isAuthLayer && (
                <button
                  onClick={() => setEdgeLayer('videoIntro')}
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-black text-slate-300 transition hover:text-white"
                >
                  Back
                </button>
              )}

              {(edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack') && (
                <button
                  onClick={() => enterSite('feed')}
                  className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                >
                  Enter VouchEdge Site
                </button>
              )}

              {presentation === 'overlay' && (
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-slate-300 transition hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className={presentation === 'page' ? 'flex-1 overflow-y-auto p-4 sm:p-8' : 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'}>
          <AnimatePresence mode="wait">
            {edgeLayer === 'videoIntro' && (
              <motion.section
                key="videoIntro"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -22, scale: 0.985 }}
                transition={{ duration: 0.5, ease }}
                className="mx-auto max-w-7xl space-y-5"
              >
                <section className="relative min-h-[640px] overflow-hidden rounded-[3rem] border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-black/50">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.30),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,.28),transparent_36%),linear-gradient(135deg,rgba(2,6,23,.96),rgba(15,23,42,.74))]" />
                  <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(34,211,238,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.18)_1px,transparent_1px)] [background-size:46px_46px]" />

                  <motion.div
                    className="absolute left-[8%] top-[18%] h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl"
                    animate={{ x: [0, 35, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute bottom-[12%] right-[10%] h-36 w-36 rounded-full bg-violet-400/20 blur-3xl"
                    animate={{ x: [0, -35, 0], y: [0, 22, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  <div className="relative z-10 grid min-h-[640px] gap-8 p-6 sm:p-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                        <Play className="h-3.5 w-3.5" />
                        Product video layer
                      </div>

                      <h2 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-7xl">
                        Before picks, build your{' '}
                        <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                          Edge.
                        </span>
                      </h2>

                      <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                        VouchEdge is a command world for MLB research, proof, alerts, saved parlays,
                        and member dashboards. Watch the system boot, then enter the portal.
                      </p>

                      <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {[
                          ['Proof', 'Track results and build trust.', ShieldCheck],
                          ['Research', 'Daily board and player context.', Waves],
                          ['Alerts', 'Notifications and next actions.', Bell],
                        ].map(([title, body, Icon]) => (
                          <div key={title as string} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-xl">
                            <Icon className="h-5 w-5 text-cyan-300" />
                            <div className="mt-3 text-sm font-black text-white">{title as string}</div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{body as string}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <button
                          onClick={() => setEdgeLayer('welcome')}
                          className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                        >
                          Enter Welcome Portal
                        </button>

                        <button
                          onClick={() => setEdgeLayer('signupFeatures')}
                          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
                        >
                          Start Free Trial
                        </button>

                        <button
                          onClick={() => setEdgeLayer('login')}
                          className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
                        >
                          Login
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-slate-800 bg-slate-950/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
                      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-cyan-300" />
                          <span className="text-xs font-black text-white">vouchedge.video.js</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
                        </div>
                      </div>

                      <div className="space-y-3 font-mono text-xs sm:text-sm">
                        {bootLines.map((line, index) => (
                          <motion.div
                            key={line}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.18, duration: 0.4 }}
                            className="rounded-2xl border border-slate-800 bg-black/35 p-3 text-slate-300"
                          >
                            <span className="mr-3 select-none text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                            {line}
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.15, duration: 0.4 }}
                      >
                        <div className="flex items-center gap-2 text-sm font-black text-white">
                          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                          Video complete: portal ready
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Next layer: Welcome Portal → Auth → The Island Dashboard.
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </section>
              </motion.section>
            )}

            {edgeLayer === 'welcome' && (
              <motion.section
                key="welcome"
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.45, ease }}
                className="mx-auto max-w-7xl space-y-5"
              >
                <section className="relative overflow-hidden rounded-[2.75rem] border border-cyan-300/20 bg-slate-950/70 shadow-2xl shadow-black/40">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.24),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(168,85,247,.22),transparent_32%)]" />
                  <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(34,211,238,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.18)_1px,transparent_1px)] [background-size:42px_42px]" />

                  <div className="relative z-10 grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.92fr] lg:p-8">
                    <div className="flex flex-col justify-center">
                      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                        <Code2 className="h-3.5 w-3.5" />
                        Live portal boot
                      </div>

                      <h2 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
                        Your MLB command layer is{' '}
                        <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                          booting.
                        </span>
                      </h2>

                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                        New users start in the welcome layer. Login or sign up, then this portal transforms into The Island dashboard.
                      </p>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <button
                          onClick={() => setEdgeLayer('signupFeatures')}
                          className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                        >
                          <span className="inline-flex items-center gap-2">
                            Start Free Trial
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </button>

                        <button
                          onClick={() => setEdgeLayer('login')}
                          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
                        >
                          <span className="inline-flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            Login
                          </span>
                        </button>

                        <button
                          onClick={() => enterSite('feed')}
                          className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Preview Site
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => setEdgeLayer('welcomeBack')}
                        className="mt-4 w-fit rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-xs font-black text-emerald-100 transition hover:-translate-y-0.5"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Demo Island transition
                        </span>
                      </button>
                    </div>

                    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
                      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-cyan-300" />
                          <span className="text-xs font-black text-white">edge.boot.js</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
                        </div>
                      </div>

                      <div className="font-mono text-xs leading-6 sm:text-sm">
                        {bootLines.map((line, index) => (
                          <motion.div
                            key={line}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.12, duration: 0.35 }}
                            className="flex gap-3"
                          >
                            <span className="select-none text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-slate-300">{line}</span>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
                        <div className="flex items-center gap-2 text-xs font-black text-white">
                          <Waves className="h-4 w-4 text-cyan-300" />
                          After login: Welcome Portal → The Island
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          The user stays inside The Edge until they choose to enter the full VouchEdge site.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-3 md:grid-cols-3">
                  {featureCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.title}
                        onClick={() => setEdgeLayer('signupFeatures')}
                        className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40"
                      >
                        <Icon className="h-6 w-6 text-cyan-300" />
                        <div className="mt-4 text-lg font-black text-white">{card.title}</div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{card.body}</p>
                      </button>
                    );
                  })}
                </section>
              </motion.section>
            )}

            {edgeLayer === 'login' && (
              <motion.section
                key="login"
                initial={{ opacity: 0, x: 42, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -42, scale: 0.98 }}
                transition={{ duration: 0.42, ease }}
                className="mx-auto max-w-3xl rounded-[2.5rem] border border-cyan-300/20 bg-black/30 p-6 shadow-2xl shadow-black/30"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Login Layer</div>
                <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Welcome back.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Login happens inside The Edge. After login, the welcome portal disappears and The Island dashboard appears.
                </p>

                <div className="mt-6 grid gap-3">
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Email" />
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Password" type="password" />
                </div>

                <button
                  onClick={completeAuth}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                >
                  Login → Enter The Island
                </button>
              </motion.section>
            )}

            {edgeLayer === 'signupFeatures' && (
              <motion.section
                key="signupFeatures"
                initial={{ opacity: 0, x: 42, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -42, scale: 0.98 }}
                transition={{ duration: 0.42, ease }}
                className="mx-auto max-w-6xl rounded-[2.5rem] border border-cyan-300/20 bg-black/30 p-6"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Feature Slideshow</div>
                <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">See what members unlock.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                  Start with value, then account details, then premium trial options.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {featureCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.title} className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-4">
                        <Icon className="h-6 w-6 text-cyan-300" />
                        <div className="mt-4 text-lg font-black text-white">{card.title}</div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{card.body}</p>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setEdgeLayer('signupDetails')}
                  className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                >
                  Continue to Sign Up
                </button>
              </motion.section>
            )}

            {edgeLayer === 'signupDetails' && (
              <motion.section
                key="signupDetails"
                initial={{ opacity: 0, x: 42, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -42, scale: 0.98 }}
                transition={{ duration: 0.42, ease }}
                className="mx-auto max-w-3xl rounded-[2.5rem] border border-cyan-300/20 bg-black/30 p-6"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Create Account</div>
                <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Start your Edge profile.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">Create an account to save picks, build a ledger, and personalize your Island dashboard.</p>

                <div className="mt-6 grid gap-3">
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Name" />
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Email" />
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Password" type="password" />
                </div>

                <button
                  onClick={() => setEdgeLayer('membership')}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                >
                  Continue to Trial Options
                </button>
              </motion.section>
            )}

            {edgeLayer === 'membership' && (
              <motion.section
                key="membership"
                initial={{ opacity: 0, x: 42, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -42, scale: 0.98 }}
                transition={{ duration: 0.42, ease }}
                className="mx-auto max-w-5xl rounded-[2.5rem] border border-cyan-300/20 bg-black/30 p-6"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Membership</div>
                <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Try Premium for 2 weeks.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                  Cancel anytime. If VouchEdge helps your research, continue with a membership to support the platform and unlock deeper tools.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button
                    onClick={completeAuth}
                    className="rounded-[2rem] border border-emerald-300/25 bg-emerald-300/10 p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="text-xl font-black text-white">Start 2-week trial</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Premium trial, cancel anytime, dashboard unlocks after setup.</p>
                  </button>

                  <button
                    onClick={completeAuth}
                    className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="text-xl font-black text-white">Continue Free</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Use basic features first and upgrade when the value is clear.</p>
                  </button>
                </div>
              </motion.section>
            )}

            {edgeLayer === 'welcomeBack' && (
              <motion.section
                key="welcomeBack"
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.55, ease }}
                className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-cyan-300/20 bg-black/30 p-8 text-center shadow-2xl shadow-black/30"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                  <Waves className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-4xl font-black text-white sm:text-6xl">Welcome back to The Island.</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                  Your welcome portal is becoming your rich Edge dashboard.
                </p>
                <button
                  onClick={() => setEdgeLayer('dashboard')}
                  className="mt-7 rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                >
                  Continue to Dashboard
                </button>
              </motion.section>
            )}

            {edgeLayer === 'dashboard' && (
              <motion.section
                key="dashboard"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                transition={{ duration: 0.45, ease }}
                className="mx-auto max-w-7xl space-y-5"
              >
                <section className="rounded-[2.5rem] border border-cyan-300/20 bg-black/30 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">The Island Dashboard</div>
                      <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Continue your Edge.</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                        Widgets, notifications, today’s board, saved parlays, results, and AI tools live here first.
                      </p>
                    </div>

                    <button
                      onClick={() => enterSite('feed')}
                      className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Enter VouchEdge Site
                      </span>
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {islandCards.map(([label, section, Icon]) => (
                      <button
                        key={label}
                        onClick={() => enterSite(section)}
                        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40"
                      >
                        <Icon className="h-5 w-5 text-cyan-300" />
                        <div className="mt-3 text-sm font-black text-white">{label}</div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-[2rem] border border-cyan-300/20 bg-black/25 p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Widgets</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ['Saved Parlays', '0'],
                        ['Pending Picks', '0'],
                        ['Win Rate', '—'],
                        ['Proof Score', 'Beta'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
                          <div className="mt-2 text-3xl font-black text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-cyan-300/20 bg-black/25 p-5">
                    <div className="flex items-center gap-3">
                      <Bot className="h-6 w-6 text-cyan-300" />
                      <h3 className="text-lg font-black text-white">AI Seat</h3>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {['Explain today’s board', 'Compare players', 'Build parlay logic', 'Summarize results'].map((tool) => (
                        <div key={tool} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                          <div className="text-xs font-black text-white">{tool}</div>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">Research support, not guaranteed picks.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-cyan-300/20 bg-black/25 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Theme Studio</div>
                      <h3 className="mt-1 text-2xl font-black text-white">Transform The Island.</h3>
                    </div>
                    <Palette className="h-6 w-6 text-cyan-300" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {['Ocean Edge', 'Midnight Pro', 'Gold Proof'].map((theme) => (
                      <div key={theme} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-3">
                        <div className="mb-3 h-20 rounded-2xl bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-violet-500/30" />
                        <div className="text-sm font-black text-white">{theme}</div>
                        <p className="mt-2 text-xs leading-5 text-slate-400">Premium visual mode for The Edge.</p>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}
