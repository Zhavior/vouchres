import { useSectionNavigation } from './app/useSectionNavigation';
import { useAppBootstrap } from './app/useAppBootstrap';
import { useAppDomain } from './app/useAppDomain';
import { AppShell } from './app/AppShell';

export default function App() {
  const navigation = useSectionNavigation();
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
    />
  );
}
