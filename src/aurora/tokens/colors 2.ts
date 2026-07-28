/**
 * Aurora Design Tokens
 * Colors
 */

export const primitive = {
  white: "#FFFFFF",
  black: "#05070A",

  slate: {
    900: "#0B1220",
    800: "#111827",
    700: "#1F2937",
    600: "#374151",
    500: "#6B7280",
    400: "#9CA3AF",
    300: "#CBD5E1",
    200: "#E2E8F0",
    100: "#F8FAFC",
  },

  blue: {
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
  },

  cyan: {
    500: "#06B6D4",
  },

  emerald: {
    500: "#10B981",
  },

  amber: {
    500: "#F59E0B",
  },

  red: {
    500: "#EF4444",
  },
} as const;

export const colors = {
  canvas: primitive.black,

  surface: "#0F172A",
  surfaceElevated: "#131C2B",
  surfaceGlass: "rgba(255,255,255,0.06)",

  text: primitive.white,
  textMuted: primitive.slate[400],
  textSubtle: primitive.slate[500],

  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.20)",

  primary: primitive.blue[500],
  primaryHover: primitive.blue[400],

  accent: primitive.cyan[500],

  success: primitive.emerald[500],
  warning: primitive.amber[500],
  danger: primitive.red[500],
} as const;

export type AuroraColors = typeof colors;

export default colors;
