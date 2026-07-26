import {
  createMlbHrDecision,
  evaluateMlbHrDecision,
} from "../../../src/core/aurora/mlb/MlbHrDecision";
import { AuroraLedgerBridge } from "../../../src/core/aurora/ledger/AuroraLedgerBridge";
import { InMemoryTrustLedger } from "../../../src/core/trust-ledger/TrustLedger";

// Prototype-only bridge. Production Layer 1 requires a durable event-store adapter.
const hrDecisionLedger = new InMemoryTrustLedger();
const hrDecisionBridge = new AuroraLedgerBridge(hrDecisionLedger);
const PUBLISHED_MLB_HR_CONTRACT_VERSION = "1.0";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const readString = (
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
};

const readNumber = (
  record: Record<string, unknown>,
  ...keys: string[]
): number | undefined => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const normalizeProbability = (
  value: number | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  if (value > 1) return Math.min(1, Math.max(0, value / 100));
  return Math.min(1, Math.max(0, value));
};

const normalizeSignedProbability = (
  value: number | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  const normalized = Math.abs(value) > 1 ? value / 100 : value;
  return Math.min(1, Math.max(-1, normalized));
};

const readPositiveInteger = (
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined => {
  const value = readNumber(record, ...keys);
  return value !== undefined && Number.isInteger(value) && value > 0
    ? String(value)
    : undefined;
};

const findCandidates = (board: unknown): readonly unknown[] => {
  const root = asRecord(board);
  if (!root) return [];

  if (Array.isArray(root.candidates)) {
    return root.candidates;
  }

  const data = asRecord(root.data);

  if (data && Array.isArray(data.candidates)) {
    return data.candidates;
  }

  return [];
};

export const materializeValidatedHrBoardAurora = (
  board: unknown,
  requestedDate?: string | null,
): number => {
  const candidates = findCandidates(board);
  let persisted = 0;

  for (const rawCandidate of candidates) {
    const candidate = asRecord(rawCandidate);
    if (!candidate) continue;

    const playerId = readString(
      candidate,
      "playerId",
    );

    const playerName = readString(
      candidate,
      "playerName",
      "player_name",
      "name",
    );

    const stablePlayerId = readPositiveInteger(candidate, "playerId");
    const gameId = readPositiveInteger(candidate, "gamePk");
    const lineupStatus = readString(candidate, "lineupStatus");
    const dataQuality = readString(candidate, "dataQuality");

    if (
      !playerId ||
      !stablePlayerId ||
      !playerName ||
      !gameId ||
      lineupStatus !== "confirmed" ||
      dataQuality === "projection_preview"
    ) continue;

    const gameDate =
      readString(candidate, "gameDate", "date") ??
      requestedDate ??
      readString(asRecord(board) ?? {}, "date");

    const projectedProbability = normalizeProbability(
      readNumber(
        candidate,
        "estimatedHrProbability",
      ),
    );

    const impliedProbability = normalizeProbability(
      readNumber(
        candidate,
        "impliedProbability",
        "marketProbability",
        "impliedPct",
      ),
    );

    const confidence = normalizeProbability(
      readNumber(
        candidate,
        "dataConfidence",
        "confidence",
        "confidencePct",
        "confidencePercent",
      ),
    );

    const edge = normalizeSignedProbability(
      readNumber(candidate, "edge", "edgePct", "edgePercent"),
    );

    if (gameDate === undefined || projectedProbability === undefined || confidence === undefined) {
      continue;
    }

    const decision = createMlbHrDecision({
      playerId: stablePlayerId,
      playerName,
      team: readString(candidate, "team", "teamAbbr", "teamCode"),
      opponent: readString(
        candidate,
        "opponent",
        "opponentAbbr",
        "opponentCode",
      ),
      pitcherId: readString(candidate, "pitcherId", "opposingPitcherId"),
      pitcherName: readString(candidate, "pitcherName", "opposingPitcher"),
      gameId,
      gameDate,
    });

    const evaluated = evaluateMlbHrDecision({
      decision,
      recommendation: {
        playerId: stablePlayerId,
        playerName,
        market: "home-run",
        selection: "yes",
        projectedProbability,
        impliedProbability,
        edge,
      },
      evidence: [
        {
          id: `${decision.id}:board-score`,
          decisionId: decision.id,
          label: "Validated HR Board projection",
          summary: `Estimated HR probability ${(projectedProbability * 100).toFixed(1)}%; data confidence ${(confidence * 100).toFixed(0)}%.`,
          direction: "supports",
          weight: projectedProbability,
          confidence,
          metadata: {
            candidateSource: readString(candidate, "dataSource"),
            hrScore: readNumber(candidate, "hrScore"),
            lineupStatus,
            dataQuality,
          },
        },
      ],
      modelVersion: readString(candidate, "modelVersion"),
    });

    persisted += hrDecisionBridge.persist(evaluated, {
      marketId: "HR",
      contractVersion: PUBLISHED_MLB_HR_CONTRACT_VERSION,
    }).length;
  }

  if (candidates.length > 0) {
    console.log(
      `[HR_BOARD_AURORA] materialized candidates=${candidates.length} events=${persisted}`,
    );
  }

  return persisted;
};

export const getHrDecisionHistory = (streamId: string) =>
  hrDecisionLedger.history(streamId);

export const getHrDecisionProjection = (streamId: string) =>
  hrDecisionLedger.current(streamId);
