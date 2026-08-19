import React, { Suspense, useEffect, useState } from 'react';
// App chrome policy: one global top bar owns branding, routes, notifications and
// account. The left navigation rail is retired — the dense board routes need the
// full desktop width — and the mobile drawer still covers the phone case.
import AppTopBar from '../../app/AppTopBar';
import { useTheme } from '../../components/theme/ThemeProvider';
import { DeferredBubbleField } from '../../components/vouchedge/DeferredBubbleField';
import { useAppPosts, useAppProfile, useAppSavedVouches } from '../../context/AppShellContext';
import { FeedScrollProvider } from '../../context/FeedScrollContext';
import { resetScrollPane } from '../../lib/scroll/resetScrollPane';
import { handleSaveVouch as saveVouchAction } from '../../domain/vouchActions';
import { useNavUiStore } from '../../stores/navUiStore';
import { OptionalChromeBoundary } from '../../components/system/OptionalChromeBoundary';
import { isEagerHrSection } from '../../lib/routePreload';
import '../../styles/legacy/feed.css';
import '../../styles/legacy/feed-stream.css';
import AuroraMaxRouteFrame from '../../components/layout/AuroraMaxRouteFrame';
import '../../styles/app-topbar.css';
import { lazyWithRetry } from '../../lib/lazyWithRetry';

const CmdKPalette = lazyWithRetry(() => import('./CmdKPalette'), { label: 'CmdKPalette' });
const FeedRightRail = lazyWithRetry(() => import('./FeedRightRail'), { label: 'FeedRightRail' });
const MobileProfileDrawer = lazyWithRetry(() => import('./MobileProfileDrawer'), { label: 'MobileProfileDrawer' });
const WorldChatWidget = lazyWithRetry(() => import('../../components/theEdge/WorldChatWidget'), { label: 'WorldChatWidget' });

function DeferredWorldChat({ defer }: { defer: boolean }) {
  const [ready, setReady] = useState(() => !defer);

  useEffect(() => {
    if (!defer) {
      setReady(true);
      return;
    }

    setReady(false);
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
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
  }, [defer]);

  if (!ready) return null;

  return (
    <OptionalChromeBoundary>
      <Suspense fallback={null}>
        <WorldChatWidget />
      </Suspense>
    </OptionalChromeBoundary>
  );
}

interface HomeFeedLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
  isRouteSwitching?: boolean;
  /** True only for the bare public front page (logged-out 'welcome') — hides
   * the sidebar/header/right-rail app chrome. Logged-in users landing on
   * 'welcome' (Edge Island) still get the normal app shell. */
  isPublicFrontPage?: boolean;
  onAuthLoginSuccess?: () => void;
  onAuthLogoutComplete?: () => void;
}

const FeedRightRailColumn = React.memo(function FeedRightRailColumn({
  activeSection,
}: {
  activeSection: string;
}) {
  const posts = useAppPosts();
  const profile = useAppProfile();
  const savedVouches = useAppSavedVouches();
  const savedVouchIds = React.useMemo(
    () => savedVouches.map((vouch) => vouch.id),
    [savedVouches],
  );

  if (activeSection !== 'feed') return null;

  return (
    <div className="ve-edge-rail ve-edge-rail-right">
      <Suspense fallback={null}>
        <FeedRightRail
          posts={posts}
          profile={profile}
          savedVouchIds={savedVouchIds}
          onSaveVouch={saveVouchAction}
        />
      </Suspense>
    </div>
  );
});

const MobileDrawerHost = React.memo(function MobileDrawerHost({
  activeSection,
  onSectionChange,
  onLogoutComplete,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogoutComplete?: () => void;
}) {
  const profile = useAppProfile();
  const mobileDrawerOpen = useNavUiStore((s) => s.mobileDrawerOpen);
  const closeMobileDrawer = useNavUiStore((s) => s.closeMobileDrawer);

  if (!mobileDrawerOpen) return null;

  return (
    <Suspense fallback={null}>
      <MobileProfileDrawer
        open
        onClose={closeMobileDrawer}
        profile={profile}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onLogoutComplete={onLogoutComplete}
      />
    </Suspense>
  );
});

