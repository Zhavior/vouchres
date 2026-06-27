export type HrShareCardCandidate = {
  playerId: number | string;
  playerName?: string;
  team?: string;
  opponent?: string;
  venue?: string;
  gamePk?: number | string;
  opponentPitcherName?: string | null;
  lineupStatus?: string;
  riskTier?: string | null;
  dataConfidence?: number;
  hrScore?: number;
  scoreBreakdown?: {
    hitterPower?: number;
    pitcherVulnerability?: number;
    parkFactor?: number;
    recentForm?: number;
    finalScore?: number;
  };
  recentForm?: {
    gamesChecked?: number;
    homeRuns?: number;
    extraBaseHits?: number;
    slugging?: number;
  };
  reasons?: string[];
  warnings?: string[];
};

export type HrShareCardParams = {
  playerId: string;
  gamePk?: string;
  date?: string;
  format: "svg";
  theme: "dark" | "gold" | "neon" | "clean";
};

export class HrShareCardRequestError extends Error {
  statusCode: number;
  payload: Record<string, unknown>;

  constructor(statusCode: number, payload: Record<string, unknown>) {
    super(String(payload.error ?? "Invalid HR share-card request"));
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

const VALID_THEMES = new Set(["dark", "gold", "neon", "clean"]);
const VALID_FORMATS = new Set(["svg"]);

const PALETTES = {
  dark: {
    bg: "#020617",
    bg2: "#07111f",
    panel: "#0f172a",
    border: "#1e3a5f",
    accent: "#38bdf8",
    accent2: "#10b981",
    accent3: "#f59e0b",
    text: "#f8fafc",
    muted: "#94a3b8",
    warningBg: "#3b2608",
    warningText: "#fde68a",
  },
  gold: {
    bg: "#070707",
    bg2: "#17120a",
    panel: "#14100a",
    border: "#854d0e",
    accent: "#fbbf24",
    accent2: "#38bdf8",
    accent3: "#34d399",
    text: "#fff7ed",
    muted: "#d6a95f",
    warningBg: "#312007",
    warningText: "#fde68a",
  },
  neon: {
    bg: "#050014",
    bg2: "#0f0528",
    panel: "#120a2a",
    border: "#5b21b6",
    accent: "#22d3ee",
    accent2: "#a78bfa",
    accent3: "#fb7185",
    text: "#f8fafc",
    muted: "#c4b5fd",
    warningBg: "#2d1636",
    warningText: "#f5d0fe",
  },
  clean: {
    bg: "#e5edf6",
    bg2: "#f8fafc",
    panel: "#ffffff",
    border: "#bfdbfe",
    accent: "#2563eb",
    accent2: "#0891b2",
    accent3: "#059669",
    text: "#0f172a",
    muted: "#475569",
    warningBg: "#fef3c7",
    warningText: "#92400e",
  },
} as const;

function firstQuery(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
  return typeof value === "string" ? value : undefined;
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

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function rounded(value: unknown, fallback = "N/A"): string {
  const numeric = numberValue(value);
  return numeric === null ? fallback : String(Math.round(numeric));
}

function decimal(value: unknown, digits = 3, fallback = "N/A"): string {
  const numeric = numberValue(value);
  return numeric === null ? fallback : numeric.toFixed(digits);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pct(value: unknown, max = 100) {
  const numeric = numberValue(value);
  if (numeric === null || max <= 0) return 0;
  return clamp((numeric / max) * 100, 0, 100);
}

function riskColor(riskTier?: string | null) {
  switch (riskTier) {
    case "Strong": return "#22c55e";
    case "Playable": return "#38bdf8";
    case "Sneaky": return "#f59e0b";
    case "Longshot": return "#fb7185";
    default: return "#94a3b8";
  }
}

function statChip(
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  palette: (typeof PALETTES)[HrShareCardParams["theme"]],
  color: string = palette.accent,
) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="74" rx="18" fill="${palette.panel}" fill-opacity="0.74" stroke="${palette.border}" />
    <text x="${x + 20}" y="${y + 28}" fill="${palette.muted}" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="1.4">${escapeXml(label)}</text>
    <text x="${x + 20}" y="${y + 58}" fill="${color}" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="900">${escapeXml(value)}</text>
  `;
}

function bar(
  label: string,
  value: unknown,
  x: number,
  y: number,
  width: number,
  palette: (typeof PALETTES)[HrShareCardParams["theme"]],
  color: string,
  max = 100,
) {
  const fillWidth = Math.round((pct(value, max) / 100) * width);
  return `
    <text x="${x}" y="${y}" fill="${palette.muted}" font-size="17" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="1.1">${escapeXml(label)}</text>
    <text x="${x + width}" y="${y}" text-anchor="end" fill="${palette.text}" font-size="17" font-family="Inter, Arial, sans-serif" font-weight="900">${escapeXml(rounded(value))}</text>
    <rect x="${x}" y="${y + 14}" width="${width}" height="12" rx="6" fill="#020617" fill-opacity="0.72" />
    <rect x="${x}" y="${y + 14}" width="${fillWidth}" height="12" rx="6" fill="${color}" />
  `;
}

export function parseHrShareCardParams(query: Record<string, unknown>): HrShareCardParams {
  const playerId = firstQuery(query.playerId);
  const gamePk = firstQuery(query.gamePk);
  const date = firstQuery(query.date);
  const format = firstQuery(query.format) ?? "svg";
  const theme = firstQuery(query.theme) ?? "dark";

  if (!playerId || !/^\d+$/.test(playerId)) {
    throw new HrShareCardRequestError(400, { error: "playerId is required and must be numeric" });
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HrShareCardRequestError(400, { error: "date must use YYYY-MM-DD format" });
  }

  if (gamePk && !/^\d+$/.test(gamePk)) {
    throw new HrShareCardRequestError(400, { error: "gamePk must be numeric when provided" });
  }

  if (!VALID_FORMATS.has(format)) {
    throw new HrShareCardRequestError(400, { error: "Only format=svg is supported in this first version" });
  }

  if (!VALID_THEMES.has(theme)) {
    throw new HrShareCardRequestError(400, { error: "theme must be one of dark, gold, neon, clean" });
  }

  return {
    playerId,
    gamePk,
    date,
    format: "svg",
    theme: theme as HrShareCardParams["theme"],
  };
}

export function findHrShareCardCandidate(
  candidates: HrShareCardCandidate[],
  params: Pick<HrShareCardParams, "playerId" | "gamePk">,
) {
  return candidates.find((row) => {
    if (String(row.playerId) !== params.playerId) return false;
    if (params.gamePk && String(row.gamePk) !== params.gamePk) return false;
    return true;
  });
}

export function renderHrShareCardSvg(
  candidate: HrShareCardCandidate,
  input: { date?: string; theme: HrShareCardParams["theme"] },
) {
  const palette = PALETTES[input.theme] ?? PALETTES.dark;
  const breakdown = candidate.scoreBreakdown;
  const recent = candidate.recentForm;
  const warning = candidate.lineupStatus === "projected_unconfirmed"
    ? "Projection preview — official lineup not posted yet."
    : "Confirmed lineup data available.";
  const risk = candidate.riskTier ?? "N/A";
  const matchup = `${candidate.team ?? "TBD"} vs ${candidate.opponent ?? "TBD"}`;
  const reasonOne = truncate(candidate.reasons?.[0] ?? "HR Engine Pro v2 signal from current matchup context.", 92);
  const reasonTwo = truncate(candidate.reasons?.[1] ?? candidate.warnings?.[0] ?? "Review final lineup and pitcher status before using this research.", 92);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="VouchEdge HR player share card">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.bg}" />
      <stop offset="1" stop-color="${palette.bg2}" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.accent}" />
      <stop offset="0.55" stop-color="${palette.accent2}" />
      <stop offset="1" stop-color="${palette.accent3}" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.22 0 0 0 0 0.74 0 0 0 0 0.97 0 0 0 0.42 0" />
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1020" cy="80" r="210" fill="${palette.accent}" opacity="0.10" filter="url(#glow)" />
  <circle cx="118" cy="555" r="230" fill="${palette.accent2}" opacity="0.08" filter="url(#glow)" />
  <path d="M0 110 C220 70 330 145 520 108 C770 58 930 95 1200 44" stroke="url(#accent)" stroke-width="2" opacity="0.35" fill="none" />

  <rect x="56" y="48" width="1088" height="534" rx="34" fill="${palette.panel}" fill-opacity="0.68" stroke="${palette.border}" stroke-width="2" />
  <rect x="56" y="48" width="1088" height="9" rx="4" fill="url(#accent)" />

  <g transform="translate(86 82)">
    <rect x="0" y="0" width="58" height="58" rx="17" fill="url(#accent)" />
    <text x="29" y="38" text-anchor="middle" fill="#020617" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="1000">VE</text>
    <text x="76" y="24" fill="${palette.text}" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="1000" letter-spacing="0.5">VouchEdge</text>
    <text x="76" y="49" fill="${palette.muted}" font-size="15" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="1.1">HR ENGINE PRO V2 SHARE CARD</text>
  </g>

  <g transform="translate(86 170)">
    <text x="0" y="0" fill="${palette.text}" font-size="52" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(truncate(candidate.playerName, 34))}</text>
    <text x="2" y="36" fill="${palette.muted}" font-size="21" font-family="Inter, Arial, sans-serif" font-weight="800">${escapeXml(truncate(matchup, 62))}</text>
    <text x="2" y="68" fill="${palette.muted}" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="700">Venue: ${escapeXml(truncate(candidate.venue ?? "Unknown venue", 58))}</text>
    <text x="2" y="96" fill="${palette.muted}" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="700">Opposing pitcher: ${escapeXml(truncate(candidate.opponentPitcherName ?? "TBD", 48))}</text>
  </g>

  <g transform="translate(805 128)">
    <circle cx="135" cy="112" r="104" fill="#020617" fill-opacity="0.66" stroke="url(#accent)" stroke-width="5" />
    <text x="135" y="86" text-anchor="middle" fill="${palette.muted}" font-size="20" font-family="Inter, Arial, sans-serif" font-weight="900" letter-spacing="1.8">HR EDGE</text>
    <text x="135" y="145" text-anchor="middle" fill="${palette.accent}" font-size="70" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(rounded(candidate.hrScore))}</text>
    <text x="135" y="180" text-anchor="middle" fill="${riskColor(risk)}" font-size="22" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(risk)}</text>
  </g>

  <g>
    ${statChip("P.VULN", rounded(breakdown?.pitcherVulnerability), 86, 326, 152, palette, palette.accent)}
    ${statChip("HITTER", rounded(breakdown?.hitterPower), 258, 326, 152, palette, palette.accent3)}
    ${statChip("PARK", rounded(breakdown?.parkFactor), 430, 326, 152, palette, palette.accent2)}
    ${statChip("RECENT", rounded(breakdown?.recentForm), 602, 326, 152, palette, "#c084fc")}
    ${statChip("DATA", `${rounded(candidate.dataConfidence)}%`, 774, 326, 152, palette, palette.accent)}
    ${statChip("FINAL", rounded(breakdown?.finalScore ?? candidate.hrScore), 946, 326, 152, palette, palette.accent3)}
  </g>

  <g transform="translate(86 430)">
    <rect x="0" y="0" width="510" height="78" rx="20" fill="#020617" fill-opacity="0.44" stroke="${palette.border}" />
    <text x="24" y="28" fill="${palette.muted}" font-size="16" font-family="Inter, Arial, sans-serif" font-weight="900" letter-spacing="1.2">RECENT FORM</text>
    <text x="24" y="58" fill="${palette.text}" font-size="22" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(recent?.gamesChecked ?? "15")}G · ${escapeXml(recent?.homeRuns ?? "N/A")} HR · ${escapeXml(recent?.extraBaseHits ?? "N/A")} XBH · ${escapeXml(decimal(recent?.slugging))} SLG</text>
  </g>

  <g transform="translate(628 432)">
    ${bar("Hitter power", breakdown?.hitterPower, 0, 0, 392, palette, palette.accent3)}
    ${bar("Pitcher vulnerability", breakdown?.pitcherVulnerability, 0, 47, 392, palette, palette.accent)}
  </g>

  <g transform="translate(86 528)">
    <rect x="0" y="0" width="1010" height="34" rx="17" fill="${palette.warningBg}" fill-opacity="0.84" />
    <text x="20" y="23" fill="${palette.warningText}" font-size="15" font-family="Inter, Arial, sans-serif" font-weight="900">${escapeXml(warning)}</text>
  </g>

  <g transform="translate(86 548)">
    <text x="0" y="-84" fill="${palette.text}" font-size="16" font-family="Inter, Arial, sans-serif" font-weight="800">${escapeXml(reasonOne)}</text>
    <text x="0" y="-58" fill="${palette.muted}" font-size="15" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeXml(reasonTwo)}</text>
  </g>

  <text x="86" y="604" fill="${palette.muted}" font-size="14" font-family="Inter, Arial, sans-serif" font-weight="800">Probability-based research. Not betting advice. No guaranteed outcomes.</text>
  <text x="1114" y="604" text-anchor="end" fill="${palette.muted}" font-size="14" font-family="Inter, Arial, sans-serif" font-weight="800">${escapeXml(input.date ?? "today")}</text>
</svg>`;
}

export const HR_SHARE_CARD_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=300",
} as const;
