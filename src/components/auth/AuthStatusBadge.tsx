import { useEffect, useState } from 'react';
import { LogIn, LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AuthModal from './AuthModal';

interface AuthStatusBadgeProps {
  hideGuest?: boolean;
  onLoginSuccess?: () => void;
  onLogoutComplete?: () => void;
}

function resetToLandingScreen() {
  localStorage.removeItem('vouchedge_after_auth_destination');
  localStorage.removeItem('vouchedge_after_auth_mode');
  localStorage.setItem('vouchedge_active_section', 'welcome');
  localStorage.setItem('activeSection', 'welcome');
  localStorage.setItem('selectedSection', 'welcome');
  sessionStorage.removeItem('vouchedge_active_section');
}

function clearVouchEdgeLocalAuth() {
  localStorage.removeItem('vouchedge_auth_token');
  localStorage.removeItem('mlb_ai_auth_token');
  localStorage.removeItem('vouchedge_after_auth_destination');
  localStorage.removeItem('vouchedge_after_auth_mode');

  // remove old/demo/local auth-ish keys without deleting everything
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

export default function AuthStatusBadge({ hideGuest = false, onLoginSuccess, onLogoutComplete }: AuthStatusBadgeProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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

  async function handleAuthed() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      localStorage.setItem('vouchedge_auth_token', token);
    }

    setEmail(data.session?.user.email ?? 'Account');
    setAuthOpen(false);
    onLoginSuccess?.();
  }

  async function logout() {
    setSigningOut(true);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      clearVouchEdgeLocalAuth();
      resetToLandingScreen();
      setEmail(null);
      setSigningOut(false);
      window.history.replaceState(null, '', '/');
      onLogoutComplete?.();
    }
  }

  if (hideGuest && !email) {
    return null;
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-[80]">
        <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs font-black text-white shadow-2xl backdrop-blur">
        {checking ? (
          <span>Checking login...</span>
        ) : email ? (
          <>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span className="hidden max-w-[180px] truncate sm:inline">Logged in: {email}</span>
            <span className="sm:hidden">Logged in</span>
            <button
              type="button"
              onClick={logout}
              disabled={signingOut}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-red-300/30 bg-red-500/20 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-red-100 hover:bg-red-500/30 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {signingOut ? 'Leaving' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <UserCircle className="h-4 w-4 text-slate-300" />
            <span className="hidden sm:inline">Guest</span>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/25"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login
            </button>
          </>
        )}
        </div>
      </div>

      <AuthModal
        open={authOpen}
        initialMode="login"
        onClose={() => setAuthOpen(false)}
        onAuthed={handleAuthed}
        onGuest={() => setAuthOpen(false)}
      />
    </>
  );
}
