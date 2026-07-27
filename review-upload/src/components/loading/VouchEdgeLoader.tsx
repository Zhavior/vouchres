import React, { useEffect, useRef, useState } from 'react';
import '../../styles/vouchedge-loader.css';

interface Props {
  /** Flip to true when the app is ready; the loader rushes to 100% then fades out. */
  ready?: boolean;
  /** Called after the fade-out finishes so the parent can unmount the loader. */
  onDone?: () => void;
}

const MESSAGES = [
  'Initializing edge engine',
  "Loading today's board",
  'Syncing parlays',
  'Preparing matchup lab',
  'Warming AI research',
];

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Full-screen cinematic "Vouch Edge" boot loader.
 *
 * Progress curve: quick to 70, eases 70→95, then snaps to 100 once `ready`.
 * All timers are cleaned up on unmount (no leaks). Respects reduced-motion.
 */
export default function VouchEdgeLoader({ ready = false, onDone }: Props) {
  const reduced = prefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const progressRef = useRef(0);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  // Animated progress driver (timer-based; cleaned up on unmount).
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64); // clamp big gaps (tab switches)
      last = now;
      const p = progressRef.current;

      // Target speed (% per ms) — fast to 70, slow 70→95, crawl 95→99.
      let speed: number;
      if (readyRef.current) speed = 0.45;       // rush to 100 when ready
      else if (p < 70) speed = 0.055;
      else if (p < 95) speed = 0.012;
      else speed = 0.002;

      const cap = readyRef.current ? 100 : 99;
      const next = Math.min(cap, p + speed * dt);
      progressRef.current = next;
      setProgress(next);

      if (next >= 100) {
        setLeaving(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Rotate subtitle messages.
  useEffect(() => {
    const id = window.setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, reduced ? 1600 : 1100);
    return () => window.clearInterval(id);
  }, [reduced]);

  // Fade out, then notify parent.
  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => onDone?.(), reduced ? 120 : 480);
    return () => window.clearTimeout(id);
  }, [leaving, reduced, onDone]);

  const pct = Math.round(progress);

  return (
    <div
      className={`vel-root${leaving ? ' vel-leaving' : ''}${reduced ? ' vel-reduced' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading Vouch Edge ${pct}%`}
    >
      {/* Background FX */}
      <div className="vel-bg" aria-hidden="true">
        <div className="vel-grid" />
        <div className="vel-radar" />
        <div className="vel-glow vel-glow-a" />
        <div className="vel-glow vel-glow-b" />
      </div>

      <div className="vel-center">
        <div className="vel-badge" aria-hidden="true">VE</div>
        <h1 className="vel-title">
          Vouch<span className="vel-title-accent"> Edge</span>
        </h1>

        <div className="vel-sub" aria-hidden="true">
          {MESSAGES.map((m, i) => (
            <span key={m} className={`vel-sub-line${i === msgIndex ? ' is-active' : ''}`}>{m}…</span>
          ))}
        </div>

        <div className="vel-pct">{pct}<span className="vel-pct-sign">%</span></div>

        <div className="vel-bar" aria-hidden="true">
          <div className="vel-bar-fill" style={{ width: `${progress}%` }}>
            <span className="vel-bar-shine" />
          </div>
        </div>
      </div>

      <p className="vel-disclaimer">Research tools for entertainment — not betting advice.</p>
    </div>
  );
}
