import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import type { DailyMlbReport, DataQuality } from '../../types/mlb';
import type { MlbMarketRadarResponse } from '../../types/marketRadar';

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
  direction: 'over' | 'under' | 'value' | 'research' | 'awaiting';
  detail: string;
  modelValue?: number;
  marketValue?: number;
  scaleMax?: number;
  edgePoints?: number;
  valueUnit?: '%' | 'Ks';
  verifiedComparison?: boolean;
  researchSignal?: boolean;
  researchRankValue?: number;
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
    signalCount: number | null;
    message: string;
  };
}

interface BuildSlateRadarInput {
  report: DailyMlbReport | null;
  hrRows: readonly HrWatchRow[];
  loading: boolean;
  hasError: boolean;
  mlbResearch?: MlbMarketRadarResponse | null;
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

function buildHrMarketEdges(rows: readonly HrWatchRow[]): SlateMarketEdge[] {
  const modeled = rows.filter((row) => row.truthStatus === 'official' && typeof row.hrProbability === 'number')
    .sort((a, b) => (b.hrProbability ?? 0) - (a.hrProbability ?? 0));
  if (modeled.length === 0) return [{
    id: 'hr-awaiting-mlb', subject: 'Home run market', bookLine: 'Awaiting confirmed MLB lineups',
    modelProjection: 'Slate environment pending', deltaLabel: 'PASS FOR NOW', direction: 'awaiting',
    detail: 'The MLB board has not returned enough confirmed hitters to assess the home-run market today.',
  }];

  const topSample = modeled.slice(0, 10);
  const averageTopProbability = average(topSample.map((row) => row.hrProbability ?? 0));
  const qualifiedSpots = modeled.filter((row) => row.hrScore >= 72).length;
  return [{
    id: 'hr-market-research',
    subject: 'Home run market',
    bookLine: `${modeled.length} confirmed hitters analyzed`,
    modelProjection: `${formatProbability(averageTopProbability)} average among top 10`,
    deltaLabel: qualifiedSpots >= 6 ? 'LOOK AT HRs' : qualifiedSpots >= 3 ? 'SELECTIVE HRs' : 'PASS / MONITOR',
    direction: 'research',
    detail: `${qualifiedSpots} hitters clear the current HR Intelligence core threshold. This is a slate-level market hint, not an individual player pick.`,
    researchSignal: true,
    researchRankValue: Math.min(1, (averageTopProbability / 0.15) * 0.7 + Math.min(qualifiedSpots / 10, 1) * 0.3),
  }];
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

function buildPitcherKsRadar(report: DailyMlbReport | null, research: MlbMarketRadarResponse | null | undefined): SlateMarketRadar {
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
  const pitcherRows = research?.pitcherKs ?? [];
  const topPitcher = pitcherRows[0];
  const topPitcherSample = pitcherRows.slice(0, 8);
  const averageSeasonKPer9 = average(topPitcherSample.map((pitcher) => pitcher.seasonKPer9));
  const recentValues = topPitcherSample.map((pitcher) => pitcher.recentKAverage).filter((value): value is number => value != null);
  const averageRecentKs = recentValues.length > 0 ? average(recentValues) : null;
  const highKStarters = pitcherRows.filter((pitcher) => pitcher.seasonKPer9 >= 9).length;
  const marketEdges: SlateMarketEdge[] = pitcherRows.length > 0
    ? [{
      id: 'k-market-research',
      subject: 'Pitcher strikeout market',
      bookLine: `${pitcherRows.length} probable starters analyzed`,
      modelProjection: `${averageSeasonKPer9.toFixed(1)} K/9 among top 8`,
      deltaLabel: highKStarters >= 6 ? 'LOOK AT Ks' : highKStarters >= 3 ? 'SELECTIVE Ks' : 'PASS / MONITOR',
      direction: 'research',
      detail: `${highKStarters} starters carry at least 9.0 K/9${averageRecentKs == null ? '' : `; the top-eight recent average is ${averageRecentKs.toFixed(1)} Ks`}. This is a slate-level market hint, not a pitcher pick.`,
      researchSignal: true,
      researchRankValue: Math.min(1, (averageSeasonKPer9 / 10.5) * 0.7 + Math.min(highKStarters / 8, 1) * 0.3),
    }]
    : [{
      id: 'k-awaiting-mlb',
      subject: 'Pitcher K market',
      bookLine: 'Awaiting probable-pitcher history',
      modelProjection: 'MLB data pending',
      deltaLabel: 'No MLB target',
      direction: 'awaiting',
      detail: 'The MLB feed has not returned a probable pitcher with usable season strikeout history.',
    }];

  return {
    id: 'pitcher_ks',
    label: 'Pitcher Ks',
    shortLabel: 'Ks',
    score,
    confidence: Math.min(confidence, 62),
    verdict,
    edgeLabel: pitcherRows.length > 0 ? 'MLB K research' : verdictLabel(verdict),
    detail: pitcherRows.length > 0
      ? 'Rank probable pitchers by real MLB season K/9 and recent strikeout output. Opponent whiff, projected batters faced, and a posted line are still required for a betting call.'
      : 'The probable-pitcher feed is still waiting for usable MLB strikeout history.',
    drivers: [
      scoreDriver('probables', 'Probable pitchers', `${probablePitchers}/${Math.max(counts.total * 2, 0)}`, pitcherCoverage * 100),
      scoreDriver('stability', 'Pitcher risk filter', pct(stability), stability * 100),
      scoreDriver('timing', 'Slate timing', counts.upcoming > 0 ? 'Pregame' : counts.live > 0 ? 'Live' : 'Late', timing),
      scoreDriver('quality', 'Report quality', report?.dataQuality ?? 'limited', dataQualityMultiplier(report?.dataQuality) * 100),
    ],
    marketEdges,
    physicalSplits: [
      split(
        'k-whiff-collision',
        'Season strikeout rate vs recent output',
        'Season K/9',
        topPitcher ? topPitcher.seasonKPer9.toFixed(1) : 'Unavailable',
        null,
        'Recent K average',
        topPitcher?.recentKAverage == null ? 'Unavailable' : topPitcher.recentKAverage.toFixed(1),
        null,
        topPitcher ? 'MLB history, not a prop projection' : 'MLB history pending',
      ),
    ],
    cautions: [
      'No K projection: CSW, opponent whiff, and batters faced are missing.',
      'No sportsbook line is used in this MLB-only view.',
    ],
    nextSection: 'pitcher_matchup_intelligence',
  };
}

function buildStolenBasesRadar(research: MlbMarketRadarResponse | null | undefined): SlateMarketRadar {
  const allRunnerRows = research?.stolenBases ?? [];
  const confirmedRunnerRows = allRunnerRows.filter((runner) => runner.lineupConfirmed);
  const runnerRows = confirmedRunnerRows.length > 0 ? confirmedRunnerRows : allRunnerRows;
  const topRunner = runnerRows[0];
  const runnerSample = runnerRows.slice(0, 12);
  const averageSbProbability = average(runnerSample.map((runner) => runner.estimatedProbability));
  const activeThreats = runnerRows.filter((runner) => runner.estimatedProbability >= 0.18 && runner.successRate >= 0.75).length;
  const marketEdges: SlateMarketEdge[] = runnerRows.length > 0
    ? [{
      id: 'sb-market-research',
      subject: 'Stolen-base market',
      bookLine: `${runnerRows.length} active runners analyzed`,
      modelProjection: `${formatProbability(averageSbProbability)} average top-12 attempt chance`,
      deltaLabel: activeThreats >= 6 ? 'LOOK AT SBs' : activeThreats >= 3 ? 'SELECTIVE SBs' : 'PASS / MONITOR',
      direction: 'research',
      detail: `${activeThreats} runners clear the current volume and success filters. This is a slate-level market hint; catcher and pitcher timing are still missing.`,
      researchSignal: true,
      researchRankValue: Math.min(1, (averageSbProbability / 0.25) * 0.7 + Math.min(activeThreats / 8, 1) * 0.3),
    }]
    : [{
      id: 'sb-awaiting-mlb',
      subject: 'Stolen-base market',
      bookLine: 'Awaiting MLB runner history',
      modelProjection: 'MLB data pending',
      deltaLabel: 'No MLB target',
      direction: 'awaiting',
      detail: 'The MLB feed has not returned an active runner with usable stolen-base history.',
    }];

  return {
    id: 'stolen_bases',
    label: 'Stolen Bases',
    shortLabel: 'SB',
    score: 0,
    confidence: 0,
    verdict: 'monitor',
    edgeLabel: runnerRows.length > 0 ? 'MLB runner research' : 'MLB data pending',
    detail: runnerRows.length > 0
      ? 'Use season attempts and success rate to identify runners worth checking. A true timing edge still requires sprint speed, catcher pop time, and pitcher delivery.'
      : 'The MLB runner feed has not returned usable stolen-base history yet.',
    drivers: [
      scoreDriver('sprint', 'Runner sprint speed', 'Unavailable', 0),
      scoreDriver('pop-time', 'Catcher pop time', 'Unavailable', 0),
      scoreDriver('delivery', 'Pitcher delivery', 'Unavailable', 0),
      scoreDriver('sb-lines', 'Sportsbook lines', 'Awaiting', 0),
    ],
    marketEdges,
    physicalSplits: [split(
      'sb-timing-window',
      'Season volume vs attempt success',
      'Season SB',
      topRunner ? String(topRunner.seasonStolenBases) : 'Unavailable',
      null,
      'Attempt success',
      topRunner ? `${Math.round(topRunner.successRate * 100)}%` : 'Unavailable',
      null,
      topRunner ? 'MLB history, timing inputs pending' : 'MLB history pending',
    )],
    cautions: [
      'No sprint speed contract.',
      'No catcher pop-time contract.',
      'No sportsbook line is used in this MLB-only view.',
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

export function buildSlateRadar({ report, hrRows, loading, hasError, mlbResearch, marketRadarLoading = false, marketRadarError = null }: BuildSlateRadarInput): SlateRadarSummary {
  const state = slateState(report, loading, hasError);
  const markets = [
    buildHomeRunRadar(report, hrRows),
    buildPitcherKsRadar(report, mlbResearch),
    buildStolenBasesRadar(mlbResearch),
    buildHitsRadar(report, hrRows),
  ].sort((a, b) => {
    const aEdge = Math.max(...a.marketEdges.filter((edge) => edge.verifiedComparison).map((edge) => Math.abs(edge.edgePoints ?? Number.NEGATIVE_INFINITY)));
    const bEdge = Math.max(...b.marketEdges.filter((edge) => edge.verifiedComparison).map((edge) => Math.abs(edge.edgePoints ?? Number.NEGATIVE_INFINITY)));
    const aPriced = Number.isFinite(aEdge);
    const bPriced = Number.isFinite(bEdge);
    if (aPriced !== bPriced) return aPriced ? -1 : 1;
    if (aPriced && bPriced && aEdge !== bEdge) return bEdge - aEdge;
    const aResearch = Math.max(...a.marketEdges.filter((edge) => edge.researchSignal).map((edge) => edge.researchRankValue ?? Number.NEGATIVE_INFINITY));
    const bResearch = Math.max(...b.marketEdges.filter((edge) => edge.researchSignal).map((edge) => edge.researchRankValue ?? Number.NEGATIVE_INFINITY));
    if (Number.isFinite(aResearch) !== Number.isFinite(bResearch)) return Number.isFinite(aResearch) ? -1 : 1;
    if (Number.isFinite(aResearch) && Number.isFinite(bResearch) && aResearch !== bResearch) return bResearch - aResearch;
    return 0;
  });

  const eligibleTop = markets.find((market) => market.marketEdges.some((edge) => edge.verifiedComparison || edge.researchSignal)) ?? null;
  const dataWarnings = [
    ...(hasError ? ['Daily report failed to load. No market should be treated as verified.'] : []),
    ...(report && report.dataQuality !== 'full' ? [`Daily report quality is ${report.dataQuality}.`] : []),
    ...(hrRows.length === 0 && report?.gameCount ? ['HR board has no visible rows yet.'] : []),
    ...(marketRadarError ? [`MLB radar feed error: ${marketRadarError}`] : []),
    ...(mlbResearch?.warnings ?? []),
  ];

  return {
    dateLabel: report?.date ?? new Date().toISOString().slice(0, 10),
    slateState: state,
    topMarket: state === 'no-slate' || state === 'unavailable' ? null : eligibleTop,
    markets,
    methodNotes: [
      'MLB research lanes rank current season and recent evidence; those signals are not sportsbook edges.',
      'Pitcher K projections remain capped until CSW, opponent whiff, and projected batters faced are available.',
      'No sportsbook line means no claimed betting edge.',
    ],
    dataWarnings,
    provider: marketRadarLoading
      ? { status: 'loading', eventCount: null, signalCount: null, message: 'Loading MLB market research' }
      : marketRadarError
        ? { status: 'error', eventCount: null, signalCount: null, message: marketRadarError }
        : { status: 'live', eventCount: mlbResearch?.provider.eventCount ?? 0, signalCount: mlbResearch?.provider.signalCount ?? 0, message: mlbResearch ? 'MLB Stats API connected' : 'MLB response pending' },
  };
}
