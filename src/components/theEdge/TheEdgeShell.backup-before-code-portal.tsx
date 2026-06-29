import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bot,
  Check,
  Crown,
  Layers3,
  LayoutDashboard,
  LogIn,
  Palette,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { EDGE_PORTAL_FEATURES } from '../edgePortal/edgePortalRegistry';
import { EDGE_AI_TOOLS } from '../edgePortal/edgePortalAiRegistry';
import {
  PRICING_TIERS,
  THEME_CHOICES,
  WELCOME_PILLARS,
  type WelcomeThemeId,
} from '../welcomePortal/welcomePortalRegistry';
import { EdgeDashboardMemberDeck, EdgePublicSalesDeck } from './EdgeValueDeck';
import EdgeSignatureDeck from './EdgeSignatureDeck';
import '../edgePortal/edgePortalTheme.css';

type TheEdgeMode = 'public' | 'dashboard';
type TheEdgePresentation = 'page' | 'overlay';
type TheEdgeTab = 'home' | 'today' | 'alerts' | 'dashboard' | 'features' | 'themes';

type TheEdgeShellProps = {
  mode: TheEdgeMode;
  presentation: TheEdgePresentation;
  activeSection?: string;
  slateLabel?: string;
  onClose?: () => void;
  onSectionChange: (section: string) => void;
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

function sectionLabel(section?: string) {
  const found = EDGE_PORTAL_FEATURES.find((feature) => feature.section === section);
  return found?.title || 'The Edge';
}

export default function TheEdgeShell({
  mode,
  presentation,
  activeSection,
  slateLabel = 'Live MLB Slate',
  onClose,
  onSectionChange,
}: TheEdgeShellProps) {
  const [selectedTheme, setSelectedTheme] = useState<WelcomeThemeId>(() => {
    const saved = localStorage.getItem('vouchedge_theme_choice') as WelcomeThemeId | null;
    return saved || 'ocean';
  });
  const [stage, setStage] = useState<'storefront' | 'dashboard'>(mode === 'public' ? 'storefront' : 'dashboard');
  const [activeTab, setActiveTab] = useState<TheEdgeTab>('home');
  const [themeMorphing, setThemeMorphing] = useState(false);

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
    setSelectedTheme(themeId);
    saveTheme(themeId);
    setThemeMorphing(true);
    window.setTimeout(() => setThemeMorphing(false), 650);
  }

  function go(section: string) {
    onSectionChange(section);
    if (presentation === 'overlay') onClose?.();
  }

  function enterFullSite() {
    onSectionChange('feed');
    if (presentation === 'overlay') onClose?.();
  }

  function transformToDashboard(nextTab: TheEdgeTab = 'dashboard') {
    setStage('dashboard');
    setActiveTab(nextTab);
  }

  function startAuthThenReturnToIsland(authSection: 'login' | 'signup') {
    localStorage.setItem('vouchedge_after_auth_destination', 'welcome');
    localStorage.setItem('vouchedge_after_auth_mode', 'island');

    // Visually show the user what The Edge becomes after auth.
    setStage('dashboard');
    setActiveTab('home');

    window.setTimeout(() => {
      onSectionChange(authSection);
      if (presentation === 'overlay') onClose?.();
    }, 420);
  }

  const shellClass =
    presentation === 'page'
      ? 'min-h-screen overflow-hidden bg-slate-950 text-white'
      : 'relative mx-auto flex h-[92vh] max-w-7xl flex-col overflow-hidden rounded-[2.2rem] border border-[var(--ve-current-border)] bg-slate-950 text-white shadow-2xl shadow-black/60';

  return (
    <motion.main
      layoutId={presentation === 'overlay' ? 'the-edge-portal-shell' : undefined}
      data-vouchedge-theme={selectedTheme}
      className={`ve-theme-root ve-theme-transition ${shellClass}`}
      initial={{ opacity: 0, y: presentation === 'overlay' ? 72 : 0, scale: presentation === 'overlay' ? 0.96 : 1 }}
      animate={{ opacity: 1, y: 0, scale: themeMorphing ? [1, 0.985, 1.015, 1] : 1 }}
      exit={{ opacity: 0, y: presentation === 'overlay' ? 72 : 0, scale: presentation === 'overlay' ? 0.96 : 1 }}
      transition={{ duration: 0.5, ease }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 0%, var(--ve-welcome-hero-1), transparent 26%), radial-gradient(circle at 92% 8%, var(--ve-welcome-hero-2), transparent 28%), linear-gradient(180deg, #020617 0%, #050816 48%, #020617 100%)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(148,163,184,0.5)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="border-b border-white/[0.08] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border ve-theme-border ve-theme-soft-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] ve-theme-accent-text">
                <Waves className="h-3.5 w-3.5" />
                {mode === 'public' ? 'First layer' : 'The Island'}
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
                The <span className="ve-theme-gradient-text">Edge</span>
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                {mode === 'public'
                  ? 'The Edge is the welcome portal: sign up, login, product features, pricing, themes, and the first transformation into the dashboard.'
                  : 'Welcome to The Island — your logged-in Edge dashboard. Start here first, review your next actions, then choose when to enter the full VouchEdge site.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={enterFullSite}
                className="ve-theme-gradient ve-theme-glow rounded-2xl px-4 py-3 text-xs font-black transition hover:-translate-y-0.5"
              >
                Enter VouchEdge Site
              </button>

              {presentation === 'overlay' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-slate-300 transition hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {mode === 'dashboard' && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-black/25 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Current page</div>
                <div className="mt-1 text-sm font-black text-white">{sectionLabel(activeSection)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-black/25 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</div>
                <div className="mt-1 text-sm font-black text-emerald-300">Always available</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-black/25 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mode</div>
                <div className="mt-1 text-sm font-black ve-theme-accent-text">The Island Dashboard</div>
              </div>
            </div>
          )}
        </header>

        {stage === 'dashboard' && (
          <nav className="border-b border-white/[0.08] px-4 py-3 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                ['home', 'Home', Sparkles],
                ['today', 'Today', Waves],
                ['alerts', 'Alerts', Bell],
                ['dashboard', 'Dashboard', LayoutDashboard],
                ['features', 'Features', Layers3],
                ['themes', 'Themes', Palette],
              ].map(([id, label, Icon]) => {
                const active = activeTab === id;
                return (
                  <button
                    key={String(id)}
                    type="button"
                    onClick={() => setActiveTab(id as TheEdgeTab)}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black transition ${
                      active
                        ? 'border-[var(--ve-current-border)] bg-[var(--ve-current-soft)] ve-theme-accent-text'
                        : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {String(label)}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div className={presentation === 'page' ? 'flex-1 overflow-y-auto p-4 sm:p-8' : 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'}>
          <AnimatePresence mode="wait">
            {stage === 'storefront' ? (
              <motion.section
                key="storefront"
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.48, ease }}
                className="mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] border ve-theme-border bg-black/20"
              >
                <div className="p-5">
                  <EdgeSignatureDeck mode="public" onGo={go} />
                </div>

                <div
                  className="relative p-6 sm:p-10"
                  style={{
                    background:
                      'radial-gradient(circle at 15% 0%, var(--ve-welcome-hero-1), transparent 32%), radial-gradient(circle at 85% 10%, var(--ve-welcome-hero-2), transparent 34%)',
                  }}
                >
                  <h2 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
                    Click into <span className="ve-theme-gradient-text">The Edge.</span>
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                    This is the premium first layer. It sells the product first, then transforms into the working dashboard when the user is ready.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      onClick={() => transformToDashboard('dashboard')}
                      className="edge-portal-shine ve-theme-gradient ve-theme-glow rounded-2xl px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
                    >
                      Click me — Enter The Edge
                    </button>

                    <button
                      onClick={enterFullSite}
                      className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-6 py-3.5 text-sm font-black text-emerald-100 transition hover:-translate-y-0.5"
                    >
                      Skip to VouchEdge Site
                    </button>

                    <button
                      onClick={() => startAuthThenReturnToIsland('login')}
                      className="rounded-2xl border ve-theme-border ve-theme-soft-bg px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Login
                      </span>
                    </button>

                    <button
                      onClick={() => startAuthThenReturnToIsland('signup')}
                      className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {WELCOME_PILLARS.map((pillar) => (
                    <button
                      key={pillar.id}
                      onClick={() => transformToDashboard('features')}
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

                <EdgePublicSalesDeck onGo={go} />
              </motion.section>
            ) : (
              <motion.section
                key={`dashboard-${activeTab}`}
                initial={{ opacity: 0, y: 20, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.99 }}
                transition={{ duration: 0.35, ease }}
                className="mx-auto max-w-7xl"
              >
                {activeTab === 'home' && (
                  <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-5">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">Dashboard mode</div>
                      <h2 className="mt-2 text-3xl font-black text-white">Welcome to The Island.</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-400">The welcome portal transformed into your Island dashboard. This is the first stop after login.</p>

                      <div className="mt-5">
                        <EdgeSignatureDeck mode="dashboard" onGo={go} />
                      </div>

                      <EdgeDashboardMemberDeck onGo={go} />

                      <div className="mt-5 rounded-[2rem] border ve-theme-border bg-black/25 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                          Enter VouchEdge
                        </div>
                        <h3 className="mt-1 text-xl font-black text-white">Choose where you want to go.</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          The Edge is your starting dashboard. Pick a main page below to enter the actual site.
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {[
                            ['Daily Players', 'daily_players'],
                            ['Live Games', 'live_games'],
                            ['Parlay Lab', 'parlay_lab'],
                            ['Results', 'results'],
                          ].map(([label, section]) => (
                            <button
                              key={label}
                              onClick={() => go(section)}
                              className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {WELCOME_PILLARS.map((pillar) => (
                          <button key={pillar.id} onClick={() => go(pillar.section)} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left">
                            <PillarIcon id={pillar.id} />
                            <div className="mt-3 text-lg font-black text-white">{pillar.title}</div>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{pillar.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-5">
                      <div className="flex items-center gap-3">
                        <Bot className="h-6 w-6 ve-theme-accent-text" />
                        <h3 className="text-lg font-black text-white">AI Seat</h3>
                      </div>
                      <div className="mt-4 grid gap-2">
                        {aiTools.map((tool) => (
                          <div key={tool.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-xs font-black text-white">{tool.title}</div>
                            <p className="mt-1 text-[11px] text-slate-500">{tool.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'today' && (
                  <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-5">
                    <h2 className="text-3xl font-black text-white">Today’s Board</h2>
                    <p className="mt-2 text-sm text-slate-400">Start where the action is.</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {topFeatures.map((feature) => {
                        const Icon = feature.icon;
                        return (
                          <button key={feature.id} onClick={() => go(feature.section)} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-left">
                            {Icon ? <Icon className="h-5 w-5 ve-theme-accent-text" /> : <Sparkles className="h-5 w-5 ve-theme-accent-text" />}
                            <div className="mt-3 text-sm font-black text-white">{feature.title}</div>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{feature.subtitle}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <div className="grid gap-4 lg:grid-cols-3">
                    {['HR Alerts', 'Parlay Updates', 'System Watch'].map((title) => (
                      <div key={title} className="rounded-[2rem] border ve-theme-border bg-black/20 p-5">
                        <Bell className="h-6 w-6 ve-theme-accent-text" />
                        <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                        <p className="mt-2 text-sm text-slate-400">Configure and review alerts from The Edge.</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'dashboard' && (
                  <div className="grid gap-4 lg:grid-cols-4">
                    <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-5 lg:col-span-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] ve-theme-accent-text">
                        Enter VouchEdge
                      </div>
                      <h3 className="mt-1 text-xl font-black text-white">Choose a main page.</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        The Edge is your dashboard first. Pick a destination below to enter the actual site.
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          ['Daily Players', 'daily_players'],
                          ['Live Games', 'live_games'],
                          ['Parlay Lab', 'parlay_lab'],
                          ['Results', 'results'],
                        ].map(([label, section]) => (
                          <button
                            key={label}
                            onClick={() => go(section)}
                            className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-[var(--ve-current-border)]"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {[
                      ['Saved Parlays', '0'],
                      ['Pending Picks', '0'],
                      ['Win Rate', '—'],
                      ['Proof Score', 'Beta'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[2rem] border ve-theme-border bg-black/20 p-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
                        <div className="mt-2 text-3xl font-black text-white">{value}</div>
                      </div>
                    ))}
                    <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-5 lg:col-span-4">
                      <Trophy className="h-6 w-6 ve-theme-accent-text" />
                      <h3 className="mt-3 text-xl font-black text-white">The Island Dashboard</h3>
                      <p className="mt-2 text-sm text-slate-400">Saved picks, results, proof ledger, alerts, profile progress, and next best action.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="grid gap-4 lg:grid-cols-3">
                    {PRICING_TIERS.map((tier) => (
                      <div key={tier.id} className="rounded-[2rem] border ve-theme-border bg-black/20 p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black text-white">{tier.name}</h3>
                          {tier.badge && <Crown className="h-5 w-5 text-amber-200" />}
                        </div>
                        <div className="mt-3 text-3xl font-black text-white">{tier.price}<span className="text-sm text-slate-500">/mo</span></div>
                        <div className="mt-4 grid gap-2">
                          {tier.features.map((feature) => (
                            <div key={feature.label} className="flex items-center gap-2 text-xs font-bold">
                              <Check className={feature.included ? 'h-4 w-4 text-emerald-300' : 'h-4 w-4 text-slate-700'} />
                              <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>{feature.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'themes' && (
                  <div className="rounded-[2rem] border ve-theme-border bg-black/20 p-5">
                    <h2 className="text-3xl font-black text-white">Theme Studio</h2>
                    <p className="mt-2 text-sm text-slate-400">Transform The Edge identity.</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {THEME_CHOICES.map((theme) => (
                        <button key={theme.id} onClick={() => chooseTheme(theme.id)} className="rounded-3xl border ve-theme-border bg-slate-900/70 p-3 text-left">
                          <div className={`mb-3 h-24 rounded-2xl bg-gradient-to-br ${theme.className}`} />
                          <div className="text-sm font-black text-white">{theme.name}</div>
                          <p className="mt-2 text-xs text-slate-400">{theme.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}
