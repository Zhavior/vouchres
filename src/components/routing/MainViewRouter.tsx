import React, { Suspense, lazy, memo } from 'react';
import RouteShellSkeleton from '../boot/RouteShellSkeleton';
import { useAppShell } from '../../context/AppShellContext';
import type { CreatorProofProfile, FeedPost, Leg, MLBPlayer, Parlay, Vouch } from '../../types';
import type { CanonicalParlaySlip } from '../../lib/parlays/parlayBridge';

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

export type MainViewRouterProps = {
  activeSection: string;
  navigateSection: (section: string) => void;
  liveGames: Array<{
    homeTeam: string;
    awayTeam: string;
    status: string;
    gamePk?: string | number;
  }>;
  isLoggedIn: boolean;
  profileViewUserId: string | null;
  onClearProfileViewUser: () => void;
  canSeeThemeStore: boolean;
  onLoginSuccess: () => void;
  onPostCreated: (postData: Partial<FeedPost>) => void;
  onLikePost: (postId: string) => void;
  onVouchPost: (postId: string) => void;
  onRepostPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, commentContent: string) => void;
  onRemoveVouchFromBoard: (vouchId: string) => void;
  onSaveParlaySlip: (newParlay: Parlay | CanonicalParlaySlip) => Promise<void>;
  onHideSavedParlay: (parlayId: string) => Promise<void>;
  onAddLegFromResearch: (
    player: MLBPlayer,
    prop: {
      id: string;
      market: string;
      odds: number | null;
      spec: string;
      gamePk?: string | number;
      playerId?: number | string;
    },
  ) => void;
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
  onResetDatabase: () => void;
};

