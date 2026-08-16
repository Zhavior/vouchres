import { buildHrDecisionBrief } from '../../hr/utils/hrDecisionBrief';
import type { HrWatchRow } from '../../hr/types/hrWatch';

export type TicketPip = {
  key: string;
  tone: 'confirmed' | 'neutral' | 'warning' | 'missing';
  label: string;
};

export type HrHitTier = 'none' | 'single' | 'multi';

export interface HrHitStatus {
  tier: HrHitTier;
  count: number;
  badgeLabel: string | null;
}

/**
 * Strictly returns whether the player hit a Home Run TODAY (in today's game).
 * Does NOT consider historical past multi-game stats.
 */
export function getHrHitStatus(row: HrWatchRow): HrHitStatus {
  const rawStats = row.raw as Record<string, any> | undefined;
  const todayCount = 
    (typeof (row as any).liveHomeRuns === 'number' ? (row as any).liveHomeRuns : null) ?? 
    (typeof (row as any).homeRunsToday === 'number' ? (row as any).homeRunsToday : null) ?? 
    (typeof rawStats?.liveHomeRuns === 'number' ? rawStats.liveHomeRuns : null) ?? 
    (typeof rawStats?.homeRunsToday === 'number' ? rawStats.homeRunsToday : null) ?? 
    (typeof rawStats?.hrToday === 'number' ? rawStats.hrToday : null) ?? 
    (typeof rawStats?.todayHomeRuns === 'number' ? rawStats.todayHomeRuns : null) ?? 
    (typeof rawStats?.boxscore?.homeRuns === 'number' ? rawStats.boxscore.homeRuns : null) ?? 
    (typeof rawStats?.gameStats?.homeRuns === 'number' ? rawStats.gameStats.homeRuns : null) ?? 
    0;

  if (todayCount >= 2) {
    return {
      tier: 'multi',
      count: todayCount,
      badgeLabel: `${todayCount}x HR TODAY`,
    };
  }
  if (todayCount === 1) {
    return {
      tier: 'single',
      count: 1,
      badgeLabel: 'HR TODAY',
    };
  }
  return {
    tier: 'none',
    count: 0,
    badgeLabel: null,
  };
}

export function formatGameTime(gameTime: string | null): string {
  if (!gameTime?.trim()) return 'Time unavailable';
  const iso = Date.parse(gameTime);
  if (Number.isFinite(iso)) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return gameTime.trim();
}

function qualitative(score: number): string {
  if (score >= 75) return 'Favorable';
  if (score >= 55) return 'Neutral';
  return 'Watch';
}

function getTone(score: number | null): TicketPip['tone'] {
  if (score == null) return 'missing';
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  if (bounded >= 75) return 'confirmed';
  if (bounded >= 55) return 'neutral';
  return 'warning';
}

function layerLabel(label: string, score: number | null): TicketPip {
  if (score == null) {
    return { key: label, tone: 'missing', label: `${label} Unavailable` };
  }
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  return {
    key: label,
    tone: getTone(score),
    label: `${label} · ${qualitative(bounded)}`,
  };
}

export function extractCardData(row: HrWatchRow) {
  const brief = buildHrDecisionBrief(row, 'fresh', null);
  const confirmed = row.truthStatus === 'official';
  const opponent = row.opponent?.trim() || 'Opponent unavailable';
  const matchupLabel = `${row.team} @ ${opponent} · ${formatGameTime(row.gameTime)}`;
  const hrStatus = getHrHitStatus(row);

  const pips: TicketPip[] = [
    layerLabel('Power', row.hitterPower),
    layerLabel('Pitcher', row.pitcherVulnerability),
    layerLabel('Park', row.parkContext ?? row.parkFactor),
  ];

  let bestPip = pips[0];
  let bestRank = -1;
  const TONE_RANK = { confirmed: 4, neutral: 3, warning: 2, missing: 0 };
  for (const pip of pips) {
    const rank = TONE_RANK[pip.tone];
    if (rank > bestRank) {
      bestPip = pip;
      bestRank = rank;
    }
  }

  let catalyst = 'Research row';
  if (hrStatus.tier === 'multi') {
    catalyst = `👑 Homered ${hrStatus.count}x Today!`;
  } else if (hrStatus.tier === 'single') {
    catalyst = '💥 Homered Today!';
  } else if (bestPip && bestRank > 0) {
    catalyst = bestPip.label;
  } else if (row.truthStatus === 'blocked') {
    catalyst = 'Blocked — not research-eligible';
  } else if (row.riskTier === 'Elite' && row.truthStatus === 'official') {
    catalyst = 'Strong research signal';
  } else if (row.riskTier === 'Elite') {
    catalyst = 'Positive, lineup pending';
  } else if (row.riskTier === 'Core' && row.truthStatus === 'official') {
    catalyst = 'Positive power context';
  } else if (row.truthStatus !== 'official') {
    catalyst = 'Wait for lineup truth';
  }

  let evEdge: number | null = null;
  const hrProb = typeof row.hrProbability === 'number' && Number.isFinite(row.hrProbability) ? row.hrProbability : null;
  const impliedProb = typeof row.impliedProbability === 'number' && Number.isFinite(row.impliedProbability) ? row.impliedProbability : null;
  if (hrProb != null && impliedProb != null && impliedProb > 0) {
    evEdge = Math.round(((hrProb - impliedProb) / impliedProb) * 1000) / 10;
  }

  const bookOddsLabel = row.oddsLabel?.trim()
    ? row.oddsLabel.trim()
    : typeof row.bookOdds === 'number' && Number.isFinite(row.bookOdds)
      ? `${row.bookOdds > 0 ? '+' : ''}${row.bookOdds}`
      : null;

  // Receipt generation
  const sources = ['Validated HR board'];
  if (row.truthStatus === 'official') sources.push('Official lineup');
  if (row.truthStatus === 'projected') sources.push('Projected lineup');
  if (row.weather != null) sources.push('Weather context on board');
  if (hrStatus.tier !== 'none') sources.push("Verified Today's MLB Live Boxscore");

  const gaps: string[] = [];
  if (row.truthStatus !== 'official') gaps.push('Official batting order is unavailable.');
  if (row.pitcherName == null || row.pitcherName.trim().length === 0) gaps.push('Probable pitcher is unavailable.');
  if (row.weather == null) gaps.push('Weather layer is unavailable.');
  if (row.bullpen == null) gaps.push('Bullpen context is unavailable.');
  for (const warning of row.warnings) {
    const trimmed = warning.trim();
    if (trimmed) gaps.push(trimmed);
  }

  const receipt = {
    updated: brief.freshnessLabel,
    sources,
    missing: gaps.length > 0 ? gaps.join(' ') : 'No material source gaps.',
    methodology: 'HRPI is the published board hrScore. Layer values are the board’s own sub-scores. Missing layers stay labeled unavailable.',
  };

  return {
    matchupLabel,
    catalyst,
    pips,
    lineupLabel: brief.lineupLabel,
    confirmed,
    score: Math.max(0, Math.min(100, Math.round(row.hrScore))),
    evEdge,
    bookOddsLabel,
    recentHrs: row.recentHomeRuns,
    hrStatus,
    receipt,
  };
}
