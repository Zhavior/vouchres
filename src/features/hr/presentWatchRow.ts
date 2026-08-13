import { buildHrDecisionBrief, toHrParlayPickerPlayer } from './utils/hrDecisionBrief';
import type { HrBoardFreshness, HrDecisionBrief, HrParlayPickerPlayer } from './utils/hrDecisionBrief';
import type { HrWatchRow, RiskTier, TruthStatus } from './types/hrWatch';
import type { AuroraMaxEvidenceItem, AuroraMaxTruthState } from '../../components/aurora-max/AuroraMaxPrimitives';
import { SIGNAL_WEIGHTS } from './engine/signalScore';

export type IntelV2SortKey = 'hrpi' | 'time' | 'volume';
export type IntelV2DisplayTier = 'Elite' | 'Strong' | 'Watch' | 'Sleepers';

/** Mirrors useHrBoardViewModel DISPLAY_TIER — presentation only, not a second scorer. */
const DISPLAY_TIER: Record<RiskTier, IntelV2DisplayTier | null> = {
  Elite: 'Elite',
  Core: 'Strong',
  Watch: 'Watch',
  Deep: 'Sleepers',
  Blocked: null,
};

/** Research-brief grouping from HRPI-v4. Not applied client-side. */
export const HRPI_V4_RESEARCH_WEIGHTS = {
  power: 35,
  pitch: 25,
  parkWeather: 20,
  lineup: 10,
  residual: 10,
} as const;

function pipelineWeightCopy(): string {
  return `${Math.round(SIGNAL_WEIGHTS.power * 100)}/${Math.round(SIGNAL_WEIGHTS.pitcher * 100)}/${Math.round(SIGNAL_WEIGHTS.park * 100)}/${Math.round(SIGNAL_WEIGHTS.weather * 100)}`;
}

export function hrpiV4ModelCard(): string {
  const v4 = `${HRPI_V4_RESEARCH_WEIGHTS.power}/${HRPI_V4_RESEARCH_WEIGHTS.pitch}/${HRPI_V4_RESEARCH_WEIGHTS.parkWeather}/${HRPI_V4_RESEARCH_WEIGHTS.lineup}/${HRPI_V4_RESEARCH_WEIGHTS.residual}`;
  return [
    'HRPI is the published board hrScore. This desk does not recompute it.',
    `Live pipeline weights ${pipelineWeightCopy()} (power/pitcher/park/weather), renormalized when a layer is missing.`,
    `HRPI-v4 research framing ${v4} (power/pitch/park-weather/lineup/residual) is methodology copy only — not applied client-side.`,
    'Raw Statcast (xSLG, Barrel%), wind, humidity, and HR/9 are labeled missing unless present on the row.',
    'Edge and probability language only; not a guaranteed pick.',
  ].join(' ');
}

export type IntelV2Row = {
  id: string;
  displayTier: IntelV2DisplayTier | null;
  playerName: string;
  team: string;
  opponent: string;
  matchupLabel: string;
  gameTimeLabel: string;
  timeValue: number | null;
  confirmed: boolean;
  truthState: AuroraMaxTruthState;
  lineupLabel: string;
  score: number;
  attention: number | null;
  signal: string;
  read: string;
  evidenceConfidence: string;
  evidence: AuroraMaxEvidenceItem[];
  strikeLine: string;
  hrpiLine: string;
  matchupSummary: string;
  weather: number | null;
  venue: string | null;
  receipt: {
    updated: string;
    sources: string[];
    missing: string;
    methodology: string;
  };
  player: HrParlayPickerPlayer;
  dataStatus: 'official' | 'projected' | 'unknown';
  reasoningSnapshot: string;
  riskSnapshot: string;
  hitterPower: number | null;
  pitcherVulnerability: number | null;
  park: number | null;
  pitcherName: string;
  canAddToSlip: boolean;
  headshotUrl: string | null;
  bookOdds: number | null;
  gamePk: string | number | null;
  playerId: string | number | null;
  stableId: string;
  truthStatus: TruthStatus;
};

