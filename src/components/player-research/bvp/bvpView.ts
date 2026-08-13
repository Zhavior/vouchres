import { assertBatterSlot, classifyMlbRole } from "./positionGuard";
import type { Batter, HandSplit, Pitcher, VenueSplit } from "./types";

export type BvpView =
  | { kind: "empty" }
  | { kind: "unknown_batter" }
  | { kind: "pitcher_in_batter"; player: Pitcher }
  | { kind: "ready"; batter: Batter; pitcher: Pitcher }
  | { kind: "partial"; batter: Batter; pitcher: Pitcher };

export function matchesHandSplit(pitcher: Pitcher, split: HandSplit): boolean {
  if (split === "ALL") return true;
  if (split === "LHP") return pitcher.throws === "L";
  return pitcher.throws === "R";
}

export function matchesVenueSplit(venue: VenueSplit | Exclude<VenueSplit, "ALL">, split: VenueSplit): boolean {
  if (split === "ALL") return true;
  return venue === split;
}

export function buildBvpView(input: {
  batter: Batter | null;
  pitcher: Pitcher | null;
  batterSlotPlayer: { position: string; name?: string } | null;
  pitcherInBatterSlot: Pitcher | null;
  handSplit: HandSplit;
  venueSplit: VenueSplit;
  selectedVenue: Exclude<VenueSplit, "ALL"> | null;
}): BvpView {
  const { batter, pitcher, batterSlotPlayer, pitcherInBatterSlot, handSplit, venueSplit, selectedVenue } = input;

  if (pitcherInBatterSlot && classifyMlbRole(pitcherInBatterSlot.position) === "pitcher") {
    return { kind: "pitcher_in_batter", player: pitcherInBatterSlot };
  }

  const guard = assertBatterSlot(batterSlotPlayer);
  if (batterSlotPlayer && guard.ok === false) {
    return guard.reason === "unknown" ? { kind: "unknown_batter" } : { kind: "unknown_batter" };
  }

  if (!batter && batterSlotPlayer) return { kind: "unknown_batter" };
  if (!batter || !pitcher) return { kind: "empty" };
  if (!matchesHandSplit(pitcher, handSplit)) return { kind: "empty" };
  if (selectedVenue && !matchesVenueSplit(selectedVenue, venueSplit)) return { kind: "empty" };
  return { kind: "ready", batter, pitcher };
}
