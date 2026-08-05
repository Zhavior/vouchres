import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Flame,
  Gamepad2,
  Radio,
  RefreshCw,
  Sparkles,
  UserRoundSearch,
  ChevronRight,
  BarChart3,
  Zap,
  Target,
} from 'lucide-react';
import type { CreatorProofProfile, Parlay } from '../types';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { buildBoard } from '../features/hr/utils/normalizeHrWatch';
import { useDailyReport } from '../hooks/queries/useDailyReport';
import { todayISO } from '../hooks/queries/hrBoardQuery';
import { AURORA_LABEL, AURORA_PAGE } from '../theme/auroraTokens';
import { buildTodayDecision } from './today/todayDecisionModel';
import TodayDecisionReel, { type BriefingFilter } from './today/TodayDecisionReel';
import { buildTodayReelSlides } from './today/todayDecisionReelModel';
import TodayAuroraHero, { type TodayHeroState } from './today/TodayAuroraHero';
import TodayPersonalizationPanel, { type TodayPlayerOption } from './today/TodayPersonalizationPanel';
import TodayChangeDigest from './today/TodayChangeDigest';
import TodayAccountabilityCard from './today/TodayAccountabilityCard';
import { toHrParlayPickerPlayer } from '../features/hr/utils/hrDecisionBrief';
import { openParlayAdd } from '../lib/parlays/parlayAddContract';
import { useTodayPreferences } from '../hooks/queries/useTodayPreferences';
import { MLB_TEAM_OPTIONS } from '../lib/mlbTeamOptions';
import { teamIdByName } from '../lib/teamLogos';
import { useTodayChangeDigest } from '../hooks/useTodayChangeDigest';
import type { LiveGameCard } from '../types/liveGames';
import '../styles/today-aurora.css';

interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
  profile?: CreatorProofProfile;
  isLoggedIn?: boolean;
  accountId?: string | null;
  liveGames?: LiveGameCard[];
}

type QuickRoute = {
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  label: string;
  color: string;
  bg: string;
};

const QUICK_ROUTES: QuickRoute[] = [
  { icon: Flame,          section: 'hr_board', label: 'Research',        color: 'text-vouch-emerald', bg: 'bg-vouch-emerald/10 border-vouch-emerald/30 hover:border-vouch-emerald/60 shadow-[0_0_12px_rgba(0,255,148,0.15)]' },
  { icon: UserRoundSearch,section: 'research', label: 'Player Evidence', color: 'text-violet-400',    bg: 'bg-violet-400/10 border-violet-400/30 hover:border-violet-400/60 shadow-[0_0_12px_rgba(167,139,250,0.15)]' },
  { icon: BarChart3,      section: 'results',  label: 'Track Record',    color: 'text-amber-400',     bg: 'bg-amber-400/10 border-amber-400/30 hover:border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)]' },
  { icon: Target,         section: 'build',    label: 'Save Decision',   color: 'text-vouch-cyan',    bg: 'bg-vouch-cyan/10 border-vouch-cyan/30 hover:border-vouch-cyan/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]' },
];

const BRIEFING_FILTERS: Array<{ id: BriefingFilter; label: string }> = [
  { id: 'all',      label: 'All' },
  { id: 'signals',  label: 'Signals' },
  { id: 'alerts',   label: 'Alerts' },
  { id: 'activity', label: 'Activity' },
];

