import { VouchEdgeMark } from '../../brand/VouchEdgeMark';
import '../../styles/ve-brand-mark.css';

/**
 * Brief full-screen transition shown while logging out, before the app
 * lands on the public front page. Mirrors HelloScreen after sign-in.
 */
export default function GoodbyeScreen() {
  return (
    <div
      className="ve-splash-shell fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 px-6 font-z8 text-white"
      role="status"
      aria-live="polite"
      aria-label="Signing out"
    >
      <div className="drop-shadow-[0_0_36px_rgba(0,229,255,0.22)]">
        <VouchEdgeMark size={88} variant="idle" />
      </div>
      <h1 className="text-2xl font-black tracking-tight">Goodbye.</h1>
      <p className="text-sm text-white/50">Signing you out…</p>
    </div>
  );
}
