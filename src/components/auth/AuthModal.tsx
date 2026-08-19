import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ClipboardCheck,
  ScrollText,
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
  requestPasswordReset,
  getGoogleAuthAvailability,
  isSupabaseConfigured,
} from '../../lib/supabaseClient';
import { apiUrl } from '../../lib/apiBase';
import { apiClient } from '../../lib/apiClient';
import { startStripeCheckout } from '../../lib/billingClient';
import { FREE_BETA_ALL_ACCESS, FREE_BETA_BLURB, PAYMENTS_ENABLED } from '../../lib/betaAccess';
import { useBodyScrollLock } from '../../lib/scroll/useBodyScrollLock';
import VouchEdgeLogo from '../brand/VouchEdgeLogo';
import { AURORA_INTERACTIVE, AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SURFACE, AURORA_AUTH_GRADIENT, AURORA_AUTH_SHADOW, AURORA_CYAN_HEX, AURORA_BLURPLE_HEX } from '../../theme/auroraTokens';
import '../../styles/auth-modal.css';

type Mode = 'login' | 'signup';
type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
type SignupPlan = 'free' | 'pro';
type SignupStep = 'intro' | 'questionnaire' | 'plan' | 'policy' | 'form';
type AgreementKey = 'age' | 'terms' | 'research';

const BILLING_POLICY_SECTION = FREE_BETA_ALL_ACCESS
  ? {
      title: 'Billing (free open beta)',
      body: 'VouchEdge is in free open beta. Every feature is unlocked on every account, no payment is collected, and no card is stored. There is no subscription and nothing to cancel. If paid plans return after the beta, you will be told before anything is ever charged.',
    }
  : {
      title: 'Billing (Beta plan)',
      body: 'The Beta plan is free for 7 days, then renews at $7.99/month via Stripe until you cancel. You can cancel or manage billing anytime from the Upgrade page — no phone call or email required.',
    };

const POLICY_SECTIONS = [
  {
    title: 'Age & jurisdiction',
    body: 'You must meet the legal age in your jurisdiction (this varies — for example 18/19+ in most of Canada, 21+ in most regulated US states) and be located somewhere probability-based sports research is legal. VouchEdge does not verify your location beyond what you confirm here — you are responsible for knowing your local laws.',
  },
  {
    title: 'Research & entertainment only',
    body: 'VouchEdge is a research and record-keeping tool, not a sportsbook and not betting advice. Research signals and confidence estimates are built from public stats — never a guarantee. Wins and losses both remain visible; nothing here predicts outcomes with certainty.',
  },
  {
    title: 'No guaranteed returns',
    body: 'VouchEdge unlocks research tools and publishing features, not winning picks. Past grading history (yours or anyone else’s) is not a promise of future results. Never research or wager more than you can afford to lose.',
  },
  {
    title: 'Your data',
    body: 'We store your email, username, saved picks, and grading history to run your account. We don’t sell your data to third parties. You can request deletion of your account and data at any time from Settings.',
  },
  BILLING_POLICY_SECTION,
] as const;

const AGREEMENTS: Array<{ id: AgreementKey; label: string }> = [
  { id: 'age', label: 'I am of legal age in my jurisdiction and located somewhere this is legal.' },
  { id: 'terms', label: 'I’ve read and agree to the account, privacy, and billing terms shown above.' },
  { id: 'research', label: 'I understand this is probability research for entertainment — not betting advice, with no guaranteed returns.' },
];

const INTRO_SLIDES = [
  {
    icon: ClipboardCheck,
    title: 'Keep graded results visible.',
    body: 'When grading data is available, results stay attached to the original research — including the losses.',
  },
  {
    icon: Trophy,
    title: 'Build slips, follow cappers, track the record.',
    body: 'Save parlays, follow research you trust, and see real win rates — not screenshots.',
  },
] as const;

const PAID_PLAN_OPTIONS: Array<{
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
    perks: ['Saved research workspace', 'Public research record', 'MLB game context'],
  },
  {
    id: 'pro',
    label: 'VouchEdge Beta',
    price: '7 days free, then $7.99/mo',
    icon: FlaskConical,
    tagline: 'Unlock every research lab. Cancel anytime.',
    perks: ['All Pro Labs (Live Game, Player Edge, Team Matchup, Graphs)', 'Verified badge', 'Signal graphs & confidence meters', '7-day free trial, then $7.99/month'],
    beta: true,
  },
];

