/**
 * "My HR List" share card — 1200×630 Open Graph image for /l/:id.
 *
 * Design constraint that drives everything here: X strips the headline and
 * description from link previews and renders only the image plus a small
 * domain label. The card must therefore be self-sufficient — brand, what the
 * list is, the players, the numbers, and the destination URL all live in the
 * pixels. Discord/Slack/iMessage still read the meta description, but nothing
 * is *only* in the description.
 *
 * 1200×630 is the cross-platform size; X crops to ~16:9, so all text and faces
 * stay inside the centre 1080×600 safe zone.
 *
 * Player headshots and team logos are inlined as PNG data URIs by
 * remoteImage.ts — librsvg will not fetch remote refs (see that module).
 */
import { inlineRemoteImage, mlbHeadshotUrl, mlbTeamLogoUrl } from "./remoteImage";

export type HrListShareEntry = {
  playerId: number | string;
  playerName: string;
  team?: string | null;
  teamId?: number | string | null;
  opponent?: string | null;
  grade?: string | null;
  /** 0–1 or 0–100; normalised on render. */
  estimatedHrProb?: number | null;
  bestOdds?: string | null;
  opposingPitcher?: string | null;
  note?: string | null;
};

export type HrListShareCardData = {
  listId: string;
  title: string;
  ownerHandle?: string | null;
  slateDate?: string | null;
  entries: HrListShareEntry[];
  /** Absolute origin, e.g. https://vouchedge.app — rendered as the CTA. */
  publicOrigin: string;
};

export const HR_LIST_SHARE_CARD_HEADERS = {
  "Content-Type": "image/png",
  // Short TTL while the card is in its under-construction state, so flipping
  // HR_LIST_CARD_UNDER_CONSTRUCTION off is reflected without waiting out a
  // long cache on X's and Slack's crawlers.
  "Cache-Control": "public, max-age=60, s-maxage=60",
} as const;

/**
 * The card is not finished, so anything posted to X renders a work-in-progress
 * state rather than a list that reads as a shipped product. The full renderer
 * below is complete and tested — flip this to false to turn it on.
 */
export const HR_LIST_CARD_UNDER_CONSTRUCTION = true;

const WIDTH = 1200;
const HEIGHT = 630;

/** Rows beyond this are summarised as "+N more" rather than clipped. */
const MAX_ROWS = 5;

const ROW_TOP = 178;
const ROW_HEIGHT = 68;
const ROW_GAP = 8;
const PAD_X = 60;
const INNER_W = WIDTH - PAD_X * 2;

const HEADSHOT = 52;
const LOGO = 26;

const C = {
  bg: "#020617",
  bg2: "#07131f",
  panel: "#0b1220",
  panelEdge: "#12314a",
  cyan: "#20C7F4",
  emerald: "#2EDB91",
  iceCyan: "#7DEBFF",
  gold: "#d6a64f",
  text: "#f8fafc",
  muted: "#93a4bb",
  faint: "#5c6f88",
} as const;

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Truncates to a character budget. SVG has no text overflow, and there is no
 * font-metrics pass here, so budgets are tuned per slot against the widest
 * realistic glyphs rather than measured.
 */
function clamp(value: unknown, max: number): string {
  const text = String(value ?? "").trim();
  if (text.length <= max) return escapeXml(text);
  return escapeXml(`${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`);
}

function initials(name: string): string {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Accepts 0–1 or 0–100 and returns a whole-percent string, or null. */
function formatProb(raw: number | null | undefined): string | null {
  if (raw == null || !Number.isFinite(Number(raw))) return null;
  const n = Number(raw);
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  if (pct < 0 || pct > 100) return null;
  return `${Math.round(pct)}%`;
}

function gradeColor(grade: string | null | undefined): string {
  const g = String(grade ?? "").toUpperCase();
  if (g.startsWith("A")) return C.emerald;
  if (g.startsWith("B")) return C.cyan;
  if (g.startsWith("C")) return C.gold;
  if (g.startsWith("D") || g.startsWith("F")) return "#f87171";
  return C.faint;
}

function formatSlateDate(iso: string | null | undefined): string {
  if (!iso) return "";
  // Parse Y-M-D as calendar parts, not an instant — `new Date("2026-08-18")` is
  // UTC midnight and renders as the 17th in US timezones.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!match) return "";
  const [, y, m, d] = match;
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][Number(m) - 1];
  if (!month) return "";
  return `${month} ${Number(d)}, ${y}`;
}

