const lightPositions = [
  "12%",
  "22%",
  "32%",
  "42%",
  "58%",
  "68%",
  "78%",
  "88%",
] as const;

export function StadiumLayer() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
    >
      {/* Distant upper-deck silhouette */}
      <div
        className="absolute inset-x-0 bottom-0 h-[48%] opacity-55"
        style={{
          clipPath:
            "polygon(0 48%, 7% 42%, 16% 38%, 26% 34%, 38% 31%, 50% 30%, 62% 31%, 74% 34%, 84% 38%, 93% 42%, 100% 48%, 100% 100%, 0 100%)",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(7,11,18,0.72) 58%, rgba(3,5,8,0.96) 100%)",
        }}
      />

      {/* Concrete seating bands */}
      <div
        className="absolute inset-x-[-6%] bottom-[8%] h-[29%] opacity-45"
        style={{
          borderTop: "1px solid rgba(148,163,184,0.12)",
          background:
            "repeating-linear-gradient(180deg, rgba(148,163,184,0.055) 0px, rgba(148,163,184,0.055) 1px, transparent 1px, transparent 18px)",
          transform: "perspective(900px) rotateX(63deg)",
          transformOrigin: "bottom center",
        }}
      />

      {/* Roofline */}
      <div className="absolute inset-x-[3%] top-[17%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div
        className="absolute left-1/2 top-[17%] h-[16%] w-[88%] -translate-x-1/2 opacity-35"
        style={{
          clipPath:
            "polygon(0 5%, 12% 18%, 27% 8%, 50% 0, 73% 8%, 88% 18%, 100% 5%, 96% 16%, 74% 20%, 50% 13%, 26% 20%, 4% 16%)",
          background:
            "linear-gradient(180deg, rgba(148,163,184,0.22), rgba(30,41,59,0.02))",
        }}
      />

      {/* Stadium light gantry */}
      <div className="absolute inset-x-[7%] top-[19%] flex justify-between opacity-55">
        {lightPositions.map((position) => (
          <div
            key={position}
            className="relative h-16 w-px bg-gradient-to-b from-white/20 to-transparent"
          >
            <div className="absolute -left-3 -top-1 h-px w-6 bg-white/25" />
            <div className="absolute -left-[2px] -top-[3px] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_12px_rgba(191,219,254,0.7)]" />
          </div>
        ))}
      </div>

      {/* Field horizon */}
      <div
        className="absolute inset-x-[-12%] bottom-[-18%] h-[45%] rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(14,116,144,0.10) 0%, rgba(8,47,73,0.06) 34%, rgba(3,7,12,0.92) 72%)",
          borderTop: "1px solid rgba(125,211,252,0.08)",
        }}
      />

      {/* Central architectural depth */}
      <div
        className="absolute bottom-[9%] left-1/2 h-[28%] w-[72%] -translate-x-1/2 opacity-30"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.05) 18%, rgba(148,163,184,0.09) 50%, rgba(148,163,184,0.05) 82%, transparent 100%)",
          clipPath:
            "polygon(0 100%, 8% 44%, 24% 20%, 50% 8%, 76% 20%, 92% 44%, 100% 100%)",
        }}
      />

      {/* Lower vignette keeps text hierarchy dominant */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 42%, rgba(3,5,8,0.18) 65%, rgba(3,5,8,0.76) 100%)",
        }}
      />
    </div>
  );
}
