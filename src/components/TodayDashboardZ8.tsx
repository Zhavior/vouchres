import React, { Suspense, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Flame,
  Gamepad2,
  LayoutTemplate,
  Radio,
  RefreshCw,
  Sparkles,
  Target,
  UserRoundSearch,
} from 'lucide-react';
import type { CreatorProofProfile, Parlay } from '../types';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { buildBoard } from '../features/hr/utils/normalizeHrWatch';
import { useDailyReport } from '../hooks/queries/useDailyReport';
import { todayISO } from '../hooks/queries/hrBoardQuery';
import { AURORA_PAGE } from '../theme/auroraTokens';
import { buildTodayDecision } from './today/todayDecisionModel';
import TodayFieldDesk, { type TodayFieldState } from './today/TodayFieldDesk';
import type { TodayPlayerOption } from './today/TodayPersonalizationPanel';
import TodayAccountabilityCard from './today/TodayAccountabilityCard';
import TodayChangeDigest from './today/TodayChangeDigest';
import { toHrParlayPickerPlayer } from '../features/hr/utils/hrDecisionBrief';
import type { HrWatchRow } from '../features/hr/types/hrWatch';
import { openParlayAdd } from '../lib/parlays/parlayAddContract';
import { useTodayPreferences } from '../hooks/queries/useTodayPreferences';
import { MLB_TEAM_OPTIONS } from '../lib/mlbTeamOptions';
import { teamIdByName } from '../lib/teamLogos';
import { useTodayChangeDigest } from '../hooks/useTodayChangeDigest';
import type { LiveGameCard } from '../types/liveGames';
import {
  AuroraMaxCommandHeader,
  AuroraMaxControl,
  AuroraMaxEyebrow,
  AuroraMaxFallback,
  AuroraMaxMetricStrip,
  AuroraMaxPanel,
  AuroraMaxRankedWorkspace,
  AuroraMaxProductMark,
  AuroraMaxTruthBadge,
} from './aurora-max/AuroraMaxPrimitives';

const TodayPersonalizationPanel = React.lazy(() => import('./today/TodayPersonalizationPanel'));

interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
  profile?: CreatorProofProfile;
  isLoggedIn?: boolean;
  accountId?: string | null;
  liveGames?: LiveGameCard[];
}

