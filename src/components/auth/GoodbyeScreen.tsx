import { ShieldCheck } from 'lucide-react';
import VouchEdgeLogo from '../brand/VouchEdgeLogo';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM } from '../../theme/auroraTokens';

/**
 * Brief full-screen transition shown while logging out, before the app
 * lands on the public front page. Mirrors the "Welcome back" loading
 * moment used right after sign-in, just for the opposite direction.
 */
export default function GoodbyeScreen() {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-obsidian-900 px-5 font-z8"
      role="status"
      aria-live="polite"
      aria-label="Signing out"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(79,184,220,0.16), transparent 31%), radial-gradient(circle at 76% 78%, rgba(49,181,131,0.10), transparent 28%), linear-gradient(180deg, rgba(5,10,20,0.25), rgba(0,0,0,0.78))',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/55 to-transparent" />

      <div className={`relative w-full max-w-sm overflow-hidden rounded-3xl p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.65),0_0_64px_rgba(79,184,220,0.08)] ${AURORA_PANEL_PREMIUM}`}>
        <div className="pointer-events-none absolute inset-x-10 top-0 h-28 rounded-full bg-vouch-cyan/10 blur-3xl" />
        <div className="relative flex justify-center">
          <VouchEdgeLogo showBeta markClassName="h-12 w-12" />
        </div>

        <div className="relative my-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full border border-vouch-emerald/20 motion-reduce:animate-none" />
          <div className="glass-panel glass-border flex h-12 w-12 items-center justify-center rounded-full text-vouch-emerald shadow-[0_0_28px_rgba(49,181,131,0.16)]">
            <ShieldCheck className="h-5 w-5 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          </div>
        </div>

        <p className={`${AURORA_LABEL} mt-5 text-vouch-emerald`}>Session secured</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">See you next time.</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">Signing you out and returning to VouchEdge.</p>

        <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vouch-emerald motion-reduce:animate-none" />
          Clearing local session
        </div>
      </div>
    </div>
  );
}