/**
 * VouchEdge mark, inlined from public/vouchedge-mark-aurora.svg rather than
 * loaded from disk — it is three paths, and a nested <svg> renders reliably in
 * librsvg where an <image> pointing at an SVG does not.
 */
function brandMark(x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
  <path d="M5 10.5 18.5 14 32 44.5 45.5 14 59 10.5 34.5 57h-5L5 10.5Z" fill="${C.cyan}"/>
  <path d="m18.5 31.5 10.25 12L46 22.5l5 4-22.25 27-15.5-18 5.25-4Z" fill="${C.emerald}"/>
  <path d="m46.5 10 8.5-3-3.5 7-8 3 3-7ZM51 19l7-2.5-2.75 5.75-6.75 2.5L51 19Z" fill="${C.iceCyan}"/>
</svg>`;
}

type ResolvedRow = HrListShareEntry & {
  headshotUri: string | null;
  logoUri: string | null;
};

function renderRow(row: ResolvedRow, index: number): string {
  const top = ROW_TOP + index * (ROW_HEIGHT + ROW_GAP);
  const midY = top + ROW_HEIGHT / 2;
  const clipId = `hs${index}`;

  const headshotX = PAD_X + 12;
  const headshotY = midY - HEADSHOT / 2;
  const headshotCx = headshotX + HEADSHOT / 2;

  const media = row.headshotUri
    ? `<clipPath id="${clipId}"><circle cx="${headshotCx}" cy="${midY}" r="${HEADSHOT / 2}"/></clipPath>
    <image x="${headshotX}" y="${headshotY}" width="${HEADSHOT}" height="${HEADSHOT}" href="${row.headshotUri}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${headshotCx}" cy="${midY}" r="${HEADSHOT / 2}" fill="#132033"/>
    <text x="${headshotCx}" y="${midY + 7}" font-size="20" font-weight="700" fill="${C.muted}" text-anchor="middle">${clamp(initials(row.playerName), 2)}</text>`;

  const ring = `<circle cx="${headshotCx}" cy="${midY}" r="${HEADSHOT / 2}" fill="none" stroke="${C.panelEdge}" stroke-width="2"/>`;

  const logoX = headshotX + HEADSHOT + 14;
  // Several club marks are near-black (NYY, CWS, SF) and vanish on the dark
  // panel, so every logo sits on a light chip for uniform contrast.
  const logo = row.logoUri
    ? `<circle cx="${logoX + LOGO / 2}" cy="${midY}" r="${LOGO / 2 + 5}" fill="#e8eef6" fill-opacity="0.93"/>
    <image x="${logoX}" y="${midY - LOGO / 2}" width="${LOGO}" height="${LOGO}" href="${row.logoUri}" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  const textX = logoX + (row.logoUri ? LOGO + 14 : 0);

  const matchup = [
    row.team ? String(row.team).toUpperCase() : null,
    row.opponent ? `vs ${String(row.opponent).toUpperCase()}` : null,
    row.opposingPitcher ? String(row.opposingPitcher) : null,
  ].filter(Boolean).join("  ·  ");

  // Right rail: probability then grade, both right-anchored off the panel edge.
  const gradeRight = PAD_X + INNER_W - 16;
  const grade = String(row.grade ?? "").trim();
  const gradeBlock = grade
    ? `<rect x="${gradeRight - 60}" y="${midY - 17}" width="60" height="34" rx="10" fill="${gradeColor(grade)}" fill-opacity="0.14" stroke="${gradeColor(grade)}" stroke-opacity="0.5"/>
    <text x="${gradeRight - 30}" y="${midY + 6}" font-size="18" font-weight="800" fill="${gradeColor(grade)}" text-anchor="middle">${clamp(grade, 3)}</text>`
    : "";

  const prob = formatProb(row.estimatedHrProb);
  const probX = grade ? gradeRight - 76 : gradeRight;
  const probBlock = prob
    ? `<text x="${probX}" y="${midY - 1}" font-size="20" font-weight="800" fill="${C.text}" text-anchor="end">${escapeXml(prob)}</text>
    <text x="${probX}" y="${midY + 15}" font-size="10" font-weight="700" letter-spacing="1.2" fill="${C.faint}" text-anchor="end">HR PROB</text>`
    : "";

  const oddsX = prob ? probX - 92 : (grade ? gradeRight - 76 : gradeRight);
  const odds = String(row.bestOdds ?? "").trim();
  const oddsBlock = odds
    ? `<text x="${oddsX}" y="${midY - 1}" font-size="19" font-weight="700" fill="${C.iceCyan}" text-anchor="end">${clamp(odds, 7)}</text>
    <text x="${oddsX}" y="${midY + 15}" font-size="10" font-weight="700" letter-spacing="1.2" fill="${C.faint}" text-anchor="end">BEST ODDS</text>`
    : "";

  // Name column stops before the right rail so long names cannot collide.
  const nameBudget = Math.max(10, Math.floor((oddsX - textX - 24) / 12));

  return `<g>
    <rect x="${PAD_X}" y="${top}" width="${INNER_W}" height="${ROW_HEIGHT}" rx="16" fill="${C.panel}" stroke="${C.panelEdge}"/>
    <rect x="${PAD_X}" y="${top}" width="4" height="${ROW_HEIGHT}" rx="2" fill="${gradeColor(row.grade)}"/>
    ${media}
    ${ring}
    ${logo}
    <text x="${textX}" y="${midY - 2}" font-size="22" font-weight="700" fill="${C.text}">${clamp(row.playerName, nameBudget)}</text>
    <text x="${textX}" y="${midY + 19}" font-size="14" fill="${C.muted}">${clamp(matchup, Math.max(12, nameBudget + 8))}</text>
    ${oddsBlock}
    ${probBlock}
    ${gradeBlock}
  </g>`;
}

