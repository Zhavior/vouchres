export function AuroraField() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: "#05070B",
        }}
      />

      <div
        className="absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(52,120,255,0.22) 0%, rgba(52,120,255,0.08) 35%, transparent 72%)",
          filter: "blur(90px)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top, transparent 55%, rgba(0,0,0,.45) 100%)",
        }}
      />
    </div>
  );
}
