import type { SmartParlayLeg, SmartParlaySlip } from "../../../domain/parlay";
import { marketStyle } from "./smartSlipStyles";

export type SlipVisualTheme = {
  id: string;
  label: string;
  borderClass: string;
  shellGradient: string;
  headerAccent: string;
  chipClass: string;
  ticketIconClass: string;
};

const THEMES: Record<string, SlipVisualTheme> = {
  hr: {
    id: "hr",
    label: "HR Slip",
    borderClass: "border-amber-400/35",
    shellGradient: "from-amber-950/40 via-slate-950/90 to-black/85",
    headerAccent: "text-amber-300",
    chipClass: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    ticketIconClass: "text-amber-400/90",
  },
  pitcher: {
    id: "pitcher",
    label: "Pitcher Slip",
    borderClass: "border-red-400/35",
    shellGradient: "from-red-950/35 via-slate-950/90 to-black/85",
    headerAccent: "text-red-300",
    chipClass: "border-red-400/30 bg-red-500/10 text-red-200",
    ticketIconClass: "text-red-400/90",
  },
  contact: {
    id: "contact",
    label: "Contact Slip",
    borderClass: "border-cyan-400/35",
    shellGradient: "from-cyan-950/35 via-slate-950/90 to-black/85",
    headerAccent: "text-cyan-300",
    chipClass: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
    ticketIconClass: "text-cyan-400/90",
  },
  mixed: {
    id: "mixed",
    label: "Multi-Market Slip",
    borderClass: "border-violet-400/35",
    shellGradient: "from-violet-950/30 via-slate-950/90 to-black/85",
    headerAccent: "text-violet-300",
    chipClass: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    ticketIconClass: "text-violet-400/90",
  },
  won: {
    id: "won",
    label: "Winner",
    borderClass: "border-emerald-400/40",
    shellGradient: "from-emerald-950/35 via-slate-950/90 to-black/85",
    headerAccent: "text-emerald-300",
    chipClass: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    ticketIconClass: "text-emerald-400/90",
  },
  lost: {
    id: "lost",
    label: "Settled",
    borderClass: "border-rose-400/35",
    shellGradient: "from-rose-950/30 via-slate-950/90 to-black/85",
    headerAccent: "text-rose-300",
    chipClass: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    ticketIconClass: "text-rose-400/90",
  },
};

function hashHue(source: string): number {
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

function dominantMarketFamily(codes: string[]): string {
  if (codes.length === 0) return "mixed";
  const normalized = codes.map((c) => c.toUpperCase());
  if (normalized.every((c) => c.includes("HR") || c === "HOME_RUN")) return "hr";
  if (normalized.every((c) => c.includes("STRIKEOUT") || c === "PITCHER_OUTS")) return "pitcher";
  if (normalized.every((c) => ["HIT", "RUN", "RBI", "TOTAL_BASES", "STOLEN_BASE"].includes(c))) return "contact";
  const unique = new Set(normalized.filter(Boolean));
  if (unique.size === 1 && normalized[0]) {
    const code = normalized[0];
    if (code.includes("HR")) return "hr";
    if (code.includes("STRIKEOUT") || code === "PITCHER_OUTS") return "pitcher";
    return "contact";
  }
  return "mixed";
}

export function deriveSlipVisualTheme(slip: SmartParlaySlip): SlipVisualTheme {
  const status = String(slip.status ?? "pending").toLowerCase();
  if (status === "won") return THEMES.won;
  if (status === "lost") return THEMES.lost;

  const codes = slip.legs.map((leg) => String(leg.marketCode ?? ""));
  const family = dominantMarketFamily(codes);
  const base = THEMES[family] ?? THEMES.mixed;

  const hue = hashHue(slip.sourceId || slip.id);
  if (family !== "mixed" || slip.legCount <= 1) return base;

  return {
    ...base,
    id: `${base.id}-${hue}`,
    borderClass: base.borderClass.replace("/35", "/45"),
  };
}

export function deriveSlipDisplayTitle(slip: { title: string; legs: SmartParlayLeg[] }): string {
  const cleaned = String(slip.title ?? "").trim();
  const generic =
    !cleaned ||
    /^\d+-leg parlay$/i.test(cleaned) ||
    cleaned.toLowerCase() === "vouchedge parlay" ||
    cleaned.toLowerCase() === "saved parlay" ||
    cleaned.toLowerCase() === "slip selection";

  if (!generic) return cleaned;

  const names = slip.legs
    .map((leg) => leg.playerName?.trim())
    .filter((name) => name && name !== "Unknown Player")
    .slice(0, 3);

  if (names.length === 0) return `${slip.legs.length}-Leg Parlay`;

  const extra = slip.legs.length > names.length ? ` +${slip.legs.length - names.length}` : "";
  return `${names.join(" · ")}${extra}`;
}

export function deriveSlipMarketChips(legs: SmartParlayLeg[]): string[] {
  const seen = new Set<string>();
  const chips: string[] = [];
  for (const leg of legs) {
    const style = marketStyle(leg.marketCode);
    const label = style.label;
    if (seen.has(label)) continue;
    seen.add(label);
    chips.push(label);
  }
  return chips;
}
