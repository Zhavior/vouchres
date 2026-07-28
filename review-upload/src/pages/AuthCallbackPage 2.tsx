import { useEffect, useState } from "react";
import { persistAuthSession, supabase } from "../lib/supabaseClient";
import { SIGNED_IN_HOME } from "../app/sectionNavigation";

/**
 * Handles Supabase email/magic-link redirects at /auth/callback.
 * detectSessionInUrl processes the code/hash; we wait for a session then route home.
 */
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const finish = (destination: string) => {
      window.history.replaceState(null, "", `/${destination}`);
      window.location.replace(`/${destination}`);
    };

    const resolveDestination = () => {
      try {
        const pending = localStorage.getItem("vouchedge_after_auth_destination");
        if (pending) {
          localStorage.removeItem("vouchedge_after_auth_destination");
          localStorage.removeItem("vouchedge_after_auth_mode");
          return pending;
        }
      } catch {
        // ignore storage failures
      }
      return SIGNED_IN_HOME;
    };

    const completeSession = () => {
      if (cancelled) return;
      finish(resolveDestination());
    };

    void (async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        persistAuthSession(data.session);
        completeSession();
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          persistAuthSession(session);
          completeSession();
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();

      window.setTimeout(() => {
        if (cancelled) return;
        void supabase.auth.getSession().then(({ data: retry, error: retryError }) => {
          if (cancelled) return;
          if (retryError) {
            setError(retryError.message);
            return;
          }
          if (retry.session) {
            persistAuthSession(retry.session);
            completeSession();
            return;
          }
          setError("Sign-in link expired or was already used. Request a new link and try again.");
        });
      }, 4000);
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-vouch-cyan/20 bg-black/60 p-6 text-center">
        {error ? (
          <>
            <p className="text-sm font-semibold text-red-300">Sign-in could not be completed</p>
            <p className="mt-2 text-xs text-white/70">{error}</p>
            <a
              href="/"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-vouch-cyan"
            >
              Back to VouchEdge
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-vouch-cyan" />
            <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan">
              Completing sign-in
            </p>
          </>
        )}
      </div>
    </div>
  );
}
