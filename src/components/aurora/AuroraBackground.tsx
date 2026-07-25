import type { ReactNode } from "react";

import { AuroraGlow } from "./AuroraGlow";
import {
  auroraVariants,
  type AuroraVariant,
} from "./auroraVariants";

type AuroraBackgroundProps = {
  variant?: AuroraVariant;
  children?: ReactNode;
  className?: string;
};

export function AuroraBackground({
  variant = "brain",
  children,
  className = "",
}: AuroraBackgroundProps) {
  const config = auroraVariants[variant];

  return (
    <div
      className={[
        "relative isolate overflow-hidden",
        "bg-ve-obsidian",
        className,
      ].join(" ")}
    >
      <AuroraGlow intensity={config.glowIntensity} />

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
