import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from '../../lib/motion';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Wand2,
  Ticket,
  MailCheck,
  FlaskConical,
  Trophy,
  Coins,
  ClipboardCheck,
  ScrollText,
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  isSupabaseConfigured,
} from '../../lib/supabaseClient';
import { apiUrl } from '../../lib/apiBase';
import { apiClient } from '../../lib/apiClient';
import { startStripeCheckout } from '../../lib/billingClient';
import AuthJudgeWelcome from './AuthJudgeWelcome';
import { Z8_INTERACTIVE, Z8_LABEL, Z8_PANEL_PREMIUM, Z8_SURFACE } from '../../theme/z8Tokens';

type Mode = 'login' | 'signup';
type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
type SignupPlan = 'free' | 'pro' | 'capper';
type SignupStep = 'intro' | 'plan' | 'policy' | 'form';
type AgreementKey = 'age' | 'terms' | 'research';

const POLICY_SECTIONS = [
  {
    title: 'Age & jurisdiction',
    body: 'You must meet the legal age in your jurisdiction (this varies — for example 18/19+ in most of Canada, 21+ in most regulated US states) and be located somewhere probability-based sports research is legal. VouchEdge does not verify your location beyond what you confirm here — you are responsible for knowing your local laws.',
  },
  {
    title: 'Research & entertainment only',
    body: 'VouchEdge is a research and record-keeping tool, not a sportsbook and not betting advice. Every score, grade, and "edge" shown is a probability estimate built from public stats — never a guarantee. We publish wins and losses both; nothing here predicts outcomes with certainty.',
  },
  {
    title: 'No guaranteed returns',
    body: 'Pro and Capper unlock research tools and publishing features, not winning picks. Past grading history (yours or anyone else’s) is not a promise of future results. Never research or wager more than you can afford to lose.',
  },
  {
    title: 'Your data',
    body: 'We store your email, username, saved picks, and grading history to run your account. We don’t sell your data to third parties. You can request deletion of your account and data at any time from Settings.',
  },
  {
    title: 'Billing (Pro & Capper only)',
    body: 'Paid plans renew monthly via Stripe until you cancel. Beta pricing is locked in for as long as you stay subscribed without a lapse. You can cancel or manage billing anytime from the Upgrade page — no phone call or email required.',
  },
] as const;

const AGREEMENTS: Array<{ id: AgreementKey; label: string }> = [
  { id: 'age', label: 'I am of legal age in my jurisdiction and located somewhere this is legal.' },
  { id: 'terms', label: 'I’ve read and agree to the Terms of Service, Privacy Policy, and billing terms above.' },
  { id: 'research', label: 'I understand this is probability research for entertainment — not betting advice, with no guaranteed returns.' },
];

const INTRO_SLIDES = [
  {
    icon: ClipboardCheck,
    title: 'Every pick graded, win or lose.',
    body: 'Your picks lock before first pitch and get checked against the official box score — no hiding a bad night.',
  },
  {
    icon: Trophy,
    title: 'Build slips, follow cappers, track the record.',
    body: 'Save parlays, follow research you trust, and see real win rates — not screenshots.',
  },
] as const;

const PLAN_OPTIONS: Array<{
  id: SignupPlan;
  label: string;
  price: string;
  icon: typeof ShieldCheck;
  tagline: string;
  perks: string[];
  beta?: boolean;
}> = [
  {
    id: 'free',
    label: 'Basic',
    price: 'Free',
    icon: ShieldCheck,
    tagline: 'Track picks and build slips.',
    perks: ['Up to 20 saved slips', 'Public ledger', 'Community feed'],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: '$19.99/mo',
    icon: FlaskConical,
    tagline: 'Unlock every research lab.',
    perks: ['All Pro Labs (Live Game, Player Edge, Team Matchup, Graphs)', 'Verified badge', 'Signal graphs & confidence meters', 'Locked-in beta price — won’t increase later'],
    beta: true,
  },
  {
    id: 'capper',
    label: 'Capper',
    price: '$34.99/mo',
    icon: Coins,
    tagline: 'Sell picks, run your own club.',
    perks: ['Everything in Pro', 'Paid storefront, 0% commission', 'Subscriber chat & clubs', 'Locked-in beta price — won’t increase later'],
    beta: true,
  },
];

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  initialPlan?: SignupPlan;
  onClose: () => void;
  /** Called after a successful sign-in / sign-up so the host can route into the app. */
  onAuthed?: () => void;
  /** Called when the user chooses to skip auth and browse as a guest. */
  onGuest?: () => void;
}

