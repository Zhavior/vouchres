import { getExperimentVariant } from '../../lib/experiments';
import React, { Suspense, lazy, memo } from 'react';
import RouteShellSkeleton from '../boot/RouteShellSkeleton';
import FadeInMount from '../system/FadeInMount';
import { useAppShell } from '../../context/AppShellContext';
import { useAppCommandStore } from '../../stores/appCommandStore';
import { useParlayOsStore } from '../../stores/parlayOsStore';
import { useFeedQuery } from '../../hooks/queries/useFeedQuery';

const ProAccessGate = lazy(() =>
  import('../pro/ProAccessGate').then((module) => ({ default: module.ProAccessGate })),
);
const PersonalizedOnboarding = lazy(() =>
  import('../onboarding/PersonalizedOnboarding').then((module) => ({
    default: module.PersonalizedOnboarding,
  })),
);
const FollowingHubPage = lazy(() => import('../../pages/FollowingHubPage'));
const HomeFeedPage = lazy(() => import('../../social/feed/HomeFeedPage'));
const TodayDashboard = lazy(() => import('../TodayDashboard'));
const VouchEdgeTerminalPage = lazy(() => import('../../pages/VouchEdgeTerminalPage'));
const VouchBoard = lazy(() => import('../VouchBoard'));
const ProfilePage = lazy(() => import('../ProfilePage'));
const SettingsPage = lazy(() => import('../SettingsPage'));
const PremiumSubPage = lazy(() => import('../PremiumSubPage'));
const PlayerResearchHub = lazy(() => import('../PlayerResearchHub'));
const CustomizePage = lazy(() => import('../CustomizePage'));
const ResultsStudio = lazy(() => import('../results/ResultsStudio'));
const SmartAiEngine = lazy(() => import('../SmartAiEngine'));
const MlbIntelligenceHub = lazy(() => import('../MlbIntelligenceHub'));
const Leaderboard = lazy(() => import('../Leaderboard'));
const SubscriberHub = lazy(() => import('../SubscriberHub'));
const HomeRunIntelligencePage = lazy(() => import('../../features/hr/pages/HomeRunIntelligencePage'));
const AiPilotPage = lazy(() => import('../../features/ai/pages/AiPilotPage'));
const MlbStatHubPage = lazy(() => import('../../features/mlb-stats/pages/MlbStatHubPage'));
const DailyPlayersPage = lazy(() => import('../../pages/DailyPlayersPage'));
const LiveGamesPro = lazy(() => import('../LiveGamesPro'));
const NotificationsPage = lazy(() => import('../notifications/NotificationsPage'));
const PlayerEdgeLabPage = lazy(() => import('../../pages/pro/PlayerEdgeLabPage'));
const TeamMatchupLabPage = lazy(() => import('../../pages/pro/TeamMatchupLabPage'));
const HitterMatchupZonesPage = lazy(() => import('../../pages/pro/HitterMatchupZonesPage'));
const ProGraphsLabPage = lazy(() => import('../../pages/pro/ProGraphsLabPage'));
const ProCommandCenterPage = lazy(() => import('../../pages/pro/ProCommandCenterPage'));
const ParlayOsWorkspace = lazy(() => import('../parlay/ParlayOsWorkspace'));
const ParlayProofPage = lazy(() => import('../../pages/ParlayProofPage'));
const NbaNflArena = lazy(() => import('../NbaNflArena'));
const AisLandingPage = lazy(() => import('../AisLandingPage'));

function ParlayProofShell() {
  const storePickId = useParlayOsStore((s) => s.proofPickId);
  const pickId = storePickId ?? (() => {
    try {
      return sessionStorage.getItem('vouchedge_proof_pick_id');
    } catch {
      return null;
    }
  })();

  if (!pickId) {
    return (
      <div className="p-8 text-center text-white/60">
        <p>Missing parlay proof id.</p>
      </div>
    );
  }

  return <ParlayProofPage pickId={pickId} />;
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RouteShellSkeleton />}>
      <FadeInMount>{children}</FadeInMount>
    </Suspense>
  );
}

function getOnboardingExperiment(userId: string) {
  const variant = getExperimentVariant(
    "new_onboarding_v2",
    userId
  );

  void import('../../lib/productEvents').then(({ ProductEvents }) => {
    ProductEvents.experimentViewed(
      "new_onboarding_v2",
      variant
    );
  });

  return variant;
}

export type MainViewRouterProps = {
  activeSection: string;
  navigateSection: (section: string) => void;
  isLoggedIn: boolean;
  profileViewUserId: string | null;
  canSeeThemeStore: boolean;
};

