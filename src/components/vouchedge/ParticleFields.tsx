import { useEffect, useMemo, useState } from "react";
import { getFounderPointsLabel } from "../../lib/founderAccess";

interface ParticleProps {
  count?: number;
  className?: string;
}

const BUBBLE_COLORS = [
  "rgba(0,240,255,0.36)",
  "rgba(59,130,246,0.32)",
  "rgba(34,211,238,0.28)",
  "rgba(37,99,235,0.24)",
];

function useResponsiveCount(desktop: number, mobile: number) {
  const [count, setCount] = useState(desktop);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      const mobileViewport = mq.matches;
      setIsMobile(mobileViewport);
      setCount(mobileViewport ? mobile : desktop);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [desktop, mobile]);
  return { count, isMobile };
}

type BubbleVariant = "drift" | "float" | "pulse";

interface BubbleFieldProps extends ParticleProps {
  mobileCount?: number;
  variant?: BubbleVariant;
}

/** Soft glass/circle bubbles — Z8 premium cyan/blue aesthetic, no emojis. */
export function BubbleField({
  count = 15,
  mobileCount = 8,
  className = "",
  variant = "drift",
}: BubbleFieldProps) {
  const { count: effectiveCount, isMobile } = useResponsiveCount(count, mobileCount);
  const animateOnDevice = !isMobile;

  const bubbles = useMemo(
    () =>
      Array.from({ length: effectiveCount }).map((_, i) => ({
        id: i,
        left: `${((i * 19) % 90) + 5}%`,
        top: variant === "float" ? `${((i * 31) % 85) + 5}%` : undefined,
        size: variant === "drift" ? 6 + ((i * 9) % 18) : 8 + ((i * 7) % 14),
        delay: variant === "drift" ? `-${(i * 2.5) % 20}s` : `${(i * 0.4) % 4}s`,
        duration:
          variant === "drift"
            ? `${((i * 6) % 15) + 18}s`
            : `${((i * 5) % 8) + 6}s`,
        driftX: `${((i * 27) % 120) - 60}px`,
        driftRot: `${((i * 53) % 240) - 120}deg`,
        opacity: i % 3 === 0 ? 0.28 : 0.14,
        color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
        blur: i % 4 === 0 ? 1.2 : 0.4,
      })),
    [effectiveCount, variant]
  );

  const animClass = animateOnDevice
    ? variant === "drift"
      ? "animate-theme-drift"
      : variant === "pulse"
        ? "ve-bubble-pulse"
        : "ve-bubble-float"
    : "";

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ve-bubble-field ${className}`}>
      {bubbles.map((b) => (
        <span
          key={b.id}
          className={`${animClass} block rounded-full`}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45), ${b.color} 55%, transparent 78%)`,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 0 ${b.size * 1.5}px ${b.color}`,
            filter: `blur(${b.blur}px)`,
            "--drift-delay": b.delay,
            "--drift-duration": b.duration,
            "--drift-x": b.driftX,
            "--drift-rot": b.driftRot,
            "--theme-particle-opacity": String(b.opacity),
            animationDelay: variant !== "drift" ? b.delay : undefined,
            animationDuration: variant !== "drift" ? b.duration : undefined,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes themeParticleDrift {
          0% {
            transform: translateY(115vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--theme-particle-opacity, 0.3);
          }
          90% {
            opacity: var(--theme-particle-opacity, 0.3);
          }
          100% {
            transform: translateY(-20vh) translateX(var(--drift-x, 60px)) rotate(var(--drift-rot, 360deg));
            opacity: 0;
          }
        }
        @keyframes ve-bubble-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: var(--theme-particle-opacity, 0.2); }
          50% { transform: translateY(-18px) scale(1.08); opacity: calc(var(--theme-particle-opacity, 0.2) * 1.4); }
        }
        @keyframes ve-bubble-pulse {
          0%, 100% { transform: scale(0.92); opacity: calc(var(--theme-particle-opacity, 0.2) * 0.7); }
          50% { transform: scale(1.12); opacity: var(--theme-particle-opacity, 0.2); }
        }
        .animate-theme-drift {
          position: absolute;
          animation: themeParticleDrift var(--drift-duration, 20s) linear infinite;
          animation-delay: var(--drift-delay, 0s);
        }
        .ve-bubble-float { position: absolute; animation: ve-bubble-float ease-in-out infinite; }
        .ve-bubble-pulse { position: absolute; animation: ve-bubble-pulse ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-theme-drift, .ve-bubble-float, .ve-bubble-pulse { animation: none !important; opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

export function SnowField({ count = 50, className = "" }: ParticleProps) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 37) % 100,
        size: 2 + ((i * 13) % 8),
        duration: 6 + ((i * 7) % 10),
        delay: (i * 0.3) % 8,
        drift: -40 + ((i * 23) % 80),
        opacity: 0.4 + ((i * 11) % 60) / 100,
      })),
    [count]
  );
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            top: "-20px",
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            ["--drift" as any]: `${f.drift}px`,
            animation: `ve-snow-fall ${f.duration}s linear ${f.delay}s infinite`,
            boxShadow: "0 0 4px rgba(255,255,255,0.6)",
          }}
        />
      ))}
    </div>
  );
}

export function EmberField({ count = 35, className = "" }: ParticleProps) {
  const embers = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 41) % 100,
        size: 2 + ((i * 9) % 6),
        duration: 4 + ((i * 5) % 8),
        delay: (i * 0.4) % 6,
        drift: -30 + ((i * 19) % 60),
        color: ["#EF4444", "#F97316", "#FBBF24"][i % 3],
      })),
    [count]
  );
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {embers.map((e) => (
        <span
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.left}%`,
            bottom: "-20px",
            width: e.size,
            height: e.size,
            background: e.color,
            ["--drift" as any]: `${e.drift}px`,
            animation: `ve-ember-rise ${e.duration}s linear ${e.delay}s infinite`,
            boxShadow: `0 0 8px ${e.color}, 0 0 16px ${e.color}`,
          }}
        />
      ))}
    </div>
  );
}

