/**
 * Single scheduled HR evidence loop.
 *
 * Render runs this every 15 minutes. Snapshot capture is cheap enough to run
 * each time; shadow scoring runs on the half-hour; outcomes run once daily.
 * Keeping these in one cron avoids paying for three separate Render workers.
 */
import { runSnapshotCapture } from "./hrSnapshotCapture";
import { runHrShadowCapture } from "./hrShadowCapture";
import { runOutcomeIngest } from "./hrOutcomeIngest";

export async function runHrIntelligenceCapture(now = new Date()): Promise<void> {
  await runSnapshotCapture({ dryRun: false, gamePk: null, forceGamePk: null, date: null });

  const minute = now.getUTCMinutes();
  if (minute === 0 || minute === 30) {
    await runHrShadowCapture(now.toISOString().slice(0, 10));
  }

  if (now.getUTCHours() === 9 && minute === 0) {
    await runOutcomeIngest({ dryRun: false, date: null }, now);
  }
}

async function main(): Promise<void> {
  try {
    await runHrIntelligenceCapture();
    process.exit(0);
  } catch (error) {
    console.error("[HR_INTELLIGENCE] capture failed:", error);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("hrIntelligenceCapture")) {
  void main();
}
