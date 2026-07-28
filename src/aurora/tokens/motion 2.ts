/**
 * Aurora Motion Tokens
 *
 * Motion communicates state and hierarchy.
 * Keep transitions subtle and consistent.
 */

export const duration = {
  instant: "0ms",
  fast: "120ms",
  normal: "180ms",
  medium: "240ms",
  slow: "320ms",
  slower: "480ms",
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  accelerate: "cubic-bezier(0.3, 0, 1, 1)",
  decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export const motion = {
  duration,
  easing,
} as const;

export type AuroraMotion = typeof motion;

export default motion;