function minutesFromClock(gameTime: string | null): number | null {
  if (!gameTime) return null;
  const timestamp = Date.parse(gameTime);
  if (Number.isFinite(timestamp)) {
    const date = new Date(timestamp);
    return date.getHours() * 60 + date.getMinutes();
  }
  const match = gameTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function clockLabel(gameTime: string | null): string {
  if (!gameTime?.trim()) return 'Time unavailable';
  const timestamp = Date.parse(gameTime);
  if (Number.isFinite(timestamp)) {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return gameTime.trim();
}

function toTruthState(status: TruthStatus): AuroraMaxTruthState {
  if (status === 'official') return 'confirmed';
  if (status === 'projected') return 'projected';
  if (status === 'blocked') return 'warning';
  return 'missing';
}

function coverage(confidence: number | null): string {
  if (confidence == null) return 'Coverage unavailable';
  if (confidence >= 80) return 'High coverage';
  if (confidence >= 50) return 'Medium coverage';
  return 'Limited coverage';
}

function boundedLayer(score: number | null | undefined): number | null {
  if (score == null || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function layerTone(score: number | null): AuroraMaxEvidenceItem['tone'] {
  if (score == null) return 'missing';
  if (score >= 75) return 'confirmed';
  if (score >= 55) return 'neutral';
  return 'warning';
}

function lineupStrike(status: TruthStatus): string {
  if (status === 'official') return 'LINEUP CONFIRMED';
  if (status === 'projected') return 'LINEUP PROJECTED';
  if (status === 'blocked') return 'LINEUP BLOCKED';
  return 'LINEUP UNVERIFIED';
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function matchupSummary(row: HrWatchRow, brief: HrDecisionBrief): string {
  const sentences: string[] = [];
  for (const reason of row.reasons) {
    const sentence = ensureSentence(reason);
    if (!sentence) continue;
    sentences.push(sentence);
    if (sentences.length >= 2) break;
  }
  if (sentences.length === 0) sentences.push(ensureSentence(brief.reason));

  const pitcher = row.pitcherName?.trim();
  if (pitcher) sentences.push(`Board lists ${pitcher} as the opposing pitcher.`);
  else sentences.push('Opposing pitcher is unavailable on this row.');

  if (sentences.length < 3) {
    const venue = row.venue?.trim();
    if (row.weather == null) {
      sentences.push(venue ? `Venue is ${venue}; weather is UNKNOWN on this payload.` : 'Weather is UNKNOWN on this payload.');
    } else if (venue) {
      sentences.push(`Venue is ${venue}; weather layer is present on the board.`);
    }
  }

  return sentences.slice(0, 3).join(' ');
}

function powerEvidence(row: HrWatchRow): AuroraMaxEvidenceItem {
  const power = boundedLayer(row.hitterPower);
  const form = boundedLayer(row.recentForm);
  return {
    label: '[+] Power profile',
    value: power == null ? 'missing' : `${power}/100`,
    score: power,
    tone: layerTone(power),
    detail: [
      power == null ? 'Board power layer missing.' : `Board power ${power}/100.`,
      'Raw Statcast (xSLG, Barrel%) missing on this row.',
      form == null ? 'Recent contact missing.' : `Recent contact ${form}/100.`,
    ].join(' '),
  };
}

function pitchEvidence(row: HrWatchRow): AuroraMaxEvidenceItem {
  const pitcherLayer = boundedLayer(row.pitcherVulnerability);
  const pitcher = row.pitcherName?.trim();
  return {
    label: '[+] Pitch matchup',
    value: pitcherLayer == null ? 'missing' : `${pitcherLayer}/100`,
    score: pitcherLayer,
    tone: layerTone(pitcherLayer),
    detail: [
      pitcherLayer == null ? 'Board pitcher layer missing.' : `Board pitcher layer ${pitcherLayer}/100.`,
      pitcher ? `Opposing pitcher ${pitcher}.` : 'Opposing pitcher unavailable.',
      'Raw HR/9 missing on this row.',
    ].join(' '),
  };
}

function parkWeatherEvidence(row: HrWatchRow): AuroraMaxEvidenceItem {
  const park = boundedLayer(row.parkContext ?? row.parkFactor);
  const weather = boundedLayer(row.weather);
  const venue = row.venue?.trim();
  const parkBit = park == null
    ? (row.parkIndex != null && Number.isFinite(row.parkIndex)
      ? `Park layer missing; raw park index ${Math.round(row.parkIndex)} on row.`
      : 'Park missing.')
    : `Park ${park}/100${venue ? ` at ${venue}` : ''}.`;
  const weatherBit = weather == null ? 'Weather UNKNOWN.' : `Weather layer ${weather}/100.`;
  const value = park == null && weather == null ? 'UNKNOWN' : park == null ? 'UNKNOWN' : `${park}/100`;
  return {
    label: '[+] Park & weather',
    value,
    score: park,
    tone: park == null && weather == null ? 'missing' : weather == null || park == null ? 'warning' : layerTone(park),
    detail: [parkBit, weatherBit, 'Wind and humidity missing on this row.'].join(' '),
  };
}

function riskEvidence(row: HrWatchRow, brief: HrDecisionBrief): AuroraMaxEvidenceItem {
  const warnings = row.warnings.map((warning) => warning.trim()).filter(Boolean);
  return {
    label: '[-] Main risk',
    value: warnings.length > 0 ? 'risk' : 'noted',
    score: null,
    tone: 'warning',
    detail: ensureSentence(brief.risk),
  };
}

function v4Evidence(row: HrWatchRow, brief: HrDecisionBrief): AuroraMaxEvidenceItem[] {
  return [powerEvidence(row), pitchEvidence(row), parkWeatherEvidence(row), riskEvidence(row, brief)];
}

function operatorSignal(row: HrWatchRow): string {
  if (row.truthStatus === 'blocked') return 'Blocked — not research-eligible';
  if (row.riskTier === 'Elite' && row.truthStatus === 'official') return 'Strong research signal';
  if (row.riskTier === 'Elite') return 'Positive, lineup pending';
  if (row.riskTier === 'Core' && row.truthStatus === 'official') return 'Positive power context';
  if (row.truthStatus !== 'official') return 'Wait for lineup truth';
  if (row.warnings.length > 0) return 'Monitor conflicting inputs';
  return 'Research row';
}

function sourceList(row: HrWatchRow, boardSource: string | null): string[] {
  const sources = ['Validated HR board'];
  if (row.truthStatus === 'official') sources.push('Official lineup');
  if (row.truthStatus === 'projected') sources.push('Projected lineup');
  if (row.weather != null) sources.push('Weather context on board');
  if (boardSource && !sources.includes(boardSource)) sources.push(boardSource);
  return sources;
}

function gapCopy(row: HrWatchRow): string {
  const gaps: string[] = [];
  if (row.truthStatus !== 'official') gaps.push('Official batting order is unavailable.');
  if (!row.pitcherName?.trim()) gaps.push('Probable pitcher is unavailable.');
  if (row.weather == null) gaps.push('Weather is UNKNOWN on this payload.');
  if (row.bullpen == null) gaps.push('Bullpen context is unavailable.');
  for (const warning of row.warnings) {
    const trimmed = warning.trim();
    if (trimmed) gaps.push(trimmed);
  }
  return gaps.length > 0 ? gaps.join(' ') : 'No material source gaps.';
}

export function presentWatchRow(
  row: HrWatchRow,
  freshness: HrBoardFreshness,
  generatedAt: Date | null,
  boardSource: string | null,
): IntelV2Row {
  const brief = buildHrDecisionBrief(row, freshness, generatedAt);
  const confirmed = row.truthStatus === 'official';
  const opponent = row.opponent?.trim() || 'Opponent unavailable';
  const score = Math.max(0, Math.min(100, Math.round(row.hrScore)));
  const displayTier = DISPLAY_TIER[row.riskTier];
  const strikeLine = `${row.playerName} | ${row.team} vs ${opponent}`;
  const hrpiLine = `HRPI: ${score}/100 | ${displayTier ?? 'Unranked'} | ${lineupStrike(row.truthStatus)}`;

  return {
    id: row.stableId,
    displayTier,
    playerName: row.playerName,
    team: row.team,
    opponent,
    matchupLabel: `${row.team} vs ${opponent}`,
    gameTimeLabel: clockLabel(row.gameTime),
    timeValue: minutesFromClock(row.gameTime),
    confirmed,
    truthState: toTruthState(row.truthStatus),
    lineupLabel: brief.lineupLabel,
    score,
    attention: row.vouchScore ?? row.dataConfidence,
    signal: operatorSignal(row),
    read: brief.reason,
    evidenceConfidence: coverage(row.dataConfidence),
    evidence: v4Evidence(row, brief),
    strikeLine,
    hrpiLine,
    matchupSummary: matchupSummary(row, brief),
    weather: boundedLayer(row.weather),
    venue: row.venue?.trim() || null,
    receipt: {
      updated: brief.freshnessLabel,
      sources: sourceList(row, boardSource),
      missing: gapCopy(row),
      methodology: hrpiV4ModelCard(),
    },
    player: toHrParlayPickerPlayer(row),
    dataStatus: confirmed ? 'official' : row.truthStatus === 'projected' ? 'projected' : 'unknown',
    reasoningSnapshot: brief.reason,
    riskSnapshot: brief.risk,
    hitterPower: row.hitterPower,
    pitcherVulnerability: row.pitcherVulnerability,
    park: row.parkContext ?? row.parkFactor,
    pitcherName: row.pitcherName?.trim() || 'Pitcher unavailable',
    canAddToSlip: brief.canAddToSlip,
    headshotUrl: row.headshotUrl,
    bookOdds: row.bookOdds ?? null,
    gamePk: row.gamePk,
    playerId: row.playerId,
    stableId: row.stableId,
    truthStatus: row.truthStatus,
  };
}

export function sortIntelV2Rows(rows: IntelV2Row[], sortKey: IntelV2SortKey): IntelV2Row[] {
  return [...rows].sort((left, right) => {
    if (sortKey === 'hrpi') return right.score - left.score;
    if (sortKey === 'volume') return (right.attention ?? -1) - (left.attention ?? -1);
    return (left.timeValue ?? Number.POSITIVE_INFINITY) - (right.timeValue ?? Number.POSITIVE_INFINITY);
  });
}

export function formatIntelDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export const INTEL_V2_SORT_LABELS: Record<IntelV2SortKey, string> = {
  hrpi: 'HRPI score',
  time: 'Game time',
  volume: 'Market attention',
};

export const INTEL_V2_TIERS: IntelV2DisplayTier[] = ['Elite', 'Strong', 'Watch', 'Sleepers'];

/** Operator labels for the four Z8 board columns — presentation only. */
export const INTEL_V2_TIER_COPY: Record<IntelV2DisplayTier, { index: string; title: string; detail: string }> = {
  Elite: { index: '01', title: 'Elite', detail: 'Highest-resolution signal stacks on the slate.' },
  Strong: { index: '02', title: 'Strong', detail: 'Balanced candidates with multiple supporting factors.' },
  Watch: { index: '03', title: 'Watch', detail: 'Useful signals that still need context or confirmation.' },
  Sleepers: { index: '04', title: 'Sleepers', detail: 'Lower-ranked rows for deliberate investigation.' },
};
