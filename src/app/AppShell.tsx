import React, { Suspense, lazy } from 'react';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { AppErrorBoundary } from '../components/system/AppErrorBoundary';
import { NotificationProvider } from '../components/notifications/UnifiedNotificationCenter';
import AuthStatusBadge from '../components/auth/AuthStatusBadge';
import GoodbyeScreen from '../components/auth/GoodbyeScreen';
import VouchEdgeBootGate from '../components/boot/VouchEdgeBootGate';
import RouteShellSkeleton from '../components/boot/RouteShellSkeleton';
import { AppShellProvider, type AppShellState } from '../context/AppShellContext';
import { hasRealAuthToken } from './sectionNavigation';
import { AppNav } from './AppNav';
import { DeployUpdateBanner } from '../components/system/DeployUpdateBanner';
import type { CreatorProofProfile, Parlay } from '../types';

const HomeFeedLayout = lazy(() => import('../social/feed/HomeFeedLayout'));
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
  return (
    <ThemeProvider profile={profile} onUpdateProfile={handleUpdateProfile}>
      <AppShellProvider value={appShellState}>
        <VouchEdgeBootGate enabled={!['welcome', 'vouchedge_intro'].includes(activeSection) && hasRealAuthToken()}>
          <div className="z8-app-shell ve-motion-shell ve-theme-transition font-z8">
            <div className="ve-motion-bg" aria-hidden="true">
              <div className="ve-motion-grid" />
              <div className="ve-motion-noise" />
              <div className="ve-motion-spotlight" />
              <div className="ve-motion-orb ve-motion-orb-a" />
              <div className="ve-motion-orb ve-motion-orb-b" />
              <div className="ve-motion-orb ve-motion-orb-c" />
            </div>

            <div className="ve-motion-content">
              {loggingOut && <GoodbyeScreen />}
              <AppErrorBoundary resetKey={activeSection} onBackHome={() => navigateSection('today')}>
                <NotificationProvider savedSlips={savedSlips} onNavigate={navigateSection}>
                  <div className="hidden md:block">
                    <AuthStatusBadge
                      hideGuest={activeSection === 'welcome' || activeSection === 'vouchedge_intro'}
                      onLoginSuccess={handleLoginSuccess}
                      onLogoutComplete={handleLogoutComplete}
                    />
                  </div>
                  <Suspense fallback={<RouteShellSkeleton />}>
                    <HomeFeedLayout
                      activeSection={activeSection}
                      onSectionChange={navigateSection}
                      isRouteSwitching={isPendingRoute}
                      isPublicFrontPage={isPublicFrontPage}
                      onAuthLoginSuccess={handleLoginSuccess}
                      onAuthLogoutComplete={handleLogoutComplete}
                    >
                      <Suspense fallback={<RouteShellSkeleton />}>
                        <MainViewRouter
                          activeSection={activeSection}
                          navigateSection={navigateSection}
                          isLoggedIn={isLoggedIn}
                          profileViewUserId={profileViewUserId}
                          canSeeThemeStore={canSeeThemeStore}
                        />
                      </Suspense>
                    </HomeFeedLayout>
                  </Suspense>

                  {showGlobalAppChrome && (
                    <>
                      <DeployUpdateBanner />
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
