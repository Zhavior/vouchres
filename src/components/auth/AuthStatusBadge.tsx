import { useEffect, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { hasRealAuthToken } from '../../app/sectionNavigation';
import { Z8_BTN_TERMINAL_GHOST, Z8_LABEL } from '../landing/LandingTokens';

interface AuthStatusBadgeProps {
  hideGuest?: boolean;
  onLoginSuccess?: () => void;
  onLogoutComplete?: () => void;
  /** Render inside the app header row (never fixed, never guest login). */
  inline?: boolean;
}

function resetToLandingScreen() {
  localStorage.removeItem('vouchedge_after_auth_destination');
  localStorage.removeItem('vouchedge_after_auth_mode');
  localStorage.setItem('vouchedge_active_section', 'vouchedge_intro');
  localStorage.setItem('activeSection', 'vouchedge_intro');
  localStorage.setItem('selectedSection', 'vouchedge_intro');
  sessionStorage.removeItem('vouchedge_active_section');
}

function clearVouchEdgeLocalAuth() {
  localStorage.removeItem('vouchedge_auth_token');
  localStorage.removeItem('mlb_ai_auth_token');
  localStorage.removeItem('vouchedge_after_auth_destination');
  localStorage.removeItem('vouchedge_after_auth_mode');

  Object.keys(localStorage).forEach((key) => {
    const lower = key.toLowerCase();
    if (
      lower.includes('demo') ||
      lower.includes('fake') ||
      lower.includes('mock') ||
      lower.includes('guest') ||
      lower.includes('vouchedge_auth') ||
      lower.includes('mlb_ai_auth')
    ) {
      localStorage.removeItem(key);
    }
  });
}

export default function AuthStatusBadge({
  onLogoutComplete,
  inline = false,
}: AuthStatusBadgeProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let alive = true;

    async function verifyRealUser() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        clearVouchEdgeLocalAuth();
        if (alive) {
          setEmail(null);
          setChecking(false);
        }
        return;
      }

      const { data: userData, error } = await supabase.auth.getUser();

      if (!alive) return;

      if (error || !userData.user) {
        clearVouchEdgeLocalAuth();
        setEmail(null);
      } else {
        localStorage.setItem('vouchedge_auth_token', sessionData.session.access_token);
        setEmail(userData.user.email ?? 'Account');
      }

      setChecking(false);
    }

    verifyRealUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        clearVouchEdgeLocalAuth();
        setEmail(null);
        setChecking(false);
        return;
      }

      localStorage.setItem('vouchedge_auth_token', session.access_token);
      setEmail(session.user.email ?? 'Account');
      setChecking(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    setSigningOut(true);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      clearVouchEdgeLocalAuth();
      resetToLandingScreen();
      setEmail(null);
      setSigningOut(false);
      window.history.replaceState(null, '', '/vouchedge');
      onLogoutComplete?.();
    }
  }

  const signedIn = Boolean(email) || hasRealAuthToken();

  if (inline) {
    if (checking || !signedIn) return null;

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
