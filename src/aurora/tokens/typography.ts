/**
 * Aurora Typography Tokens
 *
 * Single source of truth for typography.
 */

export const fontFamily = {
  display:
    '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  body:
    '"Cabinet Grotesk", ui-sans-serif, system-ui, sans-serif',
  mono:
    '"JetBrains Mono", ui-monospace, monospace',
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.7,
} as const;
