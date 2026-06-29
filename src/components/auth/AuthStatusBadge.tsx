import { useEffect, useState } from 'react';
import { LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function readFallbackToken() {
  try {
    const directToken =
      localStorage.getItem('vouchedge_auth_token') ||
      localStorage.getItem('mlb_ai_auth_token');

    if (directToken && directToken.length >= 20) return true;

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (!key.startsWith('sb-') || !key.includes('auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (raw && raw.length >= 20) return true;
    }
  } catch {
    return false;
  }

  return false;
}

export default function AuthStatusBadge() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [hasFallbackToken, setHasFallbackToken] = useState(false);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setEmail(data.session?.user?.email ?? null);
      setHasFallbackToken(Boolean(data.session?.access_token) || readFallbackToken());
      if (data.session?.access_token) {
        localStorage.setItem('vouchedge_auth_token', data.session.access_token);
      }
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setHasFallbackToken(Boolean(session?.access_token) || readFallbackToken());

      if (session?.access_token) {
        localStorage.setItem('vouchedge_auth_token', session.access_token);
      }

      if (!session) {
        localStorage.removeItem('vouchedge_auth_token');
        localStorage.removeItem('mlb_ai_auth_token');
      }

      setLoading(false);
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
      localStorage.removeItem('vouchedge_auth_token');
      localStorage.removeItem('mlb_ai_auth_token');
      localStorage.removeItem('vouchedge_after_auth_destination');
      localStorage.setItem('vouchedge_active_section', 'welcome');
      setEmail(null);
      setHasFallbackToken(false);
      setSigningOut(false);
      window.location.href = '/';
    }
  }

  return (
    <div className="fixed right-4 top-4 z-[99999]">
      <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs font-black text-white shadow-2xl backdrop-blur">
        {loading ? (
          <span>Checking login...</span>
        ) : email || hasFallbackToken ? (
          <>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span className="hidden max-w-[180px] truncate sm:inline">
              Logged in: {email ?? 'Account'}
            </span>
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
            <span>Guest mode</span>
          </>
        )}
      </div>
    </div>
  );
}
