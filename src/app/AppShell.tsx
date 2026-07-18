import React, { Suspense, lazy, useEffect } from 'react';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { AppErrorBoundary } from '../components/system/AppErrorBoundary';
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
import { useNavUiStore } from '../stores/navUiStore';
import type { CreatorProofProfile, Parlay } from '../types';

const DeployUpdateBanner = lazy(() =>
  import('../components/system/DeployUpdateBanner').then((module) => ({ default: module.DeployUpdateBanner })),
);
const MainViewRouter = lazy(() => import('../components/routing/MainViewRouter'));
const ParlayOsLayer = lazy(() => import('../components/parlay/os/ParlayOsLayer'));
const LegalComplianceHost = lazy(() =>
  import('../components/legal/LegalComplianceHost').then((module) => ({ default: module.LegalComplianceHost })),
);

export type AppShellProps = {
  activeSection: string;
  loggingOut: boolean;
  isPendingRoute: boolean;
  isLoggedIn: boolean;
  isPublicFrontPage: boolean;
  showGlobalAppChrome: boolean;
  profileViewUserId: string | null;
  canSeeThemeStore: boolean;
  savedSlips: Parlay[];
  profile: CreatorProofProfile;
  appShellState: AppShellState;
  navigateSection: (section: string) => void;
  navigateToUserProfile: (userId: string) => void;
  handleLoginSuccess: () => void;
  handleLogoutComplete: () => void;
  handleUpdateProfile: (profile: Partial<CreatorProofProfile>) => void;
  onConfirmParlayTier: (tier: import('../lib/parlays/parlayMarketCatalog').ParlayMarketTier) => void;
  onSaveParlaySlip: () => void;
};

export function AppShell({
  activeSection,
  loggingOut,
  isPendingRoute,
  isLoggedIn,
  isPublicFrontPage,
  showGlobalAppChrome,
  profileViewUserId,
  canSeeThemeStore,
  savedSlips,
  profile,
  appShellState,
  navigateSection,
  navigateToUserProfile,
  handleLoginSuccess,
  handleLogoutComplete,
  handleUpdateProfile,
  onConfirmParlayTier,
  onSaveParlaySlip,
}: AppShellProps) {
  const mobileDrawerOpen = useNavUiStore((s) => s.mobileDrawerOpen);

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
                      <Suspense fallback={null}>
                        <DeployUpdateBanner />
                      </Suspense>
                      <AppNav
                        activeSection={activeSection}
                        onNavigate={navigateSection}
                      />
                    </>
                  )}

                  {showGlobalAppChrome && isLoggedIn && !isPublicFrontPage && (
                    <Suspense fallback={null}>
                      <ParlayOsLayer
                        onConfirmTier={onConfirmParlayTier}
                        onSaveParlay={() => {
                          onSaveParlaySlip();
                          navigateSection('build');
                        }}
                        navigateSection={navigateSection}
                        suppressFloatingDock={
                          mobileDrawerOpen
                          || activeSection === 'build'
                          || activeSection === 'live_parlays'
                          || activeSection === 'judge_home'
                          || activeSection === 'settings'
                          || activeSection === 'board'
                        }
                      />
                    </Suspense>
                  )}

                  <Suspense fallback={null}>
                    <LegalComplianceHost isLoggedIn={isLoggedIn} />
                  </Suspense>

                </NotificationProvider>
              </AppErrorBoundary>
            </div>
          </div>
        </VouchEdgeBootGate>
      </AppShellProvider>
    </ThemeProvider>
  );
}
