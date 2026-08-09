import { getCachedValidatedHrBoard } from "../hubs/hrBoardHub";
import { mlbPitcherKFeatureAdapter } from "../intelligence/centralBrain/mlbPitcherKAdapter";
import { mlbStolenBaseFeatureAdapter } from "../intelligence/centralBrain/mlbStolenBaseAdapter";
import {
  calculateHrSusceptibility,
  calculatePitcherKDelta,
  calculateSbTimingMismatch,
  isHighHrSusceptibility,
  isHighSbEdge,
  pitcherKStatus,
  projectPitcherStrikeouts,
  sortMarketEdges,
} from "./math";
import { fetchMarketRadarOdds } from "./oddsProvider";
import type {
  HomeRunSignal,
  MarketRadarEdge,
  MarketRadarMarket,
  MarketRadarProviderResult,
  MarketRadarQuote,
  MarketRadarResponse,
  PitcherKSignal,
  StolenBaseSignal,
} from "./types";

export type MarketRadarSignalSource = {
  pitcherKs(date: string): Promise<PitcherKSignal[]>;
  homeRuns(date: string): Promise<HomeRunSignal[]>;
  stolenBases(date: string): Promise<StolenBaseSignal[]>;
};

export type MarketRadarDependencies = {
  fetchOdds(date: string): Promise<MarketRadarProviderResult>;
  signals: MarketRadarSignalSource;
  now(): Date;
};

const MARKET_KEYS: MarketRadarMarket[] = [
  "pitcher_strikeouts",
  "batter_home_runs",
  "batter_stolen_bases",
  "batter_hits",
  "batter_total_bases",
  "batter_walks",
];

