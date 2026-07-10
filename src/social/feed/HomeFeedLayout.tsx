import React, { Suspense, lazy } from 'react';
import FeedSidebar from './FeedSidebar';
import FeedRightRail from './FeedRightRail';
import MobileProfileDrawer from './MobileProfileDrawer';
import { useTheme } from '../../components/theme/ThemeProvider';
import { VisualTheme } from '../../theme/themeRegistry';
import { DeferredBubbleField } from '../../components/vouchedge/DeferredBubbleField';
import { useAppPosts, useAppProfile, useAppSavedVouches } from '../../context/AppShellContext';
import { FeedScrollProvider } from '../../context/FeedScrollContext';
import { resetScrollPane } from '../../lib/scroll/resetScrollPane';
import { handleSaveVouch as saveVouchAction } from '../../domain/vouchActions';
import { useNavUiStore } from '../../stores/navUiStore';
import '../../styles/legacy/feed.css';
import '../../styles/legacy/feed-stream.css';

const CmdKPalette = lazy(() => import('./CmdKPalette'));

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

  const getThemeVars = (theme: VisualTheme) => {
    return {
      '--theme-border-color': theme.borderColor || 'rgba(6,182,212,0.2)',
      '--theme-shadow-glow': theme.accentText.includes('cyan') ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.15)',
      '--theme-card-bg-gradient': 'linear-gradient(135deg, rgba(8, 20, 48, 0.84) 0%, rgba(2, 6, 23, 0.90) 100%)',
      '--theme-accent-color': theme.accentText.includes('cyan') ? '#22d3ee' : theme.accentText.includes('orange') ? '#f97316' : theme.accentText.includes('emerald') ? '#10b981' : theme.accentText.includes('rose') ? '#e11d48' : '#eab308',
    };
  };

  const themeVars = activeTheme ? getThemeVars(activeTheme) : null;

  return (
    <div
      className={`z8-layout-root font-z8 min-h-screen text-white flex justify-center w-full relative transition-colors duration-500 overflow-x-clip ${
        activeTheme && activeTheme.id !== 'cyber-blue' ? 'bg-transparent has-active-theme' : 'bg-transparent'
      }`}
      style={activeTheme && activeTheme.id !== 'cyber-blue' ? (themeVars as React.CSSProperties) : undefined}
      id="vouchedge-container-root"
      data-route-switching={isRouteSwitching ? 'true' : 'false'}
    >
      {activeTheme && activeTheme.id !== 'cyber-blue' && activeTheme.gridOverlay && (
        <div className={`absolute inset-0 pointer-events-none z-0 ${activeTheme.gridOverlay}`} />
      )}

      {activeTheme?.id === 'music_beat_lines' && (
        <>
          <style>{`
            @keyframes equalizer-pulse {
              0% { height: 16px; opacity: 0.25; filter: saturate(0.85); }
              50% { height: 135px; opacity: 0.55; filter: saturate(1.2); }
              100% { height: 38px; opacity: 0.35; filter: saturate(1.4); }
            }
          `}</style>
          <div className="absolute bottom-12 left-0 right-0 h-44 pointer-events-none z-0 select-none flex items-end justify-around px-2 opacity-40 gap-1 overflow-hidden" id="bg-equalizer-beat-lines">
            {Array.from({ length: 42 }).map((_, i) => {
              const animDuration = `${0.5 + (i % 8) * 0.12}s`;
              const animDelay = `-${(i % 5) * 0.18}s`;
              const barColor = i % 4 === 0 ? '#00F0FF' : i % 3 === 0 ? '#00FF9D' : '#FFB800';
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-t-md origin-bottom"
                  style={{
                    background: barColor,
                    animationName: 'equalizer-pulse',
                    animationDuration: animDuration,
                    animationDelay: animDelay,
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out',
                    height: '16px',
                  }}
                />
              );
            })}
          </div>
        </>
      )}

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
        <Suspense fallback={null}>
          <CmdKPalette
            open={cmdKOpen}
            onClose={handleCloseCmdK}
            onNavigate={handleSectionChange}
          />
        </Suspense>
      )}
    </div>
  );
});

export default React.memo(HomeFeedLayoutBody);
