import { getExperimentVariant } from '../../lib/experiments';
import React, { Suspense, memo } from 'react';
import RouteShellSkeleton from '../boot/RouteShellSkeleton';
import FadeInMount from '../system/FadeInMount';
import HrAuroraMaxPage from '../../features/hr-max/pages/HrAuroraMaxPage';
import AuroraHqPage from '../../features/aurora-hr-hq/pages/AuroraHqPage';
import { HrIntelligencePageV10 } from '../../features/hr-v2/pages/HrIntelligencePageV10';
import HomeRunIntelligencePageLegacy from '../../features/hr/pages/HomeRunIntelligencePageLegacy';
import {
  useAppShell,
  useAppPosts,
  useAppProfile,
  useAppSavedVouches,
  useAppSavedSlips,
  useAppSavedVouchIds
} from '../../context/AppShellContext';
import { useAppCommandStore } from '../../stores/appCommandStore';
import { useParlayOsStore } from '../../stores/parlayOsStore';
import { useFeedQuery } from '../../hooks/queries/useFeedQuery';
import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { routeModules } from '../../lib/routeModules';

const ProAccessGate = lazyWithRetry(() =>
  import('../pro/ProAccessGate').then((module) => ({ default: module.ProAccessGate })),
);
const PersonalizedOnboarding = lazyWithRetry(() =>
  import('../onboarding/PersonalizedOnboarding').then((module) => ({
    default: module.PersonalizedOnboarding,
  })),
);
const FollowingHubPage = lazyWithRetry(routeModules.following);
const HomeFeedPage = lazyWithRetry(routeModules.homeFeed);
const TodayDashboardZ8 = lazyWithRetry(routeModules.todayDashboard);
const VouchEdgeTerminalPage = lazyWithRetry(routeModules.vouchEdgeTerminal);
const VouchBoardZ8 = lazyWithRetry(routeModules.vouchBoard);
const ProfilePageZ8 = lazyWithRetry(routeModules.profile);
const SettingsPageZ8 = lazyWithRetry(routeModules.settings);
const PremiumSubPage = lazyWithRetry(routeModules.premium);
const PlayerResearchHub = lazyWithRetry(routeModules.research);
const CustomizePage = lazyWithRetry(routeModules.customize);
const ResultsStudio = lazyWithRetry(routeModules.results);
const SmartAiEngine = lazyWithRetry(routeModules.smartAiEngine);
const MlbIntelligenceHub = lazyWithRetry(routeModules.brainEdge);
const Leaderboard = lazyWithRetry(routeModules.leaderboard);
const SubscriberHub = lazyWithRetry(routeModules.subscriberHub);
const BrainPicksPage = lazyWithRetry(routeModules.brainPicks);
const BrainPerformancePage = lazyWithRetry(routeModules.brainPerformance);
const AiPilotPage = lazyWithRetry(routeModules.aiPilot);
const MlbStatHubPage = lazyWithRetry(routeModules.mlbStats);
const DailyPlayersPage = lazyWithRetry(routeModules.dailyPlayers);
const LiveGamesPage = lazyWithRetry(routeModules.liveGames);
const NotificationsPage = lazyWithRetry(routeModules.notifications);
const PlayerEdgeLabPageZ8 = lazyWithRetry(routeModules.playerEdgeLab);
const PitcherMatchupIntelligencePageZ8 = lazyWithRetry(routeModules.pitcherMatchup);
const HitterMatchupZonesPageZ8 = lazyWithRetry(routeModules.hitterMatchup);
const ProCommandCenterPageZ8 = lazyWithRetry(routeModules.proCommandCenter);
const ParlayOsWorkspace = lazyWithRetry(routeModules.parlayOs);
const ParlayProofPage = lazyWithRetry(routeModules.parlayProof);
const NbaNflArena = lazyWithRetry(routeModules.nbaNflArena);
const AisLandingPage = lazyWithRetry(routeModules.aisLanding);
const MostVouchedTodayPageZ8 = lazyWithRetry(routeModules.mostVouchedToday);
const AuroraHqShell = lazyWithRetry(routeModules.auroraHq);
const HrNextPage = lazyWithRetry(() => import('../../features/hr-next/pages/HrNextPage'));
const TrustModelQualityPage = lazyWithRetry(() => import('../../features/trust/TrustModelQualityPage'));
const TodayNextPage = lazyWithRetry(() => import('../../features/today-next/pages/TodayNextPage'));
// Module scope on purpose. Building this inside AdminAccessGateShell creates a
// new lazy component type every render, so React remounts and re-suspends the
// whole gated subtree each pass — which takes down every admin-gated route.
const AdminAccessGate = lazyWithRetry(() =>
  import('../admin/AdminAccessGate').then((m) => ({ default: m.AdminAccessGate })),
);

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

function LazyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Suspense fallback={fallback ?? <RouteShellSkeleton />}>
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
  activeLegs: Parameters<typeof PlayerResearchHub>[0]['activeLegs'];
};

function MainViewRouter({
  activeSection,
  navigateSection,
  isLoggedIn,
  profileViewUserId,
  canSeeThemeStore: _canSeeThemeStore,
  activeLegs,
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
              onComplete={(section) => navigateSection(section ?? "today")}
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
                backLabel="Back to landing"
                onBack={() => navigateSection('vouchedge_intro')}
              />
            </div>
            <LegacyStudioShell navigateSection={navigateSection} />
          </div>
        </LazyRoute>
      );

    case 'island':
      return (
        <LazyRoute>
          <TodayDashboardShell navigateSection={navigateSection} isLoggedIn={isLoggedIn} />
        </LazyRoute>
      );
    case 'today':
      return (
        <LazyRoute>
          <TodayNextPage navigateSection={navigateSection} />
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
      return (
        <FadeInMount>
          <HomeRunIntelligencePageLegacy onSectionChange={navigateSection} />
        </FadeInMount>
      );
    case 'hr_board':
      return (
        <FadeInMount>
          <HrNextPage />
        </FadeInMount>
      );
    case 'hr_max':
      return (
        <FadeInMount>
          <HrAuroraMaxPage onNavigate={navigateSection} />
        </FadeInMount>
      );
    case 'hr_v10':
      return (
        <FadeInMount>
          <HrIntelligencePageV10 onNavigate={navigateSection} />
        </FadeInMount>
      );
    case 'aurora_hr_hq':
    case 'aurora_daily_slate':
      return (
        <FadeInMount>
          <AuroraHqPage
            surface={activeSection === 'aurora_daily_slate' ? 'slate' : 'desk'}
            onNavigate={navigateSection}
          />
        </FadeInMount>
      );
    case 'brain_picks':
      return (
        <LazyRoute>
          <ProGateShell featureName="Brain Picks" navigateSection={navigateSection}>
            <BrainPicksPage onNavigate={navigateSection} />
          </ProGateShell>
        </LazyRoute>
      );
    case 'brain_performance':
      return (
        <LazyRoute>
          <ProGateShell featureName="Brain Performance" navigateSection={navigateSection}>
            <BrainPerformancePage onNavigate={navigateSection} />
          </ProGateShell>
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
          <ParlayShell key="live_parlays" panel="build" navigateSection={navigateSection} />
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
          <ProGateShell featureName="Pro Command Center" navigateSection={navigateSection}>
            <ProCommandCenterPageZ8 />
          </ProGateShell>
        </LazyRoute>
      );
    case 'player_edge_lab':
      return (
        <LazyRoute>
          <ProGateShell featureName="Top Player Lab" navigateSection={navigateSection}>
            <PlayerEdgeLabPageZ8 />
          </ProGateShell>
        </LazyRoute>
      );
    case 'pitcher_matchup':
    case 'pitcher_matchup_intelligence':
      return (
        <LazyRoute>
          <ProGateShell featureName="Pitcher Matchup Intelligence" navigateSection={navigateSection}>
            <PitcherMatchupIntelligencePageZ8 onNavigate={navigateSection} />
          </ProGateShell>
        </LazyRoute>
      );
    case 'team_matchup_lab':
      return (
        <LazyRoute>
          <ProGateShell featureName="Pitcher Matchup Intelligence" navigateSection={navigateSection}>
            <PitcherMatchupIntelligencePageZ8 onNavigate={navigateSection} />
          </ProGateShell>
        </LazyRoute>
      );
    case 'hitter_matchup':
    case 'hitter_matchup_zones':
      return (
        <LazyRoute>
          <ProGateShell featureName="Hitter Matchup Zones" navigateSection={navigateSection}>
            <HitterMatchupZonesPageZ8 onNavigate={navigateSection} />
          </ProGateShell>
        </LazyRoute>
      );
    case 'pro_graphs_lab':
      return (
        <LazyRoute>
          <IntelShell navigateSection={navigateSection} />
        </LazyRoute>
      );
    case 'live_games':
      return (
        <LazyRoute>
          <LiveGamesShell />
        </LazyRoute>
      );
    case 'research':
    case 'player_research':
      return (
        <LazyRoute>
          <ResearchShell activeLegs={activeLegs} />
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
    case 'most_vouched_today':
    case 'most_vouched':
      return (
        <LazyRoute>
          <MostVouchedTodayPageZ8 onNavigate={navigateSection} />
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
    case 'admin':
      return (
        <LazyRoute>
          <AuroraHqShell />
        </LazyRoute>
      );
    case 'admin_hr_next':
      return (
        <LazyRoute>
          <AdminAccessGateShell>
            <HrNextPage />
          </AdminAccessGateShell>
        </LazyRoute>
      );
    // Staff-only: the endpoints behind this are requireAuth + requireStaff, and
    // the page has no client-side gate of its own.
    case 'admin_model_quality':
      return (
        <LazyRoute>
          <AdminAccessGateShell>
            <TrustModelQualityPage />
          </AdminAccessGateShell>
        </LazyRoute>
      );
    case 'live_games_next':
      return (
        <LazyRoute>
          <LiveGamesShell />
        </LazyRoute>
      );
    case 'today_next':
      return (
        <LazyRoute>
          <AdminAccessGateShell>
            <TodayNextPage navigateSection={navigateSection} />
          </AdminAccessGateShell>
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
  const profile = useAppProfile();
  const savedSlips = useAppSavedSlips();
  return (
    <TodayDashboardZ8
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
  const profile = useAppProfile();
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
  const { onSaveVouch } = useAppShell();
  const savedVouchIds = useAppSavedVouchIds();
  const posts = useAppPosts();
  const profile = useAppProfile();
  const savedSlips = useAppSavedSlips();
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
  const { onSaveVouch } = useAppShell();
  const savedSlips = useAppSavedSlips();
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
  const profile = useAppProfile();
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
  const profile = useAppProfile();
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

function LiveGamesShell() {
  const onAddLegFromResearch = useAppCommandStore(
    (state) => state.onAddLegFromResearch,
  );

  return (
    <LiveGamesPage onAddLegToParlay={onAddLegFromResearch} />
  );
}

function ResearchShell({
  activeLegs,
}: {
  activeLegs: Parameters<typeof PlayerResearchHub>[0]['activeLegs'];
}) {
  const { onSaveVouch } = useAppShell();
  const savedVouchIds = useAppSavedVouchIds();
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
  const savedVouches = useAppSavedVouches();
  const profile = useAppProfile();
  const { onRemoveVouchFromBoard, onPostCreated } = useAppCommandStore();

  return (
    <VouchBoardZ8
      savedVouches={savedVouches}
      onRemoveVouch={onRemoveVouchFromBoard}
      onPostCreated={onPostCreated}
      profile={profile}
    />
  );
}

function LeaderboardShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const profile = useAppProfile();
  return <Leaderboard profile={profile} onSectionChange={navigateSection} />;
}

function ResultsShell() {
  const posts = useAppPosts();
  const profile = useAppProfile();
  const savedSlips = useAppSavedSlips();
  return <ResultsStudio posts={posts} profile={profile} savedParlays={savedSlips} />;
}

function ProfileShell({
  profileViewUserId,
  navigateSection,
}: {
  profileViewUserId: string | null;
  navigateSection?: (section: string) => void;
}) {
  const { onSaveVouch } = useAppShell();
  const savedVouchIds = useAppSavedVouchIds();
  const posts = useAppPosts();
  const profile = useAppProfile();
  const savedSlips = useAppSavedSlips();
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
    <ProfilePageZ8
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
  const profile = useAppProfile();
  const onUpdateProfile = useAppCommandStore((state) => state.onUpdateProfile);
  return <PremiumSubPage profile={profile} onUpdateProfile={onUpdateProfile} />;
}

function SubscriberShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const profile = useAppProfile();
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
  const profile = useAppProfile();
  const { onResetDatabase, onUpdateProfile } = useAppCommandStore();

  return (
    <SettingsPageZ8
      onResetDatabase={onResetDatabase}
      profileName={profile.displayName}
      profile={profile}
      onUpdateProfile={onUpdateProfile}
    />
  );
}

function CustomizeShell({ navigateSection }: { navigateSection: (section: string) => void }) {
  const profile = useAppProfile();
  const onUpdateProfile = useAppCommandStore((state) => state.onUpdateProfile);
  return (
    <CustomizePage profile={profile} onUpdateProfile={onUpdateProfile} onSectionChange={navigateSection} />
  );
}

function AdminAccessGateShell({ children }: { children: React.ReactNode }) {
  const profile = useAppProfile();
  
  return (
    <Suspense fallback={<RouteShellSkeleton />}>
      <AdminAccessGate profile={profile}>
        {children}
      </AdminAccessGate>
    </Suspense>
  );
}

export default memo(MainViewRouter);
