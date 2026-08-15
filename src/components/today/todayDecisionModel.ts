import type { DailyMlbReport } from '../../types/mlb';

export type TodayDecisionTone = 'cyan' | 'emerald' | 'amber';
export type TodayAttentionKind = 'data' | 'slate' | 'action';

export interface TodayAttentionItem {
  id: string;
  kind: TodayAttentionKind;
  label: string;
  value: string;
  detail: string;
  section?: string;
}

export interface TodayDecision {
  tone: TodayDecisionTone;
  statusLabel: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaSection: string;
  attention: TodayAttentionItem[];
  resumeLabel: string;
  resumeTitle: string;
  resumeDetail: string;
  resumeSection: string;
  liveGames: number;
  upcomingGames: number;
  finalGames: number;
}

interface TodayDecisionInput {
  report: DailyMlbReport | null;
  loading: boolean;
  hasError: boolean;
  savedSlips: number;
  pendingSlips: number;
  hrSignalCount: number | null;
  hrSignalsLoading: boolean;
}

const LIVE_STATUS = /live|in progress|manager challenge|delayed/i;
const FINAL_STATUS = /final|game over|completed/i;

function gameStateCounts(report: DailyMlbReport | null) {
  let liveGames = 0;
  let finalGames = 0;

  for (const game of report?.games ?? []) {
    if (LIVE_STATUS.test(game.status)) liveGames += 1;
    else if (FINAL_STATUS.test(game.status)) finalGames += 1;
  }

  return {
    liveGames,
    finalGames,
    upcomingGames: Math.max(0, (report?.gameCount ?? 0) - liveGames - finalGames),
  };
}

function qualityCopy(report: DailyMlbReport | null, loading: boolean, hasError: boolean) {
  if (loading) {
    return {
      statusLabel: 'Syncing',
      value: 'Checking sources',
      detail: 'Today\'s slate and research signals are loading.',
    };
  }

  if (hasError || !report) {
    return {
      statusLabel: 'Degraded',
      value: 'Daily brief unavailable',
      detail: 'VouchEdge cannot verify the complete daily report right now.',
    };
  }

  const normalized = String(report.dataQuality || 'limited').toLowerCase();
  if (normalized === 'full') {
    return {
      statusLabel: 'Report complete',
      value: 'Sources available',
      detail: 'The report loaded without a source gap. Confirm lineup status on the HR board.',
    };
  }

  if (normalized === 'partial') {
    return {
      statusLabel: 'Partial data',
      value: 'Some inputs missing',
      detail: 'Use the board, but verify missing lineup or matchup context.',
    };
  }

  return {
    statusLabel: 'Limited data',
    value: 'Research is incomplete',
    detail: 'Treat available signals as preliminary until more data arrives.',
  };
}

