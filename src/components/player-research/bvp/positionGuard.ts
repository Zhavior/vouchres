import { PITCHER_POSITIONS } from "../../../lib/parlays/parlayMarketCatalog";
import type { Batter, MlbRole, Pitcher } from "./types";

export function classifyMlbRole(position: string | null | undefined): MlbRole {
  if (position == null || String(position).trim() === "") return "unknown";
  const pos = String(position).trim().toUpperCase();
  if (PITCHER_POSITIONS.has(pos)) return "pitcher";
  if (pos === "TWP") return "unknown";
  return "batter";
}

export function isPitcherPosition(position: string | null | undefined): boolean {
  return classifyMlbRole(position) === "pitcher";
}

export function assertBatterSlot(
  player: { position: string; name?: string } | null | undefined,
): { ok: true } | { ok: false; reason: "pitcher" | "unknown" } {
  if (!player) return { ok: false, reason: "unknown" };
  const role = classifyMlbRole(player.position);
  if (role === "pitcher") return { ok: false, reason: "pitcher" };
  if (role === "unknown") return { ok: false, reason: "unknown" };
  return { ok: true };
}

export function pitcherWarningCopy(): string {
  return "Pitcher selected — use the Pitcher selector. This slot is for batters.";
}

export function isBatterRecord(player: Batter | Pitcher): player is Batter {
  return classifyMlbRole(player.position) === "batter";
}