function numeric(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeMarketRadarSubject(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function matchingQuotes(quotes: readonly MarketRadarQuote[], subject: string, market: MarketRadarMarket) {
  const key = normalizeMarketRadarSubject(subject);
  return quotes.filter((quote) => quote.market === market && normalizeMarketRadarSubject(quote.subject) === key);
}

function bestPrice(quotes: readonly MarketRadarQuote[], side: MarketRadarQuote["side"]) {
  return quotes.filter((quote) => quote.side === side).sort((a, b) => b.price.decimal - a.price.decimal)[0] ?? null;
}

function bestProbabilityPrice(quotes: readonly MarketRadarQuote[], modelProbability: number) {
  const groups = new Map<string, MarketRadarQuote[]>();
  for (const quote of quotes) {
    const key = `${quote.side}:${quote.point ?? "none"}`;
    groups.set(key, [...(groups.get(key) ?? []), quote]);
  }
  return [...groups.values()].map((group) => {
    const quote = [...group].sort((a, b) => b.price.decimal - a.price.decimal)[0];
    const marketImpliedProbability = group.reduce((sum, item) => sum + item.price.impliedProbability, 0) / group.length;
    const probability = quote.side === "under" || quote.side === "no" ? 1 - modelProbability : modelProbability;
    return { quote, marketImpliedProbability, delta: probability - marketImpliedProbability };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.quote.price.decimal - a.quote.price.decimal)[0] ?? null;
}

function consensusLine(quotes: readonly MarketRadarQuote[]): number | null {
  const lines = quotes.map((quote) => quote.point).filter((line): line is number => line != null).sort((a, b) => a - b);
  if (lines.length === 0) return null;
  const counts = new Map<number, number>();
  for (const line of lines) counts.set(line, (counts.get(line) ?? 0) + 1);
  const highestCount = Math.max(...counts.values());
  const modes = [...counts].filter(([, count]) => count === highestCount).map(([line]) => line).sort((a, b) => a - b);
  return modes[Math.floor((modes.length - 1) / 2)];
}

function edgeId(parts: Array<string | number | null>) {
  return parts.map((part) => String(part ?? "none").toLowerCase().replace(/[^a-z0-9]+/g, "-")).join(":");
}

function buildPitcherKEdges(signals: readonly PitcherKSignal[], quotes: readonly MarketRadarQuote[]): MarketRadarEdge[] {
  return signals.flatMap((signal): MarketRadarEdge[] => {
    if (signal.pitcherCswPercent == null || signal.opponentWhiffPercent == null || signal.projectedBattersFaced == null) return [];
    const projection = projectPitcherStrikeouts(signal);
    const subjectQuotes = matchingQuotes(quotes, signal.subject, "pitcher_strikeouts");
    const line = consensusLine(subjectQuotes);
    if (line == null) return [];
    return [line].flatMap((line): MarketRadarEdge[] => {
      const delta = calculatePitcherKDelta(projection, line);
      const status = pitcherKStatus(delta);
      const direction = delta >= 0 ? "over" : "under";
      const quote = bestPrice(subjectQuotes.filter((item) => item.point === line), direction);
      if (!quote) return [];
      return [{
        id: edgeId(["k", signal.subjectId, line, quote.bookmakerKey]), eventId: quote.eventId,
        market: "pitcher_strikeouts", subjectId: signal.subjectId, subject: signal.subject,
        team: signal.team, opponent: signal.opponent, direction, line, modelValue: projection,
        marketImpliedProbability: subjectQuotes.filter((item) => item.point === line && item.side === direction)
          .reduce((sum, item, _, all) => sum + item.price.impliedProbability / all.length, 0),
        modelProbability: null, delta,
        edgeScore: delta, status, bookmaker: quote.bookmaker, price: quote.price,
        metrics: { pitcherCswPercent: signal.pitcherCswPercent, opponentWhiffPercent: signal.opponentWhiffPercent, projectedBattersFaced: signal.projectedBattersFaced },
        warnings: [],
      }];
    });
  });
}

function buildHomeRunEdges(signals: readonly HomeRunSignal[], quotes: readonly MarketRadarQuote[]): MarketRadarEdge[] {
  return signals.flatMap((signal): MarketRadarEdge[] => {
    if (!signal.lineupConfirmed) return [];
    const comparable = matchingQuotes(quotes, signal.subject, "batter_home_runs")
      .filter((quote) => quote.point === 0.5 || quote.point == null);
    const selection = bestProbabilityPrice(comparable, signal.modelProbability);
    if (!selection) return [];
    const { quote, delta, marketImpliedProbability } = selection;
    const hasSusceptibility = signal.pitcherFlyBallPercent != null
      && signal.pitcherBarrelAllowedPercent != null && signal.parkFactorHr != null;
    const susceptibility = hasSusceptibility ? calculateHrSusceptibility({
      pitcherFlyBallPercent: signal.pitcherFlyBallPercent!,
      pitcherBarrelAllowedPercent: signal.pitcherBarrelAllowedPercent!,
      parkFactorHr: signal.parkFactorHr!,
    }) : null;
    const highlighted = susceptibility != null
      && isHighHrSusceptibility(susceptibility, signal.pitcherBarrelAllowedPercent!);
    return [{
      id: edgeId(["hr", signal.subjectId, quote.point, quote.bookmakerKey]), eventId: quote.eventId,
      market: "batter_home_runs", subjectId: signal.subjectId, subject: signal.subject,
      team: signal.team, opponent: signal.opponent, direction: quote.side, line: quote.point,
      modelValue: signal.modelProbability, marketImpliedProbability,
      modelProbability: signal.modelProbability, delta: Math.round(delta * 10_000) / 10_000,
      edgeScore: Math.round(delta * 10_000) / 100, status: delta > 0 ? "VALUE" : "NO EDGE / MONITOR",
      bookmaker: quote.bookmaker, price: quote.price,
      metrics: { hrSusceptibility: susceptibility, highSusceptibility: highlighted ? 1 : 0 },
      warnings: hasSusceptibility ? [] : ["Pitcher fly-ball and barrel-allowed inputs are unavailable."],
    }];
  });
}

function buildStolenBaseEdges(signals: readonly StolenBaseSignal[], quotes: readonly MarketRadarQuote[]): MarketRadarEdge[] {
  return signals.flatMap((signal): MarketRadarEdge[] => {
    if (!signal.lineupConfirmed || signal.runnerSprintSpeedFtSec == null || signal.catcherPopTime == null) return [];
    const selection = bestProbabilityPrice(
      matchingQuotes(quotes, signal.subject, "batter_stolen_bases").filter((quote) => quote.point === 0.5 || quote.point == null),
      signal.modelProbability,
    );
    if (!selection) return [];
    const { quote, delta, marketImpliedProbability } = selection;
    const timing = calculateSbTimingMismatch({ runnerSprintSpeedFtSec: signal.runnerSprintSpeedFtSec, catcherPopTime: signal.catcherPopTime });
    return [{
      id: edgeId(["sb", signal.subjectId, quote.point, quote.bookmakerKey]), eventId: quote.eventId,
      market: "batter_stolen_bases", subjectId: signal.subjectId, subject: signal.subject,
      team: signal.team, opponent: signal.opponent, direction: quote.side, line: quote.point,
      modelValue: signal.modelProbability, marketImpliedProbability,
      modelProbability: signal.modelProbability, delta: Math.round(delta * 10_000) / 10_000,
      edgeScore: Math.round(delta * 10_000) / 100,
      status: isHighSbEdge(timing) ? "HIGH SB EDGE" : "NO EDGE / MONITOR",
      bookmaker: quote.bookmaker, price: quote.price,
      metrics: { timingMismatchSeconds: timing, runnerSprintSpeedFtSec: signal.runnerSprintSpeedFtSec, catcherPopTime: signal.catcherPopTime },
      warnings: [],
    }];
  });
}

const defaultSignalSource: MarketRadarSignalSource = {
  async pitcherKs(date) {
    const snapshots = await mlbPitcherKFeatureAdapter.build({ date });
    return snapshots.map((snapshot) => ({
      eventId: snapshot.eventId, subjectId: snapshot.subjectId, subject: snapshot.subjectLabel,
      team: snapshot.team, opponent: snapshot.opponent, quality: snapshot.quality,
      pitcherCswPercent: null, opponentWhiffPercent: null, projectedBattersFaced: null,
    }));
  },
  async homeRuns(date) {
    const board = await getCachedValidatedHrBoard(date);
    return [...board.candidates, ...board.projectedCandidates].flatMap((candidate): HomeRunSignal[] => {
      const modelProbability = numeric(candidate.estimatedHrProbability);
      if (modelProbability == null) return [];
      return [{
        eventId: String(candidate.gamePk), subjectId: String(candidate.playerId), subject: candidate.playerName,
        team: candidate.teamAbbrev || candidate.team, opponent: candidate.opponent,
        quality: candidate.dataQuality === "full" || candidate.dataQuality === "partial" ? candidate.dataQuality : "limited",
        lineupConfirmed: candidate.lineupStatus === "confirmed", modelProbability,
        pitcherFlyBallPercent: null, pitcherBarrelAllowedPercent: null,
        parkFactorHr: numeric(candidate.parkFactor),
      }];
    });
  },
  async stolenBases(date) {
    const snapshots = await mlbStolenBaseFeatureAdapter.build({ date });
    return snapshots.flatMap((snapshot): StolenBaseSignal[] => {
      const modelProbability = numeric(snapshot.features.estimatedStolenBaseProbability);
      if (modelProbability == null) return [];
      return [{
        eventId: snapshot.eventId, subjectId: snapshot.subjectId, subject: snapshot.subjectLabel,
        team: snapshot.team, opponent: snapshot.opponent, quality: snapshot.quality,
        lineupConfirmed: snapshot.features.lineupConfirmed === true, modelProbability,
        runnerSprintSpeedFtSec: numeric(snapshot.features.sprintSpeed), catcherPopTime: numeric(snapshot.features.catcherPopTime),
      }];
    });
  },
};

const defaultDependencies: MarketRadarDependencies = {
  fetchOdds: fetchMarketRadarOdds, signals: defaultSignalSource, now: () => new Date(),
};

function emptyCounts(): Record<MarketRadarMarket, number> {
  return Object.fromEntries(MARKET_KEYS.map((market) => [market, 0])) as Record<MarketRadarMarket, number>;
}

export async function getMarketRadar(date: string, dependencies: MarketRadarDependencies = defaultDependencies): Promise<MarketRadarResponse> {
  const provider = await dependencies.fetchOdds(date);
  const providerSummary = { id: "odds_api" as const, status: "live" as const, eventCount: provider.events, quoteCount: provider.quotes.length, quota: provider.quota };
  if (provider.events === 0 || provider.quotes.length === 0) {
    return {
      date, generatedAt: dependencies.now().toISOString(), provider: providerSummary, edges: [], counts: emptyCounts(),
      warnings: [provider.events === 0 ? "The provider returned no MLB events for this date." : "The provider returned no supported player-prop prices for this slate."],
    };
  }
  const [pitcherKs, homeRuns, stolenBases] = await Promise.all([
    dependencies.signals.pitcherKs(date), dependencies.signals.homeRuns(date), dependencies.signals.stolenBases(date),
  ]);
  const edges = sortMarketEdges([
    ...buildPitcherKEdges(pitcherKs, provider.quotes),
    ...buildHomeRunEdges(homeRuns, provider.quotes),
    ...buildStolenBaseEdges(stolenBases, provider.quotes),
  ]);
  const counts = emptyCounts();
  for (const edge of edges) counts[edge.market] += 1;
  return {
    date, generatedAt: dependencies.now().toISOString(), provider: providerSummary, edges, counts,
    warnings: edges.length === 0 ? ["Live prices were returned, but no sportsbook subject had every required verified model input."] : [],
  };
}