/**
 * Resolves every remote asset for the card in parallel, then builds the SVG.
 * Async because of the asset fetches; the caller rasterises with sharp.
 */
export async function renderHrListShareCardSvg(
  data: HrListShareCardData,
  options: { underConstruction?: boolean } = {},
): Promise<string> {
  const underConstruction = options.underConstruction ?? HR_LIST_CARD_UNDER_CONSTRUCTION;
  if (underConstruction) return renderUnderConstructionCard(data);

  const visible = data.entries.slice(0, MAX_ROWS);
  const overflow = Math.max(0, data.entries.length - visible.length);

  const rows: ResolvedRow[] = await Promise.all(
    visible.map(async (entry) => {
      const [headshotUri, logoUri] = await Promise.all([
        inlineRemoteImage(mlbHeadshotUrl(entry.playerId), HEADSHOT * 2, HEADSHOT * 2, "cover"),
        entry.teamId != null && entry.teamId !== ""
          ? inlineRemoteImage(mlbTeamLogoUrl(entry.teamId), LOGO * 3, LOGO * 3, "contain")
          : Promise.resolve(null),
      ]);
      return { ...entry, headshotUri, logoUri };
    }),
  );

  const slate = formatSlateDate(data.slateDate);
  const owner = data.ownerHandle ? `@${String(data.ownerHandle).replace(/^@/, "")}` : null;
  const subtitleParts = [
    `${data.entries.length} ${data.entries.length === 1 ? "player" : "players"}`,
    slate || null,
    owner,
  ].filter(Boolean);

  // Strip the scheme so the CTA reads as a domain, matching X's own overlay.
  const ctaHost = String(data.publicOrigin).replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const ctaUrl = `${ctaHost}/l/${data.listId}`;

  const overflowNote = overflow > 0
    ? `<text x="${PAD_X + INNER_W / 2}" y="${ROW_TOP + visible.length * (ROW_HEIGHT + ROW_GAP) + 20}" font-size="15" font-weight="700" fill="${C.faint}" text-anchor="middle">+ ${overflow} more on the full list</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="Inter, 'Helvetica Neue', Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bg}"/>
      <stop offset="100%" stop-color="${C.bg2}"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.cyan}" stop-opacity="0.9"/>
      <stop offset="55%" stop-color="${C.emerald}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${C.cyan}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.1" r="0.6">
      <stop offset="0%" stop-color="${C.cyan}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${C.cyan}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  ${brandMark(PAD_X, 44, 40)}
  <text x="${PAD_X + 52}" y="${72}" font-size="21" font-weight="800" letter-spacing="2.4" fill="${C.text}">VOUCHEDGE</text>

  <rect x="${PAD_X + 232}" y="${52}" width="112" height="26" rx="8" fill="${C.emerald}" fill-opacity="0.12" stroke="${C.emerald}" stroke-opacity="0.45"/>
  <text x="${PAD_X + 288}" y="${70}" font-size="12" font-weight="800" letter-spacing="1.6" fill="${C.emerald}" text-anchor="middle">MY HR LIST</text>

  <text x="${WIDTH - PAD_X}" y="${70}" font-size="15" font-weight="600" fill="${C.faint}" text-anchor="end">${escapeXml(ctaHost)}</text>

  <text x="${PAD_X}" y="${132}" font-size="38" font-weight="800" fill="${C.text}">${clamp(data.title, 42)}</text>
  <text x="${PAD_X}" y="${158}" font-size="16" font-weight="600" fill="${C.muted}">${clamp(subtitleParts.join("  ·  "), 74)}</text>

  <rect x="${PAD_X}" y="${168}" width="${INNER_W}" height="2" rx="1" fill="url(#rule)"/>

  ${rows.map((row, index) => renderRow(row, index)).join("\n")}
  ${overflowNote}

  <text x="${PAD_X}" y="${594}" font-size="17" font-weight="800" fill="${C.iceCyan}">${escapeXml(ctaUrl)}</text>
  <text x="${WIDTH - PAD_X}" y="${594}" font-size="12" font-weight="600" fill="${C.faint}" text-anchor="end">Probability-based research · not betting advice · 21+</text>
</svg>`;
}

