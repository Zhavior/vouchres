import {
  clearDailyReportCache,
  getDailyReportDiagnostics,
  getSharedDailyReport,
  resetDailyReportDiagnostics,
} from "../server/services/intelligence/mlbIntelligenceEngine";
import { getMlbRequestCount, resetMlbRequestCount } from "../server/services/mlb/mlbClient";
import { getStatsRequestCount, resetStatsRequestCount } from "../server/services/mlb/statsClient";

const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const parallelCalls = 5;

clearDailyReportCache(date);
resetDailyReportDiagnostics();
resetMlbRequestCount();
resetStatsRequestCount();

const startedAt = Date.now();
const reports = await Promise.all(
  Array.from({ length: parallelCalls }, () => getSharedDailyReport(date))
);
const durationMs = Date.now() - startedAt;
const diagnostics = getDailyReportDiagnostics();

const validJson = reports.every((report) => {
  return (
    report &&
    report.date === date &&
    Array.isArray(report.games) &&
    Array.isArray(report.hrTargets) &&
    Array.isArray(report.warnings)
  );
});

const uniqueGeneratedAt = new Set(reports.map((report) => report.generatedAt));

console.log(
  JSON.stringify(
    {
      ok: validJson && diagnostics.builds.started === 1,
      date,
      parallelCalls,
      durationMs,
      buildStarts: diagnostics.builds.started,
      buildCompletions: diagnostics.builds.completed,
      buildFailures: diagnostics.builds.failed,
      cache: diagnostics.cache,
      mlbRequestCount: getMlbRequestCount(),
      statsRequestCount: getStatsRequestCount(),
      uniqueGeneratedAt: uniqueGeneratedAt.size,
      warnings: [...new Set(reports.flatMap((report) => report.warnings))],
    },
    null,
    2
  )
);

if (!validJson) {
  throw new Error("Daily report cache verification failed: one or more calls returned invalid report JSON");
}

if (diagnostics.builds.started !== 1) {
  throw new Error(`Daily report cache verification failed: expected 1 build, got ${diagnostics.builds.started}`);
}

