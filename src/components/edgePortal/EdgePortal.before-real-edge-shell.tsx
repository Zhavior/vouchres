import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  Crown,
  Layers3,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { EDGE_PORTAL_FEATURES } from './edgePortalRegistry';
import { EDGE_AI_TOOLS } from './edgePortalAiRegistry';
import {
  AMPLIFIER_SLIDES,
  PRICING_TIERS,
  THEME_CHOICES,
  WELCOME_PILLARS,
  type WelcomeThemeId,
} from '../welcomePortal/welcomePortalRegistry';
import './edgePortalTheme.css';

type EdgePortalProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  slateLabel?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

function saveTheme(themeId: WelcomeThemeId) {
  localStorage.setItem('vouchedge_theme_choice', themeId);
  document.documentElement.setAttribute('data-vouchedge-theme', themeId);
}

function PillarIcon({ id }: { id: string }) {
  if (id === 'vouch') return <ShieldCheck className="h-5 w-5" />;
  if (id === 'social') return <Users className="h-5 w-5" />;
  return <Layers3 className="h-5 w-5" />;
}

function sectionLabel(section: string) {
  const found = EDGE_PORTAL_FEATURES.find((feature) => feature.section === section);
  return found?.title || 'Command Center';
}

export default function EdgePortal({
  activeSection,
  onSectionChange,
  slateLabel = 'Live MLB Slate',
}: EdgePortalProps) {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<WelcomeThemeId>(() => {
    const saved = localStorage.getItem('vouchedge_theme_choice') as WelcomeThemeId | null;
    return saved || 'ocean';
  });
  const [themeMorphing, setThemeMorphing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const topFeatures = useMemo(
    () =>
      EDGE_PORTAL_FEATURES.filter((feature) => feature.enabled !== false)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 6),
    []
  );

  const aiTools = useMemo(() => EDGE_AI_TOOLS.filter((tool) => tool.enabled).slice(0, 3), []);

  function chooseTheme(themeId: WelcomeThemeId) {
    if (themeId === selectedTheme) return;

    setThemeMorphing(true);
    setSelectedTheme(themeId);
    saveTheme(themeId);

    window.setTimeout(() => {
      setThemeMorphing(false);
    }, 620);
  }

  function go(section: string) {
    onSectionChange(section || 'feed');
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => closeRef.current?.focus(), 50);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="edge-portal-shine ve-theme-gradient ve-theme-glow fixed bottom-5 right-5 z-[70] overflow-hidden rounded-full px-5 py-4 text-sm font-black shadow-2xl transition hover:-translate-y-0.5"
      >
        <span className="relative flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Continue Edge
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] bg-slate-950/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Continue Edge Portal"
              data-vouchedge-theme={selectedTheme}
              initial={{ opacity: 0, y: 80, scale: 0.94 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: themeMorphing ? [1, 0.985, 1.01, 1] : 1,
              }}
              exit={{ opacity: 0, y: 80, scale: 0.96 }}
              transition={{ duration: 0.5, ease }}
              className="ve-theme-root ve-theme-transition fixed inset-x-2 bottom-2 max-h-[92vh] overflow-hidden rounded-[2rem] border border-[var(--ve-current-border)] bg-slate-950 text-white shadow-2xl shadow-black/50 md:left-1/2 md:right-auto md:w-[980px] md:-translate-x-1/2"
            >
              {themeMorphing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0] }}
                  transition={{ duration: 0.62, ease }}
                  className="pointer-events-none absolute inset-0 z-20"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 20%, var(--ve-welcome-soft), transparent 30%), radial-gradient(circle at 50% 100%, var(--ve-welcome-hero-1), transparent 40%)',
                  }}
                />
              )}

              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 12% 0%, var(--ve-welcome-hero-1), transparent 26%), radial-gradient(circle at 92% 8%, var(--ve-welcome-hero-2), transparent 28%), linear-gradient(180deg, #020617 0%, #050816 48%, #020617 100%)',
                }}
              />
              <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(148,163,184,0.5)_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="relative z-10 flex max-h-[92vh] flex-col">
                <header className="border-b border-white/[0.08] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ve-theme-accent-text">
                        <Waves className="h-3.5 w-3.5" />
                        {slateLabel}
                      </div>
                      <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                        Continue{' '}
                        <span className="ve-theme-gradient-text">Continue Edge.</span>
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        Your Continue Edge is now the inside-app command layer: Today’s Board, Vouch, Social, Research, pricing, AI Seat, and theme control.
                      </p>
                    </div>

                    <button
                      ref={closeRef}
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-slate-300 transition hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-800 bg-black/25 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      You are here
                    </div>
                    <div className="mt-1 text-sm font-black text-white">{sectionLabel(activeSection)}</div>
                  </div>
                </header>

                <div className="overflow-y-auto p-5">
                  <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                            Today’s Board
                          </div>
                          <h3 className="mt-1 text-xl font-black text-white">Transform into Today’s Edge.</h3>
                        </div>
                        <button
                          onClick={() => go('daily_players')}
                          className="ve-theme-gradient rounded-2xl px-4 py-2 text-xs font-black"
                        >
                          Open Board
                        </button>
                      </div>

                      <div className="grid gap-3">
                        {topFeatures.map((feature) => {
                          const Icon = feature.icon;

                          return (
                            <button
                              key={feature.id}
                              onClick={() => go(feature.section)}
                              className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)] hover:bg-[var(--ve-current-soft)]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                                  {Icon ? <Icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-black text-white">{feature.title}</div>
                                  <div className="mt-1 truncate text-xs text-slate-500">{feature.subtitle}</div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                            <Bot className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white">AI Seat</h3>
                            <p className="text-xs text-slate-500">Future model layer, offline-safe today.</p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {aiTools.map((tool) => (
                            <div key={tool.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-black text-white">{tool.title}</div>
                                {tool.requiresPro && <Crown className="h-3.5 w-3.5 text-amber-200" />}
                              </div>
                              <p className="mt-1 text-[11px] leading-4 text-slate-500">{tool.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                              Theme
                            </div>
                            <h3 className="text-lg font-black text-white">Transform the portal.</h3>
                          </div>
                          <Palette className="h-5 w-5 ve-theme-accent-text" />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          {THEME_CHOICES.map((theme) => (
                            <button
                              key={theme.id}
                              onClick={() => chooseTheme(theme.id)}
                              className={`rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 ${
                                selectedTheme === theme.id
                                  ? 'border-[var(--ve-current-border)] bg-[var(--ve-current-soft)]'
                                  : 'border-slate-800 bg-slate-900/60'
                              }`}
                            >
                              <div className={`mb-2 h-12 rounded-xl bg-gradient-to-br ${theme.className}`} />
                              <div className="text-xs font-black text-white">{theme.name}</div>
                              <div className="mt-1 text-[10px] text-slate-500">{theme.subtitle}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mt-4 grid gap-4 lg:grid-cols-3">
                    {WELCOME_PILLARS.map((pillar) => (
                      <button
                        key={pillar.id}
                        onClick={() => go(pillar.section)}
                        className="group rounded-[2rem] border border-slate-800 bg-slate-900/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                          <PillarIcon id={pillar.id} />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] ve-theme-accent-text">
                          {pillar.eyebrow}
                        </div>
                        <h3 className="mt-1 text-lg font-black text-white">{pillar.title}</h3>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{pillar.description}</p>
                      </button>
                    ))}
                  </section>

                  <section className="mt-4 grid gap-3 lg:grid-cols-3">
                    {PRICING_TIERS.map((tier) => (
                      <div
                        key={tier.id}
                        className={`rounded-[2rem] border p-4 ${
                          tier.id === 'edge'
                            ? 'border-[var(--ve-current-border)] bg-[var(--ve-current-soft)]'
                            : 'border-slate-800 bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-black text-white">{tier.name}</div>
                          {tier.badge && (
                            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-100">
                              {tier.badge}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-2xl font-black text-white">{tier.price}<span className="text-xs text-slate-500">/mo</span></div>
                        <p className="mt-1 text-xs text-slate-500">{tier.subtitle}</p>

                        <div className="mt-3 grid gap-1.5">
                          {tier.features.slice(0, 4).map((feature) => (
                            <div key={feature.label} className="flex items-center gap-2 text-[11px] font-bold">
                              <Check className={`h-3.5 w-3.5 ${feature.included ? 'text-emerald-300' : 'text-slate-700'}`} />
                              <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>{feature.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className="mt-4 rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                      Feature amplifier
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {AMPLIFIER_SLIDES.map((slide) => (
                        <button
                          key={slide.id}
                          onClick={() => go(slide.section)}
                          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-[var(--ve-current-border)]"
                        >
                          <div className="text-sm font-black text-white">{slide.title}</div>
                          <div className="mt-1 text-xs font-bold ve-theme-accent-text">{slide.subtitle}</div>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{slide.description}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
