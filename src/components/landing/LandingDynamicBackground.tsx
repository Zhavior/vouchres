import { useEffect, useState } from 'react';
import { TEAM_ID_BY_NAME, logoByTeamId } from '../../lib/teamLogos';

const TEAM_IDS = Object.values(TEAM_ID_BY_NAME).filter(id => !!id);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isNarrowViewport(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

export default function LandingDynamicBackground() {
  const [enabled, setEnabled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Huge blurred logos are too expensive on mobile / reduced-motion devices.
    if (prefersReducedMotion() || isNarrowViewport()) {
      setEnabled(false);
      return;
    }
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setNextIndex((nextIndex + 1) % TEAM_IDS.length);
        setFading(false);
      }, 1500);
    }, 8000);

    return () => clearInterval(interval);
  }, [enabled, nextIndex]);

  if (!enabled) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>
    );
  }

  const currentLogo = logoByTeamId(TEAM_IDS[currentIndex]);
  const nextLogo = logoByTeamId(TEAM_IDS[nextIndex]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: fading ? 0 : 0.12 }}
      >
        {currentLogo && (
          <img
            src={currentLogo}
            alt=""
            width={800}
            height={800}
            decoding="async"
            loading="lazy"
            className="absolute left-1/2 top-1/3 h-[90vh] w-[90vw] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-30 blur-[48px] saturate-[1.6]"
          />
        )}
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: fading ? 0.12 : 0 }}
      >
        {nextLogo && (
          <img
            src={nextLogo}
            alt=""
            width={800}
            height={800}
            decoding="async"
            loading="lazy"
            className="absolute left-1/2 top-1/3 h-[90vh] w-[90vw] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-30 blur-[48px] saturate-[1.6]"
          />
        )}
      </div>

      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      <div className="ve-terminal-scanlines absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:100%_4px]" />
    </div>
  );
}
