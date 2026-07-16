import type { Vouch } from "../../types";
import type { ResearchProp } from "../../stores/appCommandStore";
import { useParlayOsStore, type ParlayPickerPlayer } from "../../stores/parlayOsStore";
import type { ParlayMarketFamilyId } from "./parlayMarketCatalog";

export type ParlayAddSource =
  | "today"
  | "hr_intelligence"
  | "player_research"
  | "pitcher_research"
  | "vouch_card"
  | "unknown";

export type ParlayAddDataStatus = "official" | "projected" | "waiting" | "unknown";

export type ParlayAddSnapshot = {
  entityId: string | null;
  gameId: string | null;
  market: string | null;
  line: string | null;
  odds: number | null;
  source: ParlayAddSource;
  addedAt: string;
  dataStatus: ParlayAddDataStatus;
  reasoningSnapshot: string | null;
  riskSnapshot: string | null;
};

export type OpenParlayAddInput = {
  player: ParlayPickerPlayer;
  propHint?: ResearchProp;
  vouch?: Vouch;
  initialFamily?: ParlayMarketFamilyId;
  isPitcher?: boolean;
  source: ParlayAddSource;
  dataStatus?: ParlayAddDataStatus;
  reasoningSnapshot?: string | null;
  riskSnapshot?: string | null;
  addedAt?: string;
};

function clean(value: unknown): string | null {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function createParlayAddSnapshot(input: OpenParlayAddInput): ParlayAddSnapshot {
  const entityId = clean(input.propHint?.playerId ?? input.player.id);
  const gameId = clean(
    input.propHint?.gamePk ??
      input.player.resolvedGamePk,
  );

  return {
    entityId,
    gameId,
    market: clean(input.propHint?.market),
    line: clean(input.propHint?.spec),
    odds: typeof input.propHint?.odds === "number" && Number.isFinite(input.propHint.odds)
      ? input.propHint.odds
      : null,
    source: input.source,
    addedAt: input.addedAt ?? new Date().toISOString(),
    dataStatus: input.dataStatus ?? "unknown",
    reasoningSnapshot: clean(input.reasoningSnapshot),
    riskSnapshot: clean(input.riskSnapshot),
  };
}

/** Opens the one canonical ParlayOS picker and preserves the research context. */
export function openParlayAdd(input: OpenParlayAddInput): ParlayAddSnapshot {
  const addSnapshot = createParlayAddSnapshot(input);
  useParlayOsStore.getState().openPicker({
    player: input.player,
    propHint: input.propHint,
    vouch: input.vouch,
    initialFamily: input.initialFamily,
    isPitcher: input.isPitcher,
    addSnapshot,
  });
  return addSnapshot;
}
