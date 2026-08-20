import React, { Suspense, useEffect, useState } from 'react';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { AppErrorBoundary } from '../components/system/AppErrorBoundary';
import { OptionalChromeBoundary } from '../components/system/OptionalChromeBoundary';
import { NotificationProvider } from '../components/notifications/UnifiedNotificationCenter';
import GoodbyeScreen from '../components/auth/GoodbyeScreen';
import VouchEdgeBootGate from '../components/boot/VouchEdgeBootGate';
import RouteShellSkeleton from '../components/boot/RouteShellSkeleton';
import { AppShellProvider, type AppShellState } from '../context/AppShellContext';
import { hasRealAuthToken } from './sectionNavigation';
import { AppNav } from './AppNav';
import HomeFeedLayout from '../social/feed/HomeFeedLayout';
import { isEagerHrSection, warmLikelyRoutes } from '../lib/routePreload';
import type { CreatorProofProfile, Parlay } from '../types';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import MainViewRouter from '../components/routing/MainViewRouter';

import type { Leg } from '../types';
const DeployUpdateBanner = lazyWithRetry(() =>
  import('../components/system/DeployUpdateBanner').then((module) => ({ default: module.DeployUpdateBanner })),
);
const ParlayOsLayer = lazyWithRetry(() => import('../components/parlay/os/ParlayOsLayer'));

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
  activeLegs: Leg[];
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
  activeLegs,
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
  useEffect(() => {
    if (isPublicFrontPage) return;
    warmLikelyRoutes(activeSection);
  }, [isPublicFrontPage, activeSection]);

  const isHrRoute = isEagerHrSection(activeSection);
  const [allowParlayOsLayer, setAllowParlayOsLayer] = useState(() => !isHrRoute);

  useEffect(() => {
    if (!isHrRoute) {
      setAllowParlayOsLayer(true);
      return;
    }

    setAllowParlayOsLayer(false);
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setAllowParlayOsLayer(true);
    };
    const ric = window.requestIdleCallback;
    if (typeof ric === 'function') {
      const idleId = ric(enable, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }
    const timeoutId = window.setTimeout(enable, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isHrRoute]);

  const router = (
    <MainViewRouter
      activeSection={activeSection}
      navigateSection={navigateSection}
      isLoggedIn={isLoggedIn}
      profileViewUserId={profileViewUserId}
      canSeeThemeStore={canSeeThemeStore}
      activeLegs={activeLegs}
    />
  );
  const routeContent = isHrRoute
    ? router
    : (
      <Suspense fallback={<RouteShellSkeleton />}>
        {router}
      </Suspense>
    );

  return (
    <ThemeProvider profile={profile} onUpdateProfile={handleUpdateProfile}>
      <AppShellProvider value={appShellState}>
        <VouchEdgeBootGate enabled={!['welcome', 'vouchedge_intro'].includes(activeSection) && hasRealAuthToken()}>
          <div className={`z8-app-shell ve-motion-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-aurora-generation="max">
            {/* The shared backdrop remains mounted outside the route tree so
                route changes never rebuild its WebGL context. The shell owns
                an opaque pitch-black ground for consistent page contrast. */}
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
                      {allowParlayOsLayer && (
                        <OptionalChromeBoundary>
                          <Suspense fallback={null}>
                            <DeployUpdateBanner />
                          </Suspense>
                        </OptionalChromeBoundary>
                      )}
                      <AppNav
                        activeSection={activeSection}
                        onNavigate={navigateSection}
                      />
                    </>
                  )}

                  {showGlobalAppChrome && isLoggedIn && !isPublicFrontPage && allowParlayOsLayer && (
                    <OptionalChromeBoundary>
                      <Suspense fallback={null}>
                        <ParlayOsLayer
                          onConfirmTier={onConfirmParlayTier}
                          onSaveParlay={() => {
                            onSaveParlaySlip();
                            navigateSection('build');
                          }}
                          navigateSection={navigateSection}
                          suppressFloatingDock={activeSection === 'build' || activeSection === 'live_parlays'}
                        />
                      </Suspense>
                    </OptionalChromeBoundary>
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
