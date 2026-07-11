import { useEffect, useRef, useState } from 'react';
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  isSupabaseConfigured,
  onAuthStateChange,
  persistAuthSession,
  supabase,
} from '../lib/supabaseClient';

type CallbackPhase = 'loading' | 'recovery' | 'done' | 'error';

export default function AuthCallbackPage() {
  const [phase, setPhase] = useState<CallbackPhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const settledRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setPhase('error');
      setError('Auth is not configured. Add Supabase env vars and restart the dev server.');
      return;
    }

    let cancelled = false;

    const finishSignIn = () => {
      if (cancelled || settledRef.current) return;
      settledRef.current = true;
      setPhase('done');
      window.setTimeout(() => {
        window.history.replaceState(null, '', '/today');
        window.location.reload();
      }, 800);
    };

    const { data: subscription } = onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session) persistAuthSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        settledRef.current = true;
        setPhase('recovery');
        return;
      }
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        finishSignIn();
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) {
        settledRef.current = true;
        setPhase('error');
        setError(sessionError.message);
        return;
      }
      if (data.session) {
        persistAuthSession(data.session);
        const hash = window.location.hash.toLowerCase();
        if (hash.includes('type=recovery')) {
          settledRef.current = true;
          setPhase('recovery');
          return;
        }
        finishSignIn();
        return;
      }
      window.setTimeout(() => {
        if (!cancelled && !settledRef.current) {
          settledRef.current = true;
          setPhase('error');
          setError('Sign-in link expired or invalid. Request a new magic link or password reset.');
        }
      }, 6000);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    settledRef.current = true;
    setPhase('done');
    window.setTimeout(() => {
      window.history.replaceState(null, '', '/settings');
      window.location.href = '/settings';
    }, 900);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian-950 px-4 font-z8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 text-center shadow-[0_0_40px_rgba(0,240,255,0.08)]">
        {phase === 'loading' && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-vouch-cyan" />
            <p className="mt-4 text-sm text-white/70">Completing sign-in…</p>
          </>
        )}

        {phase === 'recovery' && (
          <>
            <Lock className="mx-auto h-8 w-8 text-vouch-cyan" />
            <h1 className="mt-4 text-lg font-black">Set a new password</h1>
            <p className="mt-2 text-xs text-white/55">Your recovery link is valid. Choose a new password to continue.</p>
            <form onSubmit={handlePasswordReset} className="mt-5 space-y-3 text-left">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-vouch-cyan/40"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-vouch-cyan/40"
              />
              {error && (
                <p className="flex items-start gap-2 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-vouch-cyan py-2.5 text-sm font-black text-black disabled:opacity-60"
              >
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}

        {phase === 'done' && (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="mt-4 text-sm text-white/70">Success — redirecting…</p>
          </>
        )}

        {phase === 'error' && (
          <>
            <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-4 text-sm text-red-200">{error ?? 'Authentication failed.'}</p>
            <a href="/vouchedge" className="mt-4 inline-block text-sm font-bold text-vouch-cyan">
              Back to VouchEdge
            </a>
          </>
        )}
      </div>
    </main>
  );
}
