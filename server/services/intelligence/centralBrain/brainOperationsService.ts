import { runWithDistributedLock } from "../../../lib/distributedLock";
import { structuredLog } from "../../../lib/structuredLog";
import { getCachedValidatedHrBoard } from "../../hubs/hrBoardHub";
import { getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import { settleBrainHrPicks, settleBrainPitcherKPicks, settleBrainStolenBasePicks, snapshotDailyBrainHrPicks, snapshotDailyBrainPitcherKPicks, snapshotDailyBrainStolenBasePicks } from "./brainLedgerService";
import { buildBrainTemporalContext } from "./temporalPolicy";
import { generateBrainGeminiReviews } from "./brainGeminiReviewService";

function yesterdayIso(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export async function executeBrainOperations(date = todayISO(), now = new Date()) {
  return runWithDistributedLock(`brain:mlb:operations:${date}`, async () => {
    const [games, board] = await Promise.all([
      getScheduleByDate(date),
      getCachedValidatedHrBoard(date),
    ]);
    // Use real board evidence age — never spoof observedAt to "now" or selection will
    // correctly reject stale snapshots while ops reports a successful freeze attempt.
    const observedAt = board.debug?.lastRefresh ?? now.toISOString();
    const upcomingGames = games.filter((game) => buildBrainTemporalContext({
      now,
      scheduledAt: game.gameDate,
      observedAt,
      gameStatus: game.status,
    }).canSnapshot);

    if (upcomingGames.length) {
      await Promise.all([snapshotDailyBrainHrPicks(date), snapshotDailyBrainStolenBasePicks(date), snapshotDailyBrainPitcherKPicks(date)]);
      await generateBrainGeminiReviews(date);
    } else {
      structuredLog({
        level: "info",
        event: "brain.operations.snapshot_skipped",
        date,
        games: games.length,
        observedAt,
        reason: "no_game_in_fresh_decision_window",
      });
    }

    const [settledToday, settledYesterday, settledSbToday, settledSbYesterday, settledKToday, settledKYesterday] = await Promise.all([
      settleBrainHrPicks(date),
      settleBrainHrPicks(yesterdayIso(date)),
      settleBrainStolenBasePicks(date),
      settleBrainStolenBasePicks(yesterdayIso(date)),
      settleBrainPitcherKPicks(date),
      settleBrainPitcherKPicks(yesterdayIso(date)),
    ]);
    const result = {
      date,
      games: games.length,
      upcomingGames: upcomingGames.length,
      snapshotAttempted: upcomingGames.length > 0,
      evidenceObservedAt: observedAt,
      settled: settledToday + settledYesterday + settledSbToday + settledSbYesterday + settledKToday + settledKYesterday,
      checkedAt: now.toISOString(),
    };
    structuredLog({ level: "info", event: "brain.operations.completed", ...result });
    return result;
  }, { ttlSeconds: 900, waitMs: 5_000 });
}
