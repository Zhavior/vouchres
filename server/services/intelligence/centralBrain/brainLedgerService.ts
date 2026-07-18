import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "../../../middleware/auth";
import { structuredLog } from "../../../lib/structuredLog";
import { getGameFeed, getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import { getTodayHomeRuns } from "../../mlb/hrFeedService";
import { mlbHrFeatureAdapter } from "./mlbFeatureAdapter";
import { BRAIN_HR_SELECTION_VERSION, selectMlbHrFeatures, type BrainSelectionMode } from "./selectionPolicy";
import { mlbStolenBaseFeatureAdapter } from "./mlbStolenBaseAdapter";
import { BRAIN_SB_SELECTION_VERSION, selectMlbStolenBaseFeatures } from "./stolenBaseSelectionPolicy";
import { mlbPitcherKFeatureAdapter, BRAIN_PITCHER_K_TARGET } from "./mlbPitcherKAdapter";
import { BRAIN_PITCHER_K_SELECTION_VERSION, selectMlbPitcherKFeatures } from "./pitcherKSelectionPolicy";
import { BRAIN_MLB_DOORS } from "./brainDoors";

export const BRAIN_HR_ENGINE_VERSION = BRAIN_HR_SELECTION_VERSION;

export type BrainPickProvenance = "ledger" | "live_selection" | "monitoring";
export type BrainPublicationStatus = "ledger_frozen" | "decision" | "monitoring" | "empty";

const MONITORING_RISK = "Monitoring only — not a frozen decision. Official freeze opens in the 4h lineup window.";

function withMonitoringRisks(risks: string[], mode: BrainSelectionMode): string[] {
  if (mode !== "monitoring") return risks.slice(0, 6);
  return [MONITORING_RISK, ...risks.filter((risk) => risk !== MONITORING_RISK)].slice(0, 6);
}

function publicationFromProvenance(provenance: BrainPickProvenance, pickCount: number): BrainPublicationStatus {
  if (!pickCount) return "empty";
  if (provenance === "ledger") return "ledger_frozen";
  if (provenance === "live_selection") return "decision";
  return "monitoring";
}

export interface BrainLedgerPick {
  id?: string;
  decisionKey: string;
  date: string;
  gameId: string;
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  rank: number;
  score: number;
  confidence: number;
  tier: string;
  evidenceQuality: "official" | "preview";
  reasons: string[];
  risks: string[];
  result: "pending" | "hit" | "miss" | "void";
}

export interface BrainPerformance {
  total: number;
  resolved: number;
  pending: number;
  hits: number;
  misses: number;
  voids: number;
  hitRate: number | null;
  sampleWarning: string | null;
}

export function resolvePitcherKOutcome(pitching: unknown, target: number): "hit" | "miss" | "void" | null {
  if (!Number.isFinite(target) || target <= 0) return null;
  const stats = pitching as { inningsPitched?: unknown; strikeOuts?: unknown } | null | undefined;
  if (!stats || Number(stats.inningsPitched ?? 0) <= 0) return "void";
  return Number(stats.strikeOuts ?? 0) >= target ? "hit" : "miss";
}

function decisionKey(date: string, eventId: string, subjectId: string): string {
  return createHash("sha256")
    .update([BRAIN_HR_ENGINE_VERSION, date, eventId, subjectId, "home_run"].join("|"))
    .digest("hex");
}

export async function snapshotDailyBrainHrPicks(date = todayISO()): Promise<void> {
  const snapshots = await mlbHrFeatureAdapter.build({ date });
  const selected = selectMlbHrFeatures(snapshots);
  if (!selected.length) return;

  const rows = selected.map(({ snapshot, score, rank }) => ({
    decision_key: decisionKey(date, snapshot.eventId, snapshot.subjectId),
    decision_date: date,
    sport: "mlb",
    market: "home_run",
    game_id: snapshot.eventId,
    player_id: snapshot.subjectId,
    player_name: snapshot.subjectLabel,
    team: snapshot.team,
    opponent: snapshot.opponent,
    engine_version: BRAIN_HR_ENGINE_VERSION,
    rank,
    score,
    confidence: Number(snapshot.features.dataConfidence ?? 0),
    tier: String(snapshot.features.riskTier ?? "Unrated"),
    evidence_quality: snapshot.eligibility === "eligible" ? "official" : "preview",
    reasons: snapshot.reasons.slice(0, 6),
    risks: [...snapshot.risks, ...snapshot.missingFeatures.map((feature) => `Missing: ${feature}`)].slice(0, 6),
    feature_snapshot: snapshot,
    source_generated_at: snapshot.observedAt,
  }));

  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from("brain_decisions").upsert(rows, {
    onConflict: "decision_key",
    ignoreDuplicates: true,
  });
  if (error) throw error;
  structuredLog({ level: "info", event: "brain.decisions.snapshotted", date, count: rows.length, engineVersion: BRAIN_HR_ENGINE_VERSION });
}

export async function snapshotDailyBrainStolenBasePicks(date = todayISO()): Promise<void> {
  const snapshots = await mlbStolenBaseFeatureAdapter.build({ date });
  const selected = selectMlbStolenBaseFeatures(snapshots);
  if (!selected.length) return;
  const rows = selected.map(({ snapshot, score, rank }) => ({
    decision_key: createHash("sha256").update([BRAIN_SB_SELECTION_VERSION, date, snapshot.eventId, snapshot.subjectId, "stolen_base"].join("|")).digest("hex"),
    decision_date: date, sport: "mlb", market: "stolen_base", game_id: snapshot.eventId,
    player_id: snapshot.subjectId, player_name: snapshot.subjectLabel, team: snapshot.team, opponent: snapshot.opponent,
    engine_version: BRAIN_SB_SELECTION_VERSION, rank, score,
    confidence: Math.max(20, Math.min(70, 70 - snapshot.missingFeatures.length * 10)),
    tier: score >= 75 ? "Strong" : "Watch",
    evidence_quality: snapshot.eligibility === "eligible" ? "official" : "preview",
    reasons: snapshot.reasons.slice(0, 6), risks: snapshot.risks.slice(0, 6), feature_snapshot: snapshot,
    source_generated_at: snapshot.observedAt,
  }));
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from("brain_decisions").upsert(rows, { onConflict: "decision_key", ignoreDuplicates: true });
  if (error) throw error;
  structuredLog({ level: "info", event: "brain.stolen_base.snapshotted", date, count: rows.length, engineVersion: BRAIN_SB_SELECTION_VERSION });
}

export async function snapshotDailyBrainPitcherKPicks(date = todayISO()): Promise<void> {
  const snapshots = await mlbPitcherKFeatureAdapter.build({ date });
  const selected = selectMlbPitcherKFeatures(snapshots);
  if (!selected.length) return;
  const rows = selected.map(({ snapshot, score, confidence, rank }) => ({
    decision_key: createHash("sha256").update([BRAIN_PITCHER_K_SELECTION_VERSION, date, snapshot.eventId, snapshot.subjectId, "pitcher_strikeouts"].join("|")).digest("hex"),
    decision_date: date, sport: "mlb", market: "pitcher_strikeouts", game_id: snapshot.eventId,
    player_id: snapshot.subjectId, player_name: snapshot.subjectLabel, team: snapshot.team, opponent: snapshot.opponent,
    engine_version: BRAIN_PITCHER_K_SELECTION_VERSION, rank, score, confidence,
    tier: score >= 75 ? "Strong" : "Watch", evidence_quality: "official",
    reasons: snapshot.reasons.slice(0, 6), risks: snapshot.risks.slice(0, 6), feature_snapshot: snapshot,
    source_generated_at: snapshot.observedAt,
  }));
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from("brain_decisions").upsert(rows, { onConflict: "decision_key", ignoreDuplicates: true });
  if (error) throw error;
  structuredLog({ level: "info", event: "brain.pitcher_k.snapshotted", date, count: rows.length, engineVersion: BRAIN_PITCHER_K_SELECTION_VERSION, statTarget: BRAIN_PITCHER_K_TARGET });
}

export async function settleBrainHrPicks(date: string): Promise<number> {
  const supabase = await getSupabaseAdmin();
  const { data: decisions, error } = await supabase
    .from("brain_decisions")
    .select("id,game_id,player_id")
    .eq("decision_date", date)
    .eq("sport", "mlb")
    .eq("market", "home_run");
  if (error) throw error;
  if (!decisions?.length) return 0;

  const [feed, games] = await Promise.all([getTodayHomeRuns(date), getScheduleByDate(date)]);
  if (feed.warnings.length) return 0;
  const finalGames = new Set(games.filter((game) => /final|game over/i.test(game.status)).map((game) => String(game.gamePk)));
  const hitters = new Set(feed.events.map((event) => `${event.gamePk}|${event.playerId}`));
  const outcomes = decisions
    .filter((decision) => finalGames.has(String(decision.game_id)))
    .map((decision) => ({
      decision_id: decision.id,
      result: hitters.has(`${decision.game_id}|${decision.player_id}`) ? "hit" : "miss",
      result_source: "MLB Stats API play-by-play",
    }));
  if (!outcomes.length) return 0;

  const settled = await supabase.from("brain_decision_outcomes").upsert(outcomes, {
    onConflict: "decision_id",
    ignoreDuplicates: true,
  });
  if (settled.error) throw settled.error;
  structuredLog({ level: "info", event: "brain.outcomes.settled", date, count: outcomes.length, source: "mlb_play_by_play" });
  return outcomes.length;
}

export async function settleBrainStolenBasePicks(date: string): Promise<number> {
  const supabase = await getSupabaseAdmin();
  const { data: decisions, error } = await supabase.from("brain_decisions")
    .select("id,game_id,player_id").eq("decision_date", date).eq("sport", "mlb").eq("market", "stolen_base");
  if (error) throw error;
  if (!decisions?.length) return 0;
  const games = await getScheduleByDate(date);
  const finalGames = games.filter((game) => /final|game over/i.test(game.status));
  const stolenBaseRunners = new Set<string>();
  await Promise.all(finalGames.map(async (game) => {
    const feed = await getGameFeed(game.gamePk);
    for (const play of feed?.liveData?.plays?.allPlays ?? []) {
      for (const runner of play?.runners ?? []) {
        const eventType = String(runner?.details?.eventType ?? "");
        const playerId = runner?.details?.runner?.id;
        if (/stolen_base/i.test(eventType) && playerId) stolenBaseRunners.add(`${game.gamePk}|${playerId}`);
      }
    }
  }));
  const finalIds = new Set(finalGames.map((game) => String(game.gamePk)));
  const outcomes = decisions.filter((decision) => finalIds.has(String(decision.game_id))).map((decision) => ({
    decision_id: decision.id,
    result: stolenBaseRunners.has(`${decision.game_id}|${decision.player_id}`) ? "hit" : "miss",
    result_source: "MLB Stats API game feed runner events",
  }));
  if (!outcomes.length) return 0;
  const settled = await supabase.from("brain_decision_outcomes").upsert(outcomes, { onConflict: "decision_id", ignoreDuplicates: true });
  if (settled.error) throw settled.error;
  structuredLog({ level: "info", event: "brain.stolen_base.settled", date, count: outcomes.length, source: "mlb_game_feed" });
  return outcomes.length;
}

export async function settleBrainPitcherKPicks(date: string): Promise<number> {
  const supabase = await getSupabaseAdmin();
  const { data: decisions, error } = await supabase.from("brain_decisions")
    .select("id,game_id,player_id,feature_snapshot").eq("decision_date", date).eq("sport", "mlb").eq("market", "pitcher_strikeouts");
  if (error) throw error;
  if (!decisions?.length) return 0;
  const games = (await getScheduleByDate(date)).filter((game) => /final|game over/i.test(game.status));
  const outcomes: Array<{ decision_id: string; result: "hit" | "miss" | "void"; result_source: string }> = [];
  await Promise.all(games.map(async (game) => {
    const feed = await getGameFeed(game.gamePk);
    for (const decision of decisions.filter((item) => String(item.game_id) === String(game.gamePk))) {
      const pitching = feed?.liveData?.boxscore?.players?.[`ID${decision.player_id}`]?.stats?.pitching;
      const target = Number(decision.feature_snapshot?.features?.statTarget);
      const result = resolvePitcherKOutcome(pitching, target);
      if (!result) continue;
      outcomes.push({
        decision_id: decision.id,
        result,
        result_source: result === "void" ? "MLB Stats API final boxscore: listed pitcher did not appear" : "MLB Stats API final boxscore pitching strikeouts",
      });
    }
  }));
  if (!outcomes.length) return 0;
  const settled = await supabase.from("brain_decision_outcomes").upsert(outcomes, { onConflict: "decision_id", ignoreDuplicates: true });
  if (settled.error) throw settled.error;
  structuredLog({ level: "info", event: "brain.pitcher_k.settled", date, count: outcomes.length, source: "mlb_final_boxscore" });
  return outcomes.length;
}

export async function getBrainHrLedger(limit = 100, date?: string): Promise<{ picks: BrainLedgerPick[]; performance: BrainPerformance }> {
  return getBrainLedgerByMarket("home_run", limit, date);
}

export async function getBrainStolenBaseLedger(limit = 100, date?: string): Promise<{ picks: BrainLedgerPick[]; performance: BrainPerformance }> {
  return getBrainLedgerByMarket("stolen_base", limit, date);
}

export async function getBrainPitcherKLedger(limit = 100, date?: string): Promise<{ picks: BrainLedgerPick[]; performance: BrainPerformance }> {
  return getBrainLedgerByMarket("pitcher_strikeouts", limit, date);
}

function pendingPerformance(picks: BrainLedgerPick[], mode: "decision" | "monitoring" = "decision"): BrainPerformance {
  return {
    total: picks.length,
    resolved: 0,
    pending: picks.length,
    hits: 0,
    misses: 0,
    voids: 0,
    hitRate: null,
    sampleWarning: !picks.length
      ? null
      : mode === "monitoring"
        ? "Monitoring slate — not frozen; will not settle as ledger decisions."
        : "Live selection — outcomes settle after final MLB results.",
  };
}

/** Live HR selection from sport adapters (no DB required). */
export async function buildLiveBrainHrPicks(
  date = todayISO(),
  options: { mode?: BrainSelectionMode } = {},
): Promise<BrainLedgerPick[]> {
  const mode = options.mode ?? "decision";
  const snapshots = await mlbHrFeatureAdapter.build({ date });
  return selectMlbHrFeatures(snapshots, new Date(), { mode }).map(({ snapshot, score, rank }) => ({
    decisionKey: decisionKey(date, snapshot.eventId, snapshot.subjectId),
    date,
    gameId: snapshot.eventId,
    playerId: snapshot.subjectId,
    playerName: snapshot.subjectLabel,
    team: snapshot.team,
    opponent: snapshot.opponent,
    rank,
    score,
    confidence: Number(snapshot.features.dataConfidence ?? 0),
    tier: String(snapshot.features.riskTier ?? "Unrated"),
    evidenceQuality: snapshot.eligibility === "eligible" ? "official" : "preview",
    reasons: snapshot.reasons.slice(0, 6),
    risks: withMonitoringRisks(
      [...snapshot.risks, ...snapshot.missingFeatures.map((feature) => `Missing: ${feature}`)],
      mode,
    ),
    result: "pending",
  }));
}

/** Live stolen-base selection from sport adapters (no DB required). */
export async function buildLiveBrainStolenBasePicks(
  date = todayISO(),
  options: { mode?: BrainSelectionMode } = {},
): Promise<BrainLedgerPick[]> {
  const mode = options.mode ?? "decision";
  const snapshots = await mlbStolenBaseFeatureAdapter.build({ date });
  return selectMlbStolenBaseFeatures(snapshots, new Date(), { mode }).map(({ snapshot, score, rank }) => ({
    decisionKey: createHash("sha256")
      .update([BRAIN_SB_SELECTION_VERSION, date, snapshot.eventId, snapshot.subjectId, "stolen_base"].join("|"))
      .digest("hex"),
    date,
    gameId: snapshot.eventId,
    playerId: snapshot.subjectId,
    playerName: snapshot.subjectLabel,
    team: snapshot.team,
    opponent: snapshot.opponent,
    rank,
    score,
    confidence: Math.max(20, Math.min(70, 70 - snapshot.missingFeatures.length * 10)),
    tier: score >= 75 ? "Strong" : "Watch",
    evidenceQuality: snapshot.eligibility === "eligible" ? "official" : "preview",
    reasons: snapshot.reasons.slice(0, 6),
    risks: withMonitoringRisks(snapshot.risks, mode),
    result: "pending",
  }));
}

/** Live pitcher-K selection from sport adapters (no DB required). */
export async function buildLiveBrainPitcherKPicks(
  date = todayISO(),
  options: { mode?: BrainSelectionMode } = {},
): Promise<BrainLedgerPick[]> {
  const mode = options.mode ?? "decision";
  const snapshots = await mlbPitcherKFeatureAdapter.build({ date });
  return selectMlbPitcherKFeatures(snapshots, new Date(), { mode }).map(({ snapshot, score, confidence, rank }) => ({
    decisionKey: createHash("sha256")
      .update([BRAIN_PITCHER_K_SELECTION_VERSION, date, snapshot.eventId, snapshot.subjectId, "pitcher_strikeouts"].join("|"))
      .digest("hex"),
    date,
    gameId: snapshot.eventId,
    playerId: snapshot.subjectId,
    playerName: snapshot.subjectLabel,
    team: snapshot.team,
    opponent: snapshot.opponent,
    rank,
    score,
    confidence,
    tier: score >= 75 ? "Strong" : "Watch",
    evidenceQuality: "official",
    reasons: snapshot.reasons.slice(0, 6),
    risks: withMonitoringRisks(snapshot.risks, mode),
    result: "pending",
  }));
}

async function resolveLiveMarketPicks(
  date: string,
  builder: (date: string, options?: { mode?: BrainSelectionMode }) => Promise<BrainLedgerPick[]>,
): Promise<{ picks: BrainLedgerPick[]; provenance: BrainPickProvenance }> {
  const decision = await builder(date, { mode: "decision" });
  if (decision.length) return { picks: decision, provenance: "live_selection" };
  const monitoring = await builder(date, { mode: "monitoring" });
  if (monitoring.length) return { picks: monitoring, provenance: "monitoring" };
  return { picks: [], provenance: "live_selection" };
}

/**
 * Best-effort freeze of live selections into the immutable ledger.
 * Never blocks the picks response — ledger write failures stay degraded.
 */
async function softFreezeLiveSelections(
  date: string,
  markets: { home_run: boolean; stolen_base: boolean; pitcher_strikeouts: boolean },
): Promise<void> {
  const jobs: Array<Promise<void>> = [];
  if (markets.home_run) jobs.push(snapshotDailyBrainHrPicks(date));
  if (markets.stolen_base) jobs.push(snapshotDailyBrainStolenBasePicks(date));
  if (markets.pitcher_strikeouts) jobs.push(snapshotDailyBrainPitcherKPicks(date));
  if (!jobs.length) return;
  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") {
      structuredLog({
        level: "warn",
        event: "brain.live_selection.soft_freeze_failed",
        date,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }
}

/**
 * Brain Picks page source of truth: MLB-door adapters → selection → ledger/live.
 * Prefers frozen ledger rows when they exist for the date; otherwise computes
 * freeze-eligible decisions and soft-freezes them. Outside the 4h window,
 * returns a labeled monitoring slate that is never written to the ledger.
 */
export async function getBrainMlbPicksForDate(date = todayISO(), limit = 20): Promise<{
  picks: BrainLedgerPick[];
  performance: BrainPerformance;
  stolenBase: { picks: BrainLedgerPick[]; performance: BrainPerformance };
  pitcherStrikeouts: { picks: BrainLedgerPick[]; performance: BrainPerformance };
  provenance: {
    home_run: BrainPickProvenance;
    stolen_base: BrainPickProvenance;
    pitcher_strikeouts: BrainPickProvenance;
  };
  publicationStatus: {
    home_run: BrainPublicationStatus;
    stolen_base: BrainPublicationStatus;
    pitcher_strikeouts: BrainPublicationStatus;
  };
  engineVersions: {
    home_run: string;
    stolen_base: string;
    pitcher_strikeouts: string;
  };
  doors: typeof BRAIN_MLB_DOORS;
}> {
  const capped = Math.max(1, Math.min(limit, 250));

  const [hrLedger, sbLedger, kLedger] = await Promise.all([
    getBrainHrLedger(capped, date).catch(() => null),
    getBrainStolenBaseLedger(capped, date).catch(() => null),
    getBrainPitcherKLedger(capped, date).catch(() => null),
  ]);

  const needHr = !hrLedger?.picks.length;
  const needSb = !sbLedger?.picks.length;
  const needK = !kLedger?.picks.length;

  const [hrResolved, sbResolved, kResolved] = await Promise.all([
    needHr
      ? resolveLiveMarketPicks(date, buildLiveBrainHrPicks)
      : Promise.resolve({ picks: hrLedger!.picks, provenance: "ledger" as const }),
    needSb
      ? resolveLiveMarketPicks(date, buildLiveBrainStolenBasePicks)
      : Promise.resolve({ picks: sbLedger!.picks, provenance: "ledger" as const }),
    needK
      ? resolveLiveMarketPicks(date, buildLiveBrainPitcherKPicks)
      : Promise.resolve({ picks: kLedger!.picks, provenance: "ledger" as const }),
  ]);

  const hrPicks = hrResolved.picks.slice(0, capped);
  const sbPicks = sbResolved.picks.slice(0, capped);
  const kPicks = kResolved.picks.slice(0, capped);

  // Soft-freeze only freeze-eligible decisions — never monitoring slates.
  if (
    (hrResolved.provenance === "live_selection" && hrPicks.length) ||
    (sbResolved.provenance === "live_selection" && sbPicks.length) ||
    (kResolved.provenance === "live_selection" && kPicks.length)
  ) {
    void softFreezeLiveSelections(date, {
      home_run: hrResolved.provenance === "live_selection" && hrPicks.length > 0,
      stolen_base: sbResolved.provenance === "live_selection" && sbPicks.length > 0,
      pitcher_strikeouts: kResolved.provenance === "live_selection" && kPicks.length > 0,
    });
  }

  const provenance = {
    home_run: hrResolved.provenance,
    stolen_base: sbResolved.provenance,
    pitcher_strikeouts: kResolved.provenance,
  };

  return {
    picks: hrPicks,
    performance: needHr
      ? pendingPerformance(hrPicks, provenance.home_run === "monitoring" ? "monitoring" : "decision")
      : hrLedger!.performance,
    stolenBase: {
      picks: sbPicks,
      performance: needSb
        ? pendingPerformance(sbPicks, provenance.stolen_base === "monitoring" ? "monitoring" : "decision")
        : sbLedger!.performance,
    },
    pitcherStrikeouts: {
      picks: kPicks,
      performance: needK
        ? pendingPerformance(kPicks, provenance.pitcher_strikeouts === "monitoring" ? "monitoring" : "decision")
        : kLedger!.performance,
    },
    provenance,
    publicationStatus: {
      home_run: publicationFromProvenance(provenance.home_run, hrPicks.length),
      stolen_base: publicationFromProvenance(provenance.stolen_base, sbPicks.length),
      pitcher_strikeouts: publicationFromProvenance(provenance.pitcher_strikeouts, kPicks.length),
    },
    engineVersions: {
      home_run: BRAIN_HR_ENGINE_VERSION,
      stolen_base: BRAIN_SB_SELECTION_VERSION,
      pitcher_strikeouts: BRAIN_PITCHER_K_SELECTION_VERSION,
    },
    doors: BRAIN_MLB_DOORS,
  };
}

async function getBrainLedgerByMarket(market: "home_run" | "stolen_base" | "pitcher_strikeouts", limit = 100, date?: string): Promise<{ picks: BrainLedgerPick[]; performance: BrainPerformance }> {
  const supabase = await getSupabaseAdmin();
  let query = supabase
    .from("brain_decisions")
    .select("id,decision_key,decision_date,game_id,player_id,player_name,team,opponent,rank,score,confidence,tier,evidence_quality,reasons,risks,brain_decision_outcomes(result)")
    .eq("sport", "mlb")
    .eq("market", market)
    .order("decision_date", { ascending: false })
    .order("rank", { ascending: true });
  if (date) query = query.eq("decision_date", date);
  const { data, error } = await query.limit(Math.max(1, Math.min(limit, 250)));
  if (error) throw error;

  const picks: BrainLedgerPick[] = (data ?? []).map((row: any) => ({
    id: row.id,
    decisionKey: row.decision_key,
    date: row.decision_date,
    gameId: row.game_id,
    playerId: row.player_id,
    playerName: row.player_name,
    team: row.team,
    opponent: row.opponent,
    rank: row.rank,
    score: row.score,
    confidence: row.confidence,
    tier: row.tier,
    evidenceQuality: row.evidence_quality,
    reasons: Array.isArray(row.reasons) ? row.reasons : [],
    risks: Array.isArray(row.risks) ? row.risks : [],
    result: row.brain_decision_outcomes?.[0]?.result ?? "pending",
  }));
  const hits = picks.filter((pick) => pick.result === "hit").length;
  const misses = picks.filter((pick) => pick.result === "miss").length;
  const voids = picks.filter((pick) => pick.result === "void").length;
  const resolved = hits + misses;
  return {
    picks,
    performance: {
      total: picks.length,
      resolved,
      pending: picks.length - resolved - voids,
      hits,
      misses,
      voids,
      hitRate: resolved ? Math.round((hits / resolved) * 1000) / 10 : null,
      sampleWarning: resolved < 30 ? "Small sample: fewer than 30 resolved picks." : null,
    },
  };
}
