import { useEffect } from 'react';
import type { useSectionNavigation } from './useSectionNavigation';
import { patchPublicNotificationsFetch } from '../lib/patchPublicNotificationsFetch';
import { useAppBootstrap } from './useAppBootstrap';
import { useAppDomain } from './useAppDomain';
import { AppShell } from './AppShell';
import { SocialGraphProvider } from '../hooks/SocialGraphProvider';
import { useAuthSession } from '../lib/authSessionStore';
import { isDiscordBetaGateOpen } from '../lib/discordBetaAccess';
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

  const discordBetaVerified = isDiscordBetaGateOpen(bootstrap.profile, {
    accountId: bootstrap.accountId,
    email: authSession.session?.user?.email,
  });
  const canUseAccountSetup = navigation.activeSection === 'settings' || navigation.activeSection === 'profile';

  if (bootstrap.authProfileLoading && !canUseAccountSetup) {
    return (
      <div className="z8-app-shell flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-vouch-cyan/20 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-vouch-cyan">Checking account access</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Restoring your VouchEdge session and Discord access status…
          </p>
        </div>
      </div>
    );
  }

  if (!discordBetaVerified && !canUseAccountSetup) {
    return (
      <div className="z8-app-shell flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-vouch-cyan/20 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-vouch-cyan">Discord verification required</p>
          <h1 className="mt-3 text-2xl font-semibold">Join the VouchEdge Discord to enter the Open Beta</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Your account is created, but beta features stay locked until Discord membership and the required roles are verified.
          </p>
          <button
            type="button"
            onClick={() => navigation.navigateSection('settings')}
            className="mt-6 rounded-xl bg-vouch-cyan px-5 py-3 font-semibold text-black transition hover:brightness-110"
          >
            Connect Discord
          </button>
        </div>
      </div>
    );
  }

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
