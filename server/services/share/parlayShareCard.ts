/**
 * Parlay share card — SVG renderer for the /p/:id Open Graph permalink.
 */

export type ParlayShareCardData = {
  title: string;
  legCount: number;
  status: string;
  oddsDecimal?: number | null;
  authorHandle?: string | null;
  createdAt?: string | null;
  lockedAt?: string | null;
  lockReason?: string | null;
};

export const PARLAY_SHARE_CARD_HEADERS: Record<string, string> = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=300",
};

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

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "won": return "#22c55e";
    case "lost": return "#fb7185";
    case "push": return "#f59e0b";
    case "void": return "#94a3b8";
    default: return "#22d3ee";
  }
}

export function renderParlayShareCardSvg(data: ParlayShareCardData): string {
  const title = truncate(data.title || `${data.legCount}-leg parlay`, 72);
  const author = data.authorHandle ? `@${data.authorHandle.replace(/^@/, "")}` : "VouchEdge";
  const created = data.createdAt
    ? new Date(data.createdAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })
    : "Timestamp on file";
  const locked = data.lockedAt
    ? new Date(data.lockedAt).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
  const lockReason = data.lockReason === "trust_ledger"
    ? "Trust ledger lock"
    : data.lockReason === "feed_share"
      ? "Feed share lock"
      : null;
  const odds = data.oddsDecimal != null && Number.isFinite(data.oddsDecimal)
    ? `${Number(data.oddsDecimal).toFixed(2)}x`
    : "—";
  const status = String(data.status ?? "pending").toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#0b1220" stroke="#164e63" stroke-width="2"/>
  <text x="96" y="130" fill="#22d3ee" font-family="Inter,Arial,sans-serif" font-size="28" font-weight="700">VOUCHEDGE PARLAY PROOF</text>
  <text x="96" y="220" fill="#f8fafc" font-family="Inter,Arial,sans-serif" font-size="52" font-weight="800">${escapeXml(title)}</text>
  <text x="96" y="290" fill="#9aa8bd" font-family="Inter,Arial,sans-serif" font-size="28">${escapeXml(String(data.legCount))} legs · ${escapeXml(odds)} combined</text>
  <rect x="96" y="330" width="180" height="44" rx="22" fill="${statusColor(status)}" opacity="0.18"/>
  <text x="116" y="360" fill="${statusColor(status)}" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">${escapeXml(status)}</text>
  <text x="96" y="430" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="26">By ${escapeXml(author)}</text>
  <text x="96" y="475" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="22">Created ${escapeXml(created)} UTC</text>
  ${locked ? `<text x="96" y="515" fill="#22d3ee" font-family="Inter,Arial,sans-serif" font-size="20">Locked ${escapeXml(locked)} UTC</text>` : ""}
  ${lockReason ? `<text x="96" y="545" fill="#67e8f9" font-family="Inter,Arial,sans-serif" font-size="18">${escapeXml(lockReason)}</text>` : ""}
  <text x="96" y="${lockReason ? 575 : 540}" fill="#64748b" font-family="Inter,Arial,sans-serif" font-size="18">Probability-based research record · No guarantees</text>
</svg>`;
}