const HomeFeedLayoutBody = React.memo(function HomeFeedLayoutBody({
  activeSection,
  onSectionChange,
  children,
  isRouteSwitching = false,
  isPublicFrontPage = false,
  onAuthLogoutComplete,
}: HomeFeedLayoutProps) {
  const { activeTheme, reduceMotion } = useTheme();
  const scrollPaneRef = React.useRef<HTMLDivElement | null>(null);
  /* Hoisted to navUiStore so route-level chrome can open it — Today's mobile
     header replaces the app top bar and owns the search affordance there. */
  const cmdKOpen = useNavUiStore((state) => state.commandPaletteOpen);
  const setCmdKOpen = useNavUiStore((state) => state.setCommandPaletteOpen);
  const closeMobileDrawer = useNavUiStore((s) => s.closeMobileDrawer);

  const closeNavigationOverlays = React.useCallback(() => {
    closeMobileDrawer();
    setCmdKOpen(false);
  }, [closeMobileDrawer]);

  const handleSectionChange = React.useCallback((section: string) => {
    closeNavigationOverlays();
    onSectionChange(section);
  }, [closeNavigationOverlays, onSectionChange]);

  const handleOpenCmdK = React.useCallback(() => {
    setCmdKOpen(true);
  }, []);

  const handleCloseCmdK = React.useCallback(() => {
    setCmdKOpen(false);
  }, []);

  React.useEffect(() => {
    closeNavigationOverlays();
  }, [activeSection, closeNavigationOverlays]);

  React.useEffect(() => {
    resetScrollPane(scrollPaneRef.current);
  }, [activeSection]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Store setter takes a value, not an updater — read current state.
        useNavUiStore.getState().setCommandPaletteOpen(!useNavUiStore.getState().commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Theme accent vars (--ve-accent, --theme-accent-color, etc.) are applied to
  // :root by ThemeProvider and inherit down naturally — this layout no longer
  // derives its own parallel copy. The legacy `has-active-theme` class in
  // styles/legacy/feed.css and per-theme gridOverlay/equalizer decoration are
  // removed: themes may only recolor the accent layer, never structure.
  return (
    <div
      className={`z8-layout-root font-z8 text-white flex flex-col w-full relative transition-colors duration-500 overflow-x-clip bg-transparent ${
        isPublicFrontPage ? 've-layout-root-public min-h-screen' : ''
      }`}
      id="vouchedge-container-root"
      data-route-switching={isRouteSwitching ? 'true' : 'false'}
    >
      {activeTheme && activeTheme.id !== 'cyber-blue' && !reduceMotion && (
        <DeferredBubbleField count={12} mobileCount={4} variant="drift" className="z-0" />
      )}

      {!isPublicFrontPage && (
        <AppTopBar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onOpenCmdK={handleOpenCmdK}
          onLogoutComplete={onAuthLogoutComplete}
        />
      )}

      <div className={`ve-layout-frame w-full relative transition-all duration-300 z-10 ${
        isPublicFrontPage ? 've-layout-welcome min-h-screen' : activeSection === 'feed' ? 've-layout-feed' : 've-layout-wide'
      }`} id="layout-inner-frame">

        <main className={`flex flex-1 min-h-0 min-w-0 flex-col bg-transparent font-z8 ${isPublicFrontPage ? 'pb-0 border-none' : 'max-md:pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0'}`} id="center-main-content-column">
          <FeedScrollProvider scrollRef={scrollPaneRef}>
            <div className="ve-scroll-pane w-full min-h-0 flex-1" id="inner-view-slot" ref={scrollPaneRef}>
              <AuroraMaxRouteFrame section={activeSection}>{children}</AuroraMaxRouteFrame>
            </div>
          </FeedScrollProvider>
        </main>

        {!isPublicFrontPage && activeSection === 'feed' && (
          <FeedRightRailColumn activeSection={activeSection} />
        )}
      </div>

      {!isPublicFrontPage && (
        <MobileDrawerHost
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onLogoutComplete={onAuthLogoutComplete}
        />
      )}

      {!isPublicFrontPage && cmdKOpen && (
        <OptionalChromeBoundary>
          <Suspense fallback={null}>
            <CmdKPalette
              open={cmdKOpen}
              onClose={handleCloseCmdK}
              onNavigate={handleSectionChange}
            />
          </Suspense>
        </OptionalChromeBoundary>
      )}

      {!isPublicFrontPage && (
        <DeferredWorldChat defer={isEagerHrSection(activeSection)} />
      )}
    </div>
  );
});

export default React.memo(HomeFeedLayoutBody);
