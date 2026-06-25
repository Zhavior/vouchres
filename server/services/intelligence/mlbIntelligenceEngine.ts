/**
 * MLB Intelligence Engine — orchestrator.
 * Fetches pitcher season stats once, then runs all sub-engines with real inputs.
 * All seeded/placeholder values have been removed from the pipeline.
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

export async function buildDailyReport(date = todayISO()): Promise<DailyMlbReport> {
  return reportCache.getOrSet(`daily_v2:${date}`, async () => {
    const games = await getScheduleByDate(date);

    // Collect all probable pitcher IDs from today's schedule
    const pitcherIds = new Set<number>();
    for (const g of games) {
      if (g.probablePitchers.away?.pitcherId) pitcherIds.add(g.probablePitchers.away.pitcherId);
      if (g.probablePitchers.home?.pitcherId) pitcherIds.add(g.probablePitchers.home.pitcherId);
    }

    // Fetch all pitcher season stats in parallel
    const pitcherStatsList = await Promise.allSettled(
      [...pitcherIds].map(async (id) => ({ id, stats: await getPitcherStats(id) }))
    );
    const pitcherStatsMap = new Map<number, PitcherSeasonStats | null>();
    for (const r of pitcherStatsList) {
      if (r.status === "fulfilled") {
        pitcherStatsMap.set(r.value.id, r.value.stats.season);
      }
    }

    console.log(`[mlbIntelligenceEngine] ${games.length} games, ${pitcherStatsMap.size} pitcher stat sets`);

    // Run all engines with real stats
    const [vulnerablePitchers, hrTargets, sneakyHr, rbi] = await Promise.all([
      buildVulnerablePitcherReport(games, pitcherStatsMap),
      rankHrTargets(games, pitcherStatsMap),
      findSneakyHrTargets(games, pitcherStatsMap),
      rankRbiTargets(games, pitcherStatsMap),
    ]);
    const runEnvironments = scoreRunEnvironment(games, pitcherStatsMap);

    const hasStats = pitcherStatsMap.size > 0;
    return {
      date,
      gameCount: games.length,
      games,
      vulnerablePitchers,
      hrTargets,
      sneakyHr,
      rbi,
      runEnvironments,
      dataQuality: games.length && hasStats ? "partial" : games.length ? "limited" : "limited",
      generatedAt: new Date().toISOString(),
      disclaimer: DISCLAIMER,
    };
  }) as Promise<DailyMlbReport>;
}
