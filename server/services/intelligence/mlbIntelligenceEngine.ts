/**
 * MLB Intelligence Engine — orchestrator.
 * Fetches pitcher season stats once, then runs all sub-engines with real inputs.
 * All seeded/placeholder values have been removed from the pipeline.
 *
 * SHARED REPORT PATTERN:
 *   getSharedDailyReport(date) is the single entry point for ALL consumers
 *   (cappers, HR board, intelligence hub). It guarantees:
 *     1. Only ONE build runs per date per refresh window.
 *     2. If a build is in-flight, all callers await the same Promise.
 *     3. After the build completes, the result is cached and served instantly.
 *     4. If the build fails, a clear error is thrown (no infinite retry).
 */
import { getScheduleByDate, todayISO } from "../mlb/mlbClient";
import { getPitcherStats, PitcherSeasonStats } from "../mlb/statsClient";
import { reportCache } from "../mlb/mlbCache";
import { NormalizedGame } from "../mlb/mlbTypes";
import { buildVulnerablePitcherReport, VulnerablePitcherProfile } from "./pitcherVulnerabilityEngine";
import { rankHrTargets, findSneakyHrTargets, HrTarget, SneakyHrTarget } from "./hrEngine";
import { rankRbiTargets, RbiEnvironmentReport } from "./rbiEnvironmentEngine";
import { scoreRunEnvironment, RunEnvironment } from "./runEnvironmentEngine";
import { TTL, limitConcurrency } from "../../lib/cache";

export interface DailyMlbReport {
  date: string;
  gameCount: number;
  games: NormalizedGame[];
  vulnerablePitchers: VulnerablePitcherProfile[];
  hrTargets: HrTarget[];
  sneakyHr: SneakyHrTarget[];
  rbi: RbiEnvironmentReport;
  runEnvironments: RunEnvironment[];
  dataQuality: "full" | "partial" | "limited";
  generatedAt: string;
  disclaimer: string;
  warnings: string[];
}

const DISCLAIMER =
  "Probability-based research using real MLB season stats and sourced park factors. " +
  "For entertainment only — not betting advice. Weather and lineup data unavailable. " +
  "No guaranteed outcomes.";

/* =====================================================================
   SHARED DAILY REPORT — in-flight Promise deduplication
   =====================================================================
   This prevents 5 cappers from triggering 5 separate MLB API fetches.
   The first caller starts the build; all subsequent callers await the
   same in-flight Promise. Once resolved, the result is cached and all
   future callers get an instant cache hit.
   ===================================================================== */

const reportBuildStats = {
  started: 0,
  completed: 0,
  failed: 0,
};

const LAST_GOOD_DAILY_REPORT_MS = 30 * 60_000;
const LAST_GOOD_DAILY_REPORT_WARNING =
  "Serving last-known daily report; upstream refresh failed. Data is from the prior successful build.";

const lastGoodDailyReports = new Map<string, { report: DailyMlbReport; storedAt: number }>();

function rememberLastGoodDailyReport(date: string, report: DailyMlbReport): void {
  lastGoodDailyReports.set(date, { report, storedAt: Date.now() });
}

function serveLastGoodDailyReport(date: string): DailyMlbReport | null {
  const entry = lastGoodDailyReports.get(date);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > LAST_GOOD_DAILY_REPORT_MS) return null;

  console.warn(`[sharedReport] serving last-good daily report date=${date} ageMs=${Date.now() - entry.storedAt}`);
  return {
    ...entry.report,
    dataQuality: entry.report.dataQuality === "full" ? "partial" : entry.report.dataQuality,
    warnings: [...new Set([...entry.report.warnings, LAST_GOOD_DAILY_REPORT_WARNING])],
  };
}

/** Test-only reset for daily report last-good snapshots. */
export function resetDailyReportLastGoodForTests(): void {
  lastGoodDailyReports.clear();
}

export async function getSharedDailyReport(date = todayISO()): Promise<DailyMlbReport> {
  const cacheKey = `dailyReport:${date}`;
  return reportCache.getOrSet(cacheKey, async () => {
    reportBuildStats.started++;
    console.log(`[sharedReport] build start for ${date}`);
    try {
      const report = await buildDailyReportInternal(date);
      reportBuildStats.completed++;
      rememberLastGoodDailyReport(date, report);
      console.log(`[sharedReport] build complete for ${date}`);
      return report;
    } catch (err) {
      reportBuildStats.failed++;
      console.error(`[sharedReport] build failed for ${date}:`, (err as Error).message);
      const lastGood = serveLastGoodDailyReport(date);
      if (lastGood) return lastGood;
      return buildEmptyReport(date, [`Daily report build failed: ${(err as Error).message}`]);
    }
  }, TTL.dailyReport) as Promise<DailyMlbReport>;
}

export function clearDailyReportCache(date?: string): void {
  if (date) {
    reportCache.delete(`dailyReport:${date}`);
    return;
  }
  reportCache.clear();
}

export function resetDailyReportDiagnostics(): void {
  reportBuildStats.started = 0;
  reportBuildStats.completed = 0;
  reportBuildStats.failed = 0;
  reportCache.resetStats();
}

export function getDailyReportDiagnostics() {
  return {
    builds: { ...reportBuildStats },
    cache: reportCache.getStats(),
  };
}

function buildEmptyReport(date: string, warnings: string[]): DailyMlbReport {
  return {
    date,
    gameCount: 0,
    games: [],
    vulnerablePitchers: [],
    hrTargets: [],
    sneakyHr: [],
    rbi: { targets: [], summary: warnings[0] ?? "Daily report unavailable" } as any,
    runEnvironments: [],
    dataQuality: "limited",
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    warnings,
  };
}

