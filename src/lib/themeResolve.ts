import { THEME_REGISTRY, type VisualTheme } from '../theme/themeRegistry';

const MARKET_KEY = 'vouchedge_market_themes';

export function readMarketThemes(): VisualTheme[] {
  try {
    const cached = localStorage.getItem(MARKET_KEY);
    if (!cached) return [];
    const parsed = JSON.parse(cached) as unknown;
    return Array.isArray(parsed) ? (parsed as VisualTheme[]) : [];
  } catch {
    return [];
  }
}

export function resolveThemeById(themeId?: string | null): VisualTheme {
  if (!themeId) return THEME_REGISTRY[0];
  const fromRegistry = THEME_REGISTRY.find((theme) => theme.id === themeId);
  if (fromRegistry) return fromRegistry;
  const fromMarket = readMarketThemes().find((theme) => theme.id === themeId);
  if (fromMarket) return fromMarket;
  return THEME_REGISTRY[0];
}

export function resolveThemeByIdOptional(themeId?: string | null): VisualTheme | null {
  if (!themeId) return null;
  const fromRegistry = THEME_REGISTRY.find((theme) => theme.id === themeId);
  if (fromRegistry) return fromRegistry;
  const fromMarket = readMarketThemes().find((theme) => theme.id === themeId);
  return fromMarket ?? null;
}

export function allAvailableThemes(): VisualTheme[] {
  const market = readMarketThemes();
  const known = new Set(THEME_REGISTRY.map((theme) => theme.id));
  return [...THEME_REGISTRY, ...market.filter((theme) => !known.has(theme.id))];
}