/**
 * Work-in-progress card.
 *
 * Deliberately shows no player names, prices or probabilities: a half-built
 * card that still lists real numbers reads as a finished product to anyone who
 * sees it on X, and those numbers would outlive the post. Brand, the list's own
 * title, and the destination stay so the link is still recognisable.
 */
function renderUnderConstructionCard(data: HrListShareCardData): string {
  const ctaHost = String(data.publicOrigin).replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const count = data.entries.length;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="Inter, 'Helvetica Neue', Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bg}"/>
      <stop offset="100%" stop-color="${C.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0%" stop-color="${C.gold}" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="${C.gold}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="hazard" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="34" height="34" fill="${C.gold}" fill-opacity="0.11"/>
      <rect width="17" height="34" fill="${C.gold}" fill-opacity="0.22"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${WIDTH}" height="10" fill="url(#hazard)"/>
  <rect x="0" y="${HEIGHT - 10}" width="${WIDTH}" height="10" fill="url(#hazard)"/>

  ${brandMark(PAD_X, 44, 40)}
  <text x="${PAD_X + 52}" y="72" font-size="21" font-weight="800" letter-spacing="2.4" fill="${C.text}">VOUCHEDGE</text>
  <text x="${WIDTH - PAD_X}" y="70" font-size="15" font-weight="600" fill="${C.faint}" text-anchor="end">${escapeXml(ctaHost)}</text>

  <rect x="${PAD_X}" y="238" width="252" height="38" rx="10" fill="${C.gold}" fill-opacity="0.14" stroke="${C.gold}" stroke-opacity="0.6"/>
  <text x="${PAD_X + 126}" y="263" font-size="15" font-weight="800" letter-spacing="2" fill="${C.gold}" text-anchor="middle">UNDER CONSTRUCTION</text>

  <text x="${PAD_X}" y="336" font-size="46" font-weight="800" fill="${C.text}">My HR List is being built.</text>
  <text x="${PAD_X}" y="382" font-size="20" font-weight="500" fill="${C.muted}">Share cards are not live yet — this preview is a placeholder.</text>
  <text x="${PAD_X}" y="416" font-size="20" font-weight="500" fill="${C.muted}">${clamp(data.title, 52)}${count > 0 ? ` · ${count} ${count === 1 ? "player" : "players"} saved` : ""}</text>

  <rect x="${PAD_X}" y="462" width="${INNER_W}" height="2" rx="1" fill="${C.panelEdge}"/>

  <text x="${PAD_X}" y="${594}" font-size="17" font-weight="800" fill="${C.iceCyan}">${escapeXml(ctaHost)}</text>
  <text x="${WIDTH - PAD_X}" y="${594}" font-size="12" font-weight="600" fill="${C.faint}" text-anchor="end">Probability-based research · not betting advice · 21+</text>
</svg>`;
}

/** Exported for tests — keeps the layout constants assertable. */
export const HR_LIST_CARD_LAYOUT = { WIDTH, HEIGHT, MAX_ROWS, ROW_TOP, ROW_HEIGHT, ROW_GAP } as const;
