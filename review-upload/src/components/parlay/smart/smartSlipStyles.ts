export const SMART_MARKET_STYLES: Record<string, { stripe: string; glow: string; label: string }> = {
  ANYTIME_HR: { stripe: "bg-amber-400", glow: "from-amber-500/25 to-orange-600/5", label: "HR" },
  RUN: { stripe: "bg-emerald-400", glow: "from-emerald-500/20 to-teal-600/5", label: "RUN" },
  HIT: { stripe: "bg-cyan-400", glow: "from-cyan-500/20 to-sky-600/5", label: "HIT" },
  RBI: { stripe: "bg-violet-400", glow: "from-violet-500/20 to-purple-600/5", label: "RBI" },
  TOTAL_BASES: { stripe: "bg-rose-400", glow: "from-rose-500/20 to-pink-600/5", label: "TB" },
  STRIKEOUTS: { stripe: "bg-red-400", glow: "from-red-500/25 to-orange-700/5", label: "K" },
  PITCHER_OUTS: { stripe: "bg-slate-400", glow: "from-slate-500/20 to-zinc-600/5", label: "OUT" },
  STOLEN_BASE: { stripe: "bg-yellow-400", glow: "from-yellow-500/20 to-lime-600/5", label: "SB" },
};

export function marketStyle(code?: string | null) {
  const key = String(code ?? "").toUpperCase();
  return SMART_MARKET_STYLES[key] ?? {
    stripe: "bg-cyan-400/70",
    glow: "from-white/10 to-white/[0.02]",
    label: "PROP",
  };
}
