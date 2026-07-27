/**
 * Aurora Z-Index Tokens
 *
 * Layer hierarchy for the entire application.
 */

export const zIndex = {
  base: 0,
  content: 10,
  sticky: 100,
  dropdown: 200,
  overlay: 300,
  modal: 400,
  drawer: 500,
  toast: 600,
  tooltip: 700,
  notification: 800,
  debug: 9999,
} as const;

export type AuroraZIndex = typeof zIndex;

export default zIndex;
