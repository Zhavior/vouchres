import { AnimatePresence, motion } from 'framer-motion';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Bot, Check, CreditCard, Crown, Home, Layers3, Lock, LogIn, Palette, Radio, ShieldCheck, Sparkles, TrendingUp, Trophy, Users, X } from 'lucide-react';
import '../edgePortal/edgePortalTheme.css';
import { safeJsonFetch } from '../../api/safeApiClient';
import { isSupabaseConfigured, signInWithEmail, signUpWithEmail } from '../../lib/supabaseClient';
import type { Parlay, CreatorProofProfile } from '../../types';

type TheEdgeMode = 'public' | 'dashboard';
type TheEdgePresentation = 'page' | 'overlay';

/** Trimmed funnel: one sell screen, guided signup wizard, quick handoff to the Island. */
type EdgeLayer = 'intro' | 'login' | 'signup' | 'welcomeBack' | 'dashboard';

/** Steps inside the signup wizard. */
type SignupStep = 'features' | 'account' | 'plan' | 'payment' | 'policy';

type PlanId = 'free' | 'pro_trial' | 'pro_elite';

const PLANS: Record<PlanId, { name: string; price: string; sub: string; perks: string[]; accent: 'cyan' | 'emerald' | 'violet'; badge?: string; paid: boolean }> = {
  free: {
    name: 'Free',
    price: '$0',
    sub: 'Core research, forever',
    perks: ['Daily board & player pages', 'Build & save parlays', 'Results ledger'],
    accent: 'cyan',
    paid: false,
  },
  pro_trial: {
    name: 'Pro',
    price: '1.5 weeks free',
    sub: 'then $12.99/mo · cancel anytime',
    perks: ['Everything in Free', 'All Pro Labs + AI Smart Picks', 'Pitcher Pro profiles & alerts'],
    accent: 'emerald',
    badge: 'Most popular',
    paid: true,
  },
  pro_elite: {
    name: 'Pro Elite',
    price: '$49.99/mo',
    sub: 'Deep research + sell your picks',
    perks: ['Everything in Pro', 'Deep research suite', 'Sell picks + Subscriber Clubs'],
    accent: 'violet',
    badge: 'Top tier',
    paid: true,
  },
};

/** VouchEdge policy the user must read + agree to before an account is created. */
const POLICY_TEXT = `VouchEdge — Terms, Privacy & Responsible Use

1. Research & entertainment only. VouchEdge provides probability-based sports research, statistics, and tools. Nothing on the platform is betting advice, a guarantee of outcome, or a promise of profit. You are solely responsible for any decisions you make.

2. Eligibility. You must be at least 21 years old and located in a jurisdiction where using sports research tools is permitted. You confirm you are not excluded or self-excluded from gaming services.

3. No guaranteed outcomes. All grades, edges, projections, and AI outputs are estimates derived from public data (e.g. the MLB Stats API) and may be incomplete, delayed, or incorrect. Past results never guarantee future results.

4. Your data. We store the account details, picks, and preferences you create to operate the product. We do not sell your personal data. Payment is processed by our payment provider; we do not store full card numbers.

5. Subscriptions & trials. Free tiers remain free. Paid plans (including the 1.5-week Pro free trial) renew automatically at the stated price unless cancelled before the trial or billing period ends. You can cancel anytime from billing settings.

6. Fair use. Do not scrape, resell, or redistribute VouchEdge data or attempt to manipulate grading. Accounts that abuse the platform may be suspended.

7. Changes. We may update these terms; continued use means you accept the current version.

By checking the boxes below you confirm you have read and agree to these terms, the Privacy Policy, and the Responsible Use notice.`;

