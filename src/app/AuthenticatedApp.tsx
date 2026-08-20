import { useEffect } from 'react';
import type { useSectionNavigation } from './useSectionNavigation';
import { patchPublicNotificationsFetch } from '../lib/patchPublicNotificationsFetch';
import { useAppBootstrap } from './useAppBootstrap';
import { useAppDomain } from './useAppDomain';
import { AppShell } from './AppShell';
import { SocialGraphProvider } from '../hooks/SocialGraphProvider';
import { useAuthSession } from '../lib/authSessionStore';
import '../index.css';

type NavigationState = ReturnType<typeof useSectionNavigation>;

patchPublicNotificationsFetch();

function AuthenticatedAppContent({ navigation }: { navigation: NavigationState }) {
  const authSession = useAuthSession();
  const bootstrap = useAppBootstrap({
    activeSection: navigation.activeSection,
    commitSection: navigation.commitSection,
    isLoggedIn: navigation.isLoggedIn,
    authUser: authSession.session?.user ?? null,
  });
  const domain = useAppDomain({
    accountId: bootstrap.accountId,
    navigateSection: navigation.navigateSection,
    handleLoginSuccess: navigation.handleLoginSuccess,
    handleLogoutComplete: navigation.handleLogoutComplete,
    handleClearProfileViewUser: navigation.handleClearProfileViewUser,
    liveGames: bootstrap.liveGames,
    savedSlips: bootstrap.savedSlips,
    savedVouches: bootstrap.savedVouches,
    posts: bootstrap.posts,
    profile: bootstrap.profile,
    syncSlips: bootstrap.syncSlips,
    syncProfile: bootstrap.syncProfile,
  });

  return (
    <AppShell
      activeSection={navigation.activeSection}
      loggingOut={navigation.loggingOut}
      isPendingRoute={navigation.isPendingRoute}
      isLoggedIn={navigation.isLoggedIn}
      isPublicFrontPage={navigation.isPublicFrontPage}
      showGlobalAppChrome={navigation.showGlobalAppChrome}
      profileViewUserId={navigation.profileViewUserId}
      canSeeThemeStore={bootstrap.canSeeThemeStore}
      savedSlips={bootstrap.savedSlips}
      profile={bootstrap.profile}
      appShellState={domain.appShellState}
      navigateSection={navigation.navigateSection}
      navigateToUserProfile={navigation.navigateToUserProfile}
      handleLoginSuccess={domain.handleLoginSuccess}
      handleLogoutComplete={domain.handleLogoutComplete}
      handleUpdateProfile={domain.handleUpdateProfile}
      onConfirmParlayTier={domain.handleConfirmParlayTier}
      onSaveParlaySlip={() => navigation.navigateSection('build')}
      activeLegs={domain.activeLegs}
    />
  );
}

export default function AuthenticatedApp({ navigation }: { navigation: NavigationState }) {
  useEffect(() => {
    const loadFounderAccess = () => {
      void import('../lib/founderAccess').then(({ forceFounderPoints }) => forceFounderPoints());
    };
    if (typeof requestIdleCallback === 'function') {
      const idleId = requestIdleCallback(loadFounderAccess, { timeout: 2000 });
      return () => cancelIdleCallback(idleId);
    }
    const timer = window.setTimeout(loadFounderAccess, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // No QueryClientProvider here: App.tsx already mounts one with the same
  // queryClient above MainAppRoutes, so this was a redundant nested provider.
  return (
    <SocialGraphProvider>
      <AuthenticatedAppContent navigation={navigation} />
    </SocialGraphProvider>
  );
}
