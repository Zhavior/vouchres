import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import { persistAuthSession, supabase } from "../lib/supabaseClient";
import { SIGNED_IN_HOME } from "../app/sectionNavigation";
import VouchEdgeLogo from "../components/brand/VouchEdgeLogo";
import { AURORA_LABEL, AURORA_PANEL_PREMIUM } from "../theme/auroraTokens";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian-900 px-5 py-10 font-z8 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 18% 14%, rgba(79,184,220,0.18), transparent 30%), radial-gradient(circle at 82% 84%, rgba(49,181,131,0.12), transparent 32%), linear-gradient(180deg, rgba(6,12,24,0.15), rgba(0,0,0,0.72))",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/55 to-transparent" />

      <section
        className={`relative w-full max-w-md overflow-hidden rounded-3xl p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.62),0_0_70px_rgba(79,184,220,0.08)] sm:p-9 ${AURORA_PANEL_PREMIUM}`}
        aria-labelledby="auth-callback-title"
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-28 rounded-full bg-vouch-cyan/10 blur-3xl" />
        <div className="relative flex justify-center">
          <VouchEdgeLogo showBeta markClassName="h-12 w-12" />
        </div>

        <div className="relative my-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {error ? (
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/25 bg-red-300/10 text-red-200 shadow-[0_0_32px_rgba(248,113,113,0.12)]">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className={`${AURORA_LABEL} mt-5 text-red-200/80`}>Authentication interrupted</p>
            <h1 id="auth-callback-title" className="mt-2 text-2xl font-black tracking-tight text-white">
              Sign-in could not be completed
            </h1>
            <p className="mt-3 rounded-xl border border-red-300/15 bg-red-300/[0.06] px-4 py-3 text-sm leading-relaxed text-white/65">
              {error}
            </p>
            <a
              href="/"
              className="z8-interactive mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 px-5 py-3 text-sm font-extrabold text-vouch-cyan transition-colors hover:bg-vouch-cyan/15 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to VouchEdge
            </a>
          </div>
        ) : (
          <div className="relative" role="status" aria-live="polite">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-vouch-cyan border-r-vouch-cyan/30 motion-reduce:animate-none" />
              <div className="absolute inset-2 animate-[spin_1.8s_linear_infinite_reverse] rounded-full border border-transparent border-b-vouch-emerald/70 motion-reduce:animate-none" />
              <div className="glass-panel glass-border flex h-11 w-11 items-center justify-center rounded-full text-vouch-emerald shadow-[0_0_28px_rgba(49,181,131,0.16)]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className={`${AURORA_LABEL} mt-5 text-vouch-cyan`}>Secure account handoff</p>
            <h1 id="auth-callback-title" className="mt-2 text-2xl font-black tracking-tight text-white">
              Completing sign-in
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/45">
              Verifying your session and opening your VouchEdge workspace.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vouch-emerald motion-reduce:animate-none" />
              Protected by Supabase Auth
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
