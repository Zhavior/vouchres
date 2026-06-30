import { useEffect, useRef } from 'react';

/**
 * Space-style starfield background for the welcome portal.
 * Canvas-based: truly random stars that twinkle and drift slowly. Sizes to its
 * parent, caps density + DPR for performance, and falls back to a single static
 * frame when prefers-reduced-motion is set. Self-contained — no deps, no global
 * CSS. Render inside a positioned parent; this fills it and ignores pointer events.
 */
interface Star {
  x: number;
  y: number;
  r: number;
  a: number;      // base alpha
  tw: number;     // twinkle speed
  ph: number;     // twinkle phase
  vx: number;     // drift
  vy: number;
  hue: string;
}

const COLORS = ['255,255,255', '186,230,253', '165,243,252', '196,181,253'];

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    const build = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = Math.max(1, rect?.width ?? window.innerWidth);
      h = Math.max(1, rect?.height ?? window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with area, capped for performance.
      const count = Math.min(340, Math.round((w * h) / 5200));
      stars = Array.from({ length: count }, () => {
        const big = Math.random() < 0.16;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: big ? 1.4 + Math.random() * 1.6 : 0.5 + Math.random() * 1.1,
          a: 0.55 + Math.random() * 0.45,
          tw: 0.6 + Math.random() * 1.8,
          ph: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.05,
          vy: 0.02 + Math.random() * 0.06, // gentle downward drift
          hue: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });
    };

    const drawNebula = () => {
      // Faint deep-space tint so the field reads as "space".
      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.18, 0, w * 0.2, h * 0.18, Math.max(w, h) * 0.6);
      g1.addColorStop(0, 'rgba(34,211,238,0.06)');
      g1.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.8, 0, w * 0.85, h * 0.8, Math.max(w, h) * 0.55);
      g2.addColorStop(0, 'rgba(139,92,246,0.06)');
      g2.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      drawNebula();
      for (const s of stars) {
        const flicker = reduced ? s.a : s.a * (0.7 + 0.3 * Math.sin(t * 0.001 * s.tw + s.ph));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue},${flicker.toFixed(3)})`;
        ctx.fill();
        if (s.r > 1.3) {
          // soft halo for the brightest stars
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.hue},${(flicker * 0.12).toFixed(3)})`;
          ctx.fill();
        }
        if (!reduced) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.y - s.r > h) { s.y = -s.r; s.x = Math.random() * w; }
          if (s.x < -s.r) s.x = w + s.r;
          else if (s.x > w + s.r) s.x = -s.r;
        }
      }
      if (!reduced) raf = requestAnimationFrame(render);
    };

    build();
    render(0);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { build(); if (reduced) render(0); }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* deep-space base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,#0b1733_0%,#060912_45%,#03050b_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
