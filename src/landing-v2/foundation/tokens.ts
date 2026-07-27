export const auroraTokens = {
  color: {
    background: {
      primary: "oklch(14% 0.018 245)",
      secondary: "oklch(18% 0.018 245)",
      elevated: "oklch(22% 0.018 245)",
    },
    surface: {
      matte: "oklch(20% 0.016 245 / 0.94)",
      glass: "oklch(24% 0.018 245 / 0.68)",
      floating: "oklch(27% 0.018 245 / 0.78)",
    },
    text: {
      primary: "oklch(94% 0.008 245)",
      secondary: "oklch(76% 0.012 245)",
      muted: "oklch(61% 0.012 245)",
    },
    accent: {
      cyan: "oklch(78% 0.12 205)",
      cyanSoft: "oklch(78% 0.08 205)",
      gold: "oklch(78% 0.12 82)",
      success: "oklch(74% 0.11 150)",
      danger: "oklch(65% 0.15 28)",
    },
    border: {
      subtle: "oklch(92% 0.01 245 / 0.09)",
      active: "oklch(78% 0.12 205 / 0.34)",
    },
  },

  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
  },

  radius: {
    small: "0.5rem",
    medium: "0.875rem",
    large: "1.25rem",
    hero: "1.75rem",
    pill: "999px",
  },

  blur: {
    subtle: "10px",
    glass: "18px",
    maximum: "24px",
  },

  duration: {
    fast: "180ms",
    standard: "240ms",
    deliberate: "320ms",
  },

  easing: {
    grounding: "cubic-bezier(0.22, 1, 0.36, 1)",
  },

  layout: {
    contentMax: "1440px",
    readingMax: "760px",
    navigationHeight: "72px",
  },
} as const;

export type AuroraTokens = typeof auroraTokens;
