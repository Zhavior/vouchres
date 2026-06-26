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

const inFlightReports = new Map<string, Promise<DailyMlbReport>>();
const REPORT_TTL = 5 * 60_000; // 5 minutes

export async function getSharedDailyReport(date = todayISO()): Promise<DailyMlbReport> {
  const cacheKey = `dailyReport:${date}`;

  // 1. Check cache — if fresh, return immediately (no API calls)
  const cached = reportCache.get(cacheKey) as DailyMlbReport | undefined;
  if (cached) {
    console.log(`[sharedReport] CACHE HIT for ${date}`);
    return cached;
  }

  // 2. Check in-flight — if another caller is already building, await their Promise
  const inFlight = inFlightReports.get(cacheKey);
  if (inFlight) {
    console.log(`[sharedReport] IN-FLIGHT REUSED for ${date}`);
    return inFlight;
  }

  // 3. Cache miss + no in-flight — start a new build
  console.log(`[sharedReport] CACHE MISS for ${date} — starting new build`);

  const buildPromise = buildDailyReportInternal(date)
    .then((report) => {
      // Store in cache for future callers
      reportCache.set(cacheKey, report, REPORT_TTL);
      console.log(`[sharedReport] BUILD COMPLETE for ${date} — cached for ${REPORT_TTL / 1000}s`);
      return report;
    })
    .catch((err) => {
      // If the build fails, clear the in-flight marker so a future call can retry
      console.error(`[sharedReport] BUILD FAILED for ${date}:`, err.message);
      throw err;
    })
    .finally(() => {
      // Always clear the in-flight marker (whether success or failure)
      inFlightReports.delete(cacheKey);
    });

  // Store the in-flight Promise so concurrent callers can await it
  inFlightReports.set(cacheKey, buildPromise);

  return buildPromise;
}

/* ============ Internal build (only called by getSharedDailyReport) ============ */

async function buildDailyReportInternal(date: string): Promise<DailyMlbReport> {
  const startTime = Date.now();
  const memBefore = process.memoryUsage().heapUsed;

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
  const pitcherStatsList = await Promise.allSettled(
    [...pitcherIds].map(async (id) => ({ id, stats: await getPitcherStats(id) }))
  );
  const pitcherStatsMap = new Map<number, PitcherSeasonStats | null>();
  let pitcherStatCalls = 0;
  for (const r of pitcherStatsList) {
    if (r.status === "fulfilled") {
      pitcherStatsMap.set(r.value.id, r.value.stats.season);
      pitcherStatCalls++;
    }
  }

  console.log(`[mlbIntelligenceEngine] Pitcher stats: ${pitcherStatCalls}/${pitcherIds.size} fetched successfully`);

  // Run all engines with real stats
  const [vulnerablePitchers, hrTargets, sneakyHr, rbi] = await Promise.all([
    buildVulnerablePitcherReport(games, pitcherStatsMap),
    rankHrTargets(games, pitcherStatsMap),
    findSneakyHrTargets(games, pitcherStatsMap),
    rankRbiTargets(games, pitcherStatsMap),
  ]);
  const runEnvironments = scoreRunEnvironment(games, pitcherStatsMap);

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
    dataQuality: games.length && hasStats ? "partial" : "limited",
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}

/* ============ Legacy export (delegates to shared report) ============ */
/** @deprecated Use getSharedDailyReport() instead — this is kept for backward compat. */
export async function buildDailyReport(date = todayISO()): Promise<DailyMlbReport> {
  return getSharedDailyReport(date);
}
