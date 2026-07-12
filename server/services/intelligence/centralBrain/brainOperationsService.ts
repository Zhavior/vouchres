import { runWithDistributedLock } from "../../../lib/distributedLock";
import { structuredLog } from "../../../lib/structuredLog";
import { AppError } from "../../../errors/AppError";
import { getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import {
  settleBrainHrPicks,
  settleBrainPitcherKPicks,
  settleBrainStolenBasePicks,
  snapshotDailyBrainHrPicks,
  snapshotDailyBrainPitcherKPicks,
  snapshotDailyBrainStolenBasePicks,
} from "./brainLedgerService";
import { buildBrainTemporalContext } from "./temporalPolicy";
import { generateBrainGeminiReviews } from "./brainGeminiReviewService";

const SETTLEMENT_LOOKBACK_DAYS = Math.max(
  2,
  Math.min(14, Number(process.env.BRAIN_SETTLEMENT_LOOKBACK_DAYS ?? 7)),
);

function priorIso(date: string, offset: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - offset);
  return value.toISOString().slice(0, 10);
}

export async function executeBrainOperations(
  date = todayISO(),
  now = new Date(),
) {
  try {
    return await runWithDistributedLock(
      `brain:mlb:operations:${date}`,
      async () => {
        const games = await getScheduleByDate(date);
        const observedAt = now.toISOString();
        const upcomingGames = games.filter(
          (game) =>
            buildBrainTemporalContext({
              now,
              scheduledAt: game.gameDate,
              observedAt,
              gameStatus: game.status,
            }).canSnapshot,
        );

        if (upcomingGames.length) {
          await Promise.all([
            snapshotDailyBrainHrPicks(date),
            snapshotDailyBrainStolenBasePicks(date),
            snapshotDailyBrainPitcherKPicks(date),
          ]);
          await generateBrainGeminiReviews(date);
        }

        const settlementDates = Array.from(
          { length: SETTLEMENT_LOOKBACK_DAYS },
          (_, offset) => priorIso(date, offset),
        );
        const settled = await Promise.all(
          settlementDates.flatMap((settlementDate) => [
            settleBrainHrPicks(settlementDate),
            settleBrainStolenBasePicks(settlementDate),
            settleBrainPitcherKPicks(settlementDate),
          ]),
        );
        const result = {
          date,
          games: games.length,
          upcomingGames: upcomingGames.length,
          snapshotAttempted: upcomingGames.length > 0,
          settled: settled.reduce((total, count) => total + count, 0),
          settlementLookbackDays: SETTLEMENT_LOOKBACK_DAYS,
          checkedAt: now.toISOString(),
        };
        structuredLog({
          level: "info",
          event: "brain.operations.completed",
          ...result,
        });
        return result;
      },
      { ttlSeconds: 900, waitMs: 5_000 },
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "conflict") {
      structuredLog({
        level: "warn",
        event: "brain.operations.lock_contended",
        date,
        lock: `brain:mlb:operations:${date}`,
        waitMs: 5_000,
      });
    }
    throw error;
  }
}
