import { AppError } from "../../errors/AppError";
import {
  createParlayWithLegsRpc,
  deleteParlayById,
  findLegsForPick,
  findUserParlayByClientRef,
  insertParlayLegRows,
  insertParlayParent,
  type ParlayLegRow,
  type ParlayRow,
} from "../../repositories/parlayRepository";
import type { SaveMeParlayInput } from "../../validators/parlaySchemas";

const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);
const MISSING_FUNCTION_CODES = new Set(["42883", "PGRST202"]);
const BACKEND_SOURCES = new Set(["manual", "scanner", "ai_pick", "edge_island", "command_center"]);

export interface SaveUserParlayResult {
  statusCode: 200 | 201;
  body: ParlayRow & {
    legs: ParlayLegRow[];
    combined_odds: number | null;
    ai_generated: boolean;
    deduped: boolean;
  };
}

function isMissingColumnError(error: unknown): boolean {
  return MISSING_COLUMN_CODES.has(String((error as { code?: unknown })?.code ?? ""));
}

function isMissingFunctionError(error: unknown): boolean {
  return MISSING_FUNCTION_CODES.has(String((error as { code?: unknown })?.code ?? ""));
}

function americanToDecimal(odds: number): number {
  if (odds >= 100) return 1 + odds / 100;
  if (odds <= -100) return 1 + 100 / Math.abs(odds);
  return Math.max(1.01, odds);
}

function legOddsToDecimalOrNull(leg: Record<string, any>): number | null {
  const raw =
    leg.odds !== undefined && leg.odds !== null && leg.odds !== ""
      ? Number(leg.odds)
      : leg.odds_decimal !== undefined && leg.odds_decimal !== null
        ? Number(leg.odds_decimal)
        : leg.oddsDecimal !== undefined && leg.oddsDecimal !== null
          ? Number(leg.oddsDecimal)
          : null;

  if (raw === null || !Number.isFinite(raw) || raw === 0) return null;
  if (Math.abs(raw) >= 100) return Number(americanToDecimal(raw).toFixed(3));
  return raw > 1.01 ? Number(raw.toFixed(3)) : null;
}