export function CoinField({ count = 25, className = "" }: ParticleProps) {
  const coins = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 53) % 100,
        size: 12 + ((i * 7) % 12),
        duration: 5 + ((i * 4) % 7),
        delay: (i * 0.5) % 8,
        drift: -20 + ((i * 17) % 40),
      })),
    [count]
  );
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {coins.map((c) => (
        <span
          key={c.id}
          className="absolute rounded-full"
          style={{
            left: `${c.left}%`,
            top: "-30px",
            width: c.size,
            height: c.size,
            ["--drift" as any]: `${c.drift}px`,
            animation: `ve-coin-fall ${c.duration}s linear ${c.delay}s infinite`,
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), #FACC15 48%, #CA8A04 100%)",
            boxShadow: "0 0 10px rgba(212,175,55,0.55), inset 0 0 4px rgba(255,255,255,0.2)",
            border: "1px solid rgba(250,204,21,0.35)",
          }}
        />
      ))}
    </div>
  );
}

export function Starfield3D({ count = 60, className = "" }: ParticleProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 31) % 100,
        top: (i * 47) % 100,
        size: 1 + ((i * 5) % 4),
        duration: 2 + ((i * 3) % 6),
        delay: (i * 0.2) % 5,
      })),
    [count]
  );
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-yellow-100"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `ve-star-3d ${s.duration}s ease-in-out ${s.delay}s infinite`,
            boxShadow: "0 0 6px rgba(255,232,31,0.8)",
          }}
        />
      ))}
    </div>
  );
}

export function DiamondSpark({ count = 20, className = "" }: ParticleProps) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 29) % 100,
        top: (i * 43) % 100,
        size: 4 + ((i * 6) % 10),
        duration: 2 + ((i * 4) % 4),
        delay: (i * 0.3) % 4,
      })),
    [count]
  );
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {sparks.map((s) => (
        <span
          key={s.id}
          className="absolute ve-diamond-spark"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ color: "#22d3ee", width: "100%", height: "100%" }}>
            <path d="M12 2L4 12l8 10 8-10z" opacity="0.9" />
            <path d="M12 2L8 12l4 10 4-10z" opacity="0.6" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export function AuroraField({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="ve-aurora-flow" />
    </div>
  );
}

export function PixelRain({ count = 30, className = "" }: ParticleProps) {
  const cubes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 23) % 100,
        top: (i * 37) % 100,
        size: 8 + ((i * 5) % 12),
        duration: 6 + ((i * 3) % 8),
        delay: (i * 0.4) % 5,
        color: ["#22d3ee", "#f472b6", "#a3e635"][i % 3],
      })),
    [count]
  );
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="ve-pixel-rain" />
      {cubes.map((c) => (
        <div
          key={c.id}
          className="absolute ve-3d-cube"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            color: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        >
          <div /><div /><div /><div /><div /><div />
        </div>
      ))}
    </div>
  );
}

export function MeshFlow({
  colors = ["#22d3ee", "#a78bfa", "#4ade80", "#fbbf24"],
  className = "",
}: {
  colors?: string[];
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        ["--mesh-1" as any]: colors[0] + "26",
        ["--mesh-2" as any]: colors[1] + "26",
        ["--mesh-3" as any]: colors[2] + "20",
        ["--mesh-4" as any]: colors[3] + "20",
      }}
    >
      <div className="ve-mesh-flow" />
    </div>
  );
}

export function ThemeParticleRouter({ themeId, className = "" }: { themeId: string; className?: string }) {
  if (themeId.includes("ice")) return <SnowField count={40} className={className} />;
  if (themeId.includes("hr-hunter") || themeId.includes("redline")) return <EmberField count={30} className={className} />;
  if (themeId.includes("gold") || themeId.includes("black-gold")) return <CoinField count={20} className={className} />;
  if (themeId.includes("galactic")) return <Starfield3D count={50} className={className} />;
  if (themeId.includes("diamond-club") || themeId.includes("neon-diamond")) return <DiamondSpark count={15} className={className} />;
  if (themeId.includes("founder")) return <AuroraField className={className} />;
  if (themeId.includes("4bit") || themeId.includes("arcade")) return <PixelRain count={15} className={className} />;
  if (themeId.includes("8bit")) return <CoinField count={12} className={className} />;
  return <MeshFlow colors={["#00f0ff", "#3b82f6", "#2563eb", "#22d3ee"]} className={className} />;
}
