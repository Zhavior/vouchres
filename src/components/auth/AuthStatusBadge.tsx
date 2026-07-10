import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, ShieldCheck } from 'lucide-react';
import { clearVouchEdgeLocalAuth, performAppLogout } from '../../lib/appLogout';
import { supabase } from '../../lib/supabaseClient';
import { Z8_BTN_TERMINAL_GHOST, Z8_LABEL } from '../landing/LandingTokens';

interface AuthStatusBadgeProps {
  hideGuest?: boolean;
  onLoginSuccess?: () => void;
  onLogoutComplete?: () => void;
  /** Render inside the app header row (never fixed, never guest login). */
  inline?: boolean;
}

const AUTH_SYNC_MS = 250;

export default function AuthStatusBadge({
  onLogoutComplete,
  inline = false,
}: AuthStatusBadgeProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    const applySession = (session: Session | null) => {
      if (!alive) return;

      if (!session?.user) {
        clearVouchEdgeLocalAuth();
        setEmail(null);
        setChecking(false);
        return;
      }

      localStorage.setItem('vouchedge_auth_token', session.access_token);
      setEmail(session.user.email ?? 'Account');
      setChecking(false);
    };

    const scheduleSessionSync = (session: Session | null) => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => applySession(session), AUTH_SYNC_MS);
    };

    async function verifyRealUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!alive) return;
      applySession(sessionData.session);
    }

    verifyRealUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setChecking(true);
      scheduleSessionSync(session);
    });

    return () => {
      alive = false;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      data.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    setSigningOut(true);

    try {
      await performAppLogout(onLogoutComplete);
    } finally {
      setEmail(null);
      setChecking(false);
      setSigningOut(false);
    }
  }

  const signedIn = !checking && Boolean(email);

  if (inline) {
    if (!signedIn) return null;

    return (
      <div className="flex max-w-[min(100%,12rem)] items-center gap-1.5 sm:max-w-xs">
        <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 lg:flex">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-vouch-emerald" />
          <span className={`${Z8_LABEL} truncate normal-case tracking-normal text-white/55`}>{email}</span>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={signingOut}
          aria-label="Sign out"
          className={`${Z8_BTN_TERMINAL_GHOST} shrink-0 gap-1.5 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white/55 hover:text-white disabled:opacity-50`}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{signingOut ? 'Leaving' : 'Sign out'}</span>
        </button>
      </div>
    );
  }

  return null;
}
