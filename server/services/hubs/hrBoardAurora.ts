import {
  createMlbHrDecision,
  evaluateMlbHrDecision,
} from "../../../src/core/aurora/mlb/MlbHrDecision";
import { AuroraLedgerBridge } from "../../../src/core/aurora/ledger/AuroraLedgerBridge";
import { TrustLedger } from "../../../src/core/trust-ledger/TrustLedger";

const hrDecisionLedger = new TrustLedger();
const hrDecisionBridge = new AuroraLedgerBridge(hrDecisionLedger);

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
      "player_id",
      "mlbPlayerId",
      "id",
    );

    const playerName = readString(
      candidate,
      "playerName",
      "player_name",
      "name",
    );

    if (!playerId || !playerName) continue;

    const gameDate =
      readString(candidate, "gameDate", "date") ??
      requestedDate ??
      new Date().toISOString().slice(0, 10);

    const projectedProbability = normalizeProbability(
      readNumber(
        candidate,
        "hrProbability",
        "homeRunProbability",
        "probability",
        "hrPct",
        "hrPercent",
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
      readNumber(candidate, "confidence", "confidencePct", "confidencePercent"),
    );

    const edge = normalizeProbability(
      readNumber(candidate, "edge", "edgePct", "edgePercent"),
    );

    const decision = createMlbHrDecision({
      playerId,
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
      gameId: readString(candidate, "gameId", "gamePk"),
      gameDate,
    });

    const evaluated = evaluateMlbHrDecision({
      decision,
      recommendation: {
        playerId,
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
          label: "Validated HR Board score",
          summary:
            "The validated HR Board candidate model supports this decision.",
          direction: "supports",
          weight: projectedProbability ?? 0.5,
          confidence: confidence ?? projectedProbability ?? 0.5,
          metadata: {
            candidateSource: readString(candidate, "candidateSource", "source"),
          },
        },
      ],
      modelVersion:
        readString(candidate, "modelVersion", "version") ??
        "validated-hr-board-v1",
    });

    persisted += hrDecisionBridge.persist(evaluated).length;
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
