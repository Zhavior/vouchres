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
}): LegProgress | undefined {
  if (!isHrMarket(leg)) return undefined;
  const status = String(leg.status ?? "pending").toLowerCase();
  if (status === "won" || status === "live_hit") return { current: 1, target: 1, label: "HR hit" };
  if (status === "lost" || status === "void") return { current: 0, target: 1, label: "Final" };
  return { current: 0, target: 1, label: "Awaiting HR" };
}