export default function TodayDashboardZ8({ onSectionChange, savedSlips = [], isLoggedIn = false, accountId = null, liveGames = [] }: Props) {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const dailyReportQuery = useDailyReport();
  const hrBoardQuery = useDailyHrBoard(todayISO());
  const todayPreferencesQuery = useTodayPreferences(isLoggedIn);
  const preferences = todayPreferencesQuery.preferences;
  const report = dailyReportQuery.data ?? null;
  const hrBoard = useMemo(
    () => hrBoardQuery.data ? buildBoard(hrBoardQuery.data) : null,
    [hrBoardQuery.data],
  );
  const visibleHrRows = useMemo(() => {
    if (!hrBoard) return [];
    if (hrBoard.confirmed.length > 0) return hrBoard.confirmed;
    if (hrBoard.curated.length > 0) return hrBoard.curated;
    return hrBoard.all;
  }, [hrBoard]);
  const rankedHrRows = useMemo(
    () => rankRowsForPreferences(visibleHrRows, preferences.favoriteMlbTeamIds, preferences.followedPlayers),
    [preferences.favoriteMlbTeamIds, preferences.followedPlayers, visibleHrRows],
  );
  const rankedConfirmedRows = useMemo(
    () => rankRowsForPreferences(hrBoard?.confirmed ?? [], preferences.favoriteMlbTeamIds, preferences.followedPlayers),
    [hrBoard, preferences.favoriteMlbTeamIds, preferences.followedPlayers],
  );
  const pendingSlipList = useMemo(
    () => savedSlips.filter((slip) => String(slip.status || 'PENDING').toUpperCase() === 'PENDING'),
    [savedSlips],
  );
  const decision = useMemo(
    () => buildTodayDecision({
      report,
      loading: dailyReportQuery.isLoading,
      hasError: dailyReportQuery.isError,
      savedSlips: savedSlips.length,
      pendingSlips: pendingSlipList.length,
      hrSignalCount: hrBoard ? visibleHrRows.length : null,
      hrSignalsLoading: hrBoardQuery.loading,
    }),
    [dailyReportQuery.isError, dailyReportQuery.isLoading, hrBoard, hrBoardQuery.loading, pendingSlipList.length, report, savedSlips.length, visibleHrRows.length],
  );

  const playerOptions = useMemo<TodayPlayerOption[]>(() => {
    const fromBoard = rankedHrRows.flatMap((row) => {
      const id = Number(row.playerId);
      if (!Number.isInteger(id) || id <= 0) return [];
      return [{ id, name: row.playerName, team: row.team, headshotUrl: row.headshotUrl }];
    });
    const visibleIds = new Set(fromBoard.map((player) => player.id));
    const savedPlayers = preferences.followedPlayers
      .filter((player) => !visibleIds.has(player.id))
      .map((player) => ({ ...player, team: 'Saved player', headshotUrl: null }));
    return [...fromBoard, ...savedPlayers].slice(0, 50);
  }, [preferences.followedPlayers, rankedHrRows]);

  const addPlayerToSlip = (player: HrWatchRow) => {
    if (player.truthStatus === 'blocked') return;
    openParlayAdd({
        player: toHrParlayPickerPlayer(player),
        propHint: {
          id: `hr-watch-${player.stableId}`,
          market: 'Home Runs',
          odds: player.bookOdds ?? null,
          spec: `${player.playerName} 1+ Home Run`,
          gamePk: player.gamePk ?? undefined,
          playerId: player.playerId ?? undefined,
        },
        initialFamily: 'home_runs',
        isPitcher: false,
        source: 'today',
        dataStatus: player.truthStatus === 'official' ? 'official' : player.truthStatus === 'projected' ? 'projected' : 'unknown',
        reasoningSnapshot: player.reasons[0] ?? null,
        riskSnapshot: player.warnings[0] ?? null,
    });
  };

  const isLoading = dailyReportQuery.isLoading || hrBoardQuery.loading;
  const isDegraded = dailyReportQuery.isError || hrBoardQuery.error || report?.dataQuality === 'limited';
  const statusLabel = isLoading ? 'Syncing sources' : decision.statusLabel;
  const freshnessLabel = formatFreshness(report?.generatedAt, dailyReportQuery.dataUpdatedAt, hrBoardQuery.lastUpdated);
  const heroState: TodayFieldState = isLoading
    ? 'loading'
    : isDegraded
      ? 'degraded'
      : report?.gameCount === 0
        ? 'no-slate'
        : decision.liveGames > 0
          ? 'live'
          : decision.upcomingGames > 0
            ? 'pregame'
            : 'postgame';

  const changeDigest = useTodayChangeDigest({
    accountId,
    report,
    hrRows: visibleHrRows,
    liveGames,
    enabled: isLoggedIn && !isLoading && !isDegraded,
  });

  const refreshToday = () => {
    void Promise.all([dailyReportQuery.refetch(), hrBoardQuery.refresh()]);
  };

  return (
    <main className="aurora-max-shell min-h-full" id="today-dashboard" data-performance-page="today">

      <header className="sticky top-0 z-30 border-b border-[var(--aurora-max-line)] bg-[rgba(5,11,13,0.82)] px-4 backdrop-blur-[18px] sm:px-6">
        <div className="flex min-h-14 items-center justify-between gap-3">
          <AuroraMaxProductMark />
          <div className="flex items-center gap-2">
            <span className="hidden border-r border-white/[0.07] pr-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/30 sm:inline">Daily session</span>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8bcda0] sm:flex">Sources fresh</span>
          <span id="today-data-status" className="hidden sm:inline-flex">
            <AuroraMaxTruthBadge state={isLoading ? 'missing' : isDegraded ? 'warning' : 'confirmed'}>{statusLabel}</AuroraMaxTruthBadge>
          </span>
          {isLoggedIn ? (
            <AuroraMaxControl
              onClick={() => setPreferencesOpen((open) => !open)}
              aria-expanded={preferencesOpen}
              aria-controls="today-personalization-panel"
              className="min-h-9 px-2.5 sm:px-3"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-vouch-cyan" aria-hidden="true" />
              <span className="sm:hidden">Tune</span><span className="hidden sm:inline">Personalize</span>
            </AuroraMaxControl>
          ) : null}
          <AuroraMaxControl
            onClick={refreshToday}
            className="h-9 w-9 p-0"
            aria-label="Refresh today's report and HR board"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-vouch-cyan' : ''}`} />
          </AuroraMaxControl>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1240px] space-y-4 px-3 pb-8 pt-4 sm:space-y-5 sm:px-6">

        <AuroraMaxCommandHeader
          eyebrow={<span className="flex items-center gap-2"><Radio className="h-3 w-3" /> {formatReportDate(report?.date)}</span>}
          title="Research command desk"
          description={`Today’s VouchEdge slate · ${freshnessLabel}`}
          meta={<div className="grid grid-cols-3 border border-white/[0.07] bg-[#0a110d]">
            {[{ value: report?.gameCount ?? '—', label: 'Matchups' }, { value: rankedConfirmedRows.length, label: 'Confirmed' }, { value: decision.liveGames, label: 'Live' }].map((item, index) => <div key={item.label} className={`min-w-20 px-3 py-2 ${index ? 'border-l border-white/[0.07]' : ''}`}><p className="font-mono text-[13px] font-semibold text-[#e8ebe4]">{item.value}</p><p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/25">{item.label}</p></div>)}
          </div>}
        />

        <TodayFieldDesk
          rows={rankedHrRows}
          confirmedRows={rankedConfirmedRows}
          freshnessLabel={freshnessLabel}
          state={heroState}
          gameCount={report?.gameCount ?? null}
          liveGames={decision.liveGames}
          onAddPlayer={addPlayerToSlip}
          onResearch={() => onSectionChange('hr_board')}
        />

        {preferencesOpen ? <Suspense fallback={null}><TodayPersonalizationPanel
          key={preferences.updatedAt ?? 'new-preferences'}
          preferences={preferences}
          teams={MLB_TEAM_OPTIONS}
          players={playerOptions}
          isSaving={todayPreferencesQuery.isSaving}
          saveError={todayPreferencesQuery.saveError}
          onSave={todayPreferencesQuery.savePreferences}
          onClose={() => setPreferencesOpen(false)}
        /></Suspense> : null}

        <TodayChangeDigest
          changes={changeDigest.changes}
          baselineCapturedAt={changeDigest.baselineCapturedAt}
          onMarkAsChecked={changeDigest.markAsChecked}
          onOpenSubject={() => onSectionChange('hr_board')}
        />

        <AuroraMaxPanel as="section" id="today-resume-card" className="p-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="min-w-0">
            <AuroraMaxEyebrow>{decision.resumeLabel}</AuroraMaxEyebrow>
            <h2 className="mt-1 text-lg font-semibold text-white">{decision.resumeTitle}</h2>
            <p className="mt-1 text-xs leading-5 text-white/45">{decision.resumeDetail}</p>
          </div>
          <AuroraMaxControl onClick={() => onSectionChange(decision.resumeSection)} className="mt-4 min-h-11 w-full shrink-0 sm:mt-0 sm:w-auto">
            Continue <ArrowRight className="h-4 w-4" />
          </AuroraMaxControl>
        </AuroraMaxPanel>

        <AuroraMaxMetricStrip
          className=""
          items={[
            { icon: <Gamepad2 className="h-4 w-4" />, value: report?.gameCount ?? '—', label: 'Matchups', tone: report?.gameCount != null ? 'confirmed' : 'neutral' },
            { icon: <Radio className="h-4 w-4" />, value: decision.liveGames, label: 'Live now', tone: decision.liveGames > 0 ? 'live' : 'neutral' },
            { icon: <CheckCircle2 className="h-4 w-4" />, value: decision.finalGames, label: 'Final', tone: 'neutral' },
            { icon: <Activity className="h-4 w-4" />, value: hrBoard ? visibleHrRows.length : '—', label: 'Research rows', tone: hrBoard ? 'confirmed' : 'neutral' },
          ]}
        />

        <AuroraMaxRankedWorkspace
          title="Research tools"
          subtitle="Move from the daily desk into the next evidence workspace."
          controls={<AuroraMaxTruthBadge state="confirmed">Canonical routes</AuroraMaxTruthBadge>}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: LayoutTemplate, section: 'hr_aurora_max', label: 'Aurora Max', detail: 'Field desk HR board' },
              { icon: Flame, section: 'hr_board', label: 'Research board', detail: 'Ranked HR evidence' },
              { icon: UserRoundSearch, section: 'research', label: 'Player evidence', detail: 'Source dossiers' },
              { icon: BarChart3, section: 'results', label: 'Track record', detail: 'Projection vs outcome' },
              { icon: Target, section: 'build', label: 'Build decision', detail: 'Start a tracked slip' },
            ].map(({ icon: Icon, section, label, detail }) => (
              <AuroraMaxControl key={section} onClick={() => onSectionChange(section)} className="min-h-16 flex-col items-start p-3 text-left">
                <span className="flex items-center gap-2 text-[10px] font-bold text-white/78"><Icon className="h-4 w-4 text-vouch-cyan" />{label}</span>
                <span className="text-[9px] text-white/34">{detail}</span>
              </AuroraMaxControl>
            ))}
          </div>
        </AuroraMaxRankedWorkspace>

        <div className="grid gap-4 lg:grid-cols-2">
          <TodayAccountabilityCard savedSlips={savedSlips} finalGames={decision.finalGames} onSectionChange={onSectionChange} />
          <AuroraMaxPanel as="section" id="today-active-slip" className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-vouch-cyan" /><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Open slip</h2></div>
              <AuroraMaxControl onClick={() => onSectionChange('live_parlays')} className="min-h-9">Workspace <ChevronRight className="h-3 w-3" /></AuroraMaxControl>
            </div>
            {pendingSlipList[0] ? (
              <div className="mt-3 border border-white/[0.07] bg-black/20 p-3">
                <p className="truncate text-sm font-semibold text-white">{pendingSlipList[0].title || 'Active slip'}</p>
                <p className="mt-1 text-[11px] text-white/40">{pendingSlipList[0].legs.length} legs · {pendingSlipList[0].mode === 'REAL' ? 'Tracked' : 'Practice'}</p>
            <AuroraMaxControl tone="primary" onClick={() => onSectionChange('live_parlays')} className="!border-[rgba(0,217,160,0.4)] !bg-[var(--aurora-max-emerald)] !text-[#02100d] mt-3 w-full">Open slip <ArrowRight className="h-3.5 w-3.5" /></AuroraMaxControl>
              </div>
            ) : <AuroraMaxFallback compact title="No active slip" detail="Research a signal and add it to start a tracked decision." action={<AuroraMaxControl onClick={() => onSectionChange('hr_board')} className="mt-3">Explore signals</AuroraMaxControl>} />}
          </AuroraMaxPanel>
        </div>

        <div className="mt-4 grid gap-2 border border-white/[0.07] bg-[#0a110d] p-3 sm:grid-cols-3">
          {[
            'Every row keeps its research receipt.',
            'Freshness is visible at decision time.',
            'Missing inputs remain explicitly labeled.',
          ].map((text) => <div key={text} className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/35">{text}</div>)}
        </div>
      </div>
    </main>
  );
}

