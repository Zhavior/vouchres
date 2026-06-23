/**
 * ThemeProvider — sets data-theme on <html> + applies background.
 * Wrap the entire app. Listens to useThemeStore for changes.
 */
import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeThemeId);
    document.body.style.background = "var(--ve-bg-gradient)";
  }, [activeThemeId]);

  return <>{children}</>;
}

/** Themes available in the app */
export const APP_THEMES = [
  { id: "default", name: "Cyber Blue", desc: "Default VouchEdge" },
  { id: "neon-court", name: "Neon Court", desc: "NBA purple" },
  { id: "diamond-glow", name: "Diamond Glow", desc: "MLB emerald" },
  { id: "dark-shark", name: "Dark Shark", desc: "Aggressive red" },
  { id: "proof-mode", name: "Proof Mode", desc: "Clean slate" },
] as const;
