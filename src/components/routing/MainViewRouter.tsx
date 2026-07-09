import React, { Suspense, lazy, memo } from 'react';
import RouteShellSkeleton from '../boot/RouteShellSkeleton';
import { useAppShell } from '../../context/AppShellContext';
import { useAppCommandStore } from '../../stores/appCommandStore';
import { useFeedQuery } from '../../hooks/queries/useFeedQuery';

const ProAccessGate = lazy(() =>
  import('../pro/ProAccessGate').then((module) => ({ default: module.ProAccessGate })),
);
const HomeFeedPage = lazy(() => import('../../social/feed/HomeFeedPage'));
const TodayDashboard = lazy(() => import('../TodayDashboard'));
const EdgeIslandPage = lazy(() => import('../../pages/EdgeIslandPage'));
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
const ThemeStore = lazy(() => import('../ThemeStore'));
const EpicThemeShowcase = lazy(() =>
  import('../vouchedge/EpicThemeShowcase').then((module) => ({
    default: module.EpicThemeShowcase,
  })),
);
const SubscriberHub = lazy(() => import('../SubscriberHub'));
const LiveGameLabPage = lazy(() => import('../../pages/LiveGameLabPage'));
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
const ParlayCommandCenter = lazy(() => import('../parlay/ParlayCommandCenter'));
const NbaNflArena = lazy(() => import('../NbaNflArena'));

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteShellSkeleton />}>{children}</Suspense>;
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
    case 'welcome':
    case 'island':
      return (
        <LazyRoute>
          <EdgeIslandShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />
        </LazyRoute>
      );
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
    case 'live_game_lab':
      return (
        <LazyRoute>
          <ProGateShell featureName="Live Game Lab" navigateSection={navigateSection}>
            <LiveGameLabPage />
          </ProGateShell>
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
          <ProGateShell featureName="Player Edge Lab" navigateSection={navigateSection}>
            <PlayerEdgeLabPage />
          </ProGateShell>
        </LazyRoute>
      );
    case 'team_matchup_lab':
      return (
        <LazyRoute>
          <ProGateShell featureName="Team Matchup Lab" navigateSection={navigateSection}>
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
      if (!canSeeThemeStore) {
        return (
          <LazyRoute>
            <ProfileShell profileViewUserId={profileViewUserId} />
          </LazyRoute>
        );
      }
      return (
        <LazyRoute>
          <ThemeStoreShell />
        </LazyRoute>
      );
    case 'epic_themes':
      return (
        <LazyRoute>
          <EpicThemeShowcase />
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

function EdgeIslandShell({
  navigateSection,
  isLoggedIn,
}: {
  navigateSection: (section: string) => void;
  isLoggedIn: boolean;
}) {
  const { profile, savedSlips } = useAppShell();
  return (
    <EdgeIslandPage
      onSectionChange={navigateSection}
      savedSlips={savedSlips}
      profile={profile}
      isLoggedIn={isLoggedIn}
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
    <ParlayCommandCenter
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

function ThemeStoreShell() {
  const { profile } = useAppShell();
  const onUpdateProfile = useAppCommandStore((state) => state.onUpdateProfile);
  return <ThemeStore profile={profile} onUpdateProfile={onUpdateProfile} />;
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
