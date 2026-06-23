import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";
import { getTheme } from "@/data/themes";

/**
 * ThemeProvider — applies the active theme's background to the document body.
 *
 * Place this at the root of the app. When the active theme changes,
 * the page background transforms accordingly.
 *
 * For profile pages viewing another user's theme, pass `overrideThemeId`
 * to temporarily apply their theme instead of the viewer's.
 */
export function ThemeProvider({ children, overrideThemeId }: { children: React.ReactNode; overrideThemeId?: string }) {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);

  const themeId = overrideThemeId || activeThemeId;
  const theme = getTheme(themeId);

  useEffect(() => {
    // Apply theme background to body
    if (theme) {
      document.body.className = theme.page_bg + " " + theme.font_family + " min-h-screen transition-all duration-500";
    }
  }, [themeId, theme]);

  return <>{children}</>;
}

/**
 * Get CSS classes for a themed card.
 * Use this in components to apply the active theme's card styling.
 */
export function useThemedCard(overrideThemeId?: string) {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const themeId = overrideThemeId || activeThemeId;
  const theme = getTheme(themeId);

  if (!theme) {
    return {
      card: "glass-card",
      border: "border-electric-500/15",
      accent: "text-electric-300",
    };
  }

  return {
    card: theme.card_style,
    border: theme.border_color,
    accent: theme.accent_text,
  };
}
