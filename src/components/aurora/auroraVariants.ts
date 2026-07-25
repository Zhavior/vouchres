export type AuroraVariant =
  | "brain"
  | "research"
  | "player"
  | "live"
  | "command"
  | "social"
  | "premium";

export interface AuroraVariantConfig {
  particleDensity: number;
  glowIntensity: "low" | "medium" | "high";
  gridOpacity: number;
  neuralOpacity: number;
  animationSpeed: number;
}

export const auroraVariants: Record<AuroraVariant, AuroraVariantConfig> = {
  brain: {
    particleDensity: 60,
    glowIntensity: "high",
    gridOpacity: 0.12,
    neuralOpacity: 0.28,
    animationSpeed: 1,
  },
  research: {
    particleDensity: 40,
    glowIntensity: "medium",
    gridOpacity: 0.08,
    neuralOpacity: 0.22,
    animationSpeed: 0.85,
  },
  player: {
    particleDensity: 32,
    glowIntensity: "medium",
    gridOpacity: 0.06,
    neuralOpacity: 0.18,
    animationSpeed: 0.8,
  },
  live: {
    particleDensity: 70,
    glowIntensity: "high",
    gridOpacity: 0.14,
    neuralOpacity: 0.32,
    animationSpeed: 1.15,
  },
  command: {
    particleDensity: 28,
    glowIntensity: "low",
    gridOpacity: 0.10,
    neuralOpacity: 0.16,
    animationSpeed: 0.7,
  },
  social: {
    particleDensity: 45,
    glowIntensity: "medium",
    gridOpacity: 0.10,
    neuralOpacity: 0.20,
    animationSpeed: 0.9,
  },
  premium: {
    particleDensity: 80,
    glowIntensity: "high",
    gridOpacity: 0.16,
    neuralOpacity: 0.36,
    animationSpeed: 1.25,
  },
};
