import { buildHrDecisionBrief, toHrParlayPickerPlayer } from '../hr/utils/hrDecisionBrief';
import type { HrBoardFreshness, HrParlayPickerPlayer } from '../hr/utils/hrDecisionBrief';
import type { HrWatchRow, TruthStatus } from '../hr/types/hrWatch';
import type { AuroraMaxEvidenceItem, AuroraMaxTruthState } from '../../components/aurora-max/AuroraMaxPrimitives';

export type DeskSortKey = 'hrpi' | 'time' | 'volume';

export type HrMaxDeskRow = {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  matchupLabel: string;
  pitcherName: string | null;
  venue: string | null;
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
};

function parseTimeValue(gameTime: string | null): number | null {
  if (!gameTime) return null;
  const iso = Date.parse(gameTime);
  if (Number.isFinite(iso)) {
    const dt = new Date(iso);
    return dt.getHours() * 60 + dt.getMinutes();
  }
  const mer = gameTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!mer) return null;
  let hours = Number(mer[1]);
  const minutes = Number(mer[2]);
  const meridiem = mer[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatGameTime(gameTime: string | null): string {
  if (!gameTime?.trim()) return 'Time unavailable';
  const iso = Date.parse(gameTime);
  if (Number.isFinite(iso)) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return gameTime.trim();
}

function truthState(status: TruthStatus): AuroraMaxTruthState {
  if (status === 'official') return 'confirmed';
  if (status === 'projected') return 'projected';
  if (status === 'blocked') return 'warning';
  return 'missing';
}

function coverageLabel(confidence: number | null): string {
  if (confidence == null) return 'Coverage unavailable';
  if (confidence >= 80) return 'High coverage';
  if (confidence >= 50) return 'Medium coverage';
  return 'Limited coverage';
}

function qualitative(score: number): string {
  if (score >= 75) return 'Favorable';
  if (score >= 55) return 'Neutral';
  return 'Watch';
}

function layer(
  label: string,
  score: number | null,
): AuroraMaxEvidenceItem {
  if (score == null) {
    return { label, value: 'Unavailable', score: null, tone: 'missing' };
  }
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  return {
    label,
    value: qualitative(bounded),
    score: bounded,
    tone: bounded >= 75 ? 'confirmed' : bounded >= 55 ? 'neutral' : 'warning',
  };
}

function signalFor(row: HrWatchRow): string {
  if (row.truthStatus === 'blocked') return 'Blocked — not research-eligible';
  if (row.riskTier === 'Elite' && row.truthStatus === 'official') return 'Strong research signal';
  if (row.riskTier === 'Elite') return 'Positive, lineup pending';
  if (row.riskTier === 'Core' && row.truthStatus === 'official') return 'Positive power context';
  if (row.truthStatus !== 'official') return 'Wait for lineup truth';
  if (row.warnings.length > 0) return 'Monitor conflicting inputs';
  return 'Research row';
}

function receiptSources(row: HrWatchRow, boardSource: string | null): string[] {
  const sources = ['Validated HR board'];
  if (row.truthStatus === 'official') sources.push('Official lineup');
  if (row.truthStatus === 'projected') sources.push('Projected lineup');
  if (row.weather != null) sources.push('Weather context on board');
  if (boardSource && !sources.includes(boardSource)) sources.push(boardSource);
  return sources;
}

function missingInputs(row: HrWatchRow): string {
  const gaps: string[] = [];
  if (row.truthStatus !== 'official') gaps.push('Official batting order is unavailable.');
  if (row.pitcherName == null || row.pitcherName.trim().length === 0) {
    gaps.push('Probable pitcher is unavailable.');
  }
  if (row.weather == null) gaps.push('Weather layer is unavailable.');
  if (row.bullpen == null) gaps.push('Bullpen context is unavailable.');
  for (const warning of row.warnings) {
    const trimmed = warning.trim();
    if (trimmed) gaps.push(trimmed);
  }
  return gaps.length > 0 ? gaps.join(' ') : 'No material source gaps.';
}

export function mapHrWatchToDeskRow(
  row: HrWatchRow,
  freshness: HrBoardFreshness,
  generatedAt: Date | null,
  boardSource: string | null,
): HrMaxDeskRow {
  const brief = buildHrDecisionBrief(row, freshness, generatedAt);
  const confirmed = row.truthStatus === 'official';
  const opponent = row.opponent?.trim() || 'Opponent unavailable';
  const evidence = [
    layer('Hitter power', row.hitterPower),
    layer('Pitcher matchup', row.pitcherVulnerability),
    layer('Park environment', row.parkContext ?? row.parkFactor),
    layer('Recent contact', row.recentForm),
    {
      label: 'Lineup certainty',
      value: brief.lineupLabel,
      score: confirmed ? 90 : row.truthStatus === 'projected' ? 45 : null,
      tone: confirmed ? 'confirmed' : row.truthStatus === 'projected' ? 'warning' : 'missing',
    } satisfies AuroraMaxEvidenceItem,
  ];

  return {
    id: row.stableId,
    playerName: row.playerName,
    team: row.team,
    opponent,
    matchupLabel: `${row.team} @ ${opponent}`,
    pitcherName: row.pitcherName?.trim() || null,
    venue: row.venue?.trim() || null,
    gameTimeLabel: formatGameTime(row.gameTime),
    timeValue: parseTimeValue(row.gameTime),
    confirmed,
    truthState: truthState(row.truthStatus),
    lineupLabel: brief.lineupLabel,
    score: Math.max(0, Math.min(100, Math.round(row.hrScore))),
    attention: row.vouchScore ?? row.dataConfidence,
    signal: signalFor(row),
    read: brief.reason,
    evidenceConfidence: coverageLabel(row.dataConfidence),
    evidence,
    receipt: {
      updated: brief.freshnessLabel,
      sources: receiptSources(row, boardSource),
      missing: missingInputs(row),
      methodology:
        'HRPI is the published board hrScore. Layer values are the board’s own sub-scores. Missing layers stay labeled unavailable.',
    },
    player: toHrParlayPickerPlayer(row),
    dataStatus: confirmed ? 'official' : row.truthStatus === 'projected' ? 'projected' : 'unknown',
    reasoningSnapshot: brief.reason,
    riskSnapshot: brief.risk,
  };
}

export function sortDeskRows(rows: HrMaxDeskRow[], sortKey: DeskSortKey): HrMaxDeskRow[] {
  return [...rows].sort((left, right) => {
    if (sortKey === 'hrpi') return right.score - left.score;
    if (sortKey === 'volume') return (right.attention ?? -1) - (left.attention ?? -1);
    const leftTime = left.timeValue ?? Number.POSITIVE_INFINITY;
    const rightTime = right.timeValue ?? Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });
}

export function formatDeskDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export const SORT_LABELS: Record<DeskSortKey, string> = {
  hrpi: 'HRPI score',
  time: 'Game time',
  volume: 'Market attention',
};
