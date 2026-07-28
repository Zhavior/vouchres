import React from "react";

export default function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#050608]" />

      <div
        className="absolute inset-[-25%]"
        style={{
          background: `
            radial-gradient(circle at 50% 12%, rgba(34,211,238,.20), transparent 42%),
            radial-gradient(circle at 22% 28%, rgba(16,185,129,.10), transparent 34%),
            radial-gradient(circle at 78% 24%, rgba(59,130,246,.10), transparent 34%)
          `,
          filter: "blur(90px)",
        }}
      />

      <div className="absolute left-1/2 bottom-[18%] h-px w-[180vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div
        className="absolute left-1/2 bottom-[-55%] h-[120vh] w-[190vw] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,.07) 0%, rgba(255,255,255,.02) 40%, transparent 72%)",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,.58)_100%)]" />
    </div>
  );
}
