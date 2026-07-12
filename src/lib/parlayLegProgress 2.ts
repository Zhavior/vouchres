/** Derive simple live progress for display on slip cards (HR legs: 0/1 or 1/1). */

export interface LegProgress {
  current: number;
  target: number;
  label: string;
}

function isHrMarket(input: { marketCode?: string | null; market?: string | null; selection?: string | null }): boolean {
  const code = String(input.marketCode ?? "").toUpperCase();
  if (code === "ANYTIME_HR" || code === "HR" || code === "HOME_RUN") return true;
  const haystack = `${input.market ?? ""} ${input.selection ?? ""}`.toLowerCase();
  return haystack.includes("hr") || haystack.includes("home run");
}

export function deriveLegProgress(leg: {
  status?: string | null;
  marketCode?: string | null;
  market?: string | null;
  selection?: string | null;
  statTarget?: number | null;
  threshold?: number | null;
  actual?: number | null;
}): LegProgress | undefined {
  const status = String(leg.status ?? "pending").toLowerCase();
  const target = Number(leg.statTarget ?? leg.threshold ?? (isHrMarket(leg) ? 1 : NaN));
  const actual = leg.actual != null && Number.isFinite(Number(leg.actual)) ? Number(leg.actual) : null;

  if (isHrMarket(leg)) {
    if (status === "won" || status === "live_hit") {
      return { current: 1, target: 1, label: "HR hit" };
    }
    if (status === "lost" || status === "void" || status === "cancelled") {
      return { current: 0, target: 1, label: "Final" };
    }
    return { current: 0, target: 1, label: "Awaiting HR" };
  }

  const code = String(leg.marketCode ?? "").toUpperCase();
  if (!Number.isFinite(target) || target <= 0) return undefined;

  if (code === "RUN" || code === "HIT" || code === "RBI" || code === "TOTAL_BASES" || code === "STRIKEOUTS" || code === "PITCHER_OUTS" || code === "STOLEN_BASE") {
    const labelMap: Record<string, string> = {
      RUN: "Runs",
      HIT: "Hits",
      RBI: "RBI",
      TOTAL_BASES: "Total bases",
      STRIKEOUTS: "Strikeouts",
      PITCHER_OUTS: "Outs",
      STOLEN_BASE: "Stolen bases",
    };
    const label = labelMap[code] ?? "Progress";
    const current = actual != null ? Math.min(target, Math.max(0, actual)) : 0;
    if (status === "won" || status === "live_hit") {
      return { current: target, target, label: `${label} cleared` };
    }
    if (status === "lost" || status === "void" || status === "cancelled") {
      return { current, target, label: "Final" };
    }
    return { current, target, label: `Tracking ${label.toLowerCase()}` };
  }

  return undefined;
}

export function deriveSlipProgress(legs: Array<Record<string, unknown>>): LegProgress | undefined {
  for (const leg of legs) {
    const progress = deriveLegProgress({
      status: String(leg.status ?? leg.resultLabel ?? "pending"),
      marketCode: String(leg.marketCode ?? leg.marketLabel ?? ""),
      market: String(leg.market ?? leg.marketLabel ?? ""),
      selection: String(leg.selection ?? leg.playerName ?? ""),
      statTarget: Number(leg.statTarget ?? leg.stat_target ?? leg.threshold ?? NaN) || null,
      threshold: Number(leg.threshold ?? leg.statTarget ?? leg.stat_target ?? NaN) || null,
      actual: leg.actual != null ? Number(leg.actual) : null,
    });
    if (progress && progress.current < progress.target && String(leg.status ?? "pending").toLowerCase() === "pending") {
      return progress;
    }
  }
  return undefined;
}
