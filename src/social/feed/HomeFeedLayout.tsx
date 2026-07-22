import React, { Suspense, lazy } from 'react';
// App chrome policy: no top header bar — branding, notifications, and logout
// live only in FeedSidebar (md+) and MobileProfileDrawer (mobile).
import FeedSidebar from './FeedSidebar';
import FeedRightRail from './FeedRightRail';
import MobileProfileDrawer from './MobileProfileDrawer';
import CmdKPalette from './CmdKPalette';
import { useTheme } from '../../components/theme/ThemeProvider';
import { DeferredBubbleField } from '../../components/vouchedge/DeferredBubbleField';
import { useAppPosts, useAppProfile, useAppSavedVouches } from '../../context/AppShellContext';
import { FeedScrollProvider } from '../../context/FeedScrollContext';
import { resetScrollPane } from '../../lib/scroll/resetScrollPane';
import { handleSaveVouch as saveVouchAction } from '../../domain/vouchActions';
import { useNavUiStore } from '../../stores/navUiStore';
import '../../styles/legacy/feed.css';
import '../../styles/legacy/feed-stream.css';

const WorldChatWidget = lazy(() => import('../../components/theEdge/WorldChatWidget'));

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

const DesktopSidebarRail = React.memo(function DesktopSidebarRail({
  activeSection,
  onSectionChange,
  onOpenCmdK,
  onLogoutComplete,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenCmdK: () => void;
  onLogoutComplete?: () => void;
}) {
  return (
    <div className="ve-edge-rail ve-edge-rail-left">
      <FeedSidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onOpenCmdK={onOpenCmdK}
        onLogoutComplete={onLogoutComplete}
      />
    </div>
  );
});

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
      <FeedRightRail
        posts={posts}
        profile={profile}
        savedVouchIds={savedVouchIds}
        onSaveVouch={saveVouchAction}
      />
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

  return (
    <MobileProfileDrawer
      open={mobileDrawerOpen}
      onClose={closeMobileDrawer}
      profile={profile}
      activeSection={activeSection}
      onSectionChange={onSectionChange}
      onLogoutComplete={onLogoutComplete}
    />
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
  const [cmdKOpen, setCmdKOpen] = React.useState(false);
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
        setCmdKOpen(prev => !prev);
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
      className="z8-layout-root font-z8 min-h-screen text-white flex justify-center w-full relative transition-colors duration-500 overflow-x-clip bg-transparent"
      id="vouchedge-container-root"
      data-route-switching={isRouteSwitching ? 'true' : 'false'}
    >
      {activeTheme && activeTheme.id !== 'cyber-blue' && !reduceMotion && (
        <DeferredBubbleField count={12} mobileCount={4} variant="drift" className="z-0" />
      )}

      <div className={`ve-layout-frame w-full min-h-screen relative transition-all duration-300 z-10 ${
        isPublicFrontPage ? 've-layout-welcome' : activeSection === 'feed' ? 've-layout-feed' : 've-layout-wide'
      }`} id="layout-inner-frame">

        {!isPublicFrontPage && (
          <DesktopSidebarRail
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onOpenCmdK={handleOpenCmdK}
            onLogoutComplete={onAuthLogoutComplete}
          />
        )}

        <main className={`flex flex-1 min-h-0 min-w-0 flex-col bg-transparent font-z8 ${isPublicFrontPage ? 'pb-0 border-none' : 'max-md:pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0'}`} id="center-main-content-column">
          <FeedScrollProvider scrollRef={scrollPaneRef}>
            <div className="ve-scroll-pane w-full min-h-0 flex-1" id="inner-view-slot" ref={scrollPaneRef}>
              {children}
            </div>
          </FeedScrollProvider>
        </main>

        {!isPublicFrontPage && (
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
        <CmdKPalette
          open={cmdKOpen}
          onClose={handleCloseCmdK}
          onNavigate={handleSectionChange}
        />
      )}

      {!isPublicFrontPage && (
        <Suspense fallback={null}>
          <WorldChatWidget />
        </Suspense>
      )}
    </div>
  );
});

export default React.memo(HomeFeedLayoutBody);
