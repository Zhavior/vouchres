import React, { Suspense, lazy, useEffect } from 'react';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { AppErrorBoundary } from '../components/system/AppErrorBoundary';
import { AppToastHost } from '../components/system/AppToastHost';
import { NotificationProvider } from '../components/notifications/UnifiedNotificationCenter';
import GoodbyeScreen from '../components/auth/GoodbyeScreen';
import VouchEdgeBootGate from '../components/boot/VouchEdgeBootGate';
import RouteShellSkeleton from '../components/boot/RouteShellSkeleton';
import { TerminalBackground } from '../components/layout/TerminalBackground';
import { AppShellProvider, type AppShellState } from '../context/AppShellContext';
import { hasRealAuthToken } from './sectionNavigation';
import { AppNav } from './AppNav';
import HomeFeedLayout from '../social/feed/HomeFeedLayout';
import { preloadMainRouter, warmLikelyRoutes } from '../lib/routePreload';
import type { CreatorProofProfile, Parlay } from '../types';

const DeployUpdateBanner = lazy(() =>
  import('../components/system/DeployUpdateBanner').then((module) => ({ default: module.DeployUpdateBanner })),
);
const MainViewRouter = lazy(() => import('../components/routing/MainViewRouter'));
const EdgeIslandCommandCenter = lazy(() => import('../components/theEdge/EdgeIslandCommandCenter'));

export type AppShellProps = {
  activeSection: string;
  loggingOut: boolean;
  isPendingRoute: boolean;
  isLoggedIn: boolean;
  isPublicFrontPage: boolean;
  showGlobalAppChrome: boolean;
  edgeIslandOpen: boolean;
  profileViewUserId: string | null;
  canSeeThemeStore: boolean;
  savedSlips: Parlay[];
  profile: CreatorProofProfile;
  appShellState: AppShellState;
  navigateSection: (section: string) => void;
  navigateToUserProfile: (userId: string) => void;
  setEdgeIslandOpen: (open: boolean) => void;
  handleLoginSuccess: () => void;
  handleLogoutComplete: () => void;
  handleUpdateProfile: (profile: Partial<CreatorProofProfile>) => void;
};

export function AppShell({
  activeSection,
  loggingOut,
  isPendingRoute,
  isLoggedIn,
  isPublicFrontPage,
  showGlobalAppChrome,
  edgeIslandOpen,
  profileViewUserId,
  canSeeThemeStore,
  savedSlips,
  profile,
  appShellState,
  navigateSection,
  navigateToUserProfile,
  setEdgeIslandOpen,
  handleLoginSuccess,
  handleLogoutComplete,
  handleUpdateProfile,
}: AppShellProps) {
  useEffect(() => {
    if (isPublicFrontPage) return;
    preloadMainRouter();
    warmLikelyRoutes(activeSection);
  }, [isPublicFrontPage, activeSection]);

  const routeContent = (
    <Suspense fallback={<RouteShellSkeleton />}>
      <MainViewRouter
        activeSection={activeSection}
        navigateSection={navigateSection}
        isLoggedIn={isLoggedIn}
        profileViewUserId={profileViewUserId}
        canSeeThemeStore={canSeeThemeStore}
      />
    </Suspense>
  );

  return (
    <ThemeProvider profile={profile} onUpdateProfile={handleUpdateProfile}>
      <AppShellProvider value={appShellState}>
        <VouchEdgeBootGate enabled={!['welcome', 'vouchedge_intro'].includes(activeSection) && hasRealAuthToken()}>
          <div className="z8-app-shell ve-motion-shell ve-theme-transition font-z8">
            <TerminalBackground />

            <div className="ve-motion-content">
              {loggingOut && <GoodbyeScreen />}
              <AppErrorBoundary resetKey={activeSection} onBackHome={() => navigateSection('today')}>
                <NotificationProvider savedSlips={savedSlips} onNavigate={navigateSection}>
                  {isPublicFrontPage ? (
                    <div id="layout-inner-frame" className="ve-layout-frame ve-layout-welcome">
                      <div id="center-main-content-column">
                        <div id="inner-view-slot">{routeContent}</div>
                      </div>
                    </div>
                  ) : (
                    <HomeFeedLayout
                      activeSection={activeSection}
                      onSectionChange={navigateSection}
                      isRouteSwitching={isPendingRoute}
                      isPublicFrontPage={isPublicFrontPage}
                      onAuthLoginSuccess={handleLoginSuccess}
                      onAuthLogoutComplete={handleLogoutComplete}
                    >
                      {routeContent}
                    </HomeFeedLayout>
                  )}

                  {showGlobalAppChrome && (
                    <>
                      <AppToastHost />
                      <Suspense fallback={null}>
                        <DeployUpdateBanner />
                      </Suspense>
                      <AppNav
                        activeSection={activeSection}
                        onNavigate={navigateSection}
                        onOpenEdgeIsland={() => setEdgeIslandOpen(true)}
                      />
                    </>
                  )}

                  {showGlobalAppChrome && (
                    <Suspense fallback={<RouteShellSkeleton />}>
                      <EdgeIslandCommandCenter
                        open={edgeIslandOpen}
                        onClose={() => setEdgeIslandOpen(false)}
                        onSectionChange={navigateSection}
                        onNavigateProfile={navigateToUserProfile}
                        savedSlips={savedSlips}
                        profile={profile}
                        isLoggedIn={hasRealAuthToken()}
                      />
                    </Suspense>
                  )}
                </NotificationProvider>
              </AppErrorBoundary>
            </div>
          </div>
        </VouchEdgeBootGate>
      </AppShellProvider>
    </ThemeProvider>
  );
}