function MainViewRouter({
  activeSection,
  navigateSection,
  isLoggedIn,
  profileViewUserId,
  canSeeThemeStore,
}: MainViewRouterProps) {
  const onLoginSuccess = useAppCommandStore((state) => state.onLoginSuccess);

  switch (activeSection) {
    case 'vouchedge_intro':
      if (isLoggedIn) {
        return (
          <LazyRoute>
            <TodayDashboardShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />
          </LazyRoute>
        );
      }
      return (
        <LazyRoute>
          <VouchEdgeTerminalPage onAuthed={onLoginSuccess} />
        </LazyRoute>
      );
    case 'welcome': {
      const variant = getOnboardingExperiment(
        profileViewUserId ?? "anonymous"
      );

      if (variant === "variant") {
        return (
          <LazyRoute>
            <PersonalizedOnboarding
              onComplete={() => navigateSection("today")}
            />
          </LazyRoute>
        );
      }

      return (
        <LazyRoute>
          <TodayDashboardShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />
        </LazyRoute>
      );
    }

    case 'legacy_studio':
      return (
        <LazyRoute>
          <div className="w-full">
            <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6">
              <LegacyPublicBanner
                title="Legacy AI Studio landing (archived)"
                backLabel="Back to terminal landing"
                onBack={() => navigateSection('vouchedge_intro')}
              />
            </div>
            <LegacyStudioShell navigateSection={navigateSection} />
          </div>
        </LazyRoute>
      );

    case 'island':
    case 'today':
      return (
        <LazyRoute>
          <TodayDashboardShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />
        </LazyRoute>
      );
    case 'feed':
      return (
        <LazyRoute>
          <FeedShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'following':
      return (
        <LazyRoute>
          <FollowingHubPage />
        </LazyRoute>
      );
    case 'build':
      return (
        <LazyRoute>
          <ParlayShell panel="build" navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'ai_pilot':
      return (
        <LazyRoute>
          <AiPilotShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'ai_engine':
      return (
        <LazyRoute>
          <AiEngineShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'intel':
      return (
        <LazyRoute>
          <IntelShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'daily_hr_watch_new':
    case 'hr_board':
      return (
        <LazyRoute>
          <HomeRunIntelligencePage />
        </LazyRoute>
      );
    case 'mlb_stats':
      return (
        <LazyRoute>
          <MlbStatHubPage />
        </LazyRoute>
      );
    case 'daily_players':
      return (
        <LazyRoute>
          <DailyPlayersPage onSectionChange={navigateSection} />
        </LazyRoute>
      );
    case 'live_parlays':
      return (
        <LazyRoute>
          <ParlayShell key="live_parlays" panel="live" navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'parlay_proof':
      return (
        <LazyRoute>
          <ParlayProofShell />
        </LazyRoute>
      );
    case 'pro_command_center':
      return (
        <LazyRoute>
          <ProGateShell featureName="VouchEdge Pro Command Center" navigateSection={navigateSection}>
            <ProCommandCenterPage />
          </ProGateShell>
        </LazyRoute>
      );
    case 'player_edge_lab':
      return (
        <LazyRoute>
          <ProGateShell featureName="Top Player Lab" navigateSection={navigateSection}>
            <PlayerEdgeLabPage />
          </ProGateShell>
        </LazyRoute>
      );
    case 'team_matchup_lab':
      return (
        <LazyRoute>
          <ProGateShell featureName="Pitchers Matchup" navigateSection={navigateSection}>
            <TeamMatchupLabPage />
          </ProGateShell>
        </LazyRoute>
      );
    case 'hitter_matchup_zones':
      return (
        <LazyRoute>
          <ProGateShell featureName="Hitter Matchup Zones" navigateSection={navigateSection}>
            <HitterMatchupZonesPage />
          </ProGateShell>
        </LazyRoute>
      );
    case 'pro_graphs_lab':
      return (
        <LazyRoute>
          <ProGateShell featureName="Pro Graphs Lab" navigateSection={navigateSection}>
            <ProGraphsLabPage />
          </ProGateShell>
        </LazyRoute>
      );
    case 'live_games':
      return (
        <LazyRoute>
          <LiveGamesShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'research':
      return (
        <LazyRoute>
          <ResearchShell />
        </LazyRoute>
      );
    case 'board':
      return (
        <LazyRoute>
          <BoardShell />
        </LazyRoute>
      );
    case 'leaderboard':
      return (
        <LazyRoute>
          <LeaderboardShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'results':
      return (
        <LazyRoute>
          <ResultsShell />
        </LazyRoute>
      );
    case 'notifications':
      return (
        <LazyRoute>
          <NotificationsPage onSectionChange={navigateSection} />
        </LazyRoute>
      );
    case 'profile':
      return (
        <LazyRoute>
          <ProfileShell
            profileViewUserId={profileViewUserId}
            navigateSection={navigateSection}
          />
        </LazyRoute>
      );
    case 'nba_nfl':
      return (
        <LazyRoute>
          <NbaNflArena onSectionChange={navigateSection} />
        </LazyRoute>
      );
    case 'premium':
      return (
        <LazyRoute>
          <PremiumShell />
        </LazyRoute>
      );
    case 'themestore':
    case 'epic_themes':
      return (
        <LazyRoute>
          <SettingsShell />
        </LazyRoute>
      );
    case 'subscriber_hub':
      return (
        <LazyRoute>
          <SubscriberShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'settings':
      return (
        <LazyRoute>
          <SettingsShell />
        </LazyRoute>
      );
    case 'customize':
      return (
        <LazyRoute>
          <CustomizeShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    default:
      return (
        <div className="p-8 text-center" id="unknown-view">
          <h2 className="text-xl font-bold text-slate-100">View not found</h2>
        </div>
      );
  }
}

function TodayDashboardShell({
  navigateSection,
  isLoggedIn,
}: {
  navigateSection: (section: string) => void;
  isLoggedIn: boolean;
}) {
  const { profile, savedSlips } = useAppShell();
  return (
    <TodayDashboard
      onSectionChange={navigateSection}
      savedSlips={savedSlips}
      profile={profile}
      isLoggedIn={isLoggedIn}
    />
  );
}

function LegacyPublicBanner({
  title,
  backLabel,
  onBack,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto mb-4 flex max-w-[1500px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/8 px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-200/90">
        {title}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white/70 hover:border-vouch-cyan/35 hover:text-vouch-cyan"
      >
        {backLabel}
      </button>
    </div>
  );
}

function LegacyStudioShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const { profile } = useAppShell();
  const onUpdateProfile = useAppCommandStore((state) => state.onUpdateProfile);

  return (
    <AisLandingPage
      profile={profile}
      onUpdateProfile={onUpdateProfile}
      onSectionChange={navigateSection}
    />
  );
}

function FeedShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const { posts, profile, savedVouchIds, savedSlips, onSaveVouch } = useAppShell();
  const {
    onPostCreated,
    onLikePost,
    onVouchPost,
    onRepostPost,
    onDeletePost,
    onAddComment,
  } = useAppCommandStore();
  const feedQuery = useFeedQuery();

  return (
    <HomeFeedPage
      posts={posts}
      savedSlips={savedSlips}
      profileName={profile.displayName}
      onPostCreated={onPostCreated}
      onLikePost={onLikePost}
      onVouchPost={onVouchPost}
      onRepostPost={onRepostPost}
      onSaveVouch={onSaveVouch}
      savedVouchIds={savedVouchIds}
      onAddComment={onAddComment}
      onDeletePost={onDeletePost}
      profile={profile}
      onSectionChange={navigateSection}
      hasMoreServer={Boolean(feedQuery.hasNextPage)}
      isFetchingServer={feedQuery.isFetchingNextPage}
      onLoadMoreServer={() => {
        if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
          void feedQuery.fetchNextPage();
        }
      }}
    />
  );
}

function ParlayShell({
  panel,
  navigateSection,
}: {
  panel: 'build' | 'live';
  navigateSection: (section: string) => void;
}) {
  const { savedSlips, onSaveVouch } = useAppShell();
  const {
    liveGames,
    onAddLegFromResearch,
    onPostCreated,
    onSaveParlaySlip,
    onHideSavedParlay,
  } = useAppCommandStore();

  return (
    <ParlayOsWorkspace
      savedSlips={savedSlips}
      liveGames={liveGames}
      onSectionChange={navigateSection}
      onAddLegToParlay={onAddLegFromResearch}
      onSaveVouch={onSaveVouch}
      onPostCreated={onPostCreated}
      initialPanel={panel}
      onSaveParlay={onSaveParlaySlip}
      onHideParlay={onHideSavedParlay}
    />
  );
}

function AiPilotShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const onSaveParlaySlip = useAppCommandStore((state) => state.onSaveParlaySlip);
  return <AiPilotPage onSectionChange={navigateSection} onSaveParlay={onSaveParlaySlip} />;
}

function AiEngineShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const { onSaveVouch } = useAppShell();
  const {
    liveGames,
    onAddLegFromResearch,
    onPostCreated,
    onSaveParlaySlip,
  } = useAppCommandStore();

  return (
    <SmartAiEngine
      onSectionChange={navigateSection}
      onAddLegToParlay={onAddLegFromResearch}
      onSaveVouch={onSaveVouch}
      onPostCreated={onPostCreated}
      onSaveParlay={onSaveParlaySlip}
      liveGames={liveGames}
    />
  );
}

function IntelShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const { profile } = useAppShell();
  return <MlbIntelligenceHub profile={profile} onSectionChange={navigateSection} />;
}

function ProGateShell({
  featureName,
  navigateSection,
  children,
}: {
  featureName: string;
  navigateSection: (section: string) => void;
  children: React.ReactNode;
}) {
  const { profile } = useAppShell();
  return (
    <ProAccessGate
      profile={profile}
      featureName={featureName}
      onNavigatePremium={() => navigateSection('premium')}
    >
      {children}
    </ProAccessGate>
  );
}

function LiveGamesShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const onAddLegFromResearch = useAppCommandStore((state) => state.onAddLegFromResearch);
  return (
    <LiveGamesPro onSectionChange={navigateSection} onAddLegToParlay={onAddLegFromResearch} />
  );
}

function ResearchShell() {
  const { savedVouchIds, activeLegs, onSaveVouch } = useAppShell();
  const { liveGames, onAddLegFromResearch } = useAppCommandStore();

  return (
    <PlayerResearchHub
      onAddLegToParlay={onAddLegFromResearch}
      onSaveVouch={onSaveVouch}
      savedVouchIds={savedVouchIds}
      activeLegs={activeLegs}
      liveGames={liveGames}
    />
  );
}

function BoardShell() {
  const { savedVouches, profile } = useAppShell();
  const { onRemoveVouchFromBoard, onPostCreated } = useAppCommandStore();

  return (
    <VouchBoard
      savedVouches={savedVouches}
      onRemoveVouch={onRemoveVouchFromBoard}
      onPostCreated={onPostCreated}
      profile={profile}
    />
  );
}

function LeaderboardShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const { profile } = useAppShell();
  return <Leaderboard profile={profile} onSectionChange={navigateSection} />;
}

function ResultsShell() {
  const { posts, profile, savedSlips } = useAppShell();
  return <ResultsStudio posts={posts} profile={profile} savedParlays={savedSlips} />;
}

function ProfileShell({
  profileViewUserId,
  navigateSection,
}: {
  profileViewUserId: string | null;
  navigateSection?: (section: string) => void;
}) {
  const { posts, profile, savedVouchIds, savedSlips, onSaveVouch } = useAppShell();
  const {
    onClearProfileViewUser,
    onUpdateProfile,
    onLikePost,
    onVouchPost,
    onRepostPost,
    onDeletePost,
    onAddComment,
  } = useAppCommandStore();

  return (
    <ProfilePage
      profile={profile}
      onUpdateProfile={onUpdateProfile}
      posts={posts}
      onLikePost={onLikePost}
      onVouchPost={onVouchPost}
      onRepostPost={onRepostPost}
      onSaveVouch={onSaveVouch}
      savedVouchIds={savedVouchIds}
      onAddComment={onAddComment}
      onDeletePost={onDeletePost}
      savedParlays={savedSlips}
      viewUserId={profileViewUserId}
      onClearViewUser={onClearProfileViewUser}
      onSectionChange={navigateSection}
    />
  );
}

function PremiumShell() {
  const { profile } = useAppShell();
  const onUpdateProfile = useAppCommandStore((state) => state.onUpdateProfile);
  return <PremiumSubPage profile={profile} onUpdateProfile={onUpdateProfile} />;
}

function SubscriberShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const { profile } = useAppShell();
  const onUpdateProfile = useAppCommandStore((state) => state.onUpdateProfile);

  return (
    <ProAccessGate
      profile={profile}
      requiredTier="SELLER_PRO"
      featureName="Subscriber Clubs & Chat"
      onNavigatePremium={() => navigateSection('premium')}
    >
      <SubscriberHub
        profile={profile}
        onUpdateProfile={onUpdateProfile}
        onSectionChange={navigateSection}
      />
    </ProAccessGate>
  );
}

function SettingsShell() {
  const { profile } = useAppShell();
  const { onResetDatabase, onUpdateProfile } = useAppCommandStore();

  return (
    <SettingsPage
      onResetDatabase={onResetDatabase}
      profileName={profile.displayName}
      profile={profile}
      onUpdateProfile={onUpdateProfile}
    />
  );
}

function CustomizeShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const { profile } = useAppShell();
  const onUpdateProfile = useAppCommandStore((state) => state.onUpdateProfile);
  return (
    <CustomizePage profile={profile} onUpdateProfile={onUpdateProfile} onSectionChange={navigateSection} />
  );
}

export default memo(MainViewRouter);
