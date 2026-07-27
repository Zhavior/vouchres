export {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";

/**
 * Aurora's shared motion contract.  Keep these semantic: a caller should pick
 * the interaction level, not invent another duration or easing curve.
 */
export const auroraMotion = {
  duration: {
    instant: 0.08,
    fast: 0.14,
    standard: 0.22,
    deliberate: 0.32,
    surface: 0.4,
  },
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0.16, 1, 0.3, 1],
    exit: [0.4, 0, 1, 1],
    emphasized: [0.22, 1, 0.36, 1],
  },
  spring: {
    responsive: { stiffness: 420, damping: 34, mass: 0.8 },
    gentle: { stiffness: 280, damping: 30, mass: 1 },
  },
} as const;

export function auroraFadeTransition(reducedMotion: boolean | null) {
  return {
    duration: reducedMotion ? auroraMotion.duration.instant : auroraMotion.duration.fast,
    ease: auroraMotion.easing.standard,
  };
}

export function auroraSurfaceTransition(reducedMotion: boolean | null) {
  return reducedMotion
    ? auroraFadeTransition(true)
    : { type: 'spring' as const, ...auroraMotion.spring.gentle };
}
