import { useEffect, useRef } from "react";
import { useAppCommandStore } from "../stores/appCommandStore";
import { useParlayCommandStore } from "../stores/parlayCommandStore";
import { repairDraftLegsIdentity } from "../lib/parlays/repairDraftLegIdentity";

/** Backfill missing gamePk / marketCode / statTarget when live slate data arrives. */
export function useAutoRepairDraftIdentity(enabled = true) {
  const liveGames = useAppCommandStore((s) => s.liveGames);
  const draftLegs = useParlayCommandStore((s) => s.draftLegs);
  const batchRepairDraftLegs = useParlayCommandStore((s) => s.batchRepairDraftLegs);
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!enabled || draftLegs.length === 0) return;

    const slateKey = liveGames
      .map((game) => String(game.gamePk ?? game.id ?? `${game.awayTeam}@${game.homeTeam}`))
      .join("|");
    const legsKey = draftLegs
      .map((leg) => `${leg.id}:${leg.gamePk ?? ""}:${leg.playerId ?? ""}:${leg.marketCode ?? ""}:${leg.statTarget ?? ""}`)
      .join("|");
    const key = `${slateKey}::${legsKey}`;
    if (key === lastKeyRef.current) return;

    const { changed } = repairDraftLegsIdentity(draftLegs, liveGames);
    if (changed) {
      batchRepairDraftLegs(liveGames);
    }
    lastKeyRef.current = key;
  }, [enabled, draftLegs, liveGames, batchRepairDraftLegs]);
}
