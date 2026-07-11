import type { DraftParlayLeg } from "../../stores/parlayCommandStore";
import { normalizeMarketCode } from "./parlayBridge";
import { buildDraftLegEventKey } from "./parlayLegEditor";
import {
  findPlayerLiveGame,
  resolveLiveGamePk,
  type LiveGameRef,
} from "./parlayLegValidator";
import { playerTeamMatchesGameSide } from "../mlb/teamNameMatch";
import { isClientLegIdentityComplete } from "../parlayIdentity";

function cleanId(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  if (!text || text === "0" || text === "undefined" || text === "null") return undefined;
  return text;
}

function parsePlayerIdFromSelection(selection: unknown): string | undefined {
  const text = String(selection ?? "");
  const metaMatch = text.match(/\|\|meta:\s*(\{.*\})\s*$/);
  if (!metaMatch) return undefined;
  try {
    const meta = JSON.parse(metaMatch[1]) as Record<string, unknown>;
    return cleanId(meta.p ?? meta.playerId ?? meta.player_id);
  } catch {
    return undefined;
  }
}

function inferMarketCode(leg: DraftParlayLeg): string {
  const existing = String(leg.marketCode ?? "").trim().toUpperCase();
  if (existing && existing !== "UNKNOWN") return existing;

  for (const source of [leg.marketLabel, leg.selection, leg.marketCode]) {
    const code = normalizeMarketCode(source);
    if (code !== "UNKNOWN") return code;
  }

  const haystack = `${leg.marketLabel ?? ""} ${leg.selection ?? ""}`.toLowerCase();
  if (/home run|\bhr\b|homer|anytime hr|\d+\+ hr/.test(haystack)) return "ANYTIME_HR";
  if (/\bhit(s)?\b|\d+\+ hit/.test(haystack)) return "HIT";
  if (/\brbi\b|\d+\+ rbi/.test(haystack)) return "RBI";
  if (/\brun(s)?\b|to score|\d+\+ run/.test(haystack)) return "RUN";
  if (/total base|\btb\b|\d+\+ tb/.test(haystack)) return "TOTAL_BASES";
  if (/stolen base|\bsb\b/.test(haystack)) return "STOLEN_BASE";
  if (/strikeout|\bpitcher k\b|\d+\+ k/.test(haystack)) return "STRIKEOUTS";
  if (/pitcher out|\d+\+ out/.test(haystack)) return "PITCHER_OUTS";

  return existing;
}

function inferStatTarget(leg: DraftParlayLeg, marketCode: string): number | null {
  const direct = leg.statTarget;
  if (direct != null) {
    const n = Number(direct);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const haystack = `${leg.marketLabel ?? ""} ${leg.selection ?? ""}`;
  const plusMatch = haystack.match(/(\d+)\+/);
  if (plusMatch) {
    const n = Number(plusMatch[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const overMatch = haystack.match(/over\s+(\d+(?:\.\d+)?)/i);
  if (overMatch) {
    const line = Number(overMatch[1]);
    if (Number.isFinite(line)) return Math.floor(line) + 1;
  }

  if (marketCode === "ANYTIME_HR" || marketCode === "STOLEN_BASE" || marketCode === "SINGLE") return 1;
  if (/\b1\+|anytime|to (hit|record|score)/i.test(haystack)) return 1;

  return null;
}

export function findGameByMatchupLabel(
  gameLabel: string,
  liveGames: LiveGameRef[],
): LiveGameRef | undefined {
  const parts = gameLabel.split("@").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;
  const [awayLabel, homeLabel] = parts;

  return liveGames.find(
    (game) =>
      playerTeamMatchesGameSide(awayLabel, game.awayTeam)
      && playerTeamMatchesGameSide(homeLabel, game.homeTeam),
  );
}

function resolveDraftGamePk(leg: DraftParlayLeg, liveGames: LiveGameRef[]): string | undefined {
  const existing = cleanId(leg.gamePk) ?? cleanId(leg.gameId);
  if (existing && !existing.toUpperCase().includes("TBD")) return existing;

  if (leg.teamLabel) {
    const matched = findPlayerLiveGame({ team: leg.teamLabel, teamId: leg.teamId ?? undefined }, liveGames);
    const pk = resolveLiveGamePk(matched);
    if (pk) return pk;
  }

  const gameLabel = String(leg.game ?? "").trim();
  if (gameLabel.includes("@")) {
    const matched = findGameByMatchupLabel(gameLabel, liveGames);
    const pk = resolveLiveGamePk(matched);
    if (pk) return pk;
  }

  return existing;
}

/** Fill missing grading identity fields on a draft leg using slate + leg text. */
export function repairDraftLegIdentity(
  leg: DraftParlayLeg,
  liveGames: LiveGameRef[] = [],
): { leg: DraftParlayLeg; changed: boolean } {
  const marketCode = inferMarketCode(leg);
  const statTarget = inferStatTarget(leg, marketCode);
  const comparator = String(leg.comparator ?? ">=").trim() || ">=";
  const playerId = cleanId(leg.playerId) ?? parsePlayerIdFromSelection(leg.selection);
  const gamePk = resolveDraftGamePk(leg, liveGames);
  const gameId = cleanId(leg.gameId) ?? gamePk ?? null;

  const next: DraftParlayLeg = {
    ...leg,
    marketCode: marketCode || leg.marketCode,
    marketLabel: leg.marketLabel ?? leg.marketCode ?? undefined,
    statTarget: statTarget ?? leg.statTarget ?? undefined,
    comparator,
    playerId: playerId ?? leg.playerId,
    gamePk,
    gameId,
    eventKey:
      gamePk && playerId && marketCode && statTarget != null
        ? buildDraftLegEventKey({
            sport: leg.sport,
            gamePk,
            playerId,
            marketCode,
            statTarget,
            comparator,
          })
        : leg.eventKey,
  };

  const changed =
    next.marketCode !== leg.marketCode
    || next.statTarget !== leg.statTarget
    || next.comparator !== leg.comparator
    || String(next.playerId ?? "") !== String(leg.playerId ?? "")
    || String(next.gamePk ?? "") !== String(leg.gamePk ?? "")
    || String(next.gameId ?? "") !== String(leg.gameId ?? "")
    || next.eventKey !== leg.eventKey;

  return { leg: next, changed };
}

export function repairDraftLegsIdentity(
  legs: DraftParlayLeg[],
  liveGames: LiveGameRef[] = [],
): { legs: DraftParlayLeg[]; changed: boolean; complete: boolean } {
  let changed = false;
  const repaired = legs.map((leg) => {
    const result = repairDraftLegIdentity(leg, liveGames);
    if (result.changed) changed = true;
    return result.leg;
  });

  const complete = repaired.every((leg, index) =>
    isClientLegIdentityComplete(leg as unknown as Record<string, unknown>, index),
  );

  return { legs: repaired, changed, complete };
}
