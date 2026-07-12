import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { useSectionNavigation } from './useSectionNavigation';
import { queryClient } from '../lib/queryClient';
import { patchPublicNotificationsFetch } from '../lib/patchPublicNotificationsFetch';
import { useAppBootstrap } from './useAppBootstrap';
import { useAppDomain } from './useAppDomain';
import { AppShell } from './AppShell';
import { SocialGraphProvider } from '../hooks/SocialGraphProvider';
import '../index.css';

type NavigationState = ReturnType<typeof useSectionNavigation>;

patchPublicNotificationsFetch();

function AuthenticatedAppContent({ navigation }: { navigation: NavigationState }) {
  const bootstrap = useAppBootstrap({
    activeSection: navigation.activeSection,
    commitSection: navigation.commitSection,
    isLoggedIn: navigation.isLoggedIn,
  });
  const domain = useAppDomain({
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
      edgeIslandOpen={navigation.edgeIslandOpen}
      profileViewUserId={navigation.profileViewUserId}
      canSeeThemeStore={bootstrap.canSeeThemeStore}
      savedSlips={bootstrap.savedSlips}
      profile={bootstrap.profile}
      appShellState={domain.appShellState}
      navigateSection={navigation.navigateSection}
      navigateToUserProfile={navigation.navigateToUserProfile}
      setEdgeIslandOpen={navigation.setEdgeIslandOpen}
      handleLoginSuccess={domain.handleLoginSuccess}
      handleLogoutComplete={domain.handleLogoutComplete}
      handleUpdateProfile={domain.handleUpdateProfile}
      onConfirmParlayTier={domain.handleConfirmParlayTier}
      onSaveParlaySlip={() => navigation.navigateSection('build')}
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

  return (
    <QueryClientProvider client={queryClient}>
      <SocialGraphProvider>
        <AuthenticatedAppContent navigation={navigation} />
      </SocialGraphProvider>
    </QueryClientProvider>
  );
}
