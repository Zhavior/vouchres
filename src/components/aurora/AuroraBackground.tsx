import type { ReactNode } from "react";

import { type AuroraVariant } from "./auroraVariants";

type AuroraBackgroundProps = {
  variant?: AuroraVariant;
  children?: ReactNode;
  className?: string;
};

/*
 * The drifting glow layer is gone.
 *
 * AuroraGlow painted two blurred circles — 34rem and 36rem, `rounded-full`,
 * `blur-3xl` — translating and scaling on 30s and 36s infinite framer-motion
 * loops. It was the only moving background in the app, it ran forever on a
 * data desk, and it did not respect prefers-reduced-motion. Every other desk
 * sits on flat #050505, so this one does too.
 */
export function AuroraBackground({
  variant = "brain",
  children,
  className = "",
}: AuroraBackgroundProps) {
  return (
    <div
      className={[
        "relative isolate overflow-hidden",
        "bg-[#050505]",
        className,
      ].join(" ")}
    >
      {/* TODO: Sprint 1 */}
      {/* <AuroraGrid opacity={config.gridOpacity} /> */}
      {/* <AuroraParticles density={config.particleDensity} /> */}
      {/* <AuroraNeuralField opacity={config.neuralOpacity} /> */}
      {/* <AuroraNoise /> */}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