type TheEdgeShellProps = {
  mode: TheEdgeMode;
  presentation: TheEdgePresentation;
  activeSection?: string;
  slateLabel?: string;
  savedParlays?: Parlay[];
  profile?: Pick<CreatorProofProfile, 'displayName' | 'winRate' | 'totalPicks' | 'wonPicks'>;
  onClose?: () => void;
  onSectionChange: (section: string) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

interface SlateGame {
  away: string;
  home: string;
  time: string;
  live: boolean;
}

/* ── small shared primitives (one accent: cyan; emerald=proof, rose=loss, amber=live) ── */

function Stat({ label, value, tone = 'white' }: { label: string; value: string | number; tone?: 'white' | 'cyan' | 'emerald' | 'rose' }) {
  const color = tone === 'cyan' ? 'text-cyan-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'rose' ? 'text-rose-300' : 'text-white';
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
    </div>
  );
}

const PRIMARY = 'rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5';
const SECONDARY = 'rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5';
const GHOST = 'rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:text-white';

function friendlyAuthError(message?: string) {
  const text = String(message ?? '').toLowerCase();
  if (text.includes('invalid login')) return 'Email or password is incorrect.';
  if (text.includes('email not confirmed')) return 'Confirm your email before logging in.';
  if (text.includes('password')) return 'Password must be at least 6 characters.';
  return message || 'Authentication failed. Try again.';
}

type DashboardSummaryResponse = {
  widgets: {
    savedPicks: number;
    savedParlays: number;
    pendingPicks: number;
    winRate: number | null;
    proofScore: number;
  };
  summary: {
    total: number;
    pending: number;
    won: number;
    lost: number;
    void: number;
    push: number;
    parlays: number;
    singles: number;
  };
  recent: Array<{
    id: string;
    status?: string | null;
    leg_type?: string | null;
    created_at?: string | null;
  }>;
};