export function buildTodayDecision({
  report,
  loading,
  hasError,
  savedSlips,
  pendingSlips,
  hrSignalCount,
  hrSignalsLoading,
}: TodayDecisionInput): TodayDecision {
  const { liveGames, upcomingGames, finalGames } = gameStateCounts(report);
  const quality = qualityCopy(report, loading, hasError);
  const availableHrSignals = hrSignalCount ?? 0;

  let primary: Pick<TodayDecision, 'tone' | 'title' | 'description' | 'ctaLabel' | 'ctaSection'>;

  if (loading) {
    primary = {
      tone: 'cyan',
      title: 'Building today\'s decision brief',
      description: 'VouchEdge is checking the slate, matchup inputs, and your saved research before recommending a next step.',
      ctaLabel: 'Open HR Intelligence',
      ctaSection: 'hr_board',
    };
  } else if (pendingSlips > 0) {
    primary = {
      tone: liveGames > 0 ? 'emerald' : 'cyan',
      title: `${pendingSlips} saved slip${pendingSlips === 1 ? '' : 's'} need${pendingSlips === 1 ? 's' : ''} your attention`,
      description: liveGames > 0
        ? 'Games are underway. Check leg progress and changing game context before doing more research.'
        : 'Review pending legs, lineup status, and current context before adding anything new.',
      ctaLabel: pendingSlips === 1 ? 'Monitor saved slip' : 'Monitor saved slips',
      ctaSection: 'live_parlays',
    };
  } else if (liveGames > 0) {
    primary = {
      tone: 'emerald',
      title: `${liveGames} MLB game${liveGames === 1 ? ' is' : 's are'} live`,
      description: 'The slate has moved from pregame research to live context. Track the games before making another decision.',
      ctaLabel: 'Track live games',
      ctaSection: 'live_games',
    };
  } else if (report && report.gameCount === 0) {
    primary = {
      tone: 'amber',
      title: 'No MLB games are scheduled today',
      description: 'There is no slate to force. Use the day to review verified outcomes and improve your process.',
      ctaLabel: 'Review results ledger',
      ctaSection: 'results',
    };
  } else if (availableHrSignals > 0) {
    primary = {
      tone: report?.dataQuality === 'full' ? 'emerald' : 'cyan',
      title: 'Today\'s HR research board is available',
      description: `${availableHrSignals} research signal${availableHrSignals === 1 ? '' : 's'} available on the HR board. Compare the evidence and risks before choosing a player.`,
      ctaLabel: 'Review HR Intelligence',
      ctaSection: 'hr_board',
    };
  } else if (hrSignalsLoading && report && report.gameCount > 0) {
    primary = {
      tone: 'cyan',
      title: 'Today\'s HR research board is syncing',
      description: 'The slate is available, but VouchEdge is still verifying the player pool. No signal count is shown until the board finishes loading.',
      ctaLabel: 'Open HR Intelligence',
      ctaSection: 'hr_board',
    };
  } else if (report && report.gameCount > 0) {
    primary = {
      tone: 'amber',
      title: 'Today\'s slate is still taking shape',
      description: `${report.gameCount} game${report.gameCount === 1 ? '' : 's'} are scheduled, but no HR research signals are ready yet. Check player availability first.`,
      ctaLabel: 'Check today\'s players',
      ctaSection: 'daily_players',
    };
  } else {
    primary = {
      tone: 'amber',
      title: 'Today\'s brief is temporarily limited',
      description: 'VouchEdge cannot verify enough daily-report data to recommend a signal. No replacement picks have been invented.',
      ctaLabel: 'Check live game status',
      ctaSection: 'live_games',
    };
  }

  const slateValue = report
    ? `${report.gameCount} game${report.gameCount === 1 ? '' : 's'}`
    : 'Slate not verified';
  const slateDetail = report
    ? `${liveGames} live · ${upcomingGames} upcoming · ${finalGames} final`
    : 'Open Live Games to retry the current schedule.';

  const actionItem: TodayAttentionItem = pendingSlips > 0
    ? {
        id: 'saved-slips',
        kind: 'action',
        label: 'Saved slips',
        value: `${pendingSlips} pending`,
        detail: 'Review unresolved legs and current game context.',
        section: 'live_parlays',
      }
    : availableHrSignals > 0
      ? {
          id: 'hr-research',
          kind: 'action',
          label: 'HR research',
          value: `${availableHrSignals} signal${availableHrSignals === 1 ? '' : 's'} available`,
          detail: 'Open the board for player-level evidence and risk.',
          section: 'hr_board',
        }
      : hrSignalsLoading && report?.gameCount
        ? {
            id: 'hr-research-syncing',
            kind: 'action',
            label: 'HR research',
            value: 'Board syncing',
            detail: 'Waiting for the canonical player pool before showing a count.',
            section: 'hr_board',
          }
      : {
          id: 'lineup-status',
          kind: 'action',
          label: 'Player availability',
          value: report?.gameCount ? 'Needs verification' : 'No action required',
          detail: report?.gameCount
            ? 'Check projected and confirmed player availability.'
            : 'There is no active MLB research slate to review.',
          section: report?.gameCount ? 'daily_players' : undefined,
        };

  const resume = pendingSlips > 0
    ? {
        resumeLabel: 'Continue tracking',
        resumeTitle: `${pendingSlips} unresolved slip${pendingSlips === 1 ? '' : 's'}`,
        resumeDetail: 'Return to the exact work already in progress.',
        resumeSection: 'live_parlays',
      }
    : savedSlips > 0
      ? {
          resumeLabel: 'Continue your record',
          resumeTitle: `${savedSlips} saved slip${savedSlips === 1 ? '' : 's'}`,
          resumeDetail: 'Review outcomes and keep wins and losses visible.',
          resumeSection: 'results',
        }
      : {
          resumeLabel: 'Start the daily loop',
          resumeTitle: 'Research one decision deeply',
          resumeDetail: 'Compare the evidence, identify the main risk, then decide whether it belongs in a slip.',
          resumeSection: 'hr_board',
        };

  return {
    ...primary,
    statusLabel: quality.statusLabel,
    attention: [
      {
        id: 'data-quality',
        kind: 'data',
        label: 'Data status',
        value: quality.value,
        detail: quality.detail,
      },
      {
        id: 'slate-status',
        kind: 'slate',
        label: 'Slate status',
        value: slateValue,
        detail: slateDetail,
        section: report ? 'live_games' : undefined,
      },
      actionItem,
    ],
    ...resume,
    liveGames,
    upcomingGames,
    finalGames,
  };
}
