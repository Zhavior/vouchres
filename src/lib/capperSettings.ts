export type CapperHeroStyle = "midnight" | "emerald" | "crimson";

export interface CapperSettings {
  clubName: string;
  clubTagline: string;
  welcomeMessage: string;
  offerHeadline: string;
  offerSummary: string;
  ctaLabel: string;
  ctaSubtext: string;
  badgeText: string;
  heroStyle: CapperHeroStyle;
  featuredTags: string[];
  subscriberChatEnabled: boolean;
  announcementsEnabled: boolean;
  showVerifiedRecord: boolean;
  showTailRate: boolean;
  profanityFilterEnabled: boolean;
  linksAllowed: boolean;
  slowModeSeconds: number;
  autoWelcomeEnabled: boolean;
}

export const DEFAULT_CAPPER_SETTINGS: CapperSettings = {
  clubName: "",
  clubTagline: "Shared parlays, verified wins, and clean subscriber access.",
  welcomeMessage: "Welcome to the club. Follow for shared slips, live updates, and honest results.",
  offerHeadline: "Free follow during beta",
  offerSummary: "Followers unlock shared parlays, announcements, and club chat while paid tiers are being prepared.",
  ctaLabel: "Follow club",
  ctaSubtext: "Unlock shared parlays and club updates.",
  badgeText: "CREATOR CLUB",
  heroStyle: "midnight",
  featuredTags: ["MLB", "Parlays", "Verified"],
  subscriberChatEnabled: true,
  announcementsEnabled: true,
  showVerifiedRecord: true,
  showTailRate: true,
  profanityFilterEnabled: true,
  linksAllowed: false,
  slowModeSeconds: 0,
  autoWelcomeEnabled: true,
};

function clampText(value: unknown, maxLength: number, fallback: string): string {
  const next = typeof value === "string" ? value.trim() : "";
  if (!next) return fallback;
  return next.slice(0, maxLength);
}

function normalizeTags(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];
  const deduped = new Set<string>();
  for (const entry of source) {
    const next = clampText(entry, 20, "");
    if (!next) continue;
    deduped.add(next);
    if (deduped.size >= 6) break;
  }
  return deduped.size > 0 ? [...deduped] : [...DEFAULT_CAPPER_SETTINGS.featuredTags];
}

function normalizeHeroStyle(value: unknown): CapperHeroStyle {
  return value === "emerald" || value === "crimson" ? value : "midnight";
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeSlowMode(value: unknown): number {
  const next = Number(value);
  if (!Number.isFinite(next)) return DEFAULT_CAPPER_SETTINGS.slowModeSeconds;
  return Math.min(300, Math.max(0, Math.round(next)));
}

export function normalizeCapperSettings(value: unknown): CapperSettings {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    clubName: clampText(input.clubName, 60, DEFAULT_CAPPER_SETTINGS.clubName),
    clubTagline: clampText(input.clubTagline, 140, DEFAULT_CAPPER_SETTINGS.clubTagline),
    welcomeMessage: clampText(input.welcomeMessage, 240, DEFAULT_CAPPER_SETTINGS.welcomeMessage),
    offerHeadline: clampText(input.offerHeadline, 80, DEFAULT_CAPPER_SETTINGS.offerHeadline),
    offerSummary: clampText(input.offerSummary, 220, DEFAULT_CAPPER_SETTINGS.offerSummary),
    ctaLabel: clampText(input.ctaLabel, 32, DEFAULT_CAPPER_SETTINGS.ctaLabel),
    ctaSubtext: clampText(input.ctaSubtext, 120, DEFAULT_CAPPER_SETTINGS.ctaSubtext),
    badgeText: clampText(input.badgeText, 24, DEFAULT_CAPPER_SETTINGS.badgeText),
    heroStyle: normalizeHeroStyle(input.heroStyle),
    featuredTags: normalizeTags(input.featuredTags),
    subscriberChatEnabled: normalizeBoolean(input.subscriberChatEnabled, DEFAULT_CAPPER_SETTINGS.subscriberChatEnabled),
    announcementsEnabled: normalizeBoolean(input.announcementsEnabled, DEFAULT_CAPPER_SETTINGS.announcementsEnabled),
    showVerifiedRecord: normalizeBoolean(input.showVerifiedRecord, DEFAULT_CAPPER_SETTINGS.showVerifiedRecord),
    showTailRate: normalizeBoolean(input.showTailRate, DEFAULT_CAPPER_SETTINGS.showTailRate),
    profanityFilterEnabled: normalizeBoolean(input.profanityFilterEnabled, DEFAULT_CAPPER_SETTINGS.profanityFilterEnabled),
    linksAllowed: normalizeBoolean(input.linksAllowed, DEFAULT_CAPPER_SETTINGS.linksAllowed),
    slowModeSeconds: normalizeSlowMode(input.slowModeSeconds),
    autoWelcomeEnabled: normalizeBoolean(input.autoWelcomeEnabled, DEFAULT_CAPPER_SETTINGS.autoWelcomeEnabled),
  };
}