function rankRowsForPreferences(
  rows: readonly HrWatchRow[],
  favoriteTeamIds: readonly number[],
  followedPlayers: ReadonlyArray<{ id: number; name: string }>,
) {
  const followedIds = new Set(followedPlayers.map((player) => player.id));
  const followedNames = new Set(followedPlayers.map((player) => player.name.trim().toLowerCase()));
  const favoriteTeams = new Set(favoriteTeamIds);

  return rows
    .map((row, index) => {
      const numericPlayerId = Number(row.playerId);
      const followsPlayer = (Number.isInteger(numericPlayerId) && followedIds.has(numericPlayerId))
        || followedNames.has(row.playerName.trim().toLowerCase());
      const followsTeam = favoriteTeams.has(teamIdByName(row.team) ?? -1);
      return { row, index, preferenceRank: followsPlayer ? 2 : followsTeam ? 1 : 0 };
    })
    .sort((left, right) => right.preferenceRank - left.preferenceRank || left.index - right.index)
    .map(({ row }) => row);
}

function formatReportDate(value?: string) {
  const parsed = value ? new Date(`${value}T12:00:00`) : new Date();
  return parsed.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatFreshness(reportGeneratedAt?: string, reportUpdatedAt?: number, boardUpdatedAt?: Date | null) {
  const candidates = [
    reportGeneratedAt ? new Date(reportGeneratedAt).getTime() : Number.NaN,
    reportUpdatedAt ?? Number.NaN,
    boardUpdatedAt?.getTime() ?? Number.NaN,
  ].filter(Number.isFinite);

  if (candidates.length === 0) return 'Update time unavailable';

  const oldest = Math.min(...candidates);
  const ageMinutes = Math.max(0, Math.floor((Date.now() - oldest) / 60_000));
  if (ageMinutes < 1) return 'Updated just now';
  if (ageMinutes < 60) return `Updated ${ageMinutes}m ago`;

  return `Updated ${new Date(oldest).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}
