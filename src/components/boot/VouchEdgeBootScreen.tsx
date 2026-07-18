/**
 * App-style loading splash — logo-first, mobile-native.
 * Used while VouchEdgeBootGate warms core data after sign-in / cold entry.
 */
import { VouchEdgeMark } from '../../brand/VouchEdgeMark';
import type { VouchEdgeBootState } from '../../features/hr/hooks/useVouchEdgeBoot';
import '../../styles/ve-brand-mark.css';

type Props = {
  boot: VouchEdgeBootState;
};

export default function VouchEdgeBootScreen({ boot }: Props) {
  const progress = Math.max(0, Math.min(100, boot.progress));

  return (
    <div
      className="ve-splash-shell fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 text-white"
      role="status"
      aria-live="polite"
      aria-busy={!boot.ready}
      aria-label="Loading VouchEdge"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(rgba(148,163,184,0.16) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(circle at center, black 20%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center text-center">
        <div className="mb-8 drop-shadow-[0_0_48px_rgba(0,229,255,0.28)]">
          <VouchEdgeMark size={120} variant="boot" />
        </div>

        <p className="text-2xl font-black tracking-tight sm:text-3xl">VouchEdge</p>
        <p className="mt-2 text-sm text-white/55">
          {boot.status}
          {boot.timedOut ? ' · finishing in background' : ''}
        </p>

        <div className="mt-10 w-full">
          <div className="mb-2 flex items-center justify-between text-[11px] text-white/40">
            <span>
              {boot.completed}/{boot.total}
            </span>
            <span className="font-mono tabular-nums text-cyan-200/90">{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="ve-splash-progress h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
