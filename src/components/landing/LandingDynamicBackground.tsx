export default function LandingDynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[#050608]" />

      {/* Aurora */}
      <div
        className="absolute inset-[-30%]"
        style={{
          background: `
            radial-gradient(circle at 50% 15%, rgba(0,194,255,.22), transparent 42%),
            radial-gradient(circle at 20% 30%, rgba(0,255,170,.12), transparent 34%),
            radial-gradient(circle at 80% 28%, rgba(65,105,255,.12), transparent 34%)
          `,
          filter: "blur(80px)",
        }}
      />

      {/* Stadium Horizon */}
      <div
        className="absolute left-1/2 bottom-[18%] h-px w-[180vw] -translate-x-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent)",
        }}
      />

      {/* Stadium Bowl */}
      <div
        className="absolute left-1/2 bottom-[-55%] h-[115vh] w-[190vw] -translate-x-1/2 rounded-[100%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,.07) 0%, rgba(255,255,255,.02) 38%, transparent 70%)",
        }}
      />

      {/* Field Glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[38%]"
        style={{
          background:
            "linear-gradient(to top, rgba(7,11,16,.96), rgba(7,11,16,.55), transparent)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,.55) 100%)",
        }}
      />
    </div>
  );
}
