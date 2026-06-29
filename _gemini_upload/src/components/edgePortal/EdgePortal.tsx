import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bot,
  Check,
  Crown,
  Layers3,
  LayoutDashboard,
  Palette,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { EDGE_PORTAL_FEATURES } from './edgePortalRegistry';
import { EDGE_AI_TOOLS } from './edgePortalAiRegistry';
import {
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

type EdgeTab = 'welcome' | 'today' | 'notifications' | 'dashboard' | 'features' | 'themes';

const ease = [0.22, 1, 0.36, 1] as const;

function saveTheme(themeId: WelcomeThemeId) {
  localStorage.setItem('vouchedge_theme_choice', themeId);
  document.documentElement.setAttribute('data-vouchedge-theme', themeId);
}

function getThemeLabel(themeId: WelcomeThemeId) {
  if (themeId === 'midnight') return 'Midnight Pro';
  if (themeId === 'gold') return 'Gold Vouch';
  return 'Ocean Edge';
}

function sectionLabel(section: string) {
  const found = EDGE_PORTAL_FEATURES.find((feature) => feature.section === section);
  return found?.title || 'Dashboard';
}

function PillarIcon({ id }: { id: string }) {
  if (id === 'vouch') return <ShieldCheck className="h-5 w-5" />;
  if (id === 'social') return <Users className="h-5 w-5" />;
  return <Layers3 className="h-5 w-5" />;
}

const tabs: { id: EdgeTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'welcome', label: 'Welcome', icon: Sparkles },
  { id: 'today', label: 'Today', icon: Waves },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'features', label: 'Features', icon: Layers3 },
  { id: 'themes', label: 'Themes', icon: Palette },
];

