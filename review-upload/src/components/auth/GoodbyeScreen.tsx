import { ShieldCheck } from 'lucide-react';

/**
 * Brief full-screen transition shown while logging out, before the app
 * lands on the public front page. Mirrors the "Welcome back" loading
 * moment used right after sign-in, just for the opposite direction.
 */
export default function GoodbyeScreen() {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-obsidian-900 font-z8"
      role="status"
      aria-live="polite"
      aria-label="Signing out"
    >
      <div className="glass-panel glass-border flex h-14 w-14 items-center justify-center rounded-full text-vouch-emerald">
        <ShieldCheck className="h-6 w-6 animate-pulse" />
      </div>
      <h1 className="text-2xl font-black text-white">Goodbye.</h1>
      <p className="terminal-text text-white/40">Signing you out…</p>
    </div>
  );
}