function normalizeBackendPlayerId(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }

  const match = String(value).match(/\d{3,}/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function legPlayerId(leg: Record<string, any>): number | null {
  return normalizeBackendPlayerId(
    leg.playerId ?? leg.mlbPlayerId ?? leg.player_id ?? leg.mlb_player_id ?? leg.personId
  );
}

function normalizeSource(source: unknown, aiGenerated: boolean): string {
  const raw = String(source ?? "").trim();
  if (BACKEND_SOURCES.has(raw)) return raw;
  if (aiGenerated || raw === "vai_ai_made_parlay" || raw === "vai_smart_pick") return "ai_pick";
  if (raw === "command_center") return "command_center";
  if (raw === "hr_board" || raw === "player_research" || raw === "manual_builder") return "manual";
  if (raw === "tailed_parlay") return "manual";
  return "manual";
}

function buildResponse(input: {
  parlay: ParlayRow;
  legs: ParlayLegRow[];
  combinedOdds: number | null;
  aiGenerated: boolean;
  deduped: boolean;
}): SaveUserParlayResult["body"] {
  return {
    id: input.parlay.id,
    ...input.parlay,
    legs: input.legs,
    combined_odds: input.combinedOdds,
    ai_generated: input.aiGenerated,
    deduped: input.deduped,
  };
}

function buildLegIdentity(input: {
  leg: Record<string, any>;
  index: number;
  sport: string;
  oddsDecimal: number | null;
}) {
  const { leg, index, sport, oddsDecimal } = input;
  const sportKey = String(leg.sport || sport || "mlb").trim().toLowerCase();
  const gameId = String(
    leg.gameId || leg.game_id || leg.gamePk || leg.game_pk || leg.eventId || leg.event_id || leg.game || "manual"
  ).slice(0, 64);
  const teamIdRaw = leg.teamId || leg.team_id || leg.team?.id || leg.teamCode || leg.teamAbbr || null;
  const teamId = teamIdRaw == null ? null : String(teamIdRaw).trim().slice(0, 64) || null;
  const playerId = legPlayerId(leg);

  const rawMarketCode =
    String(leg.marketCode || leg.market_code || leg.market || "prop").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") ||
    "PROP";
  const marketCode =
    rawMarketCode === "HR" || rawMarketCode === "HOMERUN" || rawMarketCode === "HOME_RUN"
      ? "ANYTIME_HR"
      : rawMarketCode;

  const rawStatTarget = leg.statTarget ?? leg.stat_target ?? leg.target ?? leg.line ?? null;
  const parsedStatTarget = rawStatTarget === null || rawStatTarget === "" ? null : Number(rawStatTarget);
  const statTarget = Number.isFinite(parsedStatTarget)
    ? Number(rawStatTarget)
    : marketCode === "ANYTIME_HR"
      ? 1
      : null;

  const comparator = String(
    leg.comparator || leg.operator || leg.direction || (statTarget != null ? ">=" : "")
  ).trim() || null;

  const comparatorKey =
    comparator === ">=" ? "GTE" :
    comparator === "<=" ? "LTE" :
    comparator === "=" ? "EQ" :
    null;

  const keySport = sportKey.toUpperCase().replace(/[^A-Z0-9_-]/g, "") || "MLB";
  const keyGame = gameId.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const keyTeam = String(teamId || "TEAM").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const keyPlayer = playerId ? String(playerId).toUpperCase().replace(/[^A-Z0-9_-]/g, "") : "";

  const eventKey =
    String(leg.eventKey || leg.event_key || "").trim() ||
    (keyGame && keyPlayer && marketCode !== "UNKNOWN" && statTarget != null && comparatorKey
      ? [keySport, keyGame, keyTeam, keyPlayer, marketCode, statTarget, comparatorKey].join("_")
      : null);

  const popularityKey =
    String(leg.popularityKey || leg.popularity_key || "").trim() ||
    (keyPlayer && marketCode !== "UNKNOWN" && statTarget != null && comparatorKey
      ? [keySport, keyPlayer, marketCode, statTarget, comparatorKey].join("_")
      : null);

  return {
    leg_index: index,
    sport: sportKey,
    event_id: gameId,
    game_id: gameId,
    team_id: teamId,
    market: String(leg.market || leg.marketCode || "prop").slice(0, 64),
    market_code: marketCode,
    selection: String(leg.selection || "").slice(0, 280) || "-",
    odds_decimal: oddsDecimal,
    player_id: playerId,
    event_key: eventKey,
    popularity_key: popularityKey,
    stat_target: statTarget,
    comparator,
    external_provider: leg.externalProvider || leg.external_provider || leg.provider || null,
  };
}

export async function saveUserParlay(input: {
  userId: string;
  body: SaveMeParlayInput;
}): Promise<SaveUserParlayResult> {
  const body = input.body as SaveMeParlayInput & Record<string, any>;
  const rawLegs = body.legs as Record<string, any>[];
  const title = typeof body.title === "string" && body.title.trim() ? body.title.slice(0, 200) : "My Parlay";
  const explanation = typeof body.explanation === "string" && body.explanation.trim()
    ? body.explanation.trim().slice(0, 2000)
    : title;
  const mode = body.mode === "REAL" ? "REAL" : "PRACTICE";
  const wagerAmount =
    typeof body.wagerAmount === "number" && body.wagerAmount > 0
      ? body.wagerAmount
      : typeof body.stake_units === "number" && body.stake_units > 0
        ? body.stake_units
        : 1.0;
  const aiGenerated = body.aiGenerated === true;
  const source = normalizeSource(body.source, aiGenerated);
  const clientRef =
    typeof body.clientRef === "string" && body.clientRef
      ? body.clientRef.slice(0, 128)
      : typeof body.client_ref === "string" && body.client_ref
        ? body.client_ref.slice(0, 128)
        : typeof body.id === "string" && body.id
          ? body.id.slice(0, 128)
          : null;

  const legOdds = rawLegs.map((leg) => legOddsToDecimalOrNull(leg));
  const allLegsPriced = legOdds.length > 0 && legOdds.every((odds) => odds !== null);
  const combinedOdds = allLegsPriced
    ? Number((legOdds as number[]).reduce((product, odds) => product * odds, 1).toFixed(3))
    : null;

  const selectionSummary = rawLegs
    .map((leg) => String(leg.selection || leg.market || "").slice(0, 60))
    .filter(Boolean)
    .join(" | ")
    .slice(0, 500);

  const parentEventId = String(rawLegs[0]?.gamePk || rawLegs[0]?.event_id || rawLegs[0]?.game || "manual").slice(0, 64);
  const sport = String(body.sport || rawLegs[0]?.sport || "mlb").slice(0, 32);
  const confidence =
    typeof body.edgeScore === "number"
      ? body.edgeScore
      : typeof body.confidence === "number"
        ? body.confidence
        : null;
  const legsJson = rawLegs.map((leg, index) => buildLegIdentity({
    leg,
    index,
    sport,
    oddsDecimal: legOdds[index],
  }));

  if (clientRef) {
    try {
      const existing = await findUserParlayByClientRef({ userId: input.userId, clientRef });
      if (existing) {
        return {
          statusCode: 200,
          body: buildResponse({
            parlay: existing,
            legs: await findLegsForPick(String(existing.id)),
            combinedOdds,
            aiGenerated,
            deduped: true,
          }),
        };
      }
    } catch (error) {
      if (!isMissingColumnError(error)) {
        console.warn("[me/parlays] dedup lookup failed (continuing)", (error as any)?.code, (error as Error)?.message);
      }
    }
  }

  try {
    const rpcPick = await createParlayWithLegsRpc({
      p_user_id: input.userId,
      p_sport: sport,
      p_event_id: parentEventId,
      p_market: `${rawLegs.length}-leg parlay`,
      p_selection: selectionSummary || title,
      p_odds_decimal: combinedOdds,
      p_stake_units: wagerAmount,
      p_confidence: confidence,
      p_explanation: explanation,
      p_is_demo: mode === "PRACTICE",
      p_source: source,
      p_client_ref: clientRef,
      p_legs: legsJson,
    });

    if (rpcPick) {
      const parlay = Array.isArray(rpcPick) ? rpcPick[0] : rpcPick;
      return {
        statusCode: 201,
        body: buildResponse({
          parlay,
          legs: await findLegsForPick(String(parlay.id)),
          combinedOdds,
          aiGenerated,
          deduped: false,
        }),
      };
    }
  } catch (error) {
    if (!isMissingFunctionError(error)) {
      console.error("[me/parlays] RPC create failed", (error as any)?.code, (error as Error)?.message);
      throw new AppError({ status: 500, code: "internal_server_error", message: "Failed to save parlay.", cause: error });
    }
  }

  let parlay: ParlayRow | null = null;
  try {
    const parent = {
      user_id: input.userId,
      capper_id: null,
      leg_type: "parlay" as const,
      sport,
      event_id: parentEventId,
      market: `${rawLegs.length}-leg parlay`,
      selection: selectionSummary || title,
      odds_decimal: combinedOdds,
      stake_units: wagerAmount,
      confidence,
      explanation,
      is_demo: mode === "PRACTICE",
      status: "pending",
      source,
      client_ref: clientRef,
    };

    try {
      parlay = await insertParlayParent(parent);
    } catch (error) {
      if (!isMissingColumnError(error)) throw error;
      const { source: _source, client_ref: _clientRef, ...legacyParent } = parent;
      parlay = await insertParlayParent(legacyParent);
    }

    const legsToInsert = legsJson.map((leg) => ({ ...leg, pick_id: parlay!.id, status: "pending" as const }));
    const insertedLegs = await insertParlayLegRows(legsToInsert);

    if (insertedLegs.length !== legsToInsert.length) {
      throw new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Leg insert count mismatch; parlay rolled back.",
      });
    }

    return {
      statusCode: 201,
      body: buildResponse({
        parlay,
        legs: [...insertedLegs].sort((a, b) => Number(a.leg_index ?? 0) - Number(b.leg_index ?? 0)),
        combinedOdds,
        aiGenerated,
        deduped: false,
      }),
    };
  } catch (error) {
    if (parlay?.id) {
      try {
        await deleteParlayById(String(parlay.id));
      } catch (rollbackError) {
        console.error("[me/parlays] rollback failed", (rollbackError as Error)?.message);
      }
    }

    if (error instanceof AppError) throw error;
    console.error("[me/parlays] save failed", (error as any)?.code, (error as Error)?.message);
    throw new AppError({ status: 500, code: "internal_server_error", message: "Failed to save parlay.", cause: error });
  }
}
