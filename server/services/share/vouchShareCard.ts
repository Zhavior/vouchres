/**
 * Vouch share card — SVG renderer for the /v/:id Open Graph permalink.
 * Structured like server/services/share/hrShareCard.ts (same palette/helper
 * pattern), kept self-contained rather than importing across share services.
 */

export type VouchShareCardData = {
  playerOrTeam?: string | null;
  market: string;
  gameName: string;
  odds: string;
  selection?: string | null;
  aiConfidence?: number | null;
  capperConfidence?: number | null;
  riskTier?: string | null;
  cardTheme?: string | null;
};

type Theme = "dark" | "gold" | "neon" | "clean";

const PALETTES: Record<Theme, {
  bg: string; bg2: string; panel: string; border: string;
  accent: string; accent2: string; accent3: string; text: string; muted: string;
}> = {
  dark: {
    bg: "#020617", bg2: "#08111f", panel: "#0b1220", border: "#164e63",
    accent: "#22d3ee", accent2: "#34d399", accent3: "#d6a64f", text: "#f8fafc", muted: "#9aa8bd",
  },
  gold: {
    bg: "#050505", bg2: "#111827", panel: "#0b1220", border: "#7c5c24",
    accent: "#d6a64f", accent2: "#22d3ee", accent3: "#34d399", text: "#fffaf0", muted: "#b8a77c",
  },
  neon: {
    bg: "#030712", bg2: "#0b1220", panel: "#0f172a", border: "#155e75",
    accent: "#22d3ee", accent2: "#34d399", accent3: "#a3e635", text: "#f8fafc", muted: "#a7b6c8",
  },
  clean: {
    bg: "#eaf1f8", bg2: "#f8fafc", panel: "#ffffff", border: "#b6c6d9",
    accent: "#0f766e", accent2: "#2563eb", accent3: "#b7791f", text: "#0f172a", muted: "#475569",
  },
};

/** Vouch.cardTheme values (types.ts) don't match the HR card's theme names — map them. */
function normalizeTheme(cardTheme?: string | null): Theme {
  switch (cardTheme) {
    case "neon-pulse": return "neon";
    case "cyber": return "neon";
    case "vintage-gold": return "gold";
    case "minimalist": return "clean";
    case "cosmic":
    default:
      return "dark";
  }
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: unknown, max: number): string {
  const text = String(value ?? "").trim();
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;
}

function riskColor(riskTier?: string | null, palette?: (typeof PALETTES)[Theme]) {
  switch ((riskTier || "").toUpperCase()) {
    case "LOW": return "#22c55e";
    case "MEDIUM": return "#f59e0b";
    case "HIGH": return "#fb7185";
    default: return palette?.muted ?? "#94a3b8";
  }
}

function chip(
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  palette: (typeof PALETTES)[Theme],
  color: string,
) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="86" rx="20" fill="#020617" fill-opacity="0.5" stroke="${palette.border}" stroke-width="1.5" />
    <text x="${x + 22}" y="${y + 30}" fill="${palette.muted}" font-size="16" font-family="Inter, Arial, sans-serif" font-weight="900" letter-spacing="1.3">${escapeXml(label)}</text>
    <text x="${x + 22}" y="${y + 65}" fill="${color}" font-size="32" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(value)}</text>
  `;
}

export function renderVouchShareCardSvg(vouch: VouchShareCardData): string {
  const palette = PALETTES[normalizeTheme(vouch.cardTheme)];
  const headline = truncate(vouch.playerOrTeam || vouch.market, 30);
  const marketLine = truncate(vouch.selection || vouch.market, 54);
  const matchup = truncate(vouch.gameName, 50);
  const risk = vouch.riskTier ?? "N/A";
  const aiConf = vouch.aiConfidence != null ? `${Math.round(vouch.aiConfidence)}%` : "N/A";
  const capperConf = vouch.capperConfidence != null ? `${Math.round(vouch.capperConfidence)}%` : "N/A";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="VouchEdge vouch share card">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#020617" />
      <stop offset="0.48" stop-color="${palette.bg}" />
      <stop offset="1" stop-color="${palette.bg2}" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.accent}" />
      <stop offset="0.52" stop-color="${palette.accent2}" />
      <stop offset="1" stop-color="${palette.accent3}" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="42" y="35" width="1116" height="560" rx="38" fill="${palette.panel}" fill-opacity="0.6" stroke="${palette.border}" stroke-width="2" />
  <rect x="42" y="35" width="1116" height="10" rx="5" fill="url(#accent)" />

  <g transform="translate(78 72)">
    <rect x="0" y="0" width="68" height="68" rx="20" fill="url(#accent)" />
    <text x="34" y="43" text-anchor="middle" fill="#020617" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="1000">VE</text>
    <text x="88" y="26" fill="${palette.text}" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="1000">VouchEdge</text>
    <text x="90" y="55" fill="${palette.muted}" font-size="15" font-family="Inter, Arial, sans-serif" font-weight="900" letter-spacing="1.6">VOUCH SHARE CARD</text>
  </g>

  <g transform="translate(78 190)">
    <text x="0" y="0" fill="${palette.text}" font-size="56" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(headline)}</text>
    <text x="2" y="42" fill="${palette.muted}" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="900">${escapeXml(marketLine)}</text>
    <text x="2" y="76" fill="${palette.muted}" font-size="20" font-family="Inter, Arial, sans-serif" font-weight="800">${escapeXml(matchup)}</text>
  </g>

  <g transform="translate(78 320)">
    ${chip("ODDS", vouch.odds, 0, 0, 260, palette, palette.accent3)}
    ${chip("AI CONFIDENCE", aiConf, 284, 0, 260, palette, palette.accent)}
    ${chip("MY CONFIDENCE", capperConf, 568, 0, 260, palette, palette.accent2)}
    ${chip("RISK", risk, 852, 0, 214, palette, riskColor(vouch.riskTier, palette))}
  </g>

  <g transform="translate(78 546)">
    <rect x="0" y="0" width="946" height="37" rx="18" fill="#0f172a" fill-opacity="0.85" stroke="${palette.border}" stroke-opacity="0.7" />
    <text x="24" y="24" fill="${palette.text}" font-size="15" font-family="Inter, Arial, sans-serif" font-weight="900">Probability-based. No guarantees. Research and entertainment only.</text>
  </g>
</svg>`;
}

export const VOUCH_SHARE_CARD_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=300, s-maxage=300",
} as const;
