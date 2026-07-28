import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import VouchEdgeLogo from '../components/brand/VouchEdgeLogo';
import { isSupabaseConfigured, signOut, supabase, updatePassword } from '../lib/supabaseClient';
import { AURORA_PAGE } from '../theme/auroraTokens';

type RecoveryState = 'checking' | 'ready' | 'invalid' | 'saved';

export default function ResetPasswordPage() {
  const [state, setState] = useState<RecoveryState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState('invalid');
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) setState((current) => current === 'checking' ? 'invalid' : current);
    }, 5000);

    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setState('ready');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setState('ready');
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return; }

    setBusy(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) { setError(updateError.message); return; }
      setState('saved');
    } catch (caught: any) {
      setError(caught?.message ?? 'Your password could not be updated. Try the reset link again.');
    } finally {
      setBusy(false);
    }
  }

  async function returnToLogin() {
    await signOut();
    window.location.replace('/login');
  }

  return (
    <main className={`${AURORA_PAGE} flex min-h-screen items-center justify-center px-4 py-10`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,240,255,.14),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(139,92,246,.16),transparent_38%)]" />
      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-vouch-cyan/20 bg-[#06111c]/95 p-5 shadow-[0_35px_100px_-35px_rgba(0,240,255,.35)] backdrop-blur-2xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan to-transparent" />
        <VouchEdgeLogo showBeta className="mb-8" />

        {state === 'checking' ? (
          <div className="py-10 text-center" role="status">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-vouch-cyan" />
            <h1 className="mt-4 text-xl font-black text-white">Opening your secure reset</h1>
            <p className="mt-2 text-sm text-white/50">Verifying the recovery link…</p>
          </div>
        ) : state === 'invalid' ? (
          <div className="py-4 text-center" role="alert">
            <AlertCircle className="mx-auto h-9 w-9 text-amber-300" />
            <h1 className="mt-4 text-2xl font-black text-white">This reset link is unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-white/50">It may have expired or already been used. Request a new link from the login page.</p>
            <a href="/login" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-vouch-cyan px-4 text-sm font-black text-[#021017]">Return to login</a>
          </div>
        ) : state === 'saved' ? (
          <div className="py-4 text-center" role="status">
            <CheckCircle2 className="mx-auto h-10 w-10 text-vouch-emerald" />
            <h1 className="mt-4 text-2xl font-black text-white">Password updated</h1>
            <p className="mt-2 text-sm text-white/50">Your new password is ready. Sign in again to continue.</p>
            <button type="button" onClick={() => void returnToLogin()} className="mt-6 min-h-11 w-full rounded-xl bg-vouch-emerald px-4 text-sm font-black text-[#02120c]">Return to login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan"><LockKeyhole className="h-5 w-5" /></div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">Choose a new password</h1>
            <p className="mt-2 text-sm leading-6 text-white/50">Use at least 8 characters. You’ll sign in again after saving it.</p>

            <label className="mt-6 block text-xs font-black uppercase tracking-wider text-white/55" htmlFor="new-password">New password</label>
            <div className="mt-2 flex min-h-12 items-center rounded-xl border border-white/12 bg-black/35 px-3 focus-within:border-vouch-cyan/50">
              <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="ml-2 text-white/45 hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>

            <label className="mt-4 block text-xs font-black uppercase tracking-wider text-white/55" htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none focus:border-vouch-cyan/50" />

            {error ? <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p> : null}
            <button type="submit" disabled={busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-vouch-cyan to-vouch-emerald px-4 text-sm font-black text-[#021017] disabled:opacity-55">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
