import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, Loader2, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import type { CreatorProofProfile } from '../../types';
import { isDiscordBetaGateOpen } from '../../lib/discordBetaAccess';
import { startDiscordConnect, retryDiscordGuildJoin } from '../../lib/discordClient';
import { isFounderEmail } from '../../lib/founderAccess';
import {
  AURORA_LABEL,
  AURORA_PANEL_PREMIUM,
  AURORA_INTERACTIVE,
  AURORA_BLURPLE_HEX,
} from '../../theme/auroraTokens';

export interface DiscordBetaAccessGateProps {
  profile: (Partial<CreatorProofProfile> & { id?: string | null }) | null | undefined;
  accountId?: string | null;
  email?: string | null;
  returnTo?: string;
  onVerified?: () => void;
  children: ReactNode;
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      style={{ width: 18, height: 18, minWidth: 18, minHeight: 18 }}
      fill="currentColor"
    >
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.893a.076.076 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

export function DiscordBetaAccessGate({
  profile,
  accountId,
  email,
  returnTo = '/hr-next',
  onVerified,
  children,
}: DiscordBetaAccessGateProps) {
  const [connecting, setConnecting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRetried = useRef(false);

  const resolvedAccountId = accountId ?? (profile && 'id' in profile ? (profile as { id?: string | null }).id : null) ?? null;

  const isOpen = isDiscordBetaGateOpen(profile ?? {}, {
    accountId: resolvedAccountId,
    email: email ?? null,
  });

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    const result = await startDiscordConnect(returnTo);
    if (result.ok === false) {
      setConnecting(false);
      setError(result.error);
    }
  };

  const handleRetry = async () => {
    setError(null);
    setRetrying(true);
    const result = await retryDiscordGuildJoin();
    setRetrying(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    if (result.guildMember) {
      onVerified?.();
    } else {
      setError("Still couldn't verify your Discord guild membership. Join the server and try again.");
    }
  };

  const isConnected = Boolean(profile?.discordConnectedAt);
  const isVerifiedMember = Boolean(
    (profile?.discordConnectedAt && profile?.discordGuildMember && profile?.discordBetaAccess) ||
      (profile?.discordConnectedAt && isFounderEmail(email)),
  );
  const isPendingRetry = Boolean(isConnected && !isVerifiedMember);

  useEffect(() => {
    if (autoRetried.current) return;
    if (!isPendingRetry) return;
    autoRetried.current = true;
    void handleRetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPendingRetry]);

  if (isOpen) {
    return <>{children}</>;
  }

  return (
    <main className="ve-page-shell flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 text-white">
      <section
        className={`${AURORA_PANEL_PREMIUM} w-full max-w-lg space-y-6 p-6 sm:p-8 text-left border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden`}
        aria-labelledby="discord-beta-gate-title"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <DiscordMark className="w-36 h-36" />
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className={`${AURORA_LABEL} text-vouch-cyan text-[10px] tracking-widest uppercase font-mono font-bold`}>
                OPEN BETA ACCESS GATE
              </p>
              <h1 id="discord-beta-gate-title" className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Join Discord to Unlock HR Next
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
            HR Next and real-time prediction intelligence are unlocked for members of the VouchEdge community during the free Open Beta.
          </p>
        </div>

        <div className="space-y-2.5 rounded-xl border border-white/5 bg-black/40 p-4 relative z-10 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-vouch-cyan shrink-0" />
            <span>Full access to HR Next analytics & projection matrix</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-vouch-cyan shrink-0" />
            <span>Live game feeds, tactical filters & player matchup signals</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-vouch-cyan shrink-0" />
            <span>$0 Open Beta — verified via Discord server role</span>
          </div>
        </div>

        <div className="space-y-3 relative z-10 pt-1">
          <AnimatePresence mode="wait">
            {isPendingRetry ? (
              <motion.div
                key="retry-box"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-200">
                    Discord linked as {profile?.discordUsername ?? 'your account'}, but membership wasn't confirmed.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-60 ${AURORA_INTERACTIVE}`}
                  >
                    {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {retrying ? 'Verifying…' : 'Retry Verification'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-colors disabled:opacity-60"
                    style={{ backgroundColor: AURORA_BLURPLE_HEX }}
                  >
                    {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DiscordMark />}
                    Re-link Discord
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-black text-white shadow-[0_8px_24px_rgba(88,101,242,0.35)] transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${AURORA_INTERACTIVE}`}
                style={{ backgroundColor: AURORA_BLURPLE_HEX }}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DiscordMark className="brightness-0 invert" />
                )}
                {connecting ? 'Opening Discord…' : 'Connect Discord & Enter HR Next'}
                {!connecting && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-xs font-medium text-red-400 text-center">{error}</p>
          )}

          <p className="text-[11px] text-center text-slate-500">
            Already in the server? Connecting Discord will verify your @Open Beta role automatically.
          </p>
        </div>
      </section>
    </main>
  );
}

export default DiscordBetaAccessGate;
