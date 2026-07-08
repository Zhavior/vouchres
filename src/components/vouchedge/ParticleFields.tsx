import { useMemo } from "react";
import { getFounderPointsLabel } from "../../lib/founderAccess";

interface ParticleProps {
  count?: number;
  className?: string;
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
          className="absolute flex items-center justify-center font-bold"
          style={{
            left: `${c.left}%`,
            top: "-30px",
            width: c.size,
            height: c.size,
            fontSize: c.size,
            ["--drift" as any]: `${c.drift}px`,
            animation: `ve-coin-fall ${c.duration}s linear ${c.delay}s infinite`,
            color: "#FACC15",
            textShadow: "0 0 8px rgba(212,175,55,0.6)",
          }}
        >
          🪙
        </span>
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
  return <MeshFlow colors={["#22d3ee", "#3b82f6", "#a78bfa", "#fbbf24"]} className={className} />;
}
