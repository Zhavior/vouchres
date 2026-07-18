/**
 * Brief branded splash shown right after successful login,
 * before the boot gate / main shell takes over.
 */
import { VouchEdgeMark } from '../../brand/VouchEdgeMark';
import '../../styles/ve-brand-mark.css';

export default function HelloScreen() {
  return (
    <div
      className="ve-splash-shell fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 px-6 font-z8 text-white"
      role="status"
      aria-live="polite"
      aria-label="Signing in"
    >
      <div>
        <VouchEdgeMark size={104} variant="boot" />
      </div>
      <p className="text-2xl font-black tracking-tight">VouchEdge</p>
      <p className="text-sm text-white/55">Welcome back — opening your workspace…</p>
    </div>
  );
}
