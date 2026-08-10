import { runWithDistributedLock } from "../../../lib/distributedLock";
import { structuredLog } from "../../../lib/structuredLog";
import { getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import type { NormalizedGame } from "../../mlb/mlbTypes";
import { settleBrainHrPicks, settleBrainPitcherKPicks, settleBrainStolenBasePicks, snapshotDailyBrainHrPicks, snapshotDailyBrainPitcherKPicks, snapshotDailyBrainStolenBasePicks } from "./brainLedgerService";
import { buildBrainTemporalContext } from "./temporalPolicy";
import { generateBrainGeminiReviews } from "./brainGeminiReviewService";

export type BrainScheduleSnapshotReason =
  | "games_in_capture_window"
  | "empty_schedule"
  | "outside_capture_window";

function yesterdayIso(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function findEarliestUpcomingFirstPitch(games: NormalizedGame[], now: Date): {
  firstPitchAt: string;
  millisecondsUntilFirstPitch: number;
} | null {
  const upcoming = games
    .map((game) => ({
      firstPitchAt: game.gameDate,
      millisecondsUntilFirstPitch: new Date(game.gameDate).getTime() - now.getTime(),
    }))
    .filter((game) => game.millisecondsUntilFirstPitch > 0)
    .sort((left, right) => left.millisecondsUntilFirstPitch - right.millisecondsUntilFirstPitch);

  return upcoming[0] ?? null;
}

function formatDurationUntilFirstPitch(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function buildSnapshotSkipLog(input: {
  date: string;
  games: NormalizedGame[];
  now: Date;
}): {
  reason: Exclude<BrainScheduleSnapshotReason, "games_in_capture_window">;
  message: string;
  earliestFirstPitch?: string;
  millisecondsToEarliestFirstPitch?: number;
} {
  if (input.games.length === 0) {
    return {
      reason: "empty_schedule",
      message: `No games on the schedule for ${input.date}.`,
    };
  }

  const earliest = findEarliestUpcomingFirstPitch(input.games, input.now);
  if (earliest) {
    return {
      reason: "outside_capture_window",
      message: `${input.games.length} games on the schedule for ${input.date}, but none are inside the capture window. Earliest first pitch at ${earliest.firstPitchAt} (${formatDurationUntilFirstPitch(earliest.millisecondsUntilFirstPitch)} away).`,
      earliestFirstPitch: earliest.firstPitchAt,
      millisecondsToEarliestFirstPitch: earliest.millisecondsUntilFirstPitch,
    };
  }

  return {
    reason: "outside_capture_window",
    message: `${input.games.length} games on the schedule for ${input.date}, but none are inside the capture window and no upcoming first pitch remains.`,
  };
}

export async function executeBrainOperations(date = todayISO(), now = new Date()) {
  return runWithDistributedLock(`brain:mlb:operations:${date}`, async () => {
    const games = await getScheduleByDate(date);
    const observedAt = now.toISOString();
    const upcomingGames = games.filter((game) => buildBrainTemporalContext({
      now,
      scheduledAt: game.gameDate,
      observedAt,
      gameStatus: game.status,
    }).canSnapshot);

    const snapshotReason: BrainScheduleSnapshotReason = upcomingGames.length
      ? "games_in_capture_window"
      : buildSnapshotSkipLog({ date, games, now }).reason;

    if (upcomingGames.length) {
      await Promise.all([snapshotDailyBrainHrPicks(date), snapshotDailyBrainStolenBasePicks(date), snapshotDailyBrainPitcherKPicks(date)]);
      await generateBrainGeminiReviews(date);
    } else {
      const skipLog = buildSnapshotSkipLog({ date, games, now });
      structuredLog({
        level: "info",
        event: "brain.operations.snapshot_skipped",
        date,
        games: games.length,
        reason: skipLog.reason,
        message: skipLog.message,
        ...(skipLog.earliestFirstPitch ? { earliestFirstPitch: skipLog.earliestFirstPitch } : {}),
        ...(typeof skipLog.millisecondsToEarliestFirstPitch === "number"
          ? { millisecondsToEarliestFirstPitch: skipLog.millisecondsToEarliestFirstPitch }
          : {}),
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
    const skipDetails = upcomingGames.length ? null : buildSnapshotSkipLog({ date, games, now });
    const result = {
      date,
      games: games.length,
      upcomingGames: upcomingGames.length,
      snapshotAttempted: upcomingGames.length > 0,
      snapshotReason,
      ...(skipDetails?.message ? { snapshotMessage: skipDetails.message } : {}),
      ...(skipDetails?.earliestFirstPitch ? { earliestFirstPitch: skipDetails.earliestFirstPitch } : {}),
      ...(typeof skipDetails?.millisecondsToEarliestFirstPitch === "number"
        ? { millisecondsToEarliestFirstPitch: skipDetails.millisecondsToEarliestFirstPitch }
        : {}),
      settled: settledToday + settledYesterday + settledSbToday + settledSbYesterday + settledKToday + settledKYesterday,
      checkedAt: now.toISOString(),
    };
    structuredLog({ level: "info", event: "brain.operations.completed", ...result });
    return result;
  }, { ttlSeconds: 900, waitMs: 5_000 });
}