export default function TodayDashboardZ8({ onSectionChange, savedSlips = [], profile, isLoggedIn = false, accountId = null, liveGames = [] }: Props) {
  const [briefingFilter, setBriefingFilter] = useState<BriefingFilter>('all');
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
  const rankedHrRows = useMemo(() => {
    const followedIds = new Set(preferences.followedPlayers.map((player) => player.id));
    const followedNames = new Set(preferences.followedPlayers.map((player) => player.name.trim().toLowerCase()));
    const favoriteTeams = new Set(preferences.favoriteMlbTeamIds);

    return visibleHrRows
      .map((row, index) => {
        const numericPlayerId = Number(row.playerId);
        const followsPlayer = (Number.isInteger(numericPlayerId) && followedIds.has(numericPlayerId))
          || followedNames.has(row.playerName.trim().toLowerCase());
        const followsTeam = favoriteTeams.has(teamIdByName(row.team) ?? -1);
        return { row, index, preferenceRank: followsPlayer ? 2 : followsTeam ? 1 : 0 };
      })
      .sort((a, b) => b.preferenceRank - a.preferenceRank || a.index - b.index)
      .map(({ row }) => row);
  }, [preferences.favoriteMlbTeamIds, preferences.followedPlayers, visibleHrRows]);
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

  const reelSlides = useMemo(
    () => buildTodayReelSlides({
      decision,
      report,
      topPlayer: rankedHrRows[0] ?? null,
      preferredTeamIds: preferences.favoriteMlbTeamIds,
    }),
    [decision, preferences.favoriteMlbTeamIds, rankedHrRows, report],
  );

  const featuredPlayer = rankedHrRows[0] ?? null;
  const heroSlide = preferences.favoriteMlbTeamIds.length > 0
    ? reelSlides.find((slide) => slide.id === 'decision') ?? reelSlides[0] ?? null
    : reelSlides[0] ?? null;
  const personalizationLabel = preferences.favoriteMlbTeamIds.length + preferences.followedPlayers.length > 0
    ? 'Ranked using your saved teams and players'
    : undefined;
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

  const addFeaturedPlayerToSlip = useMemo(() => {
    if (!featuredPlayer) return undefined;
    if (featuredPlayer.truthStatus === 'blocked') return undefined;
    return () => {
      openParlayAdd({
        player: toHrParlayPickerPlayer(featuredPlayer),
        propHint: {
          id: `hr-watch-${featuredPlayer.stableId}`,
          market: 'Home Runs',
          odds: featuredPlayer.bookOdds ?? null,
          spec: `${featuredPlayer.playerName} 1+ Home Run`,
          gamePk: featuredPlayer.gamePk ?? undefined,
          playerId: featuredPlayer.playerId ?? undefined,
        },
        initialFamily: 'home_runs',
        isPitcher: false,
        source: 'today',
        dataStatus: featuredPlayer.truthStatus === 'official' ? 'official' : featuredPlayer.truthStatus === 'projected' ? 'projected' : 'unknown',
        reasoningSnapshot: featuredPlayer.reasons[0] ?? null,
        riskSnapshot: featuredPlayer.warnings[0] ?? null,
      });
    };
  }, [featuredPlayer]);

  const activeSlip = pendingSlipList[0] ?? null;
  const isLoading = dailyReportQuery.isLoading || hrBoardQuery.loading;
  const isDegraded = dailyReportQuery.isError || hrBoardQuery.error || report?.dataQuality === 'limited';
  const statusTone = isLoading ? 'text-vouch-cyan' : isDegraded ? 'text-amber-300' : 'text-vouch-emerald';
  const statusDot = isLoading ? 'bg-vouch-cyan animate-pulse' : isDegraded ? 'bg-amber-300' : 'bg-vouch-emerald';
  const statusLabel = isLoading ? 'Syncing sources' : decision.statusLabel;
  const freshnessLabel = formatFreshness(report?.generatedAt, dailyReportQuery.dataUpdatedAt, hrBoardQuery.lastUpdated);
  const heroState: TodayHeroState = isLoading
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
  const contextualChanges = useMemo(() => {
    const enabledAlerts = new Set(preferences.inAppAlertTypes);
    const followedPlayerIds = new Set(preferences.followedPlayers.map((player) => player.id));
    const favoriteTeamIds = new Set(preferences.favoriteMlbTeamIds);

    return changeDigest.changes.filter((change) => {
      if (change.kind === 'lineup') {
        return enabledAlerts.has('followed_player_lineup')
          && change.playerId !== null
          && change.playerId !== undefined
          && followedPlayerIds.has(change.playerId);
      }
      if (change.kind === 'game-final' || change.kind === 'game-status') {
        return enabledAlerts.has('favorite_team_game_state')
          && Boolean(change.teamIds?.some((teamId) => favoriteTeamIds.has(teamId)));
      }
      return enabledAlerts.has('research_change');
    });
  }, [changeDigest.changes, preferences.favoriteMlbTeamIds, preferences.followedPlayers, preferences.inAppAlertTypes]);

  const refreshToday = () => {
    void Promise.all([dailyReportQuery.refetch(), hrBoardQuery.refresh()]);
  };

  return (
    <main className={`${AURORA_PAGE} min-h-screen w-full max-w-full min-w-0 pb-24`} id="today-dashboard" data-performance-page="today">

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#040910]/88 px-4 py-3 shadow-lg backdrop-blur-2xl">
        <div className="flex items-center gap-2.5">
          <img src="/vouchedge-mark-aurora.svg" alt="" className="h-8 w-8 object-contain drop-shadow-[0_0_14px_rgba(0,240,255,.35)]" />
          <div>
            <p className="text-sm font-black leading-none tracking-tight text-white sm:text-base">Today</p>
            <p className="text-[10px] text-slate-400 font-bold leading-none mt-1">{formatReportDate(report?.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div id="today-data-status" className="hidden items-center gap-1.5 rounded-xl border border-white/12 bg-black/40 px-3 py-1.5 font-mono text-[10px] sm:flex">
            <span className={`h-2 w-2 rounded-full ${statusDot}`} />
            <span className={`font-bold tracking-wide ${statusTone}`}>{statusLabel}</span>
          </div>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setPreferencesOpen((open) => !open)}
              aria-expanded={preferencesOpen}
              aria-controls="today-personalization-panel"
              className="inline-flex min-h-9 items-center rounded-xl border border-white/12 bg-black/40 px-2.5 text-[10px] font-bold text-white/60 transition hover:border-vouch-cyan/30 hover:text-vouch-cyan sm:px-3"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-vouch-cyan" aria-hidden="true" />
              <span className="sm:hidden">Tune</span><span className="hidden sm:inline">Personalize</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={refreshToday}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-black/40 text-slate-300 transition hover:border-vouch-cyan/30 hover:text-vouch-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vouch-cyan"
            aria-label="Refresh today's report and HR board"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-vouch-cyan' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-3 pb-8 pt-4 sm:space-y-6 sm:px-6 lg:px-8">

        <TodayAuroraHero
          decision={decision}
          displayName={profile?.displayName}
          featuredSlide={heroSlide}
          freshnessLabel={freshnessLabel}
          personalizationLabel={personalizationLabel}
          state={heroState}
          onSectionChange={onSectionChange}
        />

        {preferencesOpen ? (
          todayPreferencesQuery.isLoading ? (
            <section id="today-personalization-panel" className="rounded-3xl border border-vouch-cyan/20 bg-ve-graphite/95 p-6 text-center" aria-live="polite">
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-vouch-cyan" />
              <p className="mt-3 text-sm font-bold text-white/60">Loading your Aurora preferences…</p>
            </section>
          ) : todayPreferencesQuery.isError ? (
            <section id="today-personalization-panel" className="rounded-3xl border border-amber-300/25 bg-[#16120a]/95 p-6 text-center" role="alert">
              <p className="text-sm font-bold text-amber-200">Your preferences could not be loaded.</p>
              <button type="button" onClick={() => void todayPreferencesQuery.refetch()} className="z8-control mt-3 rounded-xl border border-amber-300/30 px-4 text-xs font-black text-amber-200">Try again</button>
            </section>
          ) : (
            <TodayPersonalizationPanel
              key={preferences.updatedAt ?? 'new-preferences'}
              preferences={preferences}
              teams={MLB_TEAM_OPTIONS}
              players={playerOptions}
              isSaving={todayPreferencesQuery.isSaving}
              saveError={todayPreferencesQuery.saveError}
              onSave={todayPreferencesQuery.savePreferences}
              onClose={() => setPreferencesOpen(false)}
            />
          )
        ) : null}

        <TodayChangeDigest
          changes={contextualChanges}
          baselineCapturedAt={changeDigest.baselineCapturedAt}
          onMarkAsChecked={changeDigest.markAsChecked}
          onOpenSubject={(change) => onSectionChange(change.kind === 'game-final' || change.kind === 'game-status' ? 'live_games' : 'hr_board')}
        />

        <section id="today-resume-card" className="group relative overflow-hidden rounded-2xl border border-vouch-cyan/20 bg-gradient-to-r from-vouch-cyan/[0.08] via-[#07131f] to-vouch-emerald/[0.07] p-4 shadow-[0_24px_70px_-48px_rgba(0,240,255,.75)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-vouch-cyan to-vouch-emerald" />
          <div className="min-w-0 pl-1">
            <p className={`${AURORA_LABEL} text-vouch-cyan`}>{decision.resumeLabel}</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">{decision.resumeTitle}</h2>
            <p className="mt-1 text-xs leading-5 text-white/48">{decision.resumeDetail}</p>
          </div>
          <button
            type="button"
            data-testid="today-resume-action"
            onClick={() => onSectionChange(decision.resumeSection)}
            className="mt-4 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 px-4 text-xs font-black text-vouch-cyan transition hover:bg-vouch-cyan/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vouch-cyan sm:mt-0 sm:w-auto"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" id="today-stat-chips">
          <StatChip icon={Gamepad2} value={report?.gameCount ?? '—'} label="MLB Games Today" color="text-vouch-emerald" glow="hover:border-vouch-emerald/40 shadow-[0_0_10px_rgba(0,255,148,0.1)]" />
          <StatChip icon={Radio}    value={decision.liveGames}        label="In-Progress"     color="text-rose-400" glow="hover:border-rose-400/40 shadow-[0_0_10px_rgba(244,63,94,0.1)]" />
          <StatChip icon={CheckCircle2} value={decision.finalGames}   label="Completed"       color="text-slate-300" glow="hover:border-white/30" />
          <StatChip icon={Activity} value={hrBoard ? visibleHrRows.length : '—'} label="Active Signals" color="text-vouch-cyan" glow="hover:border-vouch-cyan/40 shadow-[0_0_10px_rgba(0,240,255,0.1)]" />
        </div>

        {/* ── Focused beta workflow ───────────────────────────────────── */}
        <section id="today-quick-access" className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625]/90 via-[#07111e]/90 to-[#040810]/90 p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan">
                <Target className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Daily Workflow</h2>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-vouch-cyan font-black bg-vouch-cyan/10 border border-vouch-cyan/30 px-2 py-0.5 rounded-full">
              4 Core Actions
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_ROUTES.map((route) => (
              <button
                key={route.section}
                type="button"
                data-testid={`today-quick-route-${route.section}`}
                onClick={() => onSectionChange(route.section)}
                 className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vouch-cyan ${route.bg}`}
              >
                <route.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${route.color}`} />
                <span className={`text-[10px] font-black text-center leading-tight tracking-tight ${route.color}`}>{route.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Main Dashboard 2-column grid ─────────────────── */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          <div className="space-y-6">
            {/* ── Today's Briefing ───────────────────────────── */}
            <section id="today-briefing-section" className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625]/90 via-[#07111e]/90 to-[#040810]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-vouch-emerald" />
                  <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">Daily Intelligence Briefing</h2>
                </div>
                <span className={`${AURORA_LABEL} text-white/35`}>{reelSlides.length + (activeSlip ? 1 : 0)} decision cards</span>
              </div>
              <TodayDecisionReel
                slides={reelSlides}
                pendingSlip={activeSlip}
                filter={briefingFilter}
                onSectionChange={onSectionChange}
                onAddFeaturedPlayer={addFeaturedPlayerToSlip}
              />
              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 mt-3.5 no-scrollbar">
                {BRIEFING_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBriefingFilter(f.id)}
                    aria-pressed={briefingFilter === f.id}
                    className={`inline-flex min-h-8 shrink-0 items-center rounded-full border px-4 text-[11px] font-bold tracking-wide transition ${
                      briefingFilter === f.id
                        ? 'border-vouch-emerald/45 bg-vouch-emerald/15 text-vouch-emerald shadow-[0_0_12px_rgba(49,181,131,0.15)]'
                        : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/80'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

          </div>

          <div className="space-y-6 lg:sticky lg:top-20">
            <TodayAccountabilityCard savedSlips={savedSlips} finalGames={decision.finalGames} onSectionChange={onSectionChange} />
            {/* ── Active Slip card ───────────────────────────── */}
            <section id="today-active-slip">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-vouch-cyan" />
                  <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">My Active Slip</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onSectionChange('live_parlays')}
                  className="text-[11px] font-bold text-vouch-cyan hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              {activeSlip ? (
                <div className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625] to-[#050a12] overflow-hidden shadow-xl">
                  <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/[0.07]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">{activeSlip.title || 'Active Slip'}</p>
                      <p className="mt-0.5 text-[11px] text-white/40">{activeSlip.legs.length} legs · {activeSlip.mode === 'REAL' ? 'Tracked' : 'Practice'}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-black text-vouch-emerald">{activeSlip.totalOdds || 'TBD'}</span>
                  </div>
                  <div className="divide-y divide-white/[0.07]">
                    {activeSlip.legs.slice(0, 3).map((leg) => (
                      <div key={leg.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white/80">{leg.selection}</p>
                          <p className="mt-0.5 truncate text-[10px] text-white/40">{leg.market}</p>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-bold text-vouch-cyan">{formatOdds(leg.odds)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSectionChange('live_parlays')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-vouch-emerald py-2.5 text-xs font-black text-black transition hover:bg-vouch-emerald/90 shadow-[0_0_15px_rgba(0,255,148,0.3)]"
                    >
                      Open Slip <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625] to-[#050a12] flex flex-col items-center justify-center py-10 px-6 text-center">
                  <ClipboardList className="h-8 w-8 text-white/20" />
                  <p className="mt-3 text-sm font-bold text-white/60">No active slip</p>
                  <p className="mt-1 text-xs text-white/35 leading-relaxed max-w-[220px]">Research a signal and add it to start building.</p>
                  <button
                    type="button"
                    onClick={() => onSectionChange('hr_board')}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 py-2 text-xs font-black text-vouch-emerald hover:bg-vouch-emerald/20 transition shadow-[0_0_10px_rgba(0,255,148,0.15)]"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Explore signals
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <p className="pb-4 pt-4 text-center text-[10px] font-mono uppercase tracking-widest text-white/25">
          Probability-based research. No guaranteed outcomes.
        </p>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, value, label, color, glow }: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string; color: string; glow?: string }) {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 rounded-xl border border-white/10 bg-black/40 px-2 py-2 sm:px-3 sm:py-2.5 transition ${glow ?? ''}`}>
      <div className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-black/60 border border-white/10 ${color}`}>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs sm:text-sm font-black leading-none text-white truncate">{value}</p>
        <p className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate mt-0.5">{label}</p>
      </div>
    </div>
  );
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

function formatOdds(odds: number | null) {
  if (odds === null || !Number.isFinite(odds)) return 'TBD';
  return odds > 0 ? `+${odds}` : String(odds);
}