export default function TheEdgeShell({
  mode,
  presentation,
  savedParlays = [],
  profile,
  onClose,
  onSectionChange,
}: TheEdgeShellProps) {
  const [edgeLayer, setEdgeLayer] = useState<EdgeLayer>(mode === 'public' ? 'intro' : 'welcomeBack');
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);
  const [dashboardSummaryLoading, setDashboardSummaryLoading] = useState(false);
  const [slate, setSlate] = useState<SlateGame[]>([]);
  const [signupStep, setSignupStep] = useState<SignupStep>('features');
  const [plan, setPlan] = useState<PlanId>('pro_trial');
  const [agree, setAgree] = useState({ age: false, terms: false, research: false });
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const allAgreed = agree.age && agree.terms && agree.research;

  function openSignup(p: PlanId = 'pro_trial') {
    setPlan(p);
    setSignupStep('features');
    setAgree({ age: false, terms: false, research: false });
    setAuthError(null);
    setAuthNotice(null);
    setEdgeLayer('signup');
  }

  // Wizard order — payment is skipped for the free plan.
  const signupOrder: SignupStep[] = plan === 'free'
    ? ['features', 'account', 'plan', 'policy']
    : ['features', 'account', 'plan', 'payment', 'policy'];

  async function signupNext() {
    const i = signupOrder.indexOf(signupStep);
    if (i < 0) return setSignupStep('account');
    if (signupStep === 'account' && !validateAccountForm()) return;
    if (i >= signupOrder.length - 1) { await completeSignup(); return; }
    setAuthError(null);
    setAuthNotice(null);
    setSignupStep(signupOrder[i + 1]);
  }
  function signupBack() {
    const i = signupOrder.indexOf(signupStep);
    if (i <= 0) { setEdgeLayer('intro'); return; }
    setSignupStep(signupOrder[i - 1]);
  }

  // Real today's slate for the scoreboard ticker (no fake games).
  useEffect(() => {
    let alive = true;
    safeJsonFetch<any>('/api/mlb/lineup/today', { fallbackData: { games: [] }, timeoutMs: 12000 }).then((r) => {
      if (!alive) return;
      const games: SlateGame[] = (r.data?.games ?? []).slice(0, 12).map((g: any) => ({
        away: g.awayTeam?.abbrev ?? g.awayTeam?.name ?? 'AWY',
        home: g.homeTeam?.abbrev ?? g.homeTeam?.name ?? 'HOM',
        time: g.gameDate ? new Date(g.gameDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
        live: /progress|live|in play/i.test(String(g.status ?? '')),
      }));
      setSlate(games);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (mode === 'dashboard') {
      setEdgeLayer('welcomeBack');
      const t = window.setTimeout(() => setEdgeLayer('dashboard'), 900);
      return () => window.clearTimeout(t);
    }
  }, [mode]);

  // ── Real proof numbers (no placeholders) ──
  const stats = useMemo(() => {
    const saved = savedParlays.length;
    const pending = savedParlays.filter((p) => p.status === 'PENDING').length;
    const won = savedParlays.filter((p) => p.status === 'WON').length;
    const lost = savedParlays.filter((p) => p.status === 'LOST').length;
    const settled = won + lost;
    const slipWinRate = settled > 0 ? Math.round((won / settled) * 100) : null;
    const winRate = slipWinRate ?? (profile && profile.totalPicks > 0 ? Math.round(profile.winRate) : null);
    const liveNow = slate.filter((g) => g.live).length;
    return { saved, pending, won, lost, settled, winRate, gamesToday: slate.length, liveNow };
  }, [savedParlays, profile, slate, dashboardSummary]);

  useEffect(() => {
    if (edgeLayer !== 'dashboard' && edgeLayer !== 'welcomeBack') return;

    let cancelled = false;

    async function loadDashboardSummary() {
      const token =
        localStorage.getItem('vouchedge_auth_token') ||
        localStorage.getItem('mlb_ai_auth_token');

      if (!token) return;

      try {
        setDashboardSummaryLoading(true);

        const response = await fetch('/api/me/dashboard-summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const payload = (await response.json()) as DashboardSummaryResponse;

        if (!cancelled) {
          setDashboardSummary(payload);
        }
      } catch {
        // Keep local fallback stats if backend is unavailable.
      } finally {
        if (!cancelled) {
          setDashboardSummaryLoading(false);
        }
      }
    }

    loadDashboardSummary();

    return () => {
      cancelled = true;
    };
  }, [edgeLayer]);

  function enterSite(section = 'feed') {
    onSectionChange(section);
    if (presentation === 'overlay') onClose?.();
  }

  function finishAuth() {
    localStorage.setItem('vouchedge_after_auth_mode', 'island');
    localStorage.setItem('vouchedge_signup_plan', plan);
    localStorage.setItem('vouchedge_policy_agreed_at', new Date().toISOString());
    setEdgeLayer('welcomeBack');
    window.setTimeout(() => setEdgeLayer('dashboard'), 900);
  }

  function validateAccountForm() {
    setAuthError(null);
    setAuthNotice(null);

    if (!authForm.email.trim()) {
      setAuthError('Enter your email.');
      return false;
    }
    if (!authForm.password) {
      setAuthError('Enter your password.');
      return false;
    }
    if (authForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return false;
    }
    if (edgeLayer === 'signup' && authForm.name.trim().length < 3) {
      setAuthError('Pick a username or display name with at least 3 characters.');
      return false;
    }

    return true;
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateAccountForm()) return;

    if (!isSupabaseConfigured) {
      setAuthError("Accounts aren't enabled in this environment yet.");
      return;
    }

    setAuthBusy(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const { error } = await signInWithEmail({
        email: authForm.email.trim(),
        password: authForm.password,
      });
      if (error) {
        setAuthError(friendlyAuthError(error.message));
        return;
      }
      finishAuth();
    } catch (error: any) {
      setAuthError(friendlyAuthError(error?.message));
    } finally {
      setAuthBusy(false);
    }
  }

  async function completeSignup() {
    if (!allAgreed || !validateAccountForm()) return;

    if (!isSupabaseConfigured) {
      setAuthError("Accounts aren't enabled in this environment yet.");
      return;
    }

    setAuthBusy(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const username = authForm.name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
      const { data, error } = await signUpWithEmail({
        email: authForm.email.trim(),
        password: authForm.password,
        username: username || authForm.email.trim().split('@')[0],
      });

      if (error) {
        setAuthError(friendlyAuthError(error.message));
        return;
      }

      if (data.session) {
        finishAuth();
        return;
      }

      setAuthNotice('Account created. Check your email to confirm it, then log in.');
      setEdgeLayer('login');
    } catch (error: any) {
      setAuthError(friendlyAuthError(error?.message));
    } finally {
      setAuthBusy(false);
    }
  }

  const shellClass =
    presentation === 'page'
      ? 'min-h-screen overflow-hidden bg-slate-950 text-white'
      : 'relative mx-auto flex h-[92vh] max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-black/60';

  const isAuthLayer = edgeLayer === 'login' || edgeLayer === 'signup';

  return (
    <motion.main
      className={`ve-theme-root ${shellClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="edge-home-backdrop" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="border-b border-white/[0.07] bg-slate-950/75 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-black tracking-tight text-white">
              Vouch<span className="text-cyan-300">Edge</span>
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:inline">
              MLB Research
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {edgeLayer === 'intro' && (
              <>
                <button onClick={() => setEdgeLayer('login')} className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-black text-slate-300 transition hover:text-white">
                  <span className="inline-flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5" /> Login</span>
                </button>
                <button onClick={() => openSignup('pro_trial')} className="hidden rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 sm:inline-flex">
                  Get Started
                </button>
              </>
            )}
            {isAuthLayer && (
              <button onClick={() => setEdgeLayer('intro')} className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-black text-slate-300 transition hover:text-white">
                Back
              </button>
            )}
            {(edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack') && (
              <button onClick={() => enterSite('feed')} className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                Enter VouchEdge Site
              </button>
            )}
            {presentation === 'overlay' && (
              <button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          </div>
        </header>

        <div className={presentation === 'page' ? 'flex-1 overflow-y-auto p-4 sm:p-8' : 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'}>
          <AnimatePresence mode="wait">

            {/* ── INTRO: one sports-native sell screen (video + welcome merged) ── */}
            {edgeLayer === 'intro' && (
              <motion.section
                key="intro"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease }}
                className="edge-welcome-front mx-auto max-w-6xl"
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-start">
                  <div className="edge-home-panel rounded-3xl p-5 sm:p-7">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified research workspace
                    </div>

                    <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
                      VouchEdge
                    </h1>

                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
                      Clean MLB research, saved parlays, alerts, and tracked results in one dashboard.
                    </p>

                    <div className="mt-6 grid max-w-md grid-cols-3 gap-2">
                      <Stat label="Games today" value={stats.gamesToday || '—'} tone="cyan" />
                      <Stat label="Live now" value={stats.liveNow} tone={stats.liveNow > 0 ? 'rose' : 'white'} />
                      <Stat label="Tracked" value="100%" tone="emerald" />
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button onClick={() => openSignup('pro_trial')} className={PRIMARY}>
                        <span className="inline-flex items-center gap-2">Start 1.5-week free trial <ArrowRight className="h-4 w-4" /></span>
                      </button>
                      <button onClick={() => setEdgeLayer('login')} className={SECONDARY}>
                        <span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4" /> Login</span>
                      </button>
                      <button onClick={() => enterSite('feed')} className={GHOST}>Explore site</button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-bold text-slate-500">
                      <span>Research &amp; entertainment only</span><span>·</span><span>No guaranteed outcomes</span>
                    </div>
                  </div>

                  <motion.div
                    className="edge-slate-stage"
                    initial={{ opacity: 0, scale: 0.96, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease }}
                  >
                    <div className="edge-home-card relative overflow-hidden rounded-3xl p-5 shadow-2xl shadow-black/40">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black text-white">
                          <Radio className="h-4 w-4 text-cyan-300" /> Today’s MLB slate
                        </div>
                        <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">{slate.length} games</span>
                      </div>

                      <div className="max-h-[340px] divide-y divide-white/10 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/20">
                        {slate.length === 0 ? (
                          <div className="px-4 py-10 text-center text-xs text-slate-400">Loading today’s verified slate...</div>
                        ) : (
                          slate.map((g, i) => (
                            <motion.div
                              key={`${g.away}-${g.home}-${i}`}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.3 }}
                              className="flex items-center justify-between px-4 py-2.5"
                            >
                              <div className="flex items-center gap-2 font-mono text-sm font-black text-slate-100">
                                <span className="w-10">{g.away}</span>
                                <span className="text-slate-500">@</span>
                                <span className="w-10">{g.home}</span>
                              </div>
                              {g.live ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-300">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Live
                                </span>
                              ) : (
                                <span className="text-[11px] font-mono text-slate-400">{g.time}</span>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        {[['Proof', ShieldCheck], ['Research', TrendingUp], ['Community', Users]].map(([label, Icon]) => {
                          const I = Icon as typeof ShieldCheck;
                          return (
                            <div key={label as string} className="edge-mini-glass rounded-2xl px-2 py-3">
                              <I className="mx-auto h-4 w-4 text-cyan-300" />
                              <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-300">{label as string}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                </div>
              </motion.section>
            )}

            {/* ── LOGIN ── */}
            {edgeLayer === 'login' && (
              <motion.section
                key="login"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.4, ease }}
                className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-black/30"
              >
                <form onSubmit={handleLoginSubmit}>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Login</div>
                  <h2 className="mt-2 text-3xl font-black text-white">Welcome back.</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Login happens right here — then The Edge becomes your Island.</p>
                  <div className="mt-6 grid gap-3">
                    <input
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                      placeholder="Email"
                      type="email"
                      autoComplete="email"
                      value={authForm.email}
                      onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))}
                    />
                    <input
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                      placeholder="Password"
                      type="password"
                      autoComplete="current-password"
                      value={authForm.password}
                      onChange={(event) => setAuthForm((form) => ({ ...form, password: event.target.value }))}
                    />
                  </div>
                  {authError && (
                    <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-xs font-bold leading-5 text-rose-100">
                      {authError}
                    </div>
                  )}
                  {authNotice && (
                    <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-bold leading-5 text-emerald-100">
                      {authNotice}
                    </div>
                  )}
                  <button type="submit" disabled={authBusy} className={`mt-6 w-full ${PRIMARY} ${authBusy ? 'cursor-wait opacity-70 hover:translate-y-0' : ''}`}>
                    {authBusy ? 'Logging in...' : 'Login → Enter The Island'}
                  </button>
                  <button type="button" onClick={() => openSignup('pro_trial')} className="mt-3 w-full text-center text-xs font-bold text-slate-500 hover:text-slate-300">
                    New here? Start a free trial →
                  </button>
                </form>
              </motion.section>
            )}

            {/* ── SIGNUP WIZARD: features → account → plan → payment → policy ── */}
            {edgeLayer === 'signup' && (
              <motion.section
                key="signup"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease }}
                className="mx-auto max-w-2xl"
              >
                {/* Stepper */}
                <div className="mb-5 flex items-center gap-2">
                  {signupOrder.map((s, i) => {
                    const active = s === signupStep;
                    const done = signupOrder.indexOf(signupStep) > i;
                    return (
                      <div key={s} className="flex flex-1 items-center gap-2">
                        <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${active ? 'bg-cyan-400 text-slate-950' : done ? 'bg-emerald-400 text-slate-950' : 'border border-slate-700 bg-slate-900 text-slate-500'}`}>
                          {done ? <Check className="h-3 w-3" /> : i + 1}
                        </div>
                        {i < signupOrder.length - 1 && <div className={`h-px flex-1 ${done ? 'bg-emerald-400/60' : 'bg-slate-800'}`} />}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
                  <AnimatePresence mode="wait">

                    {/* 1) FEATURES */}
                    {signupStep === 'features' && (
                      <motion.div key="s-features" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">What you unlock</div>
                        <h2 className="mt-2 text-3xl font-black text-white">Built to make you sharper.</h2>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {[
                            [ShieldCheck, 'Proof ledger', 'Every pick graded to the final box score.'],
                            [TrendingUp, 'Daily research', 'HR board, player pages, matchup context.'],
                            [Layers3, 'Parlay + AI Smart Picks', 'Build slips or let the AI build from confirmed starters.'],
                            [Users, 'Community with receipts', 'Follow members by tracked results, not hype.'],
                          ].map(([Icon, title, body]) => {
                            const I = Icon as typeof ShieldCheck;
                            return (
                              <div key={title as string} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                                <I className="h-5 w-5 text-cyan-300" />
                                <div className="mt-3 text-sm font-black text-white">{title as string}</div>
                                <p className="mt-1 text-[11px] leading-5 text-slate-500">{body as string}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button onClick={signupNext} className={PRIMARY}><span className="inline-flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span></button>
                        </div>
                      </motion.div>
                    )}

                    {/* 2) ACCOUNT */}
                    {signupStep === 'account' && (
                      <motion.div key="s-account" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Create account</div>
                        <h2 className="mt-2 text-3xl font-black text-white">Your Edge profile.</h2>
                        <div className="mt-5 grid gap-3">
                          <input
                            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                            placeholder="Name"
                            autoComplete="name"
                            value={authForm.name}
                            onChange={(event) => setAuthForm((form) => ({ ...form, name: event.target.value }))}
                          />
                          <input
                            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                            placeholder="Email"
                            type="email"
                            autoComplete="email"
                            value={authForm.email}
                            onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))}
                          />
                          <input
                            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                            placeholder="Password"
                            type="password"
                            autoComplete="new-password"
                            value={authForm.password}
                            onChange={(event) => setAuthForm((form) => ({ ...form, password: event.target.value }))}
                          />
                        </div>
                        {authError && (
                          <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-xs font-bold leading-5 text-rose-100">
                            {authError}
                          </div>
                        )}
                        {authNotice && (
                          <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-bold leading-5 text-emerald-100">
                            {authNotice}
                          </div>
                        )}
                        <div className="mt-6 flex items-center justify-between">
                          <button onClick={signupBack} className="text-xs font-black text-slate-500 hover:text-slate-300">Back</button>
                          <button onClick={signupNext} className={PRIMARY}><span className="inline-flex items-center gap-2">Choose plan <ArrowRight className="h-4 w-4" /></span></button>
                        </div>
                      </motion.div>
                    )}

                    {/* 3) PLAN */}
                    {signupStep === 'plan' && (
                      <motion.div key="s-plan" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Pick your plan</div>
                        <h2 className="mt-2 text-3xl font-black text-white">Start free, or go Pro.</h2>
                        <div className="mt-5 grid gap-3">
                          {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([id, p]) => {
                            const selected = plan === id;
                            const ring = selected
                              ? p.accent === 'emerald' ? 'border-emerald-300/50 bg-emerald-300/[0.07]' : p.accent === 'violet' ? 'border-violet-300/50 bg-violet-300/[0.07]' : 'border-cyan-300/50 bg-cyan-300/[0.07]'
                              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700';
                            return (
                              <button key={id} onClick={() => setPlan(id)} className={`relative rounded-2xl border p-4 text-left transition ${ring}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-black text-white">{p.name}</span>
                                      {p.badge && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-300">{p.badge}</span>}
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-slate-400">{p.sub}</div>
                                    <ul className="mt-2 space-y-1">
                                      {p.perks.map((perk) => (
                                        <li key={perk} className="flex items-center gap-1.5 text-[11px] text-slate-300"><Check className="h-3 w-3 text-emerald-300" /> {perk}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-black text-white">{p.price}</div>
                                    <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-slate-600'}`}>
                                      {selected && <Check className="h-3 w-3" />}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <button onClick={signupBack} className="text-xs font-black text-slate-500 hover:text-slate-300">Back</button>
                          <button onClick={signupNext} className={PRIMARY}>
                            <span className="inline-flex items-center gap-2">{PLANS[plan].paid ? 'Continue to payment' : 'Continue'} <ArrowRight className="h-4 w-4" /></span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* 4) PAYMENT (paid plans only) */}
                    {signupStep === 'payment' && (
                      <motion.div key="s-payment" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Payment</div>
                        <h2 className="mt-2 text-3xl font-black text-white">
                          {plan === 'pro_trial' ? '1.5 weeks free, then $12.99/mo.' : `${PLANS[plan].name} — ${PLANS[plan].price}.`}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {plan === 'pro_trial'
                            ? 'You won’t be charged today. Your card holds your trial; cancel anytime before it ends.'
                            : 'Secure checkout. You can cancel your subscription anytime.'}
                        </p>
                        <div className="mt-5 grid gap-3">
                          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            <input className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="Card number" inputMode="numeric" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="MM / YY" />
                            <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="CVC" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Lock className="h-3.5 w-3.5 text-emerald-300" /> Encrypted checkout · processed by our payment provider
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <button onClick={signupBack} className="text-xs font-black text-slate-500 hover:text-slate-300">Back</button>
                          <button onClick={signupNext} className={PRIMARY}><span className="inline-flex items-center gap-2">Review terms <ArrowRight className="h-4 w-4" /></span></button>
                        </div>
                      </motion.div>
                    )}

                    {/* 5) POLICY + AGREEMENT VERIFICATION */}
                    {signupStep === 'policy' && (
                      <motion.div key="s-policy" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Terms &amp; agreement</div>
                        <h2 className="mt-2 text-3xl font-black text-white">Read &amp; agree to continue.</h2>
                        <div className="mt-4 max-h-56 overflow-y-auto whitespace-pre-line rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[11px] leading-5 text-slate-400">
                          {POLICY_TEXT}
                        </div>
                        <div className="mt-4 space-y-2.5">
                          {([
                            ['age', 'I am 21+ and in a permitted jurisdiction.'],
                            ['terms', 'I have read and agree to the Terms & Privacy Policy.'],
                            ['research', 'I understand VouchEdge is research/entertainment only — not betting advice.'],
                          ] as const).map(([key, label]) => (
                            <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 transition hover:border-slate-700">
                              <button
                                type="button"
                                onClick={() => setAgree((a) => ({ ...a, [key]: !a[key] }))}
                                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${agree[key] ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600 bg-slate-950'}`}
                                aria-pressed={agree[key]}
                              >
                                {agree[key] && <Check className="h-3.5 w-3.5" />}
                              </button>
                              <span className="text-xs leading-5 text-slate-300">{label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-3">
                          <button onClick={signupBack} className="text-xs font-black text-slate-500 hover:text-slate-300">Back</button>
                          <button
                            onClick={signupNext}
                            disabled={!allAgreed || authBusy}
                            className={`${PRIMARY} ${!allAgreed || authBusy ? 'cursor-not-allowed opacity-40 hover:translate-y-0' : ''}`}
                          >
                            {authBusy ? 'Creating account...' : plan === 'free' ? 'Agree & create account' : plan === 'pro_trial' ? 'Agree & start free trial' : 'Agree & subscribe'}
                          </button>
                        </div>
                        {authError && (
                          <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-xs font-bold leading-5 text-rose-100">
                            {authError}
                          </div>
                        )}
                        {authNotice && (
                          <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-bold leading-5 text-emerald-100">
                            {authNotice}
                          </div>
                        )}
                        {!allAgreed && <p className="mt-2 text-right text-[10px] font-bold text-slate-600">Check all three boxes to continue.</p>}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </motion.section>
            )}

            {/* ── WELCOME BACK ── */}
            {edgeLayer === 'welcomeBack' && (
              <motion.section
                key="welcomeBack"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease }}
                className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center"
              >
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-8 w-8" />
                </motion.div>
                <h2 className="mt-5 text-4xl font-black text-white">
                  Welcome{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ' back'}.
                </h2>
                <p className="mt-3 text-sm text-slate-400">Building your Island dashboard…</p>
              </motion.section>
            )}

            {/* ── ISLAND DASHBOARD (real data) ── */}
            {edgeLayer === 'dashboard' && (
              <motion.section
                key="dashboard"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease }}
                className="mx-auto max-w-6xl space-y-4"
              >
                <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">The Island</div>
                      <h2 className="mt-1.5 text-3xl font-black text-white sm:text-4xl">
                        Welcome back{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}.
                      </h2>
                      <p className="mt-1.5 max-w-2xl text-sm text-slate-400">Your command island — real numbers, quick jumps into the site.</p>
                    </div>
                    <button onClick={() => enterSite('feed')} className={PRIMARY}>
                      <span className="inline-flex items-center gap-2"><Home className="h-4 w-4" /> Enter VouchEdge Site</span>
                    </button>
                  </div>

                  {/* Real widgets */}
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="Saved picks" value={dashboardSummaryLoading ? '...' : stats.savedPicks} tone="cyan" />
                    <Stat label="Saved parlays" value={dashboardSummaryLoading ? '...' : stats.saved} tone="cyan" />
                    <Stat label="Pending" value={dashboardSummaryLoading ? '...' : stats.pending} tone="white" />
                    <Stat label="Win rate" value={stats.winRate != null ? `${stats.winRate}%` : '—'} tone="emerald" />
                    <Stat label="Proof score" value={dashboardSummaryLoading ? '...' : stats.proofScore} tone="violet" />
                    <Stat label="Record" value={stats.settled > 0 ? `${stats.won}-${stats.lost}` : '0-0'} tone={stats.won >= stats.lost ? 'emerald' : 'rose'} />
                  </div>
                </section>

                {/* Quick jumps — routes verified against App.tsx */}
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {([
                    
                    ['Live Parlays', 'live_parlays', Radio],
                    ['Parlay Lab', 'build', Layers3],
                    ['Results Ledger', 'results', Trophy],
                  ] as const).map(([label, section, Icon]) => (
                    <button
                      key={label}
                      onClick={() => enterSite(section)}
                      className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900"
                    >
                      <Icon className="h-5 w-5 text-cyan-300" />
                      <div className="mt-3 text-sm font-black text-white">{label}</div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100">
                        Open <ArrowRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </section>

                <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                    <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black text-white">Pending picks</h3></div>
                    <div className="mt-4 space-y-2">
                      {savedParlays.filter((p) => p.status === 'PENDING').slice(0, 4).map((p) => (
                        <button key={p.id} onClick={() => enterSite('live_parlays')} className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left hover:border-cyan-300/30">
                          <span className="truncate text-xs font-bold text-slate-200">{p.title || 'Saved parlay'}</span>
                          <span className="font-mono text-[11px] text-cyan-300">{p.totalOdds}</span>
                        </button>
                      ))}
                      {stats.pending === 0 && (
                        <button onClick={() => enterSite('ai_engine')} className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-3 py-4 text-center text-xs font-bold text-slate-500 hover:text-slate-300">
                          No pending picks — build one in V.A.I Smart Picks →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                    <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black text-white">AI Seat</h3></div>
                    <div className="mt-4 grid gap-2">
                      {['Explain today’s board', 'Compare players', 'Build parlay logic'].map((tool) => (
                        <button key={tool} onClick={() => enterSite('ai_engine')} className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left text-xs font-bold text-slate-200 hover:border-cyan-300/30">
                          {tool}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => enterSite('themestore')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200">
                      <Palette className="h-4 w-4 text-cyan-300" /> Theme Studio
                    </button>
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
