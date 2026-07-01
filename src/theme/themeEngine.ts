export type ThemeTier = 'free' | 'pro' | 'creator';
export type ThemeStatus = 'active' | 'draft' | 'retired';

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  tierRequired: ThemeTier;
  pointCost: number;
  previewColors: { primary: string; accent: string };
  tokens: {
    bg: string;
    surface: string;
    surfaceElevated: string;
    borderSubtle: string;
    borderStrong: string;
    accent: string;
    profileFrame: string;
    cardSkin: string;
    ambientGlow: string;
  };
  tags: string[];
  status: ThemeStatus;
  version: string;
  isAnimated: boolean;
  reducedMotionSafe: boolean;
  createdAt: string;
}

export const LOCKED_READABILITY_TOKENS = {
  textPrimary: '210 20% 98%',
  textSecondary: '215 15% 72%',
  textMuted: '215 15% 48%',
  buttonText: '222 47% 7%',
  focusRing: '191 97% 60%',
  tableHeaderBg: '217 30% 18%',
  tableHeaderText: '215 15% 70%',
} as const;

const FORBIDDEN_TAGS = ['neon-overload', 'casino-style', 'low-trust'] as const;
const STORAGE_KEY = 've-theme';
const FALLBACK_THEME_ID = 'signal-dark';

export const THEME_REGISTRY: ThemeDefinition[] = [
  {
    id: 'signal-dark',
    name: 'Signal Dark',
    description: 'Default VouchEdge research interface.',
    tierRequired: 'free',
    pointCost: 0,
    previewColors: { primary: '#090e17', accent: '#38bdf8' },
    tokens: {
      bg: '222 47% 7%',
      surface: '220 40% 11%',
      surfaceElevated: '218 35% 15%',
      borderSubtle: '217 30% 18%',
      borderStrong: '216 30% 26%',
      accent: '191 97% 60%',
      profileFrame: '191 97% 60%',
      cardSkin: '220 40% 11%',
      ambientGlow: '191 97% 60%',
    },
    tags: ['default', 'research'],
    status: 'active',
    version: '1.0.0',
    isAnimated: false,
    reducedMotionSafe: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'midnight-scout',
    name: 'Midnight Scout',
    description: 'A quiet slate-gray look for long research sessions.',
    tierRequired: 'free',
    pointCost: 0,
    previewColors: { primary: '#090b10', accent: '#91a7b4' },
    tokens: {
      bg: '230 24% 5%',
      surface: '226 22% 9%',
      surfaceElevated: '224 22% 13%',
      borderSubtle: '224 18% 18%',
      borderStrong: '224 18% 27%',
      accent: '202 28% 66%',
      profileFrame: '202 28% 66%',
      cardSkin: '226 22% 10%',
      ambientGlow: '202 28% 66%',
    },
    tags: ['clean', 'low-glow'],
    status: 'active',
    version: '1.0.0',
    isAnimated: false,
    reducedMotionSafe: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'storm-radar',
    name: 'Storm Radar',
    description: 'A sharper radar-inspired theme for Pro research screens.',
    tierRequired: 'pro',
    pointCost: 120,
    previewColors: { primary: '#0b0a15', accent: '#b077f2' },
    tokens: {
      bg: '244 29% 6%',
      surface: '244 24% 10%',
      surfaceElevated: '244 22% 15%',
      borderSubtle: '248 22% 20%',
      borderStrong: '250 24% 30%',
      accent: '270 72% 68%',
      profileFrame: '270 72% 68%',
      cardSkin: '244 24% 10%',
      ambientGlow: '270 72% 68%',
    },
    tags: ['pro', 'radar'],
    status: 'active',
    version: '1.0.0',
    isAnimated: true,
    reducedMotionSafe: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'creator-gold',
    name: 'Creator Gold',
    description: 'A restrained gold identity theme for creator profiles.',
    tierRequired: 'creator',
    pointCost: 260,
    previewColors: { primary: '#120d08', accent: '#f6c43d' },
    tokens: {
      bg: '32 28% 6%',
      surface: '34 28% 10%',
      surfaceElevated: '36 26% 15%',
      borderSubtle: '40 22% 22%',
      borderStrong: '42 28% 32%',
      accent: '45 92% 62%',
      profileFrame: '45 92% 62%',
      cardSkin: '34 28% 10%',
      ambientGlow: '45 92% 62%',
    },
    tags: ['creator', 'premium'],
    status: 'active',
    version: '1.0.0',
    isAnimated: false,
    reducedMotionSafe: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'diamond-club',
    name: 'Diamond Club',
    description: 'A high-contrast creator theme with a clean monochrome edge.',
    tierRequired: 'creator',
    pointCost: 320,
    previewColors: { primary: '#050607', accent: '#f4f7fb' },
    tokens: {
      bg: '220 16% 4%',
      surface: '220 14% 8%',
      surfaceElevated: '220 13% 13%',
      borderSubtle: '220 10% 21%',
      borderStrong: '220 9% 34%',
      accent: '210 20% 96%',
      profileFrame: '210 20% 96%',
      cardSkin: '220 14% 8%',
      ambientGlow: '210 20% 96%',
    },
    tags: ['creator', 'monochrome'],
    status: 'active',
    version: '1.0.0',
    isAnimated: false,
    reducedMotionSafe: true,
    createdAt: '2026-01-01',
  },
];

type ThemeTokenKey = keyof ThemeDefinition['tokens'];
type LockedTokenKey = keyof typeof LOCKED_READABILITY_TOKENS;
type TokenKey = ThemeTokenKey | LockedTokenKey;

const THEME_TOKEN_KEYS = [
  'bg',
  'surface',
  'surfaceElevated',
  'borderSubtle',
  'borderStrong',
  'accent',
  'profileFrame',
  'cardSkin',
  'ambientGlow',
] as const satisfies readonly ThemeTokenKey[];

