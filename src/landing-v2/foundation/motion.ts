export const auroraMotion = {
  duration: {
    fast: 180,
    standard: 240,
    deliberate: 320,
  },

  easing: {
    grounding: [0.22, 1, 0.36, 1] as const,
  },

  css: {
    grounding: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
} as const;