const CYAN_GRADIENT = 'linear-gradient(135deg, #00F0FF, #2563eb)';
const CYAN_SHADOW = '0 8px 32px rgba(0,240,255,0.22)';
const CYAN = '#00F0FF';
const BLURPLE = '#5865F2';

export default function AuthModal({
  open,
  initialMode = 'signup',
  initialPlan = 'free',
  onClose,
  onAuthed,
  onGuest,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signupStep, setSignupStep] = useState<SignupStep>('intro');
  const [introIndex, setIntroIndex] = useState(0);
  const [plan, setPlan] = useState<SignupPlan>('free');
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({ age: false, terms: false, research: false });
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [handleState, setHandleState] = useState<HandleState>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync mode when reopened with a different intent
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setNotice(null);
      setEmailSent(false);
      setSignupStep(initialMode === 'signup' ? 'intro' : 'form');
      setIntroIndex(0);
      setPlan(initialPlan);
      setAgreements({ age: false, terms: false, research: false });
    }
  }, [open, initialMode, initialPlan]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Live @handle availability (signup only)
  const checkHandle = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const normalized = value.trim().toLowerCase();
    if (normalized.length < 3 || normalized.length > 30) { setHandleState(normalized ? 'invalid' : 'idle'); return; }
    if (!/^[a-z0-9][a-z0-9_]*$/.test(normalized)) { setHandleState('invalid'); return; }
    setHandleState('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiClient.get<{ available?: boolean }>(`/api/users/handle/${encodeURIComponent(normalized)}`);
        setHandleState(data.available ? 'available' : 'taken');
      } catch {
        // If the check endpoint is unreachable, don't block signup on it.
        setHandleState('idle');
      }
    }, 450);
  }, []);

  const passwordStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const friendlyError = (raw: string): string => {
    const m = raw.toLowerCase();
    if (m.includes('invalid login')) return 'Email or password is incorrect.';
    if (m.includes('already registered') || m.includes('already been registered')) return 'That email is already registered — try logging in.';
    if (m.includes('password')) return 'Password must be at least 6 characters.';
    if (m.includes('email')) return 'Please enter a valid email address.';
    if (m.includes('rate')) return 'Too many attempts. Please wait a moment and try again.';
    return raw;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setNotice("Accounts aren't enabled in this environment yet. You can explore everything as a guest.");
      return;
    }

    if (!email.trim()) { setError('Enter your email.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    if (mode === 'signup') {
      const normalizedHandle = handle.trim().toLowerCase();
      if (normalizedHandle.length < 3) { setError('Pick a handle (3+ characters).'); return; }
      if (!/^[a-z0-9][a-z0-9_]*$/.test(normalizedHandle)) {
        setError('Handle must start with a letter or number and use only lowercase letters, numbers, and underscores.');
        return;
      }
      if (handleState === 'taken') { setError('That handle is already taken.'); return; }
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await signUpWithEmail({
          email: email.trim(),
          password,
          handle: handle.trim().toLowerCase(),
          inviteCode: inviteCode.trim() || undefined,
        });
        if (error) { setError(friendlyError(error.message)); return; }
        if (data?.session) {
          // Email confirmation is disabled on this Supabase project — signUp
          // already returned a live session, so the user is logged in right
          // now. Route them straight in instead of showing a false
          // "check your inbox" step for an email that isn't coming.
          if (plan === 'pro' || plan === 'capper') {
            setRedirectingToCheckout(true);
            const result = await startStripeCheckout(plan === 'pro' ? 'gold' : 'seller_pro');
            if (result.ok) {
              window.location.href = result.url;
              return;
            }
            setRedirectingToCheckout(false);
            setNotice('Checkout is not active yet in this environment — continuing with a free account for now.');
          }
          onAuthed?.();
        } else {
          setEmailSent(true);
        }
      } else {
        const { error } = await signInWithEmail({ email: email.trim(), password });
        if (error) { setError(friendlyError(error.message)); return; }
        onAuthed?.();
      }
    } catch (err: any) {
      setError(friendlyError(err?.message ?? 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    setError(null);
    setNotice(null);
    if (!isSupabaseConfigured) {
      setNotice("Accounts aren't enabled in this environment yet. You can explore everything as a guest.");
      return;
    }
    if (!email.trim()) { setError('Enter your email first.'); return; }
    setBusy(true);
    try {
      const { error } = await signInWithMagicLink(email.trim());
      if (error) { setError(friendlyError(error.message)); return; }
      setEmailSent(true);
    } catch (err: any) {
      setError(friendlyError(err?.message ?? 'Could not send magic link.'));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const handleHint: Record<HandleState, { text: string; color: string } | null> = {
    idle: null,
    checking: { text: 'Checking…', color: '#94a3b8' },
    available: { text: 'Available', color: '#34d399' },
    taken: { text: 'Already taken', color: '#f87171' },
    invalid: { text: '3–30 chars, lowercase letters, numbers, or _', color: '#fbbf24' },
  };

  return (
    <AnimatePresence initial={false}>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 font-z8"
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(2,4,10,0.82)', backdropFilter: 'blur(12px)' }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.65)] lg:max-w-4xl lg:flex-row ${Z8_PANEL_PREMIUM}`}
        >
          {/* Judge welcome — desktop sidebar */}
          <div className="hidden lg:flex lg:w-[38%] lg:min-w-[260px] lg:max-w-[320px]">
            <AuthJudgeWelcome className="h-full w-full rounded-none border-0 shadow-none" />
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Glow header band */}
          <div
            className="relative px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5"
            style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(0,240,255,0.12), transparent 70%)' }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors ${Z8_INTERACTIVE}`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Mobile judge strip */}
            <div className="mb-4 lg:hidden">
              <AuthJudgeWelcome compact />
            </div>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-vouch-cyan/35 bg-vouch-cyan/10 font-black text-sm text-vouch-cyan shadow-[0_0_16px_rgba(0,240,255,0.15)]">
                VE
              </div>
              <div>
                <span className="font-black tracking-tight text-lg text-white">
                  Vouch<span className="text-vouch-cyan">Edge</span>
                </span>
                <p className={`${Z8_LABEL} text-white/30`}>Trust-first research</p>
              </div>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              {emailSent
                ? 'Check your inbox'
                : mode === 'signup' && signupStep === 'intro'
                ? INTRO_SLIDES[introIndex].title
                : mode === 'signup' && signupStep === 'plan'
                ? 'Choose your plan'
                : mode === 'signup' && signupStep === 'policy'
                ? 'Review & agree'
                : mode === 'signup'
                ? 'Create your account'
                : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {emailSent
                ? 'One more step to finish setting up your account.'
                : mode === 'signup' && signupStep === 'intro'
                ? INTRO_SLIDES[introIndex].body
                : mode === 'signup' && signupStep === 'plan'
                ? 'Pro tools are in beta — signing up now helps support development and locks in early access.'
                : mode === 'signup' && signupStep === 'policy'
                ? 'A quick, honest read before you create an account.'
                : mode === 'signup'
                ? 'Track verified picks, build slips, and unlock the full edge board.'
                : 'Log in to pick up where you left off.'}
            </p>
          </div>

          {emailSent ? (
            /* ── Check-your-email confirmation ── */
            <div className="px-6 py-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-vouch-cyan/30 bg-vouch-cyan/10"
                style={{ boxShadow: '0 0 24px rgba(0,240,255,0.12)' }}>
                <MailCheck className="w-8 h-8 text-vouch-cyan" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
                We sent a secure link to{' '}
                <span className="font-bold text-white break-all">{email || 'your email'}</span>.
                Click it to {mode === 'signup' ? 'confirm your account' : 'finish signing in'} — it expires in 1 hour.
              </p>
              <button
                onClick={() => { setEmailSent(false); }}
                className={`mt-5 w-full py-3 rounded-xl text-sm font-black text-black ${Z8_INTERACTIVE}`}
                style={{ background: CYAN_GRADIENT, boxShadow: CYAN_SHADOW }}
              >
                Got it
              </button>
              <button
                onClick={() => { setEmailSent(false); setMode('login'); }}
                className="mt-2 text-[13px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : mode === 'signup' && signupStep === 'intro' ? (
            /* ── Intro slides ── */
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center gap-2 py-6">
                {(() => {
                  const Icon = INTRO_SLIDES[introIndex].icon;
                  return (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center border border-vouch-cyan/30 bg-vouch-cyan/10"
                      style={{ boxShadow: '0 0 24px rgba(0,240,255,0.12)' }}
                    >
                      <Icon className="w-8 h-8 text-vouch-cyan" />
                    </div>
                  );
                })()}
              </div>

              {/* Slide dots */}
              <div className="flex items-center justify-center gap-1.5 mb-5">
                {INTRO_SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === introIndex ? 20 : 6, background: i === introIndex ? '#00F0FF' : 'rgba(255,255,255,0.15)' }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {introIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setIntroIndex((i) => Math.max(0, i - 1))}
                    className="flex items-center justify-center w-11 h-11 rounded-xl border shrink-0"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (introIndex < INTRO_SLIDES.length - 1) setIntroIndex((i) => i + 1);
                    else setSignupStep('plan');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black ${Z8_INTERACTIVE}`}
                  style={{ background: CYAN_GRADIENT, boxShadow: CYAN_SHADOW }}
                >
                  {introIndex < INTRO_SLIDES.length - 1 ? 'Next' : "Let's go"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSignupStep('plan')}
                className="w-full mt-2 text-[13px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
              >
                Skip
              </button>
            </div>
          ) : mode === 'signup' && signupStep === 'plan' ? (
            /* ── Plan selection ── */
            <div className="px-6 pb-6">
              <div className="space-y-2.5">
                {PLAN_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = plan === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPlan(opt.id)}
                      className="w-full text-left rounded-xl border p-3.5 transition-colors"
                      style={{
                        background: selected ? 'rgba(0,240,255,0.08)' : 'rgba(0,0,0,0.35)',
                        borderColor: selected ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: selected ? 'rgba(34,211,238,0.16)' : 'rgba(255,255,255,0.05)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: selected ? CYAN : '#94a3b8' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">{opt.label}</span>
                            <span className="text-xs font-bold" style={{ color: CYAN }}>{opt.price}</span>
                            {opt.beta && (
                              <span
                                className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(251,191,36,0.14)', color: '#fbbf24' }}
                              >
                                Beta
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{opt.tagline}</p>
                          <ul className="mt-1.5 space-y-0.5">
                            {opt.perks.map((perk) => (
                              <li key={perk} className="flex items-start gap-1.5 text-[10px] text-slate-500">
                                <Check className="w-3 h-3 shrink-0 mt-0.5" style={{ color: selected ? CYAN : '#64748b' }} />
                                {perk}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                          style={{ borderColor: selected ? CYAN : 'rgba(255,255,255,0.2)' }}
                        >
                          {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ background: CYAN }} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(plan === 'pro' || plan === 'capper') && (
                <p className="mt-3 text-[11px] leading-relaxed text-center" style={{ color: '#fbbf24' }}>
                  This tier is in beta — you're an early supporter and lock in this price for as long as you stay subscribed.
                </p>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSignupStep('intro')}
                  className="flex items-center justify-center w-11 h-11 rounded-xl border shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSignupStep('policy')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black ${Z8_INTERACTIVE}`}
                  style={{ background: CYAN_GRADIENT, boxShadow: CYAN_SHADOW }}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : mode === 'signup' && signupStep === 'policy' ? (
            /* ── Policy agreement ── */
            <div className="px-6 pb-6">
              <div
                className={`max-h-56 overflow-y-auto rounded-xl border p-4 space-y-3 ${Z8_SURFACE}`}
              >
                {POLICY_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className={`${Z8_LABEL} text-vouch-cyan`}>{section.title}</p>
                    <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: '#94a3b8' }}>{section.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2.5">
                {AGREEMENTS.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors"
                    style={{
                      background: agreements[item.id] ? 'rgba(0,240,255,0.06)' : 'rgba(0,0,0,0.35)',
                      borderColor: agreements[item.id] ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                      style={{
                        borderColor: agreements[item.id] ? CYAN : 'rgba(255,255,255,0.2)',
                        background: agreements[item.id] ? CYAN : 'transparent',
                      }}
                    >
                      {agreements[item.id] && <Check className="w-3 h-3" style={{ color: '#0b1322' }} />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={agreements[item.id]}
                      onChange={() => setAgreements((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    />
                    <span className="text-[12px] leading-5 text-slate-300">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSignupStep('plan')}
                  className="flex items-center justify-center w-11 h-11 rounded-xl border shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={!agreements.age || !agreements.terms || !agreements.research}
                  onClick={() => setSignupStep('form')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${Z8_INTERACTIVE}`}
                  style={{ background: CYAN_GRADIENT, boxShadow: CYAN_SHADOW }}
                >
                  Agree & continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {!(agreements.age && agreements.terms && agreements.research) && (
                <p className="mt-2 text-[11px] text-center" style={{ color: '#64748b' }}>
                  Check all three boxes to continue.
                </p>
              )}
            </div>
          ) : (
          <>
          {/* Back to policy agreement (signup only) */}
          {mode === 'signup' && (
            <div className="px-6 -mt-1 mb-1">
              <button
                type="button"
                onClick={() => setSignupStep('policy')}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {PLAN_OPTIONS.find((p) => p.id === plan)?.label ?? 'Basic'} plan
              </button>
            </div>
          )}
          {/* Tab switch */}
          <div className="px-6">
            <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl ${Z8_SURFACE}`}>
              {(['signup', 'login'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setNotice(null); setSignupStep(m === 'signup' ? 'intro' : 'form'); setIntroIndex(0); }}
                  className="relative py-2 text-sm font-bold rounded-lg transition-colors"
                  style={{ color: mode === m ? '#fff' : '#64748b' }}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{m === 'signup' ? 'Sign Up' : 'Log In'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Perks strip — signup only */}
          <AnimatePresence initial={false}>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-6 pt-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: ShieldCheck, label: 'Verified record' },
                      { icon: Sparkles, label: 'Save your slips' },
                      { icon: ArrowRight, label: 'Climb the board' },
                    ].map((p, i) => {
                      const Icon = p.icon;
                      return (
                        <div key={i} className={`flex flex-col items-center gap-1 text-center py-2 rounded-lg ${Z8_SURFACE}`}>
                          <Icon className="w-3.5 h-3.5 text-vouch-cyan" />
                          <span className="text-[10px] font-semibold text-slate-400 leading-tight">{p.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3.5">
            {/* Email */}
            <Field icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </Field>

            {/* Handle (signup) */}
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Field icon={<User className="w-4 h-4" />}>
                    <span className="text-sm text-slate-500 shrink-0">@</span>
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="yourhandle"
                      value={handle}
                      onChange={(e) => {
                        const next = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setHandle(next);
                        checkHandle(next);
                      }}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                    />
                    {handleState === 'checking' && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
                    {handleState === 'available' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {handleState === 'taken' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  </Field>
                  {handleHint[handleState] && (
                    <p className="text-[11px] mt-1 ml-1 font-medium" style={{ color: handleHint[handleState]!.color }}>
                      {handleHint[handleState]!.text}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div>
              <Field icon={<Lock className="w-4 h-4" />}>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>
              {mode === 'signup' && password.length > 0 && (
                <div className="flex gap-1 mt-1.5 px-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        background:
                          i < passwordStrength
                            ? ['#f87171', '#fbbf24', '#34d399', '#22d3ee'][passwordStrength - 1]
                            : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Invite code (signup) — optional during preview, required at private-beta launch */}
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Field icon={<Ticket className="w-4 h-4" />}>
                    <input
                      type="text"
                      placeholder="Invite code — optional (VE-XXXXXXXX)"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none tracking-wide"
                    />
                  </Field>
                  <p className="text-[11px] mt-1 ml-1" style={{ color: '#7c8aa0' }}>
                    VouchEdge is in private beta. No code?{' '}
                    <button type="button" onClick={onGuest} className="font-semibold underline" style={{ color: BLURPLE }}>
                      Join the waitlist
                    </button>
                    .
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error / notice */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 text-[13px] rounded-lg px-3 py-2"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 text-[13px] rounded-lg px-3 py-2"
                  style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{notice}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary */}
            <button
              type="submit"
              disabled={busy || redirectingToCheckout}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black transition-all disabled:opacity-60 ${Z8_INTERACTIVE}`}
              style={{ background: CYAN_GRADIENT, boxShadow: CYAN_SHADOW }}
            >
              {redirectingToCheckout ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signup'
                    ? plan === 'free' ? 'Create account' : `Create account & continue to ${PLAN_OPTIONS.find((p) => p.id === plan)?.label}`
                    : 'Log in'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Magic link */}
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={busy}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold border border-white/10 text-white/80 transition-colors disabled:opacity-60 hover:border-vouch-cyan/30 hover:text-white ${Z8_INTERACTIVE}`}
            >
              <Wand2 className="w-3.5 h-3.5" style={{ color: BLURPLE }} />
              Email me a magic link instead
            </button>
          </form>

          {/* Footer — guest + trust */}
          <div className="px-6 pb-6 pt-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] uppercase tracking-widest text-slate-600 font-mono">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <button
              onClick={onGuest}
              className={`w-full py-2.5 rounded-xl text-[13px] font-bold text-white/55 hover:text-white hover:bg-white/5 transition-colors ${Z8_INTERACTIVE}`}
            >
              Continue as guest
            </button>
            <p className="text-[10px] text-center leading-relaxed text-slate-600">
              By continuing you agree to our <span className="text-slate-400">Terms</span> &amp;{' '}
              <span className="text-slate-400">Privacy Policy</span>. You must be of legal age in your jurisdiction
              and located somewhere this is legal. Probability-based research for entertainment — not betting advice.
            </p>
          </div>
          </>
          )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 h-11 rounded-xl transition-colors focus-within:border-vouch-cyan/45 focus-within:ring-1 focus-within:ring-vouch-cyan/20 ${Z8_SURFACE}`}
    >
      <span className="text-white/35 flex-shrink-0">{icon}</span>
      {children}
    </div>
  );
}
