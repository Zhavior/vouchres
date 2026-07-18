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
    bg2: "#08111f",
    panel: "#0b1220",
    border: "#164e63",
    accent: "#22d3ee",
    accent2: "#34d399",
    accent3: "#d6a64f",
    text: "#f8fafc",
    muted: "#9aa8bd",
    warningBg: "#1f2937",
    warningText: "#f8fafc",
  },
  gold: {
    bg: "#050505",
    bg2: "#111827",
    panel: "#0b1220",
    border: "#7c5c24",
    accent: "#d6a64f",
    accent2: "#22d3ee",
    accent3: "#34d399",
    text: "#fffaf0",
    muted: "#b8a77c",
    warningBg: "#201a10",
    warningText: "#f8e7b0",
  },
  neon: {
    bg: "#030712",
    bg2: "#0b1220",
    panel: "#0f172a",
    border: "#155e75",
    accent: "#22d3ee",
    accent2: "#34d399",
    accent3: "#a3e635",
    text: "#f8fafc",
    muted: "#a7b6c8",
    warningBg: "#12202a",
    warningText: "#d9f99d",
  },
  clean: {
    bg: "#eaf1f8",
    bg2: "#f8fafc",
    panel: "#ffffff",
    border: "#b6c6d9",
    accent: "#0f766e",
    accent2: "#2563eb",
    accent3: "#b7791f",
    text: "#0f172a",
    muted: "#475569",
    warningBg: "#fff7ed",
    warningText: "#7c2d12",
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

  // Trust-first: only exact confirmed status may claim confirmed lineup copy.
  const isConfirmed = candidate.lineupStatus === "confirmed";
  const warning = isConfirmed
    ? "Confirmed lineup data available."
    : "Official lineup not posted yet.";

  const risk = candidate.riskTier ?? "N/A";
  const matchup = `${candidate.team ?? "TBD"} vs ${candidate.opponent ?? "TBD"}`;
  const dateLabel = input.date ?? "Today";
  const hrScore = rounded(candidate.hrScore);
  const finalScore = rounded(breakdown?.finalScore ?? candidate.hrScore);
  const pitcherVulnerability = rounded(breakdown?.pitcherVulnerability);
  const hitterPower = rounded(breakdown?.hitterPower);
  const parkFactor = rounded(breakdown?.parkFactor);
  const recentSignal = rounded(breakdown?.recentForm);
  const dataConfidence = `${rounded(candidate.dataConfidence)}%`;

  const recentSummary = `${recent?.gamesChecked ?? "15"}G · ${recent?.homeRuns ?? "N/A"} HR · ${recent?.extraBaseHits ?? "N/A"} XBH · ${decimal(recent?.slugging)} SLG`;
  const pitcherName = candidate.opponentPitcherName ?? "TBD";
  const venue = candidate.venue ?? "Unknown venue";

  const bar = (
    label: string,
    value: string | number | undefined,
    y: number,
    color: string,
  ) => {
    const numeric = Number(value);
    const width = Number.isFinite(numeric) ? Math.max(0, Math.min(340, (numeric / 100) * 340)) : 0;
    return `
      <text x="0" y="${y}" fill="${palette.muted}" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="900" letter-spacing="0.6">${escapeXml(label)}</text>
      <text x="382" y="${y}" text-anchor="end" fill="${palette.text}" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(String(value ?? "N/A"))}</text>
      <rect x="0" y="${y + 14}" width="382" height="12" rx="6" fill="#020617" fill-opacity="0.70" />
      <rect x="0" y="${y + 14}" width="${width}" height="12" rx="6" fill="${color}" />
    `;
  };

  const miniChip = (
    label: string,
    value: string | number | undefined,
    x: number,
    y: number,
    w: number,
    color: string,
  ) => `
    <rect x="${x}" y="${y}" width="${w}" height="74" rx="18" fill="#061226" fill-opacity="0.72" stroke="${palette.border}" stroke-width="1.5" />
    <text x="${x + 20}" y="${y + 27}" fill="${palette.muted}" font-size="14" font-family="Inter, Arial, sans-serif" font-weight="1000" letter-spacing="1.2">${escapeXml(label)}</text>
    <text x="${x + 20}" y="${y + 57}" fill="${color}" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(String(value ?? "N/A"))}</text>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="VouchEdge HR player share card">
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

    <linearGradient id="panelGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.16" />
      <stop offset="0.55" stop-color="#0f172a" stop-opacity="0.72" />
      <stop offset="1" stop-color="${palette.accent3}" stop-opacity="0.10" />
    </linearGradient>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="22" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.12 0 0 0 0 0.73 0 0 0 0 0.95 0 0 0 0.38 0" />
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#000000" flood-opacity="0.38"/>
    </filter>

    <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="${palette.accent}" opacity="0.16"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#dots)" opacity="0.55" />

  <circle cx="1025" cy="105" r="250" fill="${palette.accent}" opacity="0.08" filter="url(#softGlow)" />
  <circle cx="92" cy="552" r="250" fill="${palette.accent2}" opacity="0.08" filter="url(#softGlow)" />
  <path d="M0 106 C220 66 350 148 540 105 C790 48 950 94 1200 42" stroke="url(#accent)" stroke-width="2" opacity="0.48" fill="none" />

  <rect x="42" y="35" width="1116" height="560" rx="38" fill="url(#panelGlow)" stroke="${palette.border}" stroke-width="2" filter="url(#shadow)" />
  <rect x="42" y="35" width="1116" height="10" rx="5" fill="url(#accent)" />

  <g transform="translate(78 72)">
    <rect x="0" y="0" width="68" height="68" rx="20" fill="url(#accent)" />
    <text x="34" y="43" text-anchor="middle" fill="#020617" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="1000">VE</text>

    <text x="88" y="26" fill="${palette.text}" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="1000" letter-spacing="0.3">VouchEdge</text>
    <text x="90" y="55" fill="${palette.muted}" font-size="15" font-family="Inter, Arial, sans-serif" font-weight="900" letter-spacing="1.6">HR ENGINE PRO V2 SHARE CARD</text>
  </g>

  <g transform="translate(78 176)">
    <text x="0" y="0" fill="${palette.text}" font-size="56" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(truncate(candidate.playerName, 32))}</text>
    <text x="2" y="42" fill="${palette.muted}" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="900">${escapeXml(truncate(matchup, 54))}</text>

    <rect x="0" y="68" width="516" height="86" rx="22" fill="#020617" fill-opacity="0.44" stroke="${palette.border}" />
    <text x="24" y="102" fill="${palette.text}" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="900">Venue: ${escapeXml(truncate(venue, 42))}</text>
    <text x="24" y="132" fill="${palette.muted}" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="800">Opposing pitcher: ${escapeXml(truncate(pitcherName, 40))}</text>
  </g>

  <g transform="translate(796 92)">
    <circle cx="138" cy="130" r="113" fill="#020617" fill-opacity="0.76" stroke="url(#accent)" stroke-width="6" />
    <circle cx="138" cy="130" r="91" fill="#0f172a" fill-opacity="0.50" stroke="${palette.border}" stroke-width="1.5" />
    <text x="138" y="99" text-anchor="middle" fill="${palette.muted}" font-size="20" font-family="Inter, Arial, sans-serif" font-weight="1000" letter-spacing="2">HR EDGE</text>
    <text x="138" y="162" text-anchor="middle" fill="${palette.accent}" font-size="76" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(hrScore)}</text>
    <text x="138" y="199" text-anchor="middle" fill="${riskColor(risk)}" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(risk)}</text>
  </g>

  <g>
    ${miniChip("P.VULN", pitcherVulnerability, 78, 342, 146, palette.accent)}
    ${miniChip("HITTER", hitterPower, 238, 342, 146, palette.accent3)}
    ${miniChip("PARK", parkFactor, 398, 342, 146, palette.accent2)}
    ${miniChip("RECENT", recentSignal, 558, 342, 146, palette.accent2)}
    ${miniChip("DATA", dataConfidence, 718, 342, 146, palette.accent)}
    ${miniChip("FINAL", finalScore, 878, 342, 146, palette.accent3)}
  </g>

  <g transform="translate(78 442)">
    <rect x="0" y="0" width="520" height="88" rx="24" fill="#020617" fill-opacity="0.54" stroke="${palette.border}" stroke-width="1.5" />
    <text x="24" y="32" fill="${palette.muted}" font-size="17" font-family="Inter, Arial, sans-serif" font-weight="1000" letter-spacing="1.3">RECENT FORM</text>
    <text x="24" y="65" fill="${palette.text}" font-size="25" font-family="Inter, Arial, sans-serif" font-weight="1000">${escapeXml(recentSummary)}</text>
  </g>

  <g transform="translate(638 440)">
    <rect x="-22" y="-20" width="438" height="118" rx="24" fill="#020617" fill-opacity="0.44" stroke="${palette.border}" stroke-width="1.5" />
    ${bar("Hitter power", hitterPower, 10, palette.accent3)}
    ${bar("Pitcher vulnerability", pitcherVulnerability, 64, palette.accent)}
  </g>

  <g transform="translate(78 546)">
    <rect x="0" y="0" width="946" height="37" rx="18" fill="#0f172a" fill-opacity="0.92" stroke="${palette.border}" stroke-opacity="0.70" />
    <text x="24" y="24" fill="${palette.warningText}" font-size="15" font-family="Inter, Arial, sans-serif" font-weight="900">${escapeXml(warning)}</text>
  </g>

  <text x="78" y="612" fill="${palette.muted}" font-size="14" font-family="Inter, Arial, sans-serif" font-weight="800">Probability-based research. Not betting advice. No guaranteed outcomes.</text>
  <text x="1082" y="612" text-anchor="end" fill="${palette.muted}" font-size="14" font-family="Inter, Arial, sans-serif" font-weight="800">${escapeXml(dateLabel)}</text>
</svg>`;
}

export const HR_SHARE_CARD_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=300",
} as const;
