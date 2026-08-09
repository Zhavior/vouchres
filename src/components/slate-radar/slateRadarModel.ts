import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import type { DailyMlbReport, DataQuality } from '../../types/mlb';
import type { MarketRadarEdge, MarketRadarResponse } from '../../types/marketRadar';

export type SlateMarketId = 'home_runs' | 'pitcher_ks' | 'stolen_bases' | 'hits';
export type SlateMarketVerdict = 'research' | 'selective' | 'monitor' | 'avoid';

export interface SlateMarketRadar {
  id: SlateMarketId;
  label: string;
  shortLabel: string;
  score: number;
  confidence: number;
  verdict: SlateMarketVerdict;
  edgeLabel: string;
  detail: string;
  drivers: SlateRadarDriver[];
  marketEdges: SlateMarketEdge[];
  physicalSplits: SlatePhysicalSplit[];
  cautions: string[];
  nextSection: string;
}

export interface SlateRadarDriver {
  id: string;
  label: string;
  value: string;
  score: number;
}

export interface SlateMarketEdge {
  id: string;
  subject: string;
  bookLine: string;
  modelProjection: string;
  deltaLabel: string;
  direction: 'over' | 'under' | 'value' | 'awaiting';
  detail: string;
  modelValue?: number;
  marketValue?: number;
  scaleMax?: number;
  edgePoints?: number;
  valueUnit?: '%' | 'Ks';
  verifiedComparison?: boolean;
  addable?: boolean;
  candidate?: {
    stableId: string;
    playerId: string | number | null;
    playerName: string;
    team: string;
    opponent: string;
    headshotUrl: string | null;
    gamePk: string | number | null;
    bookOdds: number | null;
    truthStatus: HrWatchRow['truthStatus'];
    primaryReason: string | null;
    primaryRisk: string | null;
  };
}

export interface SlatePhysicalSplit {
  id: string;
  label: string;
  leftLabel: string;
  leftValue: string;
  leftScore: number | null;
  rightLabel: string;
  rightValue: string;
  rightScore: number | null;
  verdict: string;
}

export interface SlateRadarSummary {
  dateLabel: string;
  slateState: 'loading' | 'unavailable' | 'no-slate' | 'pregame' | 'live' | 'postgame';
  topMarket: SlateMarketRadar | null;
  markets: SlateMarketRadar[];
  methodNotes: string[];
  dataWarnings: string[];
  provider: {
    status: 'loading' | 'live' | 'error';
    eventCount: number | null;
    quoteCount: number | null;
    message: string;
  };
}

interface BuildSlateRadarInput {
  report: DailyMlbReport | null;
  hrRows: readonly HrWatchRow[];
  loading: boolean;
  hasError: boolean;
  marketRadar?: MarketRadarResponse | null;
  marketRadarLoading?: boolean;
  marketRadarError?: string | null;
}

const LIVE_STATUS = /live|in progress|manager challenge|delayed/i;
const FINAL_STATUS = /final|game over|completed/i;

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(clamp(value));
}

