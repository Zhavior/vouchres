/** @deprecated Orphaned — live Edge Island uses `src/components/edgeIsland/EdgeIslandShell.tsx`. */
import { AnimatePresence, motion } from '../../lib/motion';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Bot, Check, CreditCard, Crown, Home, Layers3, Lock, LogIn, Palette, Radio, ShieldCheck, Sparkles, TrendingUp, Trophy, Users, X } from 'lucide-react';
import '../edgePortal/edgePortalTheme.css';
import { safeJsonFetch } from '../../api/safeApiClient';
import { apiClient } from '../../lib/apiClient';
import { isSupabaseConfigured, signInWithEmail, signUpWithEmail } from '../../lib/supabaseClient';
import type { Parlay, CreatorProofProfile } from '../../types';
import { bootDataStore } from "../../lib/boot/bootDataStore";
import WelcomeIntro from './WelcomeIntro';
import { Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../theme/z8Tokens';

type TheEdgeMode = 'public' | 'dashboard';
type TheEdgePresentation = 'page' | 'overlay';

/** Trimmed funnel: one sell screen, guided signup wizard, quick handoff to the Island. */
type EdgeLayer = 'intro' | 'login' | 'signup' | 'welcomeBack' | 'dashboard';

/** Steps inside the signup wizard. */
type SignupStep = 'features' | 'account' | 'plan' | 'payment' | 'policy';

type PlanId = 'free' | 'pro_trial' | 'pro_elite';

const PLANS: Record<PlanId, { name: string; price: string; sub: string; perks: string[]; accent: 'cyan' | 'emerald'; badge?: string; paid: boolean }> = {
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
    accent: 'emerald',
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
  const color = tone === 'cyan' ? 'text-vouch-cyan' : tone === 'emerald' ? 'text-vouch-emerald' : tone === 'rose' ? 'text-rose-300' : 'text-white';
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-center font-z8">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</div>
    </div>
  );
}

const PRIMARY = 'rounded-2xl bg-gradient-to-r from-vouch-cyan to-vouch-cyan/80 px-6 py-3.5 text-sm font-black text-obsidian-900 shadow-lg shadow-vouch-cyan/20 transition hover:-translate-y-0.5 font-z8';
const SECONDARY = 'rounded-2xl border border-vouch-cyan/25 bg-vouch-cyan/10 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 font-z8';
const GHOST = 'rounded-2xl border border-white/10 bg-black/25 px-6 py-3.5 text-sm font-black text-white/70 transition hover:-translate-y-0.5 hover:text-white font-z8';

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