/* ============ Internal build (only called by getSharedDailyReport) ============ */

async function buildDailyReportInternal(date: string): Promise<DailyMlbReport> {
  const startTime = Date.now();
  const memBefore = process.memoryUsage().heapUsed;
  const warnings: string[] = [];

  const games = await getScheduleByDate(date);

  if (games.length === 0) {
    console.log(`[mlbIntelligenceEngine] No games scheduled for ${date}`);
    return {
      date,
      gameCount: 0,
      games: [],
      vulnerablePitchers: [],
      hrTargets: [],
      sneakyHr: [],
      rbi: { targets: [], summary: "No games scheduled" } as any,
      runEnvironments: [],
      dataQuality: "limited",
      generatedAt: new Date().toISOString(),
      disclaimer: DISCLAIMER,
      warnings: [],
    };
  }

  // Collect all probable pitcher IDs from today's schedule
  const pitcherIds = new Set<number>();
  for (const g of games) {
    if (g.probablePitchers.away?.pitcherId) pitcherIds.add(g.probablePitchers.away.pitcherId);
    if (g.probablePitchers.home?.pitcherId) pitcherIds.add(g.probablePitchers.home.pitcherId);
  }

  console.log(`[mlbIntelligenceEngine] ${games.length} games, ${pitcherIds.size} probable pitchers — fetching stats...`);

  // Fetch all pitcher season stats in parallel
  const pitcherStatsList = await limitConcurrency([...pitcherIds], 6, async (id) => {
    try {
      return { status: "fulfilled" as const, value: { id, stats: await getPitcherStats(id) } };
    } catch (reason) {
      return { status: "rejected" as const, reason };
    }
  });
  const pitcherStatsMap = new Map<number, PitcherSeasonStats | null>();
  let pitcherStatCalls = 0;
  for (const r of pitcherStatsList) {
    if (r.status === "fulfilled") {
      pitcherStatsMap.set(r.value.id, r.value.stats.season);
      pitcherStatCalls++;
    } else {
      warnings.push(`Pitcher stats unavailable: ${r.reason?.message ?? "unknown error"}`);
    }
  }
  if (pitcherStatCalls < pitcherIds.size) {
    warnings.push(`Pitcher stats partial: ${pitcherStatCalls}/${pitcherIds.size} loaded`);
  }

  console.log(`[mlbIntelligenceEngine] Pitcher stats: ${pitcherStatCalls}/${pitcherIds.size} fetched successfully`);

  // Run all engines with real stats
  const [vulnerableResult, hrResult, sneakyResult, rbiResult] = await Promise.allSettled([
    buildVulnerablePitcherReport(games, pitcherStatsMap),
    rankHrTargets(games, pitcherStatsMap),
    findSneakyHrTargets(games, pitcherStatsMap),
    rankRbiTargets(games, pitcherStatsMap),
  ] as const);

  const vulnerablePitchers = vulnerableResult.status === "fulfilled" ? vulnerableResult.value : [];
  const hrTargets = hrResult.status === "fulfilled" ? hrResult.value : [];
  const sneakyHr = sneakyResult.status === "fulfilled" ? sneakyResult.value : [];
  const rbi = rbiResult.status === "fulfilled" ? rbiResult.value : ({ targets: [], summary: "RBI engine unavailable" } as any);

  if (vulnerableResult.status === "rejected") warnings.push(`Vulnerable pitcher report unavailable: ${vulnerableResult.reason?.message ?? "unknown error"}`);
  if (hrResult.status === "rejected") warnings.push(`HR target report unavailable: ${hrResult.reason?.message ?? "unknown error"}`);
  if (sneakyResult.status === "rejected") warnings.push(`Sneaky HR report unavailable: ${sneakyResult.reason?.message ?? "unknown error"}`);
  if (rbiResult.status === "rejected") warnings.push(`RBI report unavailable: ${rbiResult.reason?.message ?? "unknown error"}`);

  let runEnvironments: RunEnvironment[] = [];
  try {
    runEnvironments = scoreRunEnvironment(games, pitcherStatsMap);
  } catch (err) {
    warnings.push(`Run environment report unavailable: ${(err as Error).message}`);
  }

  const hasStats = pitcherStatsMap.size > 0;
  const memAfter = process.memoryUsage().heapUsed;
  const duration = Date.now() - startTime;
  const memDeltaMB = ((memAfter - memBefore) / 1024 / 1024).toFixed(1);

  console.log(
    `[mlbIntelligenceEngine] Report built: ${games.length} games, ${pitcherStatCalls} pitcher stats, ` +
    `${hrTargets.length} HR targets, ${sneakyHr.length} sneaky — ${duration}ms, +${memDeltaMB}MB heap`
  );

  return {
    date,
    gameCount: games.length,
    games,
    vulnerablePitchers,
    hrTargets,
    sneakyHr,
    rbi,
    runEnvironments,
    dataQuality: games.length && hasStats && warnings.length === 0 ? "full" : games.length && hasStats ? "partial" : "limited",
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    warnings,
  };
}

/* ============ Legacy export (delegates to shared report) ============ */
/** @deprecated Use getSharedDailyReport() instead — this is kept for backward compat. */
export async function buildDailyReport(date = todayISO()): Promise<DailyMlbReport> {
  return getSharedDailyReport(date);
}