function average(values: readonly number[]) {
  const clean = values.filter(Number.isFinite);
  if (clean.length === 0) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function share(part: number, whole: number) {
  if (whole <= 0) return 0;
  return clamp(part / whole, 0, 1);
}

function pct(value: number) {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function dataQualityMultiplier(quality: DataQuality | undefined) {
  if (quality === 'full') return 1;
  if (quality === 'partial') return 0.82;
  return 0.62;
}

function marketVerdict(score: number, confidence: number): SlateMarketVerdict {
  if (confidence < 42) return 'monitor';
  if (score >= 78 && confidence >= 68) return 'research';
  if (score >= 62) return 'selective';
  if (score < 42) return 'avoid';
  return 'monitor';
}

function verdictLabel(verdict: SlateMarketVerdict) {
  if (verdict === 'research') return 'Best research lane';
  if (verdict === 'selective') return 'Selective only';
  if (verdict === 'avoid') return 'Pass for now';
  return 'Monitor';
}

function scoreDriver(id: string, label: string, value: string, score: number): SlateRadarDriver {
  return { id, label, value, score: round(score) };
}

function formatProbability(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return `${(value * 100).toFixed(1)}%`;
}

function normalizedName(value: string) {
  return value.toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function serverMarketEdge(edge: MarketRadarEdge, rows: readonly HrWatchRow[]): SlateMarketEdge {
  const probabilityMarket = edge.modelProbability != null;
  const deltaValue = probabilityMarket ? edge.delta * 100 : edge.delta;
  const row = rows.find((candidate) => normalizedName(candidate.playerName) === normalizedName(edge.subject));
  const direction = edge.status === 'TARGET UNDER' || edge.direction === 'under' || edge.direction === 'no'
    ? 'under'
    : edge.status === 'NO EDGE / MONITOR' ? 'awaiting' : edge.market === 'batter_home_runs' ? 'value' : 'over';
  return {
    id: edge.id,
    subject: edge.subject,
    bookLine: `${edge.direction.toUpperCase()} ${edge.line ?? 0.5} · ${edge.price.american > 0 ? '+' : ''}${edge.price.american} · ${edge.bookmaker}`,
    modelProjection: probabilityMarket ? `${(edge.modelValue * 100).toFixed(1)}%` : `${edge.modelValue.toFixed(1)} Ks`,
    deltaLabel: `${deltaValue >= 0 ? '+' : ''}${deltaValue.toFixed(1)} ${probabilityMarket ? 'pts' : 'Ks'}`,
    direction,
    detail: `${edge.status}. ${edge.warnings[0] ?? 'All required comparison inputs are present.'}`,
    modelValue: probabilityMarket ? edge.modelValue * 100 : edge.modelValue,
    marketValue: probabilityMarket ? edge.marketImpliedProbability * 100 : edge.line ?? undefined,
    scaleMax: probabilityMarket ? 50 : 15,
    edgePoints: deltaValue,
    valueUnit: probabilityMarket ? '%' : 'Ks',
    verifiedComparison: true,
    addable: edge.status === 'VALUE' || edge.status === 'TARGET OVER' || edge.status === 'TARGET UNDER' || edge.status === 'HIGH SB EDGE',
    candidate: row ? {
      stableId: row.stableId, playerId: row.playerId, playerName: row.playerName, team: row.team,
      opponent: row.opponent, headshotUrl: row.headshotUrl, gamePk: row.gamePk,
      bookOdds: edge.price.american, truthStatus: 'official',
      primaryReason: row.reasons[0] ?? null, primaryRisk: edge.warnings[0] ?? row.warnings[0] ?? null,
    } : undefined,
  };
}

function mergeLiveEdges(markets: SlateMarketRadar[], radar: MarketRadarResponse | null | undefined, rows: readonly HrWatchRow[]) {
  if (!radar) return markets;
  const marketMap: Partial<Record<SlateMarketId, MarketRadarEdge['market'][]>> = {
    home_runs: ['batter_home_runs'], pitcher_ks: ['pitcher_strikeouts'], stolen_bases: ['batter_stolen_bases'],
    hits: ['batter_hits', 'batter_total_bases'],
  };
  return markets.map((market) => {
    const keys = marketMap[market.id] ?? [];
    const liveEdges = radar.edges.filter((edge) => keys.includes(edge.market)).map((edge) => serverMarketEdge(edge, rows));
    if (liveEdges.length === 0) return market;
    return {
      ...market,
      marketEdges: liveEdges,
      verdict: 'research' as const,
      edgeLabel: 'Verified model vs book',
      detail: `${liveEdges.length} server-verified comparison${liveEdges.length === 1 ? '' : 's'} with a current sportsbook price.`,
    };
  });
}

function buildHrMarketEdges(rows: readonly HrWatchRow[]): SlateMarketEdge[] {
  const edges = rows
    .filter((row) => typeof row.hrProbability === 'number' && typeof row.impliedProbability === 'number')
    .map((row) => {
      const model = row.hrProbability ?? 0;
      const implied = row.impliedProbability ?? 0;
      const delta = model - implied;
      return {
        row,
        delta,
      };
    })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  if (edges.length === 0) {
    return [{
      id: 'hr-awaiting-lines',
      subject: 'HR market',
      bookLine: 'Awaiting sportsbook lines',
      modelProjection: 'Model probability available only when player feed includes it',
      deltaLabel: 'No EV delta',
      direction: 'awaiting',
      detail: 'The radar will not claim a home-run betting edge without a book-implied probability or usable price.',
    }];
  }

  return edges.map(({ row, delta }) => ({
    id: `hr-edge-${row.stableId}`,
    subject: row.playerName,
    bookLine: `${row.oddsLabel} · ${formatProbability(row.impliedProbability) ?? 'market ?'}`,
    modelProjection: formatProbability(row.hrProbability) ?? 'model ?',
    deltaLabel: `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`,
    direction: delta >= 0 ? 'value' : 'under',
    modelValue: (row.hrProbability ?? 0) * 100,
    marketValue: (row.impliedProbability ?? 0) * 100,
    scaleMax: 50,
    edgePoints: delta * 100,
    verifiedComparison: row.truthStatus === 'official'
      && typeof row.bookOdds === 'number'
      && Number.isFinite(row.bookOdds),
    addable: row.truthStatus === 'official'
      && typeof row.bookOdds === 'number'
      && Number.isFinite(row.bookOdds)
      && delta > 0,
    candidate: {
      stableId: row.stableId,
      playerId: row.playerId,
      playerName: row.playerName,
      team: row.team,
      opponent: row.opponent,
      headshotUrl: row.headshotUrl,
      gamePk: row.gamePk,
      bookOdds: row.bookOdds ?? null,
      truthStatus: row.truthStatus,
      primaryReason: row.reasons[0] ?? null,
      primaryRisk: row.warnings[0] ?? null,
    },
    detail: delta >= 0
      ? 'Model probability is above the book-implied probability.'
      : 'Book price is richer than the current model probability.',
  }));
}

function split(
  id: string,
  label: string,
  leftLabel: string,
  leftValue: string,
  leftScore: number | null,
  rightLabel: string,
  rightValue: string,
  rightScore: number | null,
  verdict: string,
): SlatePhysicalSplit {
  return {
    id,
    label,
    leftLabel,
    leftValue,
    leftScore: leftScore == null ? null : round(leftScore),
    rightLabel,
    rightValue,
    rightScore: rightScore == null ? null : round(rightScore),
    verdict,
  };
}

function gameCounts(report: DailyMlbReport | null) {
  let live = 0;
  let final = 0;
  for (const game of report?.games ?? []) {
    if (LIVE_STATUS.test(game.status)) live += 1;
    else if (FINAL_STATUS.test(game.status)) final += 1;
  }
  const total = report?.gameCount ?? 0;
  return { live, final, upcoming: Math.max(0, total - live - final), total };
}

function slateState(report: DailyMlbReport | null, loading: boolean, hasError: boolean): SlateRadarSummary['slateState'] {
  if (loading) return 'loading';
  if (hasError || !report) return 'unavailable';
  const counts = gameCounts(report);
  if (counts.total === 0) return 'no-slate';
  if (counts.live > 0) return 'live';
  if (counts.final >= counts.total) return 'postgame';
  return 'pregame';
}

function buildHomeRunRadar(report: DailyMlbReport | null, rows: readonly HrWatchRow[]): SlateMarketRadar {
  const topRows = rows.slice(0, 12);
  const eliteRows = rows.filter((row) => row.hrScore >= 82).length;
  const coreRows = rows.filter((row) => row.hrScore >= 72).length;
  const pricedRows = rows.filter((row) => typeof row.bookOdds === 'number' && Number.isFinite(row.bookOdds)).length;
  const weatherRows = rows.filter((row) => typeof row.weather === 'number' && Number.isFinite(row.weather)).length;
  const officialRows = rows.filter((row) => row.truthStatus === 'official').length;
  const avgTopScore = average(topRows.map((row) => row.hrScore));
  const avgParkWeather = average(rows.map((row) => average([row.parkContext ?? row.parkFactor ?? 0, row.weather ?? 0])));
  const vulnerablePitcherCount = report?.vulnerablePitchers?.filter((pitcher) => pitcher.riskTier === 'HIGH' || pitcher.riskTier === 'EXTREME').length ?? 0;
  const highRunGameCount = report?.runEnvironments?.filter((game) => game.tier === 'HIGH' || game.tier === 'SHOOTOUT').length ?? 0;
  const vulnerablePitcherBoost = share(vulnerablePitcherCount, Math.max(report?.gameCount ?? 0, 1)) * 100;
  const highRunBoost = share(highRunGameCount, Math.max(report?.runEnvironments?.length ?? report?.gameCount ?? 0, 1)) * 100;

  const signalDepth = clamp((eliteRows * 24) + (coreRows * 8), 0, 100);
  const coverage = (share(pricedRows, rows.length) * 40) + (share(weatherRows, rows.length) * 30) + (share(officialRows, rows.length) * 30);
  const score = round(
    (avgTopScore * 0.38) +
    (signalDepth * 0.24) +
    (avgParkWeather * 0.14) +
    (vulnerablePitcherBoost * 0.12) +
    (highRunBoost * 0.12),
  );
  const confidence = round((coverage * 0.5) + (dataQualityMultiplier(report?.dataQuality) * 100 * 0.35) + (Math.min(rows.length, 40) / 40 * 100 * 0.15));
  const verdict = marketVerdict(score, confidence);

  return {
    id: 'home_runs',
    label: 'Home Runs',
    shortLabel: 'HR',
    score,
    confidence,
    verdict,
    edgeLabel: verdictLabel(verdict),
    detail: verdict === 'research'
      ? 'Power, pitcher damage, park/weather, and available prices line up better than the other markets.'
      : verdict === 'selective'
        ? 'There are usable HR signals, but keep the card tight and avoid weak prices or unconfirmed lineups.'
        : verdict === 'avoid'
          ? 'The HR board does not have enough strong, priced, context-backed candidates right now.'
          : 'Watch lineup, odds, and weather confirmation before treating HRs as today\'s main angle.',
    drivers: [
      scoreDriver('top-score', 'Top HR signal', `${Math.round(avgTopScore) || 0}/100`, avgTopScore),
      scoreDriver('depth', 'Elite/Core depth', `${eliteRows} elite · ${coreRows} core`, signalDepth),
      scoreDriver('price-cover', 'Odds coverage', pct(share(pricedRows, rows.length)), share(pricedRows, rows.length) * 100),
      scoreDriver('weather-park', 'Park/weather read', `${Math.round(avgParkWeather) || 0}/100`, avgParkWeather),
    ],
    marketEdges: buildHrMarketEdges(rows),
    physicalSplits: [
      split(
        'hr-power-damage',
        'Starter susceptibility vs power',
        'Hitter power',
        `${Math.round(average(topRows.map((row) => row.hitterPower ?? 0))) || 0}/100`,
        average(topRows.map((row) => row.hitterPower ?? 0)),
        'Pitcher damage',
        `${Math.round(average(topRows.map((row) => row.pitcherVulnerability ?? 0))) || 0}/100`,
        average(topRows.map((row) => row.pitcherVulnerability ?? 0)),
        'Power meets damage risk',
      ),
      split(
        'hr-park-weather',
        'Park carry vs weather carry',
        'Park factor',
        `${Math.round(average(rows.map((row) => row.parkContext ?? row.parkFactor ?? 0))) || 0}/100`,
        average(rows.map((row) => row.parkContext ?? row.parkFactor ?? 0)),
        'Weather',
        `${Math.round(average(rows.map((row) => row.weather ?? 0))) || 0}/100`,
        average(rows.map((row) => row.weather ?? 0)),
        'Physical carry check',
      ),
    ],
    cautions: [
      ...(officialRows < rows.length ? [`Lineups ${officialRows}/${rows.length} confirmed.`] : []),
      ...(pricedRows < rows.length ? [`Odds ${pricedRows}/${rows.length} priced.`] : []),
      ...(weatherRows < rows.length ? [`Weather ${weatherRows}/${rows.length} covered.`] : []),
    ],
    nextSection: 'hr_board',
  };
}

function buildPitcherKsRadar(report: DailyMlbReport | null): SlateMarketRadar {
  const counts = gameCounts(report);
  const probablePitchers = (report?.games ?? []).reduce((sum, game) => (
    sum + (game.probablePitchers.away ? 1 : 0) + (game.probablePitchers.home ? 1 : 0)
  ), 0);
  const pitcherCoverage = share(probablePitchers, counts.total * 2);
  const nonVulnerablePitchers = (report?.vulnerablePitchers ?? []).filter((pitcher) => pitcher.riskTier === 'LOW' || pitcher.riskTier === 'MEDIUM').length;
  const vulnerableCount = report?.vulnerablePitchers?.length ?? 0;
  const stability = share(nonVulnerablePitchers, Math.max(vulnerableCount, 1));
  const timing = counts.upcoming > 0 ? 78 : counts.live > 0 ? 42 : 24;

  const score = round((pitcherCoverage * 100 * 0.34) + (stability * 100 * 0.24) + (timing * 0.22) + (dataQualityMultiplier(report?.dataQuality) * 100 * 0.2));
  const confidence = round((pitcherCoverage * 100 * 0.5) + (dataQualityMultiplier(report?.dataQuality) * 100 * 0.32) + (vulnerableCount > 0 ? 18 : 0));
  const verdict = marketVerdict(score, Math.min(confidence, 62));

  return {
    id: 'pitcher_ks',
    label: 'Pitcher Ks',
    shortLabel: 'Ks',
    score,
    confidence: Math.min(confidence, 62),
    verdict,
    edgeLabel: verdictLabel(verdict),
    detail: 'Use this only as a watchlist until opponent whiff rate, pitcher pitch count, umpire zone, and posted K lines are in the model.',
    drivers: [
      scoreDriver('probables', 'Probable pitchers', `${probablePitchers}/${Math.max(counts.total * 2, 0)}`, pitcherCoverage * 100),
      scoreDriver('stability', 'Pitcher risk filter', pct(stability), stability * 100),
      scoreDriver('timing', 'Slate timing', counts.upcoming > 0 ? 'Pregame' : counts.live > 0 ? 'Live' : 'Late', timing),
      scoreDriver('quality', 'Report quality', report?.dataQuality ?? 'limited', dataQualityMultiplier(report?.dataQuality) * 100),
    ],
    marketEdges: [{
      id: 'k-awaiting-lines',
      subject: 'Pitcher K market',
      bookLine: 'Awaiting O/U K lines',
      modelProjection: 'No K projection contract yet',
      deltaLabel: 'No line delta',
      direction: 'awaiting',
      detail: 'K edge requires projected strikeouts compared against each posted pitcher strikeout line.',
    }],
    physicalSplits: [
      split(
        'k-whiff-collision',
        'Pitcher CSW vs opponent whiff',
        'Pitcher CSW',
        'Unavailable',
        null,
        'Opponent whiff',
        'Unavailable',
        null,
        'CSW, whiff, and leash missing',
      ),
    ],
    cautions: [
      'No K projection: CSW, opponent whiff, and batters faced are missing.',
      'Awaiting pitcher strikeout lines.',
    ],
    nextSection: 'pitcher_matchup_intelligence',
  };
}

function buildStolenBasesRadar(): SlateMarketRadar {
  return {
    id: 'stolen_bases',
    label: 'Stolen Bases',
    shortLabel: 'SB',
    score: 0,
    confidence: 0,
    verdict: 'monitor',
    edgeLabel: 'Data locked',
    detail: 'A stolen-base timing edge requires runner sprint speed, catcher pop time, pitcher delivery time, and a posted sportsbook line.',
    drivers: [
      scoreDriver('sprint', 'Runner sprint speed', 'Unavailable', 0),
      scoreDriver('pop-time', 'Catcher pop time', 'Unavailable', 0),
      scoreDriver('delivery', 'Pitcher delivery', 'Unavailable', 0),
      scoreDriver('sb-lines', 'Sportsbook lines', 'Awaiting', 0),
    ],
    marketEdges: [{
      id: 'sb-awaiting-contract',
      subject: 'Stolen-base market',
      bookLine: 'Awaiting SB lines and timing inputs',
      modelProjection: 'No SB timing projection contract yet',
      deltaLabel: 'No timing delta',
      direction: 'awaiting',
      detail: 'The lane remains locked until sprint speed, catcher pop time, pitcher delivery time, and a sportsbook line are all available.',
    }],
    physicalSplits: [split(
      'sb-timing-window',
      'Runner speed vs catcher pop time',
      'Runner sprint speed',
      'Unavailable',
      null,
      'Catcher pop time',
      'Unavailable',
      null,
      'Timing window unavailable',
    )],
    cautions: [
      'No sprint speed contract.',
      'No catcher pop-time contract.',
      'Awaiting stolen-base lines.',
    ],
    nextSection: 'daily_players',
  };
}

function buildHitsRadar(report: DailyMlbReport | null, rows: readonly HrWatchRow[]): SlateMarketRadar {
  const counts = gameCounts(report);
  const officialRows = rows.filter((row) => row.truthStatus === 'official').length;
  const projectedRows = rows.filter((row) => row.truthStatus === 'projected').length;
  const lineupClarity = share(officialRows + (projectedRows * 0.45), rows.length);
  const highRunGames = report?.runEnvironments?.filter((game) => game.tier === 'HIGH' || game.tier === 'SHOOTOUT').length ?? 0;
  const runEnv = share(highRunGames, Math.max(report?.runEnvironments?.length ?? 0, 1));
  const playerPool = Math.min(rows.length, 60) / 60;
  const timing = counts.upcoming > 0 ? 72 : counts.live > 0 ? 48 : 28;

  const hitContractCap = 72;
  const score = Math.min(
    hitContractCap,
    round((lineupClarity * 100 * 0.24) + (runEnv * 100 * 0.2) + (playerPool * 100 * 0.14) + (timing * 0.12) + (dataQualityMultiplier(report?.dataQuality) * 100 * 0.1)),
  );
  const confidence = round((lineupClarity * 100 * 0.42) + (playerPool * 100 * 0.22) + (dataQualityMultiplier(report?.dataQuality) * 100 * 0.26) + (report?.runEnvironments?.length ? 10 : 0));
  const verdict = marketVerdict(score, Math.min(confidence, 70));

  return {
    id: 'hits',
    label: 'Hits',
    shortLabel: 'Hits',
    score,
    confidence: Math.min(confidence, 70),
    verdict,
    edgeLabel: verdictLabel(verdict),
    detail: 'Hits are usually a volume and contact-quality lane. Prefer confirmed top-half lineup spots, high run environments, and lower strikeout matchups.',
    drivers: [
      scoreDriver('lineup', 'Lineup clarity', pct(lineupClarity), lineupClarity * 100),
      scoreDriver('run-env', 'Run environment', `${highRunGames} hot game${highRunGames === 1 ? '' : 's'}`, runEnv * 100),
      scoreDriver('pool', 'Player pool', `${rows.length} rows`, playerPool * 100),
      scoreDriver('timing', 'Decision timing', counts.upcoming > 0 ? 'Pregame' : counts.live > 0 ? 'Live' : 'Late', timing),
    ],
    marketEdges: [{
      id: 'hits-awaiting-lines',
      subject: 'Hits market',
      bookLine: 'Awaiting hit lines',
      modelProjection: 'No hit projection contract yet',
      deltaLabel: 'No line delta',
      direction: 'awaiting',
      detail: 'Hits edge requires projected hits or total bases compared against each posted line.',
    }],
    physicalSplits: [
      split(
        'hits-volume-environment',
        'Lineup volume vs run environment',
        'Lineup clarity',
        pct(lineupClarity),
        lineupClarity * 100,
        'Run environment',
        `${highRunGames} hot game${highRunGames === 1 ? '' : 's'}`,
        runEnv * 100,
        'Contact lane is not fully priced',
      ),
    ],
    cautions: [
      'Hits need contact rate, batting-order slot, pitcher balls-in-play profile, and line price before a real EV call.',
      ...(officialRows === 0 && rows.length > 0 ? ['No confirmed lineups yet, so plate-appearance volume is uncertain.'] : []),
    ],
    nextSection: 'daily_players',
  };
}

export function buildSlateRadar({ report, hrRows, loading, hasError, marketRadar, marketRadarLoading = false, marketRadarError = null }: BuildSlateRadarInput): SlateRadarSummary {
  const state = slateState(report, loading, hasError);
  const markets = mergeLiveEdges([
    buildHomeRunRadar(report, hrRows),
    buildPitcherKsRadar(report),
    buildStolenBasesRadar(),
    buildHitsRadar(report, hrRows),
  ], marketRadar, hrRows).sort((a, b) => {
    const aEdge = Math.max(...a.marketEdges.filter((edge) => edge.verifiedComparison).map((edge) => Math.abs(edge.edgePoints ?? Number.NEGATIVE_INFINITY)));
    const bEdge = Math.max(...b.marketEdges.filter((edge) => edge.verifiedComparison).map((edge) => Math.abs(edge.edgePoints ?? Number.NEGATIVE_INFINITY)));
    const aPriced = Number.isFinite(aEdge);
    const bPriced = Number.isFinite(bEdge);
    if (aPriced !== bPriced) return aPriced ? -1 : 1;
    if (aPriced && bPriced && aEdge !== bEdge) return bEdge - aEdge;
    return 0;
  });

  const eligibleTop = markets.find((market) => market.marketEdges.some((edge) => edge.verifiedComparison)) ?? null;
  const dataWarnings = [
    ...(hasError ? ['Daily report failed to load. No market should be treated as verified.'] : []),
    ...(report && report.dataQuality !== 'full' ? [`Daily report quality is ${report.dataQuality}.`] : []),
    ...(hrRows.length === 0 && report?.gameCount ? ['HR board has no visible rows yet.'] : []),
    ...(marketRadarError ? [`Sportsbook feed error: ${marketRadarError}`] : []),
    ...(marketRadar?.warnings ?? []),
  ];

  return {
    dateLabel: report?.date ?? new Date().toISOString().slice(0, 10),
    slateState: state,
    topMarket: state === 'no-slate' || state === 'unavailable' ? null : eligibleTop,
    markets,
    methodNotes: [
      'Priced markets rank first by absolute model-minus-market line displacement.',
      'K and Hits are intentionally capped until full market-specific projection inputs are available.',
      'No sportsbook line means no claimed betting edge.',
    ],
    dataWarnings,
    provider: marketRadarLoading
      ? { status: 'loading', eventCount: null, quoteCount: null, message: 'Loading sportsbook markets' }
      : marketRadarError
        ? { status: 'error', eventCount: null, quoteCount: null, message: marketRadarError }
        : { status: 'live', eventCount: marketRadar?.provider.eventCount ?? 0, quoteCount: marketRadar?.provider.quoteCount ?? 0, message: marketRadar ? 'Sportsbook provider connected' : 'Sportsbook response pending' },
  };
}
