import React, { Component, Suspense, useMemo, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { assessVerifiedNow } from '../utils/verifiedNow';
import { useAmbient3dEnabled } from '@/stores/ambient3dStore';
import { lazyWithRetry } from '../../../lib/lazyWithRetry';
import type { CollisionAxis } from './HrNextCollisionScene';

/**
 * COLLISION FIELD // EVIDENCE VECTOR
 *
 * The selected candidate's evidence rendered spatially. Each axis is a
 * sub-score the board already publishes — nothing here is derived, inferred or
 * invented, and a layer the row does not carry is drawn as unavailable rather
 * than filled with a guess.
 *
 * The canvas is supplemental. The same numbers are always present as a mono
 * register beside it, so the visualisation is never the only route to the data:
 * with 3D off, with reduced motion, on a WebGL failure, or before the chunk
 * lands, the evidence still reads.
 *
 * three.js and @react-three/fiber are ~870 KB that must download *and evaluate*
 * before paint, so the scene sits behind lazyWithRetry exactly like the ambient
 * field does. With the 3D toggle off the chunk is never requested at all.
 */

const CollisionScene = lazyWithRetry(
  () => import('./HrNextCollisionScene').then((m) => ({ default: m.HrNextCollisionScene })),
  { label: 'HrNextCollisionScene', optional: true },
);

/** Any throw inside the canvas drops to the register — never a blank dossier. */
class FieldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function readAxes(row: HrWatchRow): CollisionAxis[] {
  const finite = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;

  return [
    {
      key: 'power',
      label: 'Hitter power',
      value: finite(row.hitterPower),
      color: '#31B583',
      dir: [1, 0, 0],
    },
    {
      key: 'vuln',
      label: 'Pitcher vuln',
      value: finite(row.pitcherVulnerability),
      color: '#4FB8DC',
      dir: [0, 1, 0],
    },
    {
      key: 'park',
      label: 'Park / env',
      value: finite(row.parkContext) ?? finite(row.parkFactor),
      color: 'rgba(255,255,255,0.4)',
      dir: [0, 0, 1],
    },
  ];
}

export function HrNextCollisionField({ row }: { row: HrWatchRow }) {
  const reducedMotion = Boolean(useReducedMotion());
  const threeDEnabled = useAmbient3dEnabled();
  const axes = useMemo(() => readAxes(row), [row]);
  const verified = assessVerifiedNow(row).verified;
  const hrpi = Number.isFinite(row.hrScore)
    ? Math.max(0, Math.min(100, Math.round(row.hrScore)))
    : null;
  const available = axes.filter((a) => a.value != null).length;

  return (
    <section
      aria-label="Collision field evidence vector"
      className="grid gap-0 border-t border-white/[0.08] sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)]"
    >
      <div className="relative min-w-0 border-white/[0.08] sm:border-r">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
            Collision field // evidence vector
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/25">
            {available}/3 layers
          </span>
        </div>

        {threeDEnabled ? (
          <div className="h-[186px] w-full" aria-hidden="true">
            <FieldBoundary>
              <Suspense fallback={null}>
                <CollisionScene axes={axes} verified={verified} reducedMotion={reducedMotion} />
              </Suspense>
            </FieldBoundary>
          </div>
        ) : (
          <div className="flex h-[186px] items-center justify-center px-4" aria-hidden="true">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/25">
              3D layer off — values at right
            </span>
          </div>
        )}
      </div>

      {/* The canvas is never the only way to read this. */}
      <dl className="min-w-0 self-start">
        {axes.map((axis) => (
          <div
            key={axis.key}
            className="flex items-baseline justify-between gap-3 border-b border-white/[0.08] px-3 py-2.5"
          >
            <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
              {axis.label}
            </dt>
            <dd
              className="font-mono text-sm tabular-nums"
              style={{ color: axis.value == null ? 'rgba(255,255,255,0.25)' : axis.color }}
            >
              {axis.value == null ? 'N/A' : Math.round(axis.value)}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
          <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">HRPI</dt>
          <dd
            className={`font-mono text-base font-bold tabular-nums ${
              verified ? 'text-ve-emerald' : 'text-ve-amber'
            }`}
          >
            {hrpi == null ? 'N/A' : hrpi}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default HrNextCollisionField;
