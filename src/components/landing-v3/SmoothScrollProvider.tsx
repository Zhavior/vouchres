import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type SmoothScrollProviderProps = {
  children: ReactNode;
};

/**
 * Wraps the public landing page in Lenis inertia-based smooth scrolling and
 * keeps GSAP's ScrollTrigger perfectly in sync with Lenis's virtual scroll
 * position. Scoped to the landing page only — the authenticated dashboard
 * keeps native scroll behavior (important for virtualized lists/tables).
 *
 * Respects prefers-reduced-motion: if the user has reduced motion enabled,
 * Lenis is never instantiated and native scroll is used instead.
 */
export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    lenisRef.current = lenis;

    // Keep ScrollTrigger's internal scroll position in lockstep with Lenis.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP's own rAF ticker so both stay perfectly synced
    // to the same animation frame instead of running two separate rAF loops.
    const update = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
