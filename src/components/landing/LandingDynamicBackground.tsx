import { useEffect, useState } from 'react';
import { TEAM_ID_BY_NAME, logoByTeamId } from '../../lib/teamLogos';

const TEAM_IDS = Object.values(TEAM_ID_BY_NAME).filter(id => !!id);

export default function LandingDynamicBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Cycle teams every 6 seconds
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setNextIndex((nextIndex + 1) % TEAM_IDS.length);
        setFading(false);
      }, 1500); // 1.5s fade duration
    }, 6000);

    return () => clearInterval(interval);
  }, [nextIndex]);

  const currentLogo = logoByTeamId(TEAM_IDS[currentIndex]);
  const nextLogo = logoByTeamId(TEAM_IDS[nextIndex]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* 
        Apple-style massive blurred background glow 
        We use an image with extreme scale and blur to create dynamic light pools based on team colors
      */}
      <div 
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: fading ? 0 : 0.15 }}
      >
        {currentLogo && (
          <img 
            src={currentLogo} 
            alt="" 
            className="absolute left-1/2 top-1/3 h-[120vh] w-[120vw] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-30 blur-[100px] saturate-[2]" 
          />
        )}
      </div>

      <div 
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: fading ? 0.15 : 0 }}
      >
        {nextLogo && (
          <img 
            src={nextLogo} 
            alt="" 
            className="absolute left-1/2 top-1/3 h-[120vh] w-[120vw] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-30 blur-[100px] saturate-[2]" 
          />
        )}
      </div>

      {/* Overlays to ensure readability */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      
      {/* Subtle scanline texture */}
      <div className="ve-terminal-scanlines absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:100%_4px]" />
    </div>
  );
}