function MainViewRouter({
  activeSection,
  navigateSection,
  liveGames,
  isLoggedIn,
  profileViewUserId,
  onClearProfileViewUser,
  canSeeThemeStore,
  onLoginSuccess,
  onPostCreated,
  onLikePost,
  onVouchPost,
  onRepostPost,
  onDeletePost,
  onAddComment,
  onRemoveVouchFromBoard,
  onSaveParlaySlip,
  onHideSavedParlay,
  onAddLegFromResearch,
  onUpdateProfile,
  onResetDatabase,
}: MainViewRouterProps) {
  switch (activeSection) {
    case 'vouchedge_intro':
      if (isLoggedIn) {
        return <TodayDashboardShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />;
      }
      return <VouchEdgeTerminalPage onAuthed={onLoginSuccess} />;
    case 'welcome':
    case 'island':
      return <EdgeIslandShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />;
    case 'today':
      return <TodayDashboardShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />;
    case 'feed':
      return (
        <FeedShell
          navigateSection={navigateSection}
          onPostCreated={onPostCreated}
          onLikePost={onLikePost}
          onVouchPost={onVouchPost}
          onRepostPost={onRepostPost}
          onDeletePost={onDeletePost}
          onAddComment={onAddComment}
        />
      );
    case 'build':
      return (
        <ParlayShell
          panel="build"
          navigateSection={navigateSection}
          liveGames={liveGames}
          onAddLegFromResearch={onAddLegFromResearch}
          onPostCreated={onPostCreated}
          onSaveParlaySlip={onSaveParlaySlip}
          onHideSavedParlay={onHideSavedParlay}
        />
      );
    case 'ai_pilot':
      return <AiPilotPage onSectionChange={navigateSection} onSaveParlay={onSaveParlaySlip} />;
    case 'ai_engine':
      return (
        <AiEngineShell
          navigateSection={navigateSection}
          liveGames={liveGames}
          onAddLegFromResearch={onAddLegFromResearch}
          onPostCreated={onPostCreated}
          onSaveParlaySlip={onSaveParlaySlip}
        />
      );
    case 'intel':
      return <IntelShell navigateSection={navigateSection} />;
    case 'daily_hr_watch_new':
    case 'hr_board':
      return <HomeRunIntelligencePage />;
    case 'mlb_stats':
      return (
        <Suspense fallback={<RouteShellSkeleton />}>
          <MlbStatHubPage />
        </Suspense>
      );
    case 'daily_players':
      return <DailyPlayersPage onSectionChange={navigateSection} />;
    case 'live_parlays':
      return (
        <ParlayShell
          key="live_parlays"
          panel="live"
          navigateSection={navigateSection}
          liveGames={liveGames}
          onAddLegFromResearch={onAddLegFromResearch}
          onPostCreated={onPostCreated}
          onSaveParlaySlip={onSaveParlaySlip}
          onHideSavedParlay={onHideSavedParlay}
        />
      );
    case 'live_game_lab':
      return (
        <ProGateShell featureName="Live Game Lab" navigateSection={navigateSection}>
          <LiveGameLabPage />
        </ProGateShell>
      );
    case 'pro_command_center':
      return (
        <ProGateShell featureName="VouchEdge Pro Command Center" navigateSection={navigateSection}>
          <ProCommandCenterPage />
        </ProGateShell>
      );
    case 'player_edge_lab':
      return (
        <ProGateShell featureName="Player Edge Lab" navigateSection={navigateSection}>
          <PlayerEdgeLabPage />
        </ProGateShell>
      );
    case 'team_matchup_lab':
      return <TeamMatchupLabPage />;
    case 'hitter_matchup_zones':
      return (
        <ProGateShell featureName="Hitter Matchup Zones" navigateSection={navigateSection}>
          <HitterMatchupZonesPage />
        </ProGateShell>
      );
    case 'pro_graphs_lab':
      return (
        <ProGateShell featureName="Pro Graphs Lab" navigateSection={navigateSection}>
          <ProGraphsLabPage />
        </ProGateShell>
      );
    case 'live_games':
      return (
        <LiveGamesPro onSectionChange={navigateSection} onAddLegToParlay={onAddLegFromResearch} />
      );
    case 'research':
      return <ResearchShell liveGames={liveGames} onAddLegFromResearch={onAddLegFromResearch} />;
    case 'board':
      return (
        <BoardShell
          onRemoveVouchFromBoard={onRemoveVouchFromBoard}
          onPostCreated={onPostCreated}
        />
      );
    case 'leaderboard':
      return <LeaderboardShell navigateSection={navigateSection} />;
    case 'results':
      return <ResultsShell />;
    case 'notifications':
      return <NotificationsPage onSectionChange={navigateSection} />;
    case 'profile':
      return (
        <ProfileShell
          profileViewUserId={profileViewUserId}
          onClearProfileViewUser={onClearProfileViewUser}
          navigateSection={navigateSection}
          onUpdateProfile={onUpdateProfile}
          onLikePost={onLikePost}
          onVouchPost={onVouchPost}
          onRepostPost={onRepostPost}
          onDeletePost={onDeletePost}
          onAddComment={onAddComment}
        />
      );
    case 'nba_nfl':
      return <NbaNflArena onSectionChange={navigateSection} />;
    case 'premium':
      return <PremiumShell onUpdateProfile={onUpdateProfile} />;
    case 'themestore':
      if (!canSeeThemeStore) {
        return (
          <ProfileShell
            profileViewUserId={profileViewUserId}
            onClearProfileViewUser={onClearProfileViewUser}
            onUpdateProfile={onUpdateProfile}
            onLikePost={onLikePost}
            onVouchPost={onVouchPost}
            onRepostPost={onRepostPost}
            onDeletePost={onDeletePost}
            onAddComment={onAddComment}
          />
        );
      }
      return <ThemeStoreShell onUpdateProfile={onUpdateProfile} />;
    case 'epic_themes':
      return <EpicThemeShowcase />;
    case 'subscriber_hub':
      return (
        <SubscriberShell navigateSection={navigateSection} onUpdateProfile={onUpdateProfile} />
      );
    case 'settings':
      return (
        <SettingsShell
          onResetDatabase={onResetDatabase}
          onUpdateProfile={onUpdateProfile}
        />
      );
    case 'customize':
      return <CustomizeShell navigateSection={navigateSection} onUpdateProfile={onUpdateProfile} />;
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

function FeedShell({
  navigateSection,
  onPostCreated,
  onLikePost,
  onVouchPost,
  onRepostPost,
  onDeletePost,
  onAddComment,
}: Pick<
  MainViewRouterProps,
  | 'navigateSection'
  | 'onPostCreated'
  | 'onLikePost'
  | 'onVouchPost'
  | 'onRepostPost'
  | 'onDeletePost'
  | 'onAddComment'
>) {
  const { posts, profile, savedVouchIds, savedSlips, onSaveVouch } = useAppShell();
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
    />
  );
}

function ParlayShell({
  panel,
  navigateSection,
  liveGames,
  onAddLegFromResearch,
  onPostCreated,
  onSaveParlaySlip,
  onHideSavedParlay,
}: {
  panel: 'build' | 'live';
  navigateSection: (section: string) => void;
  liveGames: MainViewRouterProps['liveGames'];
  onAddLegFromResearch: MainViewRouterProps['onAddLegFromResearch'];
  onPostCreated: MainViewRouterProps['onPostCreated'];
  onSaveParlaySlip: MainViewRouterProps['onSaveParlaySlip'];
  onHideSavedParlay: MainViewRouterProps['onHideSavedParlay'];
}) {
  const { savedSlips, onSaveVouch } = useAppShell();
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

function AiEngineShell({
  navigateSection,
  liveGames,
  onAddLegFromResearch,
  onPostCreated,
  onSaveParlaySlip,
}: {
  navigateSection: (section: string) => void;
  liveGames: MainViewRouterProps['liveGames'];
  onAddLegFromResearch: MainViewRouterProps['onAddLegFromResearch'];
  onPostCreated: MainViewRouterProps['onPostCreated'];
  onSaveParlaySlip: MainViewRouterProps['onSaveParlaySlip'];
}) {
  const { onSaveVouch } = useAppShell();
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

function ResearchShell({
  liveGames,
  onAddLegFromResearch,
}: {
  liveGames: MainViewRouterProps['liveGames'];
  onAddLegFromResearch: MainViewRouterProps['onAddLegFromResearch'];
}) {
  const { savedVouchIds, activeLegs, onSaveVouch } = useAppShell();
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

function BoardShell({
  onRemoveVouchFromBoard,
  onPostCreated,
}: {
  onRemoveVouchFromBoard: (vouchId: string) => void;
  onPostCreated: (postData: Partial<FeedPost>) => void;
}) {
  const { savedVouches, profile } = useAppShell();
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
  onClearProfileViewUser,
  navigateSection,
  onUpdateProfile,
  onLikePost,
  onVouchPost,
  onRepostPost,
  onDeletePost,
  onAddComment,
}: {
  profileViewUserId: string | null;
  onClearProfileViewUser: () => void;
  navigateSection?: (section: string) => void;
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
  onLikePost: (postId: string) => void;
  onVouchPost: (postId: string) => void;
  onRepostPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, commentContent: string) => void;
}) {
  const { posts, profile, savedVouchIds, savedSlips, onSaveVouch } = useAppShell();
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

function PremiumShell({
  onUpdateProfile,
}: {
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
}) {
  const { profile } = useAppShell();
  return <PremiumSubPage profile={profile} onUpdateProfile={onUpdateProfile} />;
}

function ThemeStoreShell({
  onUpdateProfile,
}: {
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
}) {
  const { profile } = useAppShell();
  return <ThemeStore profile={profile} onUpdateProfile={onUpdateProfile} />;
}

function SubscriberShell({
  navigateSection,
  onUpdateProfile,
}: {
  navigateSection: (section: string) => void;
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
}) {
  const { profile } = useAppShell();
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

function SettingsShell({
  onResetDatabase,
  onUpdateProfile,
}: {
  onResetDatabase: () => void;
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
}) {
  const { profile } = useAppShell();
  return (
    <SettingsPage
      onResetDatabase={onResetDatabase}
      profileName={profile.displayName}
      profile={profile}
      onUpdateProfile={onUpdateProfile}
    />
  );
}

function CustomizeShell({
  navigateSection,
  onUpdateProfile,
}: {
  navigateSection: (section: string) => void;
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
}) {
  const { profile } = useAppShell();
  return (
    <CustomizePage profile={profile} onUpdateProfile={onUpdateProfile} onSectionChange={navigateSection} />
  );
}

export default memo(MainViewRouter);
