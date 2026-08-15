import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { startDiscordConnect, retryDiscordGuildJoin } from '../../lib/discordClient';
import { isFounderEmail } from '../../lib/founderAccess';
import { AURORA_BLURPLE_HEX, AURORA_INTERACTIVE, AURORA_SURFACE } from '../../theme/auroraTokens';

export interface ConnectDiscordButtonProfile {
  discord_username: string | null;
  discord_connected_at: string | null;
  discord_guild_member: boolean;
  discord_beta_access: boolean;
}

interface ConnectDiscordButtonProps {
  profile: ConnectDiscordButtonProfile;
  email?: string | null;
  /** Called after a successful retry so the parent can refetch /api/auth/me. */
  onVerified?: () => void;
  className?: string;
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      style={{ width: 18, height: 18, minWidth: 18, minHeight: 18 }}
      fill={AURORA_BLURPLE_HEX}
    >
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.893a.076.076 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

/**
 * "Continue with Discord" CTA. Three states:
 *   - not connected: solid Discord-blurple button, kicks off the OAuth redirect
 *   - connected + verified guild member: pill badge "Connected as {username}"
 *   - connected but guild join didn't complete: retry state with a clear
 *     retry action — never a silently "broken" half-connected button.
 */
export default function ConnectDiscordButton({ profile, email, onVerified, className }: ConnectDiscordButtonProps) {
  const [connecting, setConnecting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRetried = useRef(false);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    const result = await startDiscordConnect();
    if (result.ok === false) {
      setConnecting(false);
      setError(result.error);
    }
    // On success the page navigates away to Discord — no need to reset state.
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
      setError("Still couldn't verify your Discord membership. Try again in a moment.");
    }
  };

  const isVerified = Boolean(
    (profile.discord_connected_at && profile.discord_guild_member && profile.discord_beta_access) ||
      (profile.discord_connected_at && isFounderEmail(email)),
  );
  const isPendingRetry = Boolean(profile.discord_connected_at && !isVerified);

  useEffect(() => {
    if (autoRetried.current) return;
    if (!isPendingRetry) return;
    autoRetried.current = true;
    void handleRetry();
    // Heal once on mount when flags are stale; user can still click Retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPendingRetry]);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isVerified ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 ${AURORA_SURFACE}`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${AURORA_BLURPLE_HEX}22` }}
            >
              <DiscordMark />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-bold text-white">
                Connected as {profile.discord_username ?? 'Discord user'}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-vouch-emerald">
                <CheckCircle2 className="h-3 w-3" />
                Open Beta access verified
              </span>
            </div>
          </motion.div>
        ) : isPendingRetry ? (
          <motion.div
            key="retry"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center justify-between gap-3 rounded-xl border border-vouch-amber/30 bg-vouch-amber/10 px-4 py-3`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-vouch-amber" />
              <span className="text-xs font-semibold text-white/80">
                Discord connected as {profile.discord_username ?? 'your account'} — couldn't verify Open Beta access yet.
              </span>
            </div>
            <motion.button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${AURORA_INTERACTIVE}`}
            >
              {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {retrying ? 'Retrying…' : 'Retry'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="connect"
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            whileHover={{ scale: connecting ? 1 : 1.02 }}
            whileTap={{ scale: connecting ? 1 : 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(88,101,242,0.35)] transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${AURORA_INTERACTIVE}`}
            style={{ backgroundColor: AURORA_BLURPLE_HEX }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative flex items-center justify-center gap-2.5">
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DiscordMark className="brightness-0 invert" />
              )}
              {connecting ? 'Opening Discord…' : 'Continue with Discord'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-[11px] font-semibold text-vouch-amber">{error}</p>
      )}
    </div>
  );
}
