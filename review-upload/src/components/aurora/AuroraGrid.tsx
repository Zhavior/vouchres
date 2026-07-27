type AuroraGridProps = {
  opacity?: number;
};

export function AuroraGrid({
  opacity = 0.08,
}: AuroraGridProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(to right, rgb(var(--ve-ion-rgb) / 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(var(--ve-ion-rgb) / 0.08) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage:
          "radial-gradient(circle at center, black 30%, transparent 90%)",
        WebkitMaskImage:
          "radial-gradient(circle at center, black 30%, transparent 90%)",
      }}
    />
  );
}
