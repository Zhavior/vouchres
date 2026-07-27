export type VouchEdgeTheme = "cyber" | "gold" | "royal" | "fire" | "ocean";

const STORAGE_KEY = "vouchedge_theme";

export const VOUCH_EDGE_THEMES: VouchEdgeTheme[] = ["cyber", "gold", "royal", "fire", "ocean"];

export function applyVouchEdgeTheme(theme: VouchEdgeTheme) {
  document.documentElement.dataset.veTheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function getSavedVouchEdgeTheme(): VouchEdgeTheme {
  const saved = localStorage.getItem(STORAGE_KEY) as VouchEdgeTheme | null;
  return saved && VOUCH_EDGE_THEMES.includes(saved) ? saved : "cyber";
}

export function bootVouchEdgeTheme() {
  applyVouchEdgeTheme(getSavedVouchEdgeTheme());
}