const isThemeTokenKey = (key: TokenKey): key is ThemeTokenKey => {
  return (THEME_TOKEN_KEYS as readonly string[]).includes(key);
};

export const resolveThemeToken = (key: TokenKey, theme: ThemeDefinition): string => {
  if (isThemeTokenKey(key)) {
    return theme.tokens[key];
  }

  return LOCKED_READABILITY_TOKENS[key];
};

interface ContrastRequirement {
  fg: TokenKey;
  bg: TokenKey;
  threshold: 3 | 4.5;
  reason: string;
}

const CONTRAST_REQUIREMENTS: ContrastRequirement[] = [
  { fg: 'textPrimary', bg: 'bg', threshold: 4.5, reason: 'primary page text' },
  { fg: 'textPrimary', bg: 'surface', threshold: 4.5, reason: 'panel text' },
  { fg: 'textSecondary', bg: 'surface', threshold: 4.5, reason: 'secondary panel text' },
  { fg: 'textMuted', bg: 'surface', threshold: 3, reason: 'muted metadata text' },
  { fg: 'accent', bg: 'bg', threshold: 3, reason: 'accent on page background' },
  { fg: 'accent', bg: 'surface', threshold: 3, reason: 'accent on panels' },
  { fg: 'buttonText', bg: 'accent', threshold: 4.5, reason: 'primary button text' },
  { fg: 'borderSubtle', bg: 'surface', threshold: 3, reason: 'panel borders' },
  { fg: 'borderStrong', bg: 'surface', threshold: 3, reason: 'active borders' },
  { fg: 'focusRing', bg: 'bg', threshold: 3, reason: 'keyboard focus ring' },
  { fg: 'tableHeaderText', bg: 'tableHeaderBg', threshold: 4.5, reason: 'table header text' },
];

const parseHsl = (value: string): [number, number, number] | null => {
  const normalized = value.trim().replace(/,/g, ' ');
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length < 3) return null;

  const h = Number.parseFloat(parts[0]);
  const s = Number.parseFloat(parts[1].replace('%', ''));
  const l = Number.parseFloat(parts[2].replace('%', ''));

  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return null;
  return [h, s, l];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const hue = ((h % 360) + 360) % 360;
  const saturation = Math.max(0, Math.min(100, s)) / 100;
  const lightness = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const toLinear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  const [rs, gs, bs] = [toLinear(r), toLinear(g), toLinear(b)];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const calculateContrast = (foreground: string, background: string): number => {
  const fgHsl = parseHsl(foreground);
  const bgHsl = parseHsl(background);

  if (!fgHsl || !bgHsl) return 0;

  const fgLum = relativeLuminance(hslToRgb(...fgHsl));
  const bgLum = relativeLuminance(hslToRgb(...bgHsl));

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
};

export const getThemeById = (id: string): ThemeDefinition | undefined => {
  return THEME_REGISTRY.find((theme) => theme.id === id);
};

export const validateThemeSafety = (theme: ThemeDefinition): { ok: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (theme.status !== 'active') {
    errors.push(`Theme "${theme.id}" is not active.`);
  }

  const forbiddenTag = theme.tags.find((tag) => (FORBIDDEN_TAGS as readonly string[]).includes(tag));
  if (forbiddenTag) {
    errors.push(`Theme "${theme.id}" uses forbidden tag "${forbiddenTag}".`);
  }

  for (const requirement of CONTRAST_REQUIREMENTS) {
    const foreground = resolveThemeToken(requirement.fg, theme);
    const background = resolveThemeToken(requirement.bg, theme);
    const contrast = calculateContrast(foreground, background);

    if (contrast < requirement.threshold) {
      errors.push(
        `Contrast failed for ${requirement.reason}: ${requirement.fg} on ${requirement.bg} (${contrast.toFixed(
          2
        )} < ${requirement.threshold}).`
      );
    }
  }

  return { ok: errors.length === 0, errors };
};

const getSafeTheme = (id: string | null | undefined): ThemeDefinition => {
  const requested = id ? getThemeById(id) : undefined;
  const fallback = getThemeById(FALLBACK_THEME_ID) ?? THEME_REGISTRY[0];

  if (!requested) return fallback;

  const safety = validateThemeSafety(requested);
  if (!safety.ok) return fallback;

  return requested;
};

export const applyTheme = (id: string): ThemeDefinition => {
  const theme = getSafeTheme(id);
  document.documentElement.setAttribute('data-ve-theme', theme.id);
  localStorage.setItem(STORAGE_KEY, theme.id);
  return theme;
};

export const previewTheme = (id: string): ThemeDefinition | null => {
  const theme = getThemeById(id);
  if (!theme) return null;

  const safety = validateThemeSafety(theme);
  if (!safety.ok) return null;

  document.documentElement.setAttribute('data-ve-theme', theme.id);
  return theme;
};

export const revertTheme = (): ThemeDefinition => {
  return applyTheme(localStorage.getItem(STORAGE_KEY) || FALLBACK_THEME_ID);
};

export const loadSavedTheme = (): ThemeDefinition => {
  return applyTheme(localStorage.getItem(STORAGE_KEY) || FALLBACK_THEME_ID);
};

export const isThemeUnlockedClientHint = (
  theme: ThemeDefinition,
  userTier: ThemeTier,
  unlockedThemeIds: string[]
): boolean => {
  if (theme.tierRequired === 'free') return true;
  if (unlockedThemeIds.includes(theme.id)) return true;

  const tierWeight: Record<ThemeTier, number> = { free: 0, pro: 1, creator: 2 };
  return tierWeight[userTier] >= tierWeight[theme.tierRequired];
};
