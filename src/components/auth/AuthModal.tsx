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
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  isSupabaseConfigured,
} from '../../lib/supabaseClient';
import { apiUrl } from '../../lib/apiBase';
import { startStripeCheckout } from '../../lib/billingClient';

type Mode = 'login' | 'signup';
type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
type SignupPlan = 'free' | 'pro' | 'capper';
type SignupStep = 'intro' | 'plan' | 'form';

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
    price: '$29.99/mo',
    icon: Coins,
    tagline: 'Sell picks, run your own club.',
    perks: ['Everything in Pro', 'Paid storefront, 0% commission', 'Subscriber chat & clubs', 'Locked-in beta price — won’t increase later'],
    beta: true,
  },
];

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
  /** Called after a successful sign-in / sign-up so the host can route into the app. */
  onAuthed?: () => void;
  /** Called when the user chooses to skip auth and browse as a guest. */
  onGuest?: () => void;
}

const PANEL = '#0b1322';
const FIELD = '#0a1120';
const CYAN = '#22d3ee';
const BLURPLE = '#5865F2';

export default function AuthModal({
  open,
  initialMode = 'signup',
  onClose,
  onAuthed,
  onGuest,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signupStep, setSignupStep] = useState<SignupStep>('intro');
  const [introIndex, setIntroIndex] = useState(0);
  const [plan, setPlan] = useState<SignupPlan>('free');
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
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
      setPlan('free');
    }
  }, [open, initialMode]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Live username availability (signup only)
  const checkUsername = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3 || value.length > 24) { setUsernameState(value ? 'invalid' : 'idle'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) { setUsernameState('invalid'); return; }
    setUsernameState('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/auth/username-check?username=${encodeURIComponent(value)}`));
        const data = await res.json();
        setUsernameState(data.available ? 'available' : 'taken');
      } catch {
        // If the check endpoint is unreachable, don't block signup on it.
        setUsernameState('idle');
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
      if (username.trim().length < 3) { setError('Pick a username (3+ characters).'); return; }
      if (usernameState === 'taken') { setError('That username is taken.'); return; }
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await signUpWithEmail({
          email: email.trim(),
          password,
          username: username.trim(),
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

  const usernameHint: Record<UsernameState, { text: string; color: string } | null> = {
    idle: null,
    checking: { text: 'Checking…', color: '#94a3b8' },
    available: { text: 'Available', color: '#34d399' },
    taken: { text: 'Already taken', color: '#f87171' },
    invalid: { text: '3–24 letters, numbers, or _', color: '#fbbf24' },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(2,4,10,0.78)', backdropFilter: 'blur(8px)' }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
          style={{ background: PANEL, borderColor: 'rgba(34,211,238,0.22)' }}
        >
          {/* Glow header band */}
          <div
            className="relative px-6 pt-6 pb-5"
            style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(34,211,238,0.16), transparent 70%)' }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-slate-950 text-sm">
                VE
              </div>
              <span className="font-black tracking-tight text-lg text-white">
                Vouch<span style={{ color: CYAN }}>Edge</span>
              </span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              {emailSent
                ? 'Check your inbox'
                : mode === 'signup' && signupStep === 'intro'
                ? INTRO_SLIDES[introIndex].title
                : mode === 'signup' && signupStep === 'plan'
                ? 'Choose your plan'
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
                : mode === 'signup'
                ? 'Track verified picks, build slips, and unlock the full edge board.'
                : 'Log in to pick up where you left off.'}
            </p>
          </div>

          {emailSent ? (
            /* ── Check-your-email confirmation ── */
            <div className="px-6 py-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}>
                <MailCheck className="w-8 h-8" style={{ color: CYAN }} />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
                We sent a secure link to{' '}
                <span className="font-bold text-white break-all">{email || 'your email'}</span>.
                Click it to {mode === 'signup' ? 'confirm your account' : 'finish signing in'} — it expires in 1 hour.
              </p>
              <button
                onClick={() => { setEmailSent(false); }}
                className="mt-5 w-full py-3 rounded-xl text-sm font-black text-slate-950"
                style={{ background: 'linear-gradient(135deg, #22d3ee, #2563eb)', boxShadow: '0 8px 28px rgba(34,211,238,0.28)' }}
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
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}
                    >
                      <Icon className="w-8 h-8" style={{ color: CYAN }} />
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
                    style={{ width: i === introIndex ? 20 : 6, background: i === introIndex ? CYAN : 'rgba(255,255,255,0.15)' }}
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
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-slate-950"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #2563eb)', boxShadow: '0 8px 28px rgba(34,211,238,0.28)' }}
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
                        background: selected ? 'rgba(34,211,238,0.08)' : FIELD,
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
                  onClick={() => setSignupStep('form')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-slate-950"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #2563eb)', boxShadow: '0 8px 28px rgba(34,211,238,0.28)' }}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Back to plan (signup only) */}
          {mode === 'signup' && (
            <div className="px-6 -mt-1 mb-1">
              <button
                type="button"
                onClick={() => setSignupStep('plan')}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {PLAN_OPTIONS.find((p) => p.id === plan)?.label ?? 'Basic'} plan
              </button>
            </div>
          )}
          {/* Tab switch */}
          <div className="px-6">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: FIELD }}>
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
                        <div key={i} className="flex flex-col items-center gap-1 text-center py-2 rounded-lg" style={{ background: FIELD }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: CYAN }} />
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

            {/* Username (signup) */}
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
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="username"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); checkUsername(e.target.value); }}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                    />
                    {usernameState === 'checking' && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
                    {usernameState === 'available' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {usernameState === 'taken' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  </Field>
                  {usernameHint[usernameState] && (
                    <p className="text-[11px] mt-1 ml-1 font-medium" style={{ color: usernameHint[usernameState]!.color }}>
                      {usernameHint[usernameState]!.text}
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-slate-950 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #22d3ee, #2563eb)', boxShadow: '0 8px 28px rgba(34,211,238,0.28)' }}
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold border transition-colors disabled:opacity-60"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}
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
              className="w-full py-2.5 rounded-xl text-[13px] font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Continue as guest
            </button>
            <p className="text-[10px] text-center leading-relaxed text-slate-600">
              By continuing you agree to our <span className="text-slate-400">Terms</span> &amp;{' '}
              <span className="text-slate-400">Privacy Policy</span>. You must be 21+ and in a jurisdiction
              where this is legal. Probability-based research for entertainment — not betting advice.
            </p>
          </div>
          </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 h-11 rounded-xl border transition-colors focus-within:border-cyan-400/50"
      style={{ background: FIELD, borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <span className="text-slate-500 flex-shrink-0">{icon}</span>
      {children}
    </div>
  );
}
