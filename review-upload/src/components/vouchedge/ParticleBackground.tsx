import React, { useMemo } from "react";

/**
 * ParticleBackground — lightweight CSS-only particle system.
 * No canvas, no requestAnimationFrame, no heavy library.
 * Uses CSS keyframes + deterministic seeding for 60fps performance.
 *
 * Layers:
 *   1. Baseball diamond grid (perspective floor, scrolling)
 *   2. Floating cyan dots (twinkling)
 *   3. Data flow lines (horizontal drift)
 *   4. Glow orbs (ambient)
 */

export default function ParticleBackground() {
  const dots = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: (i * 37) % 100,
        top: (i * 53) % 100,
        size: 1 + ((i * 7) % 3),
        duration: 3 + ((i * 5) % 6),
        delay: (i * 0.3) % 5,
      })),
    []
  );

  const lines = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        top: 10 + i * 12,
        duration: 8 + (i * 3) % 6,
        delay: (i * 0.7) % 4,
        width: 100 + ((i * 40) % 200),
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Glow orbs */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "rgba(34,211,238,0.08)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "rgba(37,99,235,0.06)" }}
      />

      {/* Baseball diamond grid (perspective floor) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[60%]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(34,211,238,0.04) 1px, transparent 1px),
            linear-gradient(-45deg, rgba(34,211,238,0.04) 1px, transparent 1px),
            linear-gradient(to right, rgba(34,211,238,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34,211,238,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px, 80px 80px, 40px 40px, 40px 40px",
          transform: "perspective(600px) rotateX(65deg) translateY(20%)",
          transformOrigin: "bottom center",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 80%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 80%)",
          animation: "ve-grid-scroll 20s linear infinite",
        }}
      />

      {/* Floating cyan dots */}
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: "rgba(34,211,238,0.5)",
            boxShadow: "0 0 4px rgba(34,211,238,0.6)",
            animation: `ve-twinkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}

      {/* Data flow lines */}
      {lines.map((l) => (
        <div
          key={l.id}
          className="absolute h-px"
          style={{
            top: `${l.top}%`,
            left: 0,
            width: `${l.width}px`,
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent)",
            animation: `ve-line-drift ${l.duration}s linear ${l.delay}s infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes ve-grid-scroll {
          0% { background-position: 0 0, 0 0, 0 0, 0 0; }
          100% { background-position: 80px 80px, -80px 80px, 40px 0, 0 40px; }
        }
        @keyframes ve-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes ve-line-drift {
          0% { transform: translateX(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