function triggerEdgeIslandTransition() {
  sessionStorage.setItem("vouchedge_entering_edge_island", "true");
}

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

    const mapSlateGames = (payload: any): SlateGame[] => {
      return (payload?.games ?? []).slice(0, 12).map((g: any) => ({
        away: g.awayTeam?.abbrev ?? g.awayTeam?.name ?? 'AWY',
        home: g.homeTeam?.abbrev ?? g.homeTeam?.name ?? 'HOM',
        time: g.gameDate ? new Date(g.gameDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
        live: /progress|live|in play/i.test(String(g.status ?? '')),
      }));
    };

    const bootLineup = bootDataStore.get<any>("lineupToday");
    if (bootLineup) {
      const bootGames = mapSlateGames(bootLineup);
      if (bootGames.length > 0) setSlate(bootGames);
    }

    safeJsonFetch<any>('/api/mlb/lineup/today', { fallbackData: { games: [] }, timeoutMs: 12000 }).then((r) => {
      if (!alive) return;
      setSlate(mapSlateGames(r.data));
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

        const payload = await apiClient.get<DashboardSummaryResponse>('/api/me/dashboard-summary');

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
    triggerEdgeIslandTransition();
    onSectionChange(section);
    if (presentation === 'overlay') onClose?.();
  }

  function finishAuth() {
    localStorage.setItem('vouchedge_after_auth_mode', 'welcome');
    localStorage.setItem('vouchedge_signup_plan', plan);
    localStorage.setItem('vouchedge_policy_agreed_at', new Date().toISOString());

    setEdgeLayer('welcomeBack');

    window.setTimeout(() => {
      triggerEdgeIslandTransition();
      onSectionChange('welcome');
      window.dispatchEvent(new CustomEvent('vouchedge:navigate', { detail: { section: 'welcome' } }));
      if (presentation === 'overlay') onClose?.();
    }, 900);
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
      const handle = authForm.name.trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30);
      const { data, error } = await signUpWithEmail({
        email: authForm.email.trim(),
        password: authForm.password,
        handle: handle || authForm.email.trim().split('@')[0].toLowerCase(),
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
      ? 'edge-space-shell ve-page min-h-screen overflow-hidden text-ve-flash'
      : 'edge-space-shell ve-page glass-command relative mx-auto flex h-[92vh] max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-ve-fuse text-ve-flash shadow-2xl shadow-black/40';

  const isAuthLayer = edgeLayer === 'login' || edgeLayer === 'signup';

  return (
    <motion.main
      className={`relative isolate overflow-hidden bg-ve-obsidian text-ve-flash font-z8 ${shellClass}`}
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      {/* Stadium-floodlight backdrop — one clean layer, not stacked sci-fi space effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(0,240,255,0.12),transparent_38%),linear-gradient(180deg,#0a0a0f,#111118_60%,#0a0a0f)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className={`${Z8_PANEL_PREMIUM} glass-command edge-space-header border-b border-ve-fuse rounded-none border-x-0 border-t-0 px-4 py-4 backdrop-blur-2xl sm:px-6`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-vouch-cyan shadow-[0_0_22px_rgba(0,240,255,0.16)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-black tracking-tight text-white">
              Vouch<span className="text-vouch-cyan">Edge</span>
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 sm:inline">
              Trust-first MLB research
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {edgeLayer === 'intro' && (
              <>
                <button onClick={() => setEdgeLayer('login')} className="ve-button-ghost px-3.5 py-2 text-xs font-black">
                  <span className="inline-flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5" /> Login</span>
                </button>
                <button onClick={() => openSignup('pro_trial')} className="ve-button-primary hidden px-3.5 py-2 text-xs font-black text-obsidian-900 sm:inline-flex">
                  Get Started
                </button>
              </>
            )}
            {isAuthLayer && (
              <button onClick={() => setEdgeLayer('intro')} className="ve-button-ghost px-3.5 py-2 text-xs font-black">
                Back
              </button>
            )}
            {(edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack') && (
              <button onClick={() => enterSite('feed')} className="ve-button-primary px-3.5 py-2 text-xs font-black text-obsidian-900">
                Enter VouchEdge Site
              </button>
            )}
            {presentation === 'overlay' && (
              <button onClick={onClose} className="ve-button-ghost p-2">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          </div>
        </header>

        <div className={presentation === 'page' ? 'relative flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8' : 'relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'}>
          <AnimatePresence mode="wait">

            {/* ── INTRO: brand-new welcome page built on the Z8 design system ── */}
            {edgeLayer === 'intro' && (
              <motion.section
                key="intro"
                initial={{ y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease }}
              >
                <WelcomeIntro
                  slate={slate}
                  stats={stats}
                  onStartTrial={() => openSignup('pro_trial')}
                  onOpenDailyBoard={() => enterSite('daily_players')}
                  onLogin={() => setEdgeLayer('login')}
                  onOpenModule={(section) => enterSite(section)}
                />
              </motion.section>
            )}

            {/* ── LOGIN ── */}
            {edgeLayer === 'login' && (
              <motion.section
                key="login"
                initial={{ x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.4, ease }}
                className={`${Z8_PANEL_PREMIUM} mx-auto max-w-md rounded-[2rem] p-6`}
              >
                <form onSubmit={handleLoginSubmit}>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-vouch-cyan">Login</div>
                  <h2 className="mt-2 text-3xl font-black text-white">Welcome back.</h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">Login happens right here — then you're straight into your dashboard.</p>
                  <div className="mt-6 grid gap-3">
                    <input
                      className="ve-input px-4 py-3 text-sm"
                      placeholder="Email"
                      type="email"
                      autoComplete="email"
                      value={authForm.email}
                      onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))}
                    />
                    <input
                      className="ve-input px-4 py-3 text-sm"
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
                    <div className="mt-4 rounded-2xl border border-vouch-emerald/20 bg-vouch-emerald/10 px-4 py-3 text-xs font-bold leading-5 text-vouch-emerald">
                      {authNotice}
                    </div>
                  )}
                  <button type="submit" disabled={authBusy} className={`mt-6 w-full ${PRIMARY} ${authBusy ? 'cursor-wait opacity-70 hover:translate-y-0' : ''}`}>
                    {authBusy ? 'Logging in...' : 'Login → Enter Dashboard'}
                  </button>
                  <button type="button" onClick={() => openSignup('pro_trial')} className="mt-3 w-full text-center text-xs font-bold text-white/40 hover:text-white/70">
                    New here? Start a free trial →
                  </button>
                </form>
              </motion.section>
            )}

            {/* ── SIGNUP WIZARD: features → account → plan → payment → policy ── */}
            {edgeLayer === 'signup' && (
              <motion.section
                key="signup"
                initial={{ y: 18 }}
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
                        <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${active ? 'bg-vouch-cyan text-obsidian-900' : done ? 'bg-vouch-emerald text-obsidian-900' : 'border border-white/15 bg-black/40 text-white/40'}`}>
                          {done ? <Check className="h-3 w-3" /> : i + 1}
                        </div>
                        {i < signupOrder.length - 1 && <div className={`h-px flex-1 ${done ? 'bg-vouch-emerald/60' : 'bg-white/10'}`} />}
                      </div>
                    );
                  })}
                </div>

                <div className={`${Z8_PANEL_PREMIUM} rounded-[2rem] p-6`}>
                  <AnimatePresence mode="wait">

                    {/* 1) FEATURES */}
                    {signupStep === 'features' && (
                      <motion.div key="s-features" initial={{ x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-vouch-cyan">What you unlock</div>
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
                              <div key={title as string} className={`${Z8_SURFACE} rounded-2xl p-4 transition hover:border-vouch-cyan/30`}>
                                <I className="h-5 w-5 text-vouch-cyan" />
                                <div className="mt-3 text-sm font-black text-white">{title as string}</div>
                                <p className="mt-1 text-[11px] leading-5 text-white/40">{body as string}</p>
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
                      <motion.div key="s-account" initial={{ x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-vouch-cyan">Create account</div>
                        <h2 className="mt-2 text-3xl font-black text-white">Your Edge profile.</h2>
                        <div className="mt-5 grid gap-3">
                          <input
                            className="ve-input px-4 py-3 text-sm"
                            placeholder="Name"
                            autoComplete="name"
                            value={authForm.name}
                            onChange={(event) => setAuthForm((form) => ({ ...form, name: event.target.value }))}
                          />
                          <input
                            className="ve-input px-4 py-3 text-sm"
                            placeholder="Email"
                            type="email"
                            autoComplete="email"
                            value={authForm.email}
                            onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))}
                          />
                          <input
                            className="ve-input px-4 py-3 text-sm"
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
                          <div className="mt-4 rounded-2xl border border-vouch-emerald/20 bg-vouch-emerald/10 px-4 py-3 text-xs font-bold leading-5 text-vouch-emerald">
                            {authNotice}
                          </div>
                        )}
                        <div className="mt-6 flex items-center justify-between">
                          <button onClick={signupBack} className="text-xs font-black text-white/40 hover:text-white/70">Back</button>
                          <button onClick={signupNext} className={PRIMARY}><span className="inline-flex items-center gap-2">Choose plan <ArrowRight className="h-4 w-4" /></span></button>
                        </div>
                      </motion.div>
                    )}

                    {/* 3) PLAN */}
                    {signupStep === 'plan' && (
                      <motion.div key="s-plan" initial={{ x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-vouch-cyan">Pick your plan</div>
                        <h2 className="mt-2 text-3xl font-black text-white">Start free, or go Pro.</h2>
                        <div className="mt-5 grid gap-3">
                          {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([id, p]) => {
                            const selected = plan === id;
                            const ring = selected
                              ? p.accent === 'emerald' ? 'border-vouch-emerald/50 bg-vouch-emerald/[0.07]' : 'border-vouch-cyan/50 bg-vouch-cyan/[0.07]'
                              : 'border-white/10 bg-black/40 hover:border-vouch-cyan/30';
                            return (
                              <button key={id} onClick={() => setPlan(id)} className={`relative rounded-2xl border p-4 text-left transition ${ring}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-black text-white">{p.name}</span>
                                      {p.badge && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/70">{p.badge}</span>}
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-white/45">{p.sub}</div>
                                    <ul className="mt-2 space-y-1">
                                      {p.perks.map((perk) => (
                                        <li key={perk} className="flex items-center gap-1.5 text-[11px] text-white/70"><Check className="h-3 w-3 text-vouch-emerald" /> {perk}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-black text-white">{p.price}</div>
                                    <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-vouch-cyan bg-vouch-cyan text-obsidian-900' : 'border-white/20'}`}>
                                      {selected && <Check className="h-3 w-3" />}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <button onClick={signupBack} className="text-xs font-black text-white/40 hover:text-white/70">Back</button>
                          <button onClick={signupNext} className={PRIMARY}>
                            <span className="inline-flex items-center gap-2">{PLANS[plan].paid ? 'Continue to payment' : 'Continue'} <ArrowRight className="h-4 w-4" /></span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* 4) PAYMENT (paid plans only) */}
                    {signupStep === 'payment' && (
                      <motion.div key="s-payment" initial={{ x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-vouch-cyan">Payment</div>
                        <h2 className="mt-2 text-3xl font-black text-white">
                          {plan === 'pro_trial' ? '1.5 weeks free, then $12.99/mo.' : `${PLANS[plan].name} — ${PLANS[plan].price}.`}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-white/45">
                          {plan === 'pro_trial'
                            ? 'You won’t be charged today. Your card holds your trial; cancel anytime before it ends.'
                            : 'Secure checkout. You can cancel your subscription anytime.'}
                        </p>
                        <div className="mt-5 grid gap-3">
                          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/45 px-4 py-3">
                            <CreditCard className="h-4 w-4 text-white/40" />
                            <input className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" placeholder="Card number" inputMode="numeric" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none focus:border-vouch-cyan/50" placeholder="MM / YY" />
                            <input className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none focus:border-vouch-cyan/50" placeholder="CVC" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-white/40">
                          <Lock className="h-3.5 w-3.5 text-vouch-emerald" /> Encrypted checkout · processed by our payment provider
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <button onClick={signupBack} className="text-xs font-black text-white/40 hover:text-white/70">Back</button>
                          <button onClick={signupNext} className={PRIMARY}><span className="inline-flex items-center gap-2">Review terms <ArrowRight className="h-4 w-4" /></span></button>
                        </div>
                      </motion.div>
                    )}

                    {/* 5) POLICY + AGREEMENT VERIFICATION */}
                    {signupStep === 'policy' && (
                      <motion.div key="s-policy" initial={{ x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.32, ease }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-vouch-cyan">Terms &amp; agreement</div>
                        <h2 className="mt-2 text-3xl font-black text-white">Read &amp; agree to continue.</h2>
                        <div className="mt-4 max-h-56 overflow-y-auto whitespace-pre-line rounded-2xl border border-white/10 bg-black/45/80 p-4 text-[11px] leading-5 text-white/45">
                          {POLICY_TEXT}
                        </div>
                        <div className="mt-4 space-y-2.5">
                          {([
                            ['age', 'I am 21+ and in a permitted jurisdiction.'],
                            ['terms', 'I have read and agree to the Terms & Privacy Policy.'],
                            ['research', 'I understand VouchEdge is research/entertainment only — not betting advice.'],
                          ] as const).map(([key, label]) => (
                            <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/35 p-3 transition hover:border-vouch-cyan/30">
                              <button
                                type="button"
                                onClick={() => setAgree((a) => ({ ...a, [key]: !a[key] }))}
                                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${agree[key] ? 'border-vouch-emerald bg-vouch-emerald text-obsidian-900' : 'border-white/20 bg-black/45'}`}
                                aria-pressed={agree[key]}
                              >
                                {agree[key] && <Check className="h-3.5 w-3.5" />}
                              </button>
                              <span className="text-xs leading-5 text-white/70">{label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-3">
                          <button onClick={signupBack} className="text-xs font-black text-white/40 hover:text-white/70">Back</button>
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
                          <div className="mt-4 rounded-2xl border border-vouch-emerald/20 bg-vouch-emerald/10 px-4 py-3 text-xs font-bold leading-5 text-vouch-emerald">
                            {authNotice}
                          </div>
                        )}
                        {!allAgreed && <p className="mt-2 text-right text-[10px] font-bold text-white/30">Check all three boxes to continue.</p>}
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
                initial={{ scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease }}
                className={`${Z8_PANEL_PREMIUM} mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl p-10 text-center font-z8`}
              >
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-3xl bg-vouch-emerald/10 text-vouch-emerald"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-8 w-8" />
                </motion.div>
                <h2 className="mt-5 text-4xl font-black text-white">
                  Welcome{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ' back'}.
                </h2>
                <p className="mt-3 text-sm text-white/40">Building your dashboard…</p>
              </motion.section>
            )}

            {/* ── ISLAND DASHBOARD (real data) ── */}
            {edgeLayer === 'dashboard' && (
              <motion.section
                key="dashboard"
                initial={{ y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease }}
                className="mx-auto max-w-6xl space-y-4 font-z8"
              >
                <section className={`${Z8_PANEL_PREMIUM} rounded-3xl p-5`}>
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <div className="terminal-text text-vouch-emerald">Your Dashboard</div>
                      <h2 className="mt-1.5 text-3xl font-black text-white sm:text-4xl">
                        Welcome back{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}.
                      </h2>
                      <p className="mt-1.5 max-w-2xl text-sm text-white/40">Your command island — real numbers, quick jumps into the site.</p>
                    </div>
                    <button
                      onClick={() => enterSite('feed')}
                      className="rounded-xl bg-vouch-emerald px-6 py-3.5 text-sm font-bold text-black transition hover:-translate-y-0.5"
                    >
                      <span className="inline-flex items-center gap-2"><Home className="h-4 w-4" /> Enter VouchEdge Site</span>
                    </button>
                  </div>

                  {/* Real widgets */}
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="Saved picks" value={dashboardSummaryLoading ? '...' : stats.saved} tone="cyan" />
                    <Stat label="Saved parlays" value={dashboardSummaryLoading ? '...' : stats.saved} tone="cyan" />
                    <Stat label="Pending" value={dashboardSummaryLoading ? '...' : stats.pending} tone="white" />
                    <Stat label="Win rate" value={stats.winRate != null ? `${stats.winRate}%` : '—'} tone="emerald" />
                    <Stat label="Proof score" value={dashboardSummaryLoading ? '...' : stats.winRate} tone="emerald" />
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
                      className={`${Z8_PANEL_PREMIUM} group rounded-2xl p-4 text-left transition hover:-translate-y-0.5`}
                    >
                      <Icon className="h-5 w-5 text-vouch-emerald" />
                      <div className="mt-3 text-sm font-bold text-white">{label}</div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-vouch-cyan opacity-0 transition group-hover:opacity-100">
                        Open <ArrowRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </section>

                <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
                  <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-5`}>
                    <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-white/40" /><h3 className="text-sm font-bold text-white">Pending picks</h3></div>
                    <div className="mt-4 space-y-2">
                      {savedParlays.filter((p) => p.status === 'PENDING').slice(0, 4).map((p) => (
                        <button key={p.id} onClick={() => enterSite('live_parlays')} className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-left hover:border-vouch-cyan/30">
                          <span className="truncate text-xs font-bold text-white/80">{p.title || 'Saved parlay'}</span>
                          <span className="font-mono text-[11px] text-vouch-cyan">{p.totalOdds}</span>
                        </button>
                      ))}
                      {stats.pending === 0 && (
                        <button onClick={() => enterSite('ai_engine')} className="w-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs font-bold text-white/40 hover:text-white/70">
                          No pending picks — build one in V.A.I Smart Picks →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-5`}>
                    <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-white/40" /><h3 className="text-sm font-bold text-white">AI Seat</h3></div>
                    <div className="mt-4 grid gap-2">
                      {['Explain today’s board', 'Compare players', 'Build parlay logic'].map((tool) => (
                        <button key={tool} onClick={() => enterSite('ai_engine')} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-left text-xs font-bold text-white/80 hover:border-vouch-cyan/30">
                          {tool}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => enterSite('themestore')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-xs font-bold text-white/40 hover:text-white/70">
                      <Palette className="h-4 w-4 text-vouch-emerald" /> Theme Studio
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