export default function EdgePortal({
  activeSection,
  onSectionChange,
  slateLabel = 'Live MLB Slate',
}: EdgePortalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EdgeTab>('welcome');
  const [edgeStage, setEdgeStage] = useState<'storefront' | 'dashboard'>('storefront');
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
        .slice(0, 8),
    []
  );

  const aiTools = useMemo(() => EDGE_AI_TOOLS.filter((tool) => tool.enabled).slice(0, 4), []);

  function chooseTheme(themeId: WelcomeThemeId) {
    if (themeId === selectedTheme) return;

    setThemeMorphing(true);
    setSelectedTheme(themeId);
    saveTheme(themeId);

    window.setTimeout(() => setThemeMorphing(false), 650);
  }

  function go(section: string) {
    onSectionChange(section || 'feed');
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => closeRef.current?.focus(), 40);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
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
        onClick={() => {
          setOpen(true);
          setActiveTab('welcome');
          setEdgeStage('storefront');
        }}
        className="edge-portal-shine ve-theme-gradient ve-theme-glow fixed bottom-5 right-5 z-[70] overflow-hidden rounded-full px-5 py-4 text-sm font-black shadow-2xl transition hover:-translate-y-0.5"
      >
        <span className="relative flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          The Edge
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] bg-slate-950/72 p-2 backdrop-blur-xl sm:p-4"
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
              aria-label="The Edge"
              data-vouchedge-theme={selectedTheme}
              initial={{ opacity: 0, y: 74, scale: 0.94 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: themeMorphing ? [1, 0.985, 1.015, 1] : 1,
              }}
              exit={{ opacity: 0, y: 74, scale: 0.96 }}
              transition={{ duration: 0.5, ease }}
              className="ve-theme-root ve-theme-transition relative mx-auto flex h-[92vh] max-w-7xl flex-col overflow-hidden rounded-[2.2rem] border border-[var(--ve-current-border)] bg-slate-950 text-white shadow-2xl shadow-black/60"
            >
              {themeMorphing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.75, 0] }}
                  transition={{ duration: 0.65, ease }}
                  className="pointer-events-none absolute inset-0 z-30"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 20%, var(--ve-welcome-soft), transparent 30%), radial-gradient(circle at 50% 100%, var(--ve-welcome-hero-1), transparent 42%)',
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
              <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(148,163,184,0.5)_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <header className="border-b border-white/[0.08] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ve-theme-accent-text">
                        <Waves className="h-3.5 w-3.5" />
                        {slateLabel}
                      </div>
                      <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
                        The <span className="ve-theme-gradient-text">Edge</span>
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                        The Edge is the welcome portal itself. New users see Sign Up, Login, features, pricing, and themes first. Logged-in users continue into My Edge dashboard, notifications, Today’s Board, and research tools.
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

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-black/25 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Current page</div>
                      <div className="mt-1 text-sm font-black text-white">{sectionLabel(activeSection)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-black/25 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Theme</div>
                      <div className="mt-1 text-sm font-black ve-theme-accent-text">{getThemeLabel(selectedTheme)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-black/25 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</div>
                      <div className="mt-1 text-sm font-black text-emerald-300">Always available</div>
                    </div>
                  </div>
                </header>

                <nav className="border-b border-white/[0.08] px-4 py-3 sm:px-5">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id !== 'welcome') setEdgeStage('dashboard');
                          }}
                          className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black transition ${
                            active
                              ? 'border-[var(--ve-current-border)] bg-[var(--ve-current-soft)] ve-theme-accent-text'
                              : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </nav>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                  {activeTab === 'welcome' && (
                    <AnimatePresence mode="wait">
                      {edgeStage === 'storefront' ? (
                        <motion.section
                          key="edge-storefront"
                          initial={{ opacity: 0, y: 22, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -18, scale: 0.985 }}
                          transition={{ duration: 0.48, ease }}
                          className="overflow-hidden rounded-[2.2rem] border ve-theme-border bg-black/20"
                        >
                          <div
                            className="relative p-6 sm:p-8"
                            style={{
                              background:
                                'radial-gradient(circle at 15% 0%, var(--ve-welcome-hero-1), transparent 32%), radial-gradient(circle at 85% 10%, var(--ve-welcome-hero-2), transparent 34%)',
                            }}
                          >
                            <div className="inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                              <Sparkles className="h-3.5 w-3.5" />
                              First layer
                            </div>

                            <h3 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
                              This is <span className="ve-theme-gradient-text">The Edge.</span>
                            </h3>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                              The Edge starts as the premium welcome portal. Click it, and it transforms into the user dashboard with Today’s Board, notifications, research, pricing, themes, and My Edge tools.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">
                              <button
                                onClick={() => {
                                  setEdgeStage('dashboard');
                                  setActiveTab('dashboard');
                                }}
                                className="edge-portal-shine ve-theme-gradient ve-theme-glow rounded-2xl px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
                              >
                                Click me — Enter The Edge
                              </button>

                              <button
                                onClick={() => {
                                  setEdgeStage('dashboard');
                                  setActiveTab('today');
                                }}
                                className="rounded-2xl border ve-theme-border ve-theme-soft-bg px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
                              >
                                Preview Today’s Board
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-3 p-5 sm:grid-cols-3">
                            {WELCOME_PILLARS.map((pillar) => (
                              <button
                                key={pillar.id}
                                onClick={() => {
                                  setEdgeStage('dashboard');
                                  go(pillar.section);
                                }}
                                className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
                              >
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                                  <PillarIcon id={pillar.id} />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] ve-theme-accent-text">
                                  {pillar.eyebrow}
                                </div>
                                <div className="mt-1 text-lg font-black text-white">{pillar.title}</div>
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{pillar.description}</p>
                              </button>
                            ))}
                          </div>
                        </motion.section>
                      ) : (
                        <motion.section
                          key="edge-dashboard-intro"
                          initial={{ opacity: 0, y: 24, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -18, scale: 0.985 }}
                          transition={{ duration: 0.5, ease }}
                          className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
                        >
                          <section className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                                  Dashboard mode
                                </div>
                                <h3 className="mt-1 text-2xl font-black text-white">Welcome to My Edge.</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                  The storefront transformed. Now this is your operating layer.
                                </p>
                              </div>
                              <button onClick={() => setActiveTab('today')} className="ve-theme-gradient rounded-2xl px-4 py-2 text-xs font-black">
                                Today
                              </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              {WELCOME_PILLARS.map((pillar) => (
                                <button
                                  key={pillar.id}
                                  onClick={() => go(pillar.section)}
                                  className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
                                >
                                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                                    <PillarIcon id={pillar.id} />
                                  </div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] ve-theme-accent-text">{pillar.eyebrow}</div>
                                  <div className="mt-1 text-lg font-black text-white">{pillar.title}</div>
                                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{pillar.description}</p>
                                </button>
                              ))}
                            </div>
                          </section>

                          <section className="grid gap-4">
                            <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                                Quick Dashboard
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {[
                                  ['Today’s Board', 'daily_players'],
                                  ['Notifications', 'notifications'],
                                  ['My Results', 'results'],
                                  ['Parlay Lab', 'parlay_lab'],
                                ].map(([label, section]) => (
                                  <button
                                    key={label}
                                    onClick={() => go(section)}
                                    className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left text-sm font-black text-white transition hover:border-[var(--ve-current-border)]"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                                  <Bot className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-black text-white">AI Seat</h3>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Future model actions plug into The Edge without breaking the app.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </section>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  )}

                  {activeTab === 'today' && (
                    <section className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">Today’s Board</div>
                          <h3 className="mt-1 text-2xl font-black text-white">Start where the action is.</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-400">Daily players, live games, HR board, parlay lab, and results.</p>
                        </div>
                        <button onClick={() => go('daily_players')} className="ve-theme-gradient rounded-2xl px-5 py-3 text-sm font-black">
                          Open Full Board
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {topFeatures.slice(0, 8).map((feature) => {
                          const Icon = feature.icon;
                          return (
                            <button
                              key={feature.id}
                              onClick={() => go(feature.section)}
                              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
                            >
                              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                                {Icon ? <Icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                              </div>
                              <div className="text-sm font-black text-white">{feature.title}</div>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{feature.subtitle}</p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {activeTab === 'notifications' && (
                    <section className="grid gap-4 lg:grid-cols-3">
                      {[
                        ['HR Alerts', 'When a watched home run pick goes live or grades.'],
                        ['Parlay Updates', 'Saved parlays, pending tickets, and final results.'],
                        ['System Watch', 'Lineup posted, pitcher changed, weather risk, and game final.'],
                      ].map(([title, body]) => (
                        <div key={title} className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border ve-theme-border ve-theme-soft-bg ve-theme-accent-text">
                            <Bell className="h-5 w-5" />
                          </div>
                          <h3 className="text-lg font-black text-white">{title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                          <button className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs font-black text-slate-300">
                            Configure
                          </button>
                        </div>
                      ))}
                    </section>
                  )}

                  {activeTab === 'dashboard' && (
                    <section className="grid gap-4 lg:grid-cols-4">
                      {[
                        ['Saved Parlays', '0', 'Build from Parlay Lab'],
                        ['Pending Picks', '0', 'Waiting for games'],
                        ['Win Rate', '—', 'Needs graded results'],
                        ['Proof Score', 'Beta', 'Vouch profile'],
                      ].map(([title, value, detail]) => (
                        <div key={title} className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</div>
                          <div className="mt-2 text-3xl font-black text-white">{value}</div>
                          <div className="mt-1 text-xs text-slate-500">{detail}</div>
                        </div>
                      ))}

                      <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-4 lg:col-span-4">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 ve-theme-accent-text" />
                          <h3 className="text-lg font-black text-white">My Edge Dashboard</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          This area becomes the personalized logged-in dashboard: saved parlays, proof ledger,
                          notifications, profile progress, and recommended next action.
                        </p>
                      </div>
                    </section>
                  )}

                  {activeTab === 'features' && (
                    <section className="grid gap-4 lg:grid-cols-3">
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
                          <div className="mt-2 text-2xl font-black text-white">
                            {tier.price}<span className="text-xs text-slate-500">/mo</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{tier.subtitle}</p>
                          <div className="mt-3 grid gap-1.5">
                            {tier.features.map((feature) => (
                              <div key={feature.label} className="flex items-center gap-2 text-[11px] font-bold">
                                <Check className={`h-3.5 w-3.5 ${feature.included ? 'text-emerald-300' : 'text-slate-700'}`} />
                                <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>{feature.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>
                  )}

                  {activeTab === 'themes' && (
                    <section className="rounded-[2rem] border ve-theme-border bg-black/20 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">Theme Studio</div>
                          <h3 className="mt-1 text-2xl font-black text-white">Transform The Edge.</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-400">Choose a product identity: command center, research lab, or proof prestige.</p>
                        </div>
                        <Palette className="h-6 w-6 ve-theme-accent-text" />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {THEME_CHOICES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => chooseTheme(theme.id)}
                            className={`rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 ${
                              selectedTheme === theme.id
                                ? 'border-[var(--ve-current-border)] bg-[var(--ve-current-soft)]'
                                : 'border-slate-800 bg-slate-900/60'
                            }`}
                          >
                            <div className={`mb-3 h-24 rounded-2xl bg-gradient-to-br ${theme.className}`} />
                            <div className="text-sm font-black text-white">{theme.name}</div>
                            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{theme.subtitle}</div>
                            <p className="mt-2 text-xs leading-5 text-slate-400">{theme.description}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
