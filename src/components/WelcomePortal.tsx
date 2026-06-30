import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Crown,
  Layers3,
  Lock,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { EDGE_PORTAL_FEATURES } from './edgePortal/edgePortalRegistry';
import './edgePortal/edgePortalTheme.css';
import {
  AMPLIFIER_SLIDES,
  PRICING_TIERS,
  THEME_CHOICES,
  WELCOME_PILLARS,
  type WelcomeThemeId,
} from './welcomePortal/welcomePortalRegistry';

type Props = {
  onSectionChange: (section: string) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

function themeRootClass(themeId: WelcomeThemeId) {
  if (themeId === 'midnight') {
    return 'from-violet-400/20 via-indigo-500/10 to-slate-950';
  }

  if (themeId === 'gold') {
    return 'from-amber-300/20 via-yellow-600/10 to-slate-950';
  }

  return 'from-cyan-300/20 via-sky-500/10 to-slate-950';
}

function saveTheme(themeId: WelcomeThemeId) {
  localStorage.setItem('vouchedge_theme_choice', themeId);
  document.documentElement.setAttribute('data-vouchedge-theme', themeId);
}

function PillarIcon({ id }: { id: string }) {
  if (id === 'vouch') return <ShieldCheck className="h-6 w-6" />;
  if (id === 'social') return <Users className="h-6 w-6" />;
  return <Layers3 className="h-6 w-6" />;
}

function accentClasses(accent: 'cyan' | 'violet' | 'amber') {
  if (accent === 'violet') {
    return {
      card: 'hover:border-violet-300/40',
      icon: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
      text: 'text-violet-200',
      glow: 'from-violet-300/20',
    };
  }

  if (accent === 'amber') {
    return {
      card: 'hover:border-amber-300/40',
      icon: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
      text: 'text-amber-200',
      glow: 'from-amber-300/20',
    };
  }

  return {
    card: 'hover:border-cyan-300/40',
    icon: 'border-cyan-300/20 ve-theme-soft-bg text-white',
    text: 'text-cyan-200',
    glow: 'from-cyan-300/20',
  };
}

function triggerEdgeIslandTransition() {
  sessionStorage.setItem("vouchedge_entering_edge_island", "true");
}

export default function WelcomePortal({ onSectionChange }: Props) {
  const [isEntering, setIsEntering] = useState(false);
  const [amplifierOpen, setAmplifierOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<WelcomeThemeId>(() => {
    const saved = localStorage.getItem('vouchedge_theme_choice') as WelcomeThemeId | null;
    return saved || 'ocean';
  });
  const [themeMorphing, setThemeMorphing] = useState(false);

  const topFeatures = useMemo(
    () => EDGE_PORTAL_FEATURES.filter((feature) => feature.enabled !== false).sort((a, b) => a.priority - b.priority).slice(0, 6),
    []
  );

  const currentSlide = AMPLIFIER_SLIDES[slideIndex];
  const isThemeStep = slideIndex >= AMPLIFIER_SLIDES.length;

  function chooseTheme(themeId: WelcomeThemeId) {
    if (themeId === selectedTheme) return;

    setThemeMorphing(true);
    setSelectedTheme(themeId);
    saveTheme(themeId);

    window.setTimeout(() => {
      setThemeMorphing(false);
    }, 720);
  }

  function enterApp(section = 'feed') {
    if (isEntering) return;
    saveTheme(selectedTheme);
    setIsEntering(true);

    window.setTimeout(() => {
      triggerEdgeIslandTransition();
    onSectionChange(section);
    }, 620);
  }

  function startAmplifier() {
    setAmplifierOpen(true);
    setSlideIndex(0);
  }

  function nextAmplifier() {
    if (slideIndex < AMPLIFIER_SLIDES.length) {
      setSlideIndex((value) => value + 1);
      return;
    }

    enterApp('feed');
  }

  function openPillar(section: string) {
    setAmplifierOpen(true);
    const matchingIndex = AMPLIFIER_SLIDES.findIndex((slide) => slide.section === section);
    setSlideIndex(matchingIndex >= 0 ? matchingIndex : 0);
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key="welcome-funnel"
        initial={{ opacity: 1, scale: 1, y: 0 }}
        animate={
          isEntering
            ? { opacity: 0, scale: 0.965, y: -28, filter: 'blur(10px)' }
            : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
        }
        exit={{ opacity: 0, scale: 0.965, y: -28, filter: 'blur(10px)' }}
        transition={{ duration: 0.58, ease }}
        data-vouchedge-theme={selectedTheme}
        className="ve-theme-transition min-h-screen overflow-hidden bg-slate-950 text-white"
      >
        {isEntering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.46, ease }}
              className="rounded-[2rem] border border-cyan-300/20 bg-slate-950/90 px-6 py-5 text-center shadow-2xl shadow-cyan-950/40"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg text-white">
                <Waves className="h-6 w-6" />
              </div>
              <div className="text-sm font-black text-white">Opening Open Edge</div>
              <div className="mt-1 text-xs text-slate-500">Your Open Edge is becoming the command layer.</div>
            </motion.div>
          </motion.div>
        )}

        {themeMorphing && (
          <motion.div
            key={`theme-morph-${selectedTheme}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: [0, 0.72, 0], scale: [0.98, 1.015, 1.04] }}
            transition={{ duration: 0.72, ease }}
            className="pointer-events-none fixed inset-0 z-[70]"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 40%, var(--ve-welcome-soft), transparent 28%), radial-gradient(circle at 50% 100%, var(--ve-welcome-hero-1), transparent 38%)',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-[46vh] bg-gradient-to-t from-[var(--ve-welcome-accent)]/20 to-transparent blur-2xl" />
          </motion.div>
        )}

        <div className="pointer-events-none fixed inset-0">
          <div
            className="absolute inset-0 ve-theme-transition"
            style={{
              background:
                'radial-gradient(circle at 15% 10%, var(--ve-welcome-hero-1), transparent 28%), radial-gradient(circle at 80% 8%, var(--ve-welcome-hero-2), transparent 30%), linear-gradient(180deg, #020617 0%, #050816 45%, #020617 100%)',
            }}
          />
          <div className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(148,163,184,0.38)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-cyan-950/20 to-transparent" />
        </div>

        <header className="relative z-10 border-b border-white/[0.06] bg-slate-950/50 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <button onClick={() => enterApp('feed')} className="group flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/25 ve-theme-soft-bg text-white shadow-lg shadow-cyan-950/30">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_30%)]" />
                <span className="relative text-sm font-black">VE</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white">
                  Vouch<span className="ve-theme-accent-text">Edge</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Edge Command Center</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button onClick={() => enterApp('feed')} className="hidden rounded-xl px-3 py-2 text-xs font-bold text-slate-300 transition hover:text-white sm:inline-flex">
                Sign in
              </button>
              <button
                onClick={startAmplifier}
                className="rounded-xl ve-theme-accent-bg px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Vouch · Social · Research
              <span className="ml-1 rounded-full border ve-theme-border px-2 py-0.5 ve-theme-accent-text">
                {selectedTheme === 'ocean' ? 'Ocean Edge' : selectedTheme === 'midnight' ? 'Midnight Pro' : 'Gold Vouch'}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05, ease }}
              className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              The only sports platform that holds{' '}
              <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                every pick accountable.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14, ease }}
              className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg"
            >
              Research the slate. Build your slip. Every pick is graded to the final box score and published to your public proof ledger — no hiding losses.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.23, ease }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <button
                onClick={startAmplifier}
                className="edge-portal-shine relative overflow-hidden rounded-2xl ve-theme-accent-bg px-6 py-3.5 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-950/30 transition hover:-translate-y-0.5"
              >
                <span className="relative flex items-center gap-2">
                  Start the Portal <ArrowRight className="h-4 w-4" />
                </span>
              </button>

              <button
                onClick={() => enterApp('daily_players')}
                className="rounded-2xl border ve-theme-border ve-theme-soft-bg px-6 py-3.5 text-sm font-black text-cyan-50 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-200/35"
              >
                Preview Daily Board
              </button>
            </motion.div>

            <div className="mt-6 grid grid-cols-3 gap-2 max-w-sm">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-center">
                <div className="text-xl font-black text-cyan-300">12k+</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Picks tracked</div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-center">
                <div className="text-xl font-black text-emerald-300">100%</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">To final score</div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-center">
                <div className="text-xl font-black text-violet-300">4.2k</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Active cappers</div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease }}
            className="relative"
          >
            <div className="absolute -inset-10 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.25rem] border ve-theme-border bg-slate-950/80 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  <Waves className="h-3.5 w-3.5" />
                  Tidal Glass Motion
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-100">
                  Live
                </span>
              </div>

              <div className="grid gap-3">
                {topFeatures.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <button
                      key={feature.id}
                      onClick={() => enterApp(feature.section)}
                      className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg text-white">
                          {Icon ? <Icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-black text-white">{feature.title}</div>
                          <div className="mt-1 truncate text-xs text-slate-500">{feature.subtitle}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-200" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-8 max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">Three product worlds</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              VouchEdge sells trust, community, and research.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              VouchEdge isn't just a picks app. It's a full research stack, a social proof layer, and a capper accountability system in one place.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {WELCOME_PILLARS.map((pillar, index) => {
              const classes = accentClasses(pillar.accent);

              return (
                <motion.button
                  key={pillar.id}
                  onClick={() => openPillar(pillar.section)}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease }}
                  className={`group relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 text-left shadow-2xl shadow-black/20 transition hover:-translate-y-1 ${classes.card}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${classes.glow} to-transparent`} />

                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-3xl border ${classes.icon}`}>
                    <PillarIcon id={pillar.id} />
                  </div>

                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${classes.text}`}>{pillar.eyebrow}</div>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{pillar.description}</p>

                  <div className="mt-5 grid gap-2">
                    {pillar.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        {bullet}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-xs font-black text-white">
                    Explore {pillar.title}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">Pricing</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Clear plans. Simple comparison.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Show users what is included, what is locked, and why Pro matters.
              </p>
            </div>
            <button onClick={startAmplifier} className="rounded-2xl border ve-theme-border ve-theme-soft-bg px-5 py-3 text-sm font-black text-white">
              Start with Free
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PRICING_TIERS.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.08, ease }}
                className={`relative overflow-hidden rounded-[2rem] border p-5 shadow-2xl shadow-black/20 ${
                  tier.id === 'edge'
                    ? 'border-cyan-300/30 bg-cyan-300/[0.08]'
                    : 'border-slate-800 bg-slate-950/70'
                }`}
              >
                {tier.badge && (
                  <div className="absolute right-4 top-4 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase text-amber-100">
                    {tier.badge}
                  </div>
                )}

                <div className="text-sm font-black text-white">{tier.name}</div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{tier.price}</span>
                  <span className="pb-1 text-xs font-bold text-slate-500">/mo</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{tier.subtitle}</p>

                <button
                  onClick={() => enterApp(tier.section)}
                  className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                    tier.id === 'edge'
                      ? 'bg-gradient-to-r from-cyan-300 to-blue-600 text-slate-950'
                      : 'border border-slate-700 bg-slate-900 text-white'
                  }`}
                >
                  {tier.cta}
                </button>

                <div className="mt-5 grid gap-2">
                  {tier.features.map((feature) => (
                    <div key={feature.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-black/20 px-3 py-2">
                      <span className={`text-xs font-bold ${feature.included ? 'text-slate-200' : 'text-slate-600'}`}>{feature.label}</span>
                      {feature.included ? (
                        <Check className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <X className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border ve-theme-border bg-gradient-to-br from-cyan-300/10 via-slate-900/80 to-slate-950 p-5 shadow-2xl shadow-cyan-950/20">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border ve-theme-border ve-theme-soft-bg text-white">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-white">AI Seat Ready</h3>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Offline-safe
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Built to plug in OpenAI, Gemini, Claude, Z.ai, or your own model later without breaking the portal.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">Theme choice</div>
                  <h3 className="mt-1 text-2xl font-black text-white">Pick your first look.</h3>
                  <p className="mt-1 text-xs font-bold ve-theme-accent-text">The portal transforms instantly as you choose.</p>
                </div>
                <Palette className="h-6 w-6 text-cyan-200" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {THEME_CHOICES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      chooseTheme(theme.id);
                    }}
                    className={`rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 ${
                      selectedTheme === theme.id
                        ? 'border-cyan-300/50 ve-theme-soft-bg'
                        : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    <div className={`mb-3 h-20 rounded-2xl bg-gradient-to-br ${theme.className}`} />
                    <div className="text-sm font-black text-white">{theme.name}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{theme.subtitle}</div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{theme.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-t border-white/[0.06] bg-slate-950/70 px-4 py-16 text-center sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Free to start · No card required
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Stop guessing. Start proving.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Your win rate, your ledger, your proof — all public by default. Build a reputation on results, not hype.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={startAmplifier}
                className="rounded-2xl ve-theme-accent-bg px-7 py-3.5 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-950/30 transition hover:-translate-y-0.5"
              >
                Build your proof ledger →
              </button>
              <button
                onClick={() => enterApp('daily_players')}
                className="rounded-2xl border ve-theme-border ve-theme-soft-bg px-7 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                Preview the board
              </button>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {amplifierOpen && (
            <motion.div
              className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/75 p-3 backdrop-blur-xl sm:items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 42, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.98 }}
                transition={{ duration: 0.48, ease }}
                className="w-full max-w-2xl overflow-hidden rounded-[2rem] border ve-theme-border bg-slate-950 text-white shadow-2xl shadow-cyan-950/40"
              >
                <div className="border-b border-slate-800 bg-gradient-to-br from-cyan-300/10 via-slate-950 to-slate-950 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                        New User Amplifier
                      </div>
                      <h3 className="mt-2 text-2xl font-black">
                        {isThemeStep ? 'Choose your theme' : currentSlide.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {isThemeStep ? 'Pick 1 of 3 premium styles before entering the app.' : currentSlide.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setAmplifierOpen(false)}
                      className="rounded-2xl border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {!isThemeStep ? (
                    <div>
                      <div className="mb-4 inline-flex rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1 text-xs font-black text-white">
                        {currentSlide.subtitle}
                      </div>

                      <div className="grid gap-2">
                        {currentSlide.bullets.map((bullet) => (
                          <div key={bullet} className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-sm font-bold text-slate-200">
                            <Check className="h-4 w-4 text-emerald-300" />
                            {bullet}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {THEME_CHOICES.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => {
                            chooseTheme(theme.id);
                          }}
                          className={`rounded-3xl border p-3 text-left transition ${
                            selectedTheme === theme.id
                              ? 'border-cyan-300/50 ve-theme-soft-bg'
                              : 'border-slate-800 bg-slate-900/60'
                          }`}
                        >
                          <div className={`mb-3 h-24 rounded-2xl bg-gradient-to-br ${theme.className}`} />
                          <div className="text-sm font-black text-white">{theme.name}</div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{theme.description}</p>
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-black text-cyan-200">
                            {selectedTheme === theme.id ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                            {selectedTheme === theme.id ? 'Selected' : 'Choose'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex gap-1.5">
                      {[...AMPLIFIER_SLIDES, { id: 'theme' }].map((item, index) => (
                        <div
                          key={item.id}
                          className={`h-1.5 rounded-full transition-all ${
                            index === slideIndex ? 'w-8 bg-cyan-300' : 'w-2 bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => enterApp('feed')}
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-black text-slate-300"
                      >
                        Skip
                      </button>
                      <button
                        onClick={nextAmplifier}
                        className="rounded-2xl ve-theme-accent-bg px-5 py-3 text-sm font-black text-slate-950"
                      >
                        {isThemeStep ? 'Enter App' : 'Next'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </AnimatePresence>
  );
}