/** During the free open beta there is only one plan and it costs nothing. */
const FREE_BETA_PLAN_OPTIONS: typeof PAID_PLAN_OPTIONS = [
  {
    id: 'free',
    label: 'Free open beta',
    price: 'Free — no card required',
    icon: FlaskConical,
    tagline: 'Every feature is unlocked during the beta.',
    perks: ['All Pro Labs (Live Game, Player Edge, Team Matchup, Graphs)', 'All V.A.I rooms and AI Edge Lab', 'ParlayOS building and tracking', 'No subscription, nothing to cancel'],
    beta: true,
  },
];

const PLAN_OPTIONS = FREE_BETA_ALL_ACCESS ? FREE_BETA_PLAN_OPTIONS : PAID_PLAN_OPTIONS;

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  initialPlan?: SignupPlan;
  onClose: () => void;
  /** Called after a successful sign-in / sign-up so the host can route into the app. */
  onAuthed?: () => void;
}


export default function AuthModal({
  open,
  initialMode = 'signup',
  initialPlan: requestedPlan = 'free',
  onClose,
  onAuthed,
}: AuthModalProps) {
  // During the free open beta 'pro' is not an offered plan — callers that ask
  // for it (e.g. the landing "Join Beta" CTA) collapse onto the single free one.
  const initialPlan: SignupPlan = FREE_BETA_ALL_ACCESS ? 'free' : requestedPlan;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [signupStep, setSignupStep] = useState<SignupStep>(() =>
    initialMode === 'signup' ? (initialPlan === 'free' ? 'policy' : 'plan') : 'form',
  );
  const [introIndex, setIntroIndex] = useState(0);
  const [plan, setPlan] = useState<SignupPlan>(initialPlan);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({ age: false, terms: false, research: false });
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [handleState, setHandleState] = useState<HandleState>('idle');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useBodyScrollLock(open);

  // Sync mode when reopened with a different intent
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setNotice(null);
      setEmailSent(false);
      setGoogleBusy(false);
      setSignupStep(initialMode === 'signup' ? (initialPlan === 'free' ? 'policy' : 'plan') : 'form');
      setIntroIndex(0);
      setPlan(initialPlan);
      setAgreements({ age: false, terms: false, research: false });
    }
  }, [open, initialMode, initialPlan]);

  useEffect(() => {
    if (!open || !isSupabaseConfigured) return;
    let cancelled = false;
    void getGoogleAuthAvailability().then((available) => {
      if (!cancelled) setGoogleAvailable(available);
    });
    return () => { cancelled = true; };
  }, [open]);

  // Keep keyboard focus inside the modal and restore it to the opener on close.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => {
      (emailInputRef.current ?? closeButtonRef.current)?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden') && element.offsetParent !== null);

      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [emailSent, mode, open, signupStep]);

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
    if (m.includes('email not confirmed') || m.includes('confirm your email')) {
      return 'Confirm your email before logging in.';
    }
    if (m.includes('password')) return 'Password must be at least 6 characters.';
    if (
      m.includes('invalid email')
      || m.includes('unable to validate email')
      || m.includes('valid email address')
      || m.includes('email format')
    ) {
      return 'Please enter a valid email address.';
    }
    if (m.includes('email rate limit') || m.includes('email send rate limit')) {
      return 'Confirmation email sending is temporarily at its limit. Please try again later.';
    }
    if (m.includes('unsupported provider') || m.includes('provider is not enabled')) {
      return 'Google sign-in is not enabled yet. Use email or a magic link for now.';
    }
    if (m.includes('rate')) return 'Too many attempts. Please wait a moment and try again.';
    return raw;
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError(
        'Login is not configured locally. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local (Supabase → Project Settings → API), then restart npm run dev.',
      );
      return;
    }

    if (!email.trim()) { setError('Enter your email.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
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
          // No checkout during the free open beta — the account is already
          // fully entitled the moment it exists.
          if (plan === 'pro' && PAYMENTS_ENABLED) {
            setRedirectingToCheckout(true);
            const result = await startStripeCheckout();
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
        const { data, error } = await signInWithEmail({ email: email.trim(), password });
        if (error) { setError(friendlyError(error.message)); return; }
        if (!data?.session) {
          setError('Sign-in succeeded but no session was returned. Check your email for a confirmation link.');
          return;
        }
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
      setError(
        'Login is not configured locally. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local (Supabase → Project Settings → API), then restart npm run dev.',
      );
      return;
    }
    if (!email.trim()) { setError('Enter your email first.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
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

  async function handleForgotPassword() {
    setError(null);
    setNotice(null);
    if (!isSupabaseConfigured) {
      setError('Password recovery is not configured in this environment.');
      return;
    }
    if (!email.trim()) { setError('Enter your email first.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }

    setBusy(true);
    try {
      const { error } = await requestPasswordReset(email.trim());
      if (error) { setError(friendlyError(error.message)); return; }
      setNotice(`If an account exists for ${email.trim()}, a password reset link is on its way.`);
    } catch (err: any) {
      setError(friendlyError(err?.message ?? 'Could not send the password reset email.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError(
        'Login is not configured locally. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local (Supabase → Project Settings → API), then restart npm run dev.',
      );
      return;
    }

    const providerAvailable = googleAvailable ?? await getGoogleAuthAvailability();
    if (providerAvailable === false) {
      setGoogleAvailable(false);
      setError('Google sign-in is being configured. Use email or a magic link for now.');
      return;
    }

    setGoogleBusy(true);
    let timeoutId: number | undefined;
    try {
      const { data, error } = await Promise.race([
        signInWithGoogle(),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(
            () => reject(new Error('Google sign-in took too long. Try again or use email instead.')),
            10_000,
          );
        }),
      ]);
      if (error) {
        setError(friendlyError(error.message));
        setGoogleBusy(false);
        return;
      }
      if (!data?.url) {
        setError('Google sign-in could not be started. Try email instead.');
        setGoogleBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch (err: any) {
      setError(friendlyError(err?.message ?? 'Could not continue with Google.'));
      setGoogleBusy(false);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
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

  return createPortal(
    (
      <div
        className="ve-auth-backdrop fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 font-z8"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ve-auth-title"
          tabIndex={-1}
          className="ve-auth-dialog ve-auth-vouch-dialog"
        >
          <header className="ve-auth-vouch-topbar">
            <button
              type="button"
              className="ve-auth-vouch-brand"
              onClick={onClose}
              aria-label="Back to VouchEdge"
            >
              <span>VouchEdge</span>
              <b>OPEN BETA</b>
            </button>

            <div className="ve-auth-vouch-status">
              <i />
              <span>SECURE ACCOUNT ACCESS</span>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ve-auth-vouch-close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="ve-auth-vouch-layout">
            <aside className="ve-auth-vouch-story ve-auth-aurora-panel">
              <div>
                <span className="ve-auth-vouch-kicker">
                  {mode === 'signup' ? 'ACCOUNT / 02' : 'ACCOUNT / 01'}
                </span>

                <h1>
                  {mode === 'signup' ? (
                    <>
                      Build a record
                      <br />
                      that <em>holds up.</em>
                    </>
                  ) : (
                    <>
                      Welcome
                      <br />
                      <em>back.</em>
                    </>
                  )}
                </h1>

                <p>
                  {mode === 'signup'
                    ? 'Research, Vouch, and build an accountable record before the result is known.'
                    : 'Continue your research record. Your reasoning, Vouches, and available grading stay connected to one account.'}
                </p>
              </div>

              <div className="ve-auth-vouch-proof">
                {mode === 'signup' ? (
                  <>
                    <div>
                      <span>01</span>
                      <p>$0 Open Beta</p>
                    </div>
                    <div>
                      <span>02</span>
                      <p>No credit card</p>
                    </div>
                    <div>
                      <span>03</span>
                      <p>Results stay attached</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span>01</span>
                      <p>Research stays connected</p>
                    </div>
                    <div>
                      <span>02</span>
                      <p>Reasoning stays inspectable</p>
                    </div>
                    <div>
                      <span>03</span>
                      <p>Results remain visible</p>
                    </div>
                  </>
                )}
              </div>

              <div className="ve-auth-vouch-system">
                <i />
                SYSTEM ONLINE
              </div>
            </aside>

            <section className="ve-auth-form-panel">
              <div className="ve-auth-form-header">
                <span className="ve-auth-vouch-panel-label">
                  {mode === 'signup' ? 'CREATE ACCOUNT' : 'ACCOUNT ACCESS'}
                </span>

                <h2
                  ref={titleRef}
                  id="ve-auth-title"
                  tabIndex={-1}
                >
                  {emailSent
                    ? 'Check your inbox'
                    : mode === 'signup' && signupStep === 'intro'
                    ? INTRO_SLIDES[introIndex].title
                    : mode === 'signup' && signupStep === 'plan'
                    ? (FREE_BETA_ALL_ACCESS ? 'Your beta access' : 'Choose your plan')
                    : mode === 'signup' && signupStep === 'policy'
                    ? 'Review & agree'
                    : mode === 'signup'
                    ? 'Create your account'
                    : 'Welcome back'}
                </h2>

                <p>
                  {emailSent
                    ? 'One more step to finish setting up your account.'
                    : mode === 'signup' && signupStep === 'intro'
                    ? INTRO_SLIDES[introIndex].body
                    : mode === 'signup' && signupStep === 'plan'
                    ? (FREE_BETA_ALL_ACCESS
                        ? 'Every feature is unlocked on every account during the beta.'
                        : 'Choose your research plan before creating your account.')
                    : mode === 'signup' && signupStep === 'policy'
                    ? 'A quick, clear review before you create an account.'
                    : mode === 'signup'
                    ? 'Create one account for your research workspace and visible record.'
                    : 'Log in to pick up where you left off.'}
                </p>
              </div>

          {emailSent ? (
            /* ── Check-your-email confirmation ── */
            <div className="px-6 py-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-vouch-cyan/30 bg-vouch-cyan/10"
                style={{ boxShadow: '0 0 24px rgba(0, 217, 160,0.12)' }}>
                <MailCheck className="w-8 h-8 text-vouch-cyan" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
                We sent a secure link to{' '}
                <span className="font-bold text-white break-all">{email || 'your email'}</span>.
                Click it to {mode === 'signup' ? 'confirm your account' : 'finish signing in'}.
              </p>
              <button
                onClick={() => { setEmailSent(false); }}
                className={`mt-5 w-full py-3 rounded-xl text-sm font-black text-black ${AURORA_INTERACTIVE}`}
                style={{ background: AURORA_AUTH_GRADIENT, boxShadow: AURORA_AUTH_SHADOW }}
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
                      style={{ boxShadow: '0 0 24px rgba(0, 217, 160,0.12)' }}
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
                    style={{ width: i === introIndex ? 20 : 6, background: i === introIndex ? '#00D9A0' : 'rgba(255,255,255,0.15)' }}
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
                    else setSignupStep('questionnaire');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black ${AURORA_INTERACTIVE}`}
                  style={{ background: AURORA_AUTH_GRADIENT, boxShadow: AURORA_AUTH_SHADOW }}
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
          ) : mode === 'signup' && signupStep === 'questionnaire' ? (
            /* ── Questionnaire selection ── */
            <div className="px-6 pb-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-white">How do you plan to use VouchEdge?</h3>
                <p className="mt-1 text-sm text-slate-400">Select your primary goal so we can tailor your experience.</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'track', label: 'Track my own picks', icon: ClipboardCheck, desc: 'Immutable record keeping' },
                  { id: 'follow', label: 'Find sharp research', icon: Eye, desc: 'Follow verified cappers' },
                  { id: 'build', label: 'Build an audience', icon: Trophy, desc: 'Monetize my proof' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSignupStep('plan')}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${AURORA_INTERACTIVE}`}
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 217, 160,0.4)';
                      e.currentTarget.style.background = 'rgba(0, 217, 160,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.35)';
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <opt.icon className="w-5 h-5 text-vouch-cyan" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-white">{opt.label}</div>
                        <div className="text-xs text-slate-400">{opt.desc}</div>
                      </div>
                      <div className="ml-auto opacity-50">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSignupStep('plan')}
                className="w-full mt-4 text-[13px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
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
                      aria-pressed={selected}
                      onClick={() => setPlan(opt.id)}
                      className="w-full text-left rounded-xl border p-3.5 transition-colors"
                      style={{
                        background: selected ? 'rgba(0, 217, 160,0.08)' : 'rgba(0,0,0,0.35)',
                        borderColor: selected ? 'rgba(0,217,160,0.5)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: selected ? 'rgba(0,217,160,0.16)' : 'rgba(255,255,255,0.05)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: selected ? AURORA_CYAN_HEX : '#94a3b8' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">{opt.label}</span>
                            <span className="text-xs font-bold" style={{ color: AURORA_CYAN_HEX }}>{opt.price}</span>
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
                                <Check className="w-3 h-3 shrink-0 mt-0.5" style={{ color: selected ? AURORA_CYAN_HEX : '#64748b' }} />
                                {perk}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                          style={{ borderColor: selected ? AURORA_CYAN_HEX : 'rgba(255,255,255,0.2)' }}
                        >
                          {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ background: AURORA_CYAN_HEX }} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {FREE_BETA_ALL_ACCESS ? (
                <p className="mt-3 text-[11px] leading-relaxed text-center" style={{ color: '#34d399' }}>
                  {FREE_BETA_BLURB}
                </p>
              ) : plan === 'pro' ? (
                <p className="mt-3 text-[11px] leading-relaxed text-center" style={{ color: '#fbbf24' }}>
                  Your first 7 days are free. After that, it is $7.99/month until you cancel.
                </p>
              ) : null}

              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  aria-label="Back to introduction"
                  onClick={() => setSignupStep('intro')}
                  className="flex items-center justify-center w-11 h-11 rounded-xl border shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Back to plan selection"
                  onClick={() => setSignupStep('policy')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black ${AURORA_INTERACTIVE}`}
                  style={{ background: AURORA_AUTH_GRADIENT, boxShadow: AURORA_AUTH_SHADOW }}
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
                className={`max-h-56 overflow-y-auto rounded-xl border p-4 space-y-3 ${AURORA_SURFACE}`}
              >
                {POLICY_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className={`${AURORA_LABEL} text-vouch-cyan`}>{section.title}</p>
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
                      background: agreements[item.id] ? 'rgba(0, 217, 160,0.06)' : 'rgba(0,0,0,0.35)',
                      borderColor: agreements[item.id] ? 'rgba(0,217,160,0.4)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                      style={{
                        borderColor: agreements[item.id] ? AURORA_CYAN_HEX : 'rgba(255,255,255,0.2)',
                        background: agreements[item.id] ? AURORA_CYAN_HEX : 'transparent',
                      }}
                    >
                      {agreements[item.id] && <Check className="w-3 h-3" style={{ color: '#0b1322' }} />}
                    </span>
                    <input
                      type="checkbox"
                      className="absolute h-px w-px overflow-hidden opacity-0"
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
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${AURORA_INTERACTIVE}`}
                  style={{ background: AURORA_AUTH_GRADIENT, boxShadow: AURORA_AUTH_SHADOW }}
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
            <div className="-mt-1 mb-1 px-5 sm:px-8">
              <button
                type="button"
                onClick={() => setSignupStep('policy')}
                className="ve-auth-back-link"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {PLAN_OPTIONS.find((p) => p.id === plan)?.label ?? 'Basic'} plan
              </button>
            </div>
          )}
          {/* Tab switch */}
          <div className="px-5 sm:px-8">
            <div className="ve-auth-mode-switch">
              {(['signup', 'login'] as Mode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                    setSignupStep(m === 'signup' ? 'policy' : 'form');
                    setIntroIndex(0);
                    window.history.replaceState(window.history.state, '', m === 'signup' ? '/signup' : '/login');
                  }}
                  className="ve-auth-mode-button"
                  style={{ color: mode === m ? '#071117' : '#64748b' }}
                >
                  {mode === m && (
                    <div
                      className="ve-auth-mode-active"
                      style={{ background: 'linear-gradient(110deg, #7de8ff, #55cbed 48%, #64e6b2)' }}
                    />
                  )}
                  <span className="relative">{m === 'signup' ? 'Sign Up' : 'Log In'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compact trust strip — signup only */}
          {mode === 'signup' && (
            <div className="ve-auth-trust-strip">
              <span><i /> VERIFIED RECORD</span>
              <span><i /> $0 OPEN BETA</span>
              <span><i /> NO CREDIT CARD</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="ve-auth-account-form">
            {/* Google OAuth — available after the signup policy gate and on login. */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy || googleBusy || redirectingToCheckout || googleAvailable === false}
              className="ve-auth-google-button"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white via-slate-50 to-white opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-center justify-center gap-3">
                {googleBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                ) : (
                  <GoogleMark />
                )}
                {googleAvailable === false
                  ? 'Google sign-in is being configured'
                  : googleBusy
                  ? 'Opening Google…'
                  : mode === 'signup'
                    ? 'Continue with Google'
                    : 'Log in with Google'}
              </span>
            </button>

            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-white/10" />
              <span className={`${AURORA_LABEL} text-white/35`}>or use email</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Email */}
            <Field icon={<Mail className="w-4 h-4" />}>
              <input
                ref={emailInputRef}
                type="email"
                aria-label="Email address"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </Field>

            {/* Handle (signup) */}
              {mode === 'signup' && (
                <div className="ve-auth-reveal overflow-hidden">
                  <Field icon={<User className="w-4 h-4" />}>
                    <span className="text-sm text-slate-500 shrink-0">@</span>
                    <input
                      type="text"
                      aria-label="Username"
                      autoComplete="username"
                      placeholder="yourhandle"
                      value={handle}
                      onChange={(e) => {
                        const next = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setHandle(next);
                        if (error) setError(null);
                        checkHandle(next);
                      }}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                    />
                    {handleState === 'checking' && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
                    {handleState === 'available' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {handleState === 'taken' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  </Field>
                  {handleHint[handleState] && (
                    <p aria-live="polite" className="text-[11px] mt-1 ml-1 font-medium" style={{ color: handleHint[handleState]!.color }}>
                      {handleHint[handleState]!.text}
                    </p>
                  )}
                </div>
              )}

            {/* Password */}
            <div>
              <Field icon={<Lock className="w-4 h-4" />}>
                <input
                  type={showPw ? 'text' : 'password'}
                  aria-label="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw((v) => !v)}
                  className="text-slate-500 hover:text-slate-300"
                >
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
                            ? ['#f87171', '#fbbf24', '#34d399', '#00d9a0'][passwordStrength - 1]
                            : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>
              )}
              {mode === 'login' && (
                <div className="mt-1.5 flex justify-end px-1">
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    disabled={busy || googleBusy}
                    className="min-h-9 text-xs font-bold text-vouch-cyan transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Invite code (signup) — optional during preview, required at private-beta launch */}
              {mode === 'signup' && (
                <div className="ve-auth-reveal overflow-hidden">
                  <Field icon={<Ticket className="w-4 h-4" />}>
                    <input
                      type="text"
                      aria-label="Invite code"
                      placeholder="Invite code — optional"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none tracking-wide"
                    />
                  </Field>
                  <p className="ml-1 mt-1 text-[11px]" style={{ color: '#7c8aa0' }}>
                    Optional during Open Beta. Leave this blank if you do not have a code.
                  </p>
                </div>
              )}

            {/* Error / notice */}
              {error && (
                <div
                  role="alert"
                  className="ve-auth-message flex items-start gap-2 text-[13px] rounded-lg px-3 py-2"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {notice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="ve-auth-message flex items-start gap-2 text-[13px] rounded-lg px-3 py-2"
                  style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{notice}</span>
                </div>
              )}

            {/* Primary */}
            <button
              type="submit"
              disabled={busy || googleBusy || redirectingToCheckout}
              className="ve-auth-submit"
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
              disabled={busy || googleBusy}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold border border-white/10 text-white/80 transition-colors disabled:opacity-60 hover:border-vouch-cyan/30 hover:text-white ${AURORA_INTERACTIVE}`}
            >
              <Wand2 className="w-3.5 h-3.5" style={{ color: AURORA_BLURPLE_HEX }} />
              Email me a magic link instead
            </button>
          </form>

          {/* Footer — trust */}
          <div className="px-5 pb-6 pt-1 sm:px-8">
            <p className="text-[10px] text-center leading-relaxed text-slate-600">
              By continuing you agree to the account, privacy, and billing terms reviewed during signup. You must be
              of legal age in your jurisdiction and located somewhere this is legal. Probability-based research for
              entertainment — not betting advice.
            </p>
          </div>
          </>
          )}
            </section>
          </div>
        </div>
      </div>
    ),
    document.body,
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="block shrink-0"
      style={{ width: 18, height: 18, minWidth: 18, minHeight: 18 }}
    >
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 h-11 rounded-xl transition-colors focus-within:border-vouch-cyan/45 focus-within:ring-1 focus-within:ring-vouch-cyan/20 ${AURORA_SURFACE}`}
    >
      <span className="text-white/35 flex-shrink-0">{icon}</span>
      {children}
    </div>
  );
}
