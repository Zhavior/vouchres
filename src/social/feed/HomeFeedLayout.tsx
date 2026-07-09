import React from 'react';
import FeedSidebar from './FeedSidebar';
import FeedRightRail from './FeedRightRail';
import MobileProfileDrawer, { TierAvatar } from './MobileProfileDrawer';
import CmdKPalette from './CmdKPalette';
import { Sparkles } from 'lucide-react';
import AuthStatusBadge from '../../components/auth/AuthStatusBadge';
import { NotificationBellButton } from '../../components/notifications/UnifiedNotificationCenter';
import { useTheme } from '../../components/theme/ThemeProvider';
import { VisualTheme } from '../../theme/themeRegistry';
import { DeferredBubbleField } from '../../components/vouchedge/DeferredBubbleField';
import { useAppPosts, useAppProfile, useAppSavedVouches } from '../../context/AppShellContext';
import { FeedScrollProvider } from '../../context/FeedScrollContext';
import { resetScrollPane } from '../../lib/scroll/resetScrollPane';
import { handleSaveVouch as saveVouchAction } from '../../domain/vouchActions';

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
  edgeTransitioning,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenCmdK: () => void;
  edgeTransitioning: boolean;
}) {
  return (
    <div className={`ve-edge-rail ve-edge-rail-left ${edgeTransitioning ? 've-edge-rail-switching' : ''}`}>
      <FeedSidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onOpenCmdK={onOpenCmdK}
      />
    </div>
  );
});

const FeedRightRailColumn = React.memo(function FeedRightRailColumn({
  activeSection,
  edgeTransitioning,
}: {
  activeSection: string;
  edgeTransitioning: boolean;
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
    <div className={`ve-edge-rail ve-edge-rail-right ${edgeTransitioning ? 've-edge-rail-switching' : ''}`}>
      <FeedRightRail
        posts={posts}
        profile={profile}
        savedVouchIds={savedVouchIds}
        onSaveVouch={saveVouchAction}
      />
    </div>
  );
});

const DesktopSlimHeader = React.memo(function DesktopSlimHeader({
  onAuthLoginSuccess,
  onAuthLogoutComplete,
}: {
  onAuthLoginSuccess?: () => void;
  onAuthLogoutComplete?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 hidden shrink-0 select-none items-center justify-end gap-2 border-b border-white/5 bg-black/20 px-4 py-2 backdrop-blur-xl md:flex font-z8 supports-[backdrop-filter]:bg-black/40">
      <NotificationBellButton />
      <AuthStatusBadge
        inline
        onLoginSuccess={onAuthLoginSuccess}
        onLogoutComplete={onAuthLogoutComplete}
      />
    </header>
  );
});

const MobileCompactHeader = React.memo(function MobileCompactHeader({
  activeSection,
  onSectionChange,
  onOpenDrawer,
  onAuthLoginSuccess,
  onAuthLogoutComplete,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenDrawer: () => void;
  onAuthLoginSuccess?: () => void;
  onAuthLogoutComplete?: () => void;
}) {
  const profile = useAppProfile();

  return (
    <header className="ve-mobile-header sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-white/5 bg-black/20 px-3 py-2.5 backdrop-blur-xl select-none font-z8 supports-[backdrop-filter]:bg-black/40 md:hidden">
      <div className="flex items-center gap-2.5 min-w-0">
        <TierAvatar
          profile={profile}
          size={36}
          priority
          onClick={onOpenDrawer}
          ariaLabel="Open navigation menu"
        />
        <button type="button" onClick={() => onSectionChange('feed')} className="text-sm font-black text-white tracking-wider">
          VOUCH<span className="text-vouch-cyan">EDGE</span>
        </button>
      </div>

      <div className="flex items-center justify-end gap-1.5 font-mono text-[10px]">
        <NotificationBellButton size="sm" />

        {profile.subscriptionTier !== 'SELLER_PRO' && (
          <button
            onClick={() => onSectionChange('premium')}
            className="flex items-center gap-1 bg-vouch-emerald/10 border border-vouch-emerald/30 px-2.5 py-1 rounded-full text-vouch-emerald font-bold active:scale-95 transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>UPGRADE</span>
          </button>
        )}

        <AuthStatusBadge
          inline
          onLoginSuccess={onAuthLoginSuccess}
          onLogoutComplete={onAuthLogoutComplete}
        />
      </div>
    </header>
  );
});

const MobileDrawerHost = React.memo(function MobileDrawerHost({
  open,
  onClose,
  activeSection,
  onSectionChange,
}: {
  open: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  const profile = useAppProfile();

  return (
    <MobileProfileDrawer
      open={open}
      onClose={onClose}
      profile={profile}
      activeSection={activeSection}
      onSectionChange={onSectionChange}
    />
  );
});

const HomeFeedLayoutBody = React.memo(function HomeFeedLayoutBody({
  activeSection,
  onSectionChange,
  children,
  isRouteSwitching = false,
  isPublicFrontPage = false,
  onAuthLoginSuccess,
  onAuthLogoutComplete,
}: HomeFeedLayoutProps) {
  const { activeTheme, reduceMotion } = useTheme();
  const scrollPaneRef = React.useRef<HTMLDivElement | null>(null);
  const [edgeTransitioning, setEdgeTransitioning] = React.useState(false);
  const [cmdKOpen, setCmdKOpen] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const previousSectionRef = React.useRef(activeSection);

  const closeNavigationOverlays = React.useCallback(() => {
    setMobileDrawerOpen(false);
    setCmdKOpen(false);
  }, []);

  const handleSectionChange = React.useCallback((section: string) => {
    closeNavigationOverlays();
    onSectionChange(section);
  }, [closeNavigationOverlays, onSectionChange]);

  const handleOpenCmdK = React.useCallback(() => {
    setCmdKOpen(true);
  }, []);

  const handleOpenMobileDrawer = React.useCallback(() => {
    setMobileDrawerOpen(true);
  }, []);

  const handleCloseMobileDrawer = React.useCallback(() => {
    setMobileDrawerOpen(false);
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
    if (previousSectionRef.current === activeSection) return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    setEdgeTransitioning(true);
    const duration = reduceMotion ? 0 : isMobile ? 140 : 280;
    const timer = window.setTimeout(() => {
      setEdgeTransitioning(false);
      previousSectionRef.current = activeSection;
    }, duration);

    return () => window.clearTimeout(timer);
  }, [activeSection, reduceMotion]);

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
            edgeTransitioning={edgeTransitioning}
          />
        )}

        <main className={`flex flex-1 min-h-0 min-w-0 flex-col bg-transparent font-z8 ${isPublicFrontPage ? 'pb-0 border-none' : 'max-md:pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0'}`} id="center-main-content-column">
          {!isPublicFrontPage && (
            <DesktopSlimHeader
              onAuthLoginSuccess={onAuthLoginSuccess}
              onAuthLogoutComplete={onAuthLogoutComplete}
            />
          )}

          {!isPublicFrontPage && (
            <MobileCompactHeader
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              onOpenDrawer={handleOpenMobileDrawer}
              onAuthLoginSuccess={onAuthLoginSuccess}
              onAuthLogoutComplete={onAuthLogoutComplete}
            />
          )}

          <FeedScrollProvider scrollRef={scrollPaneRef}>
            <div className="ve-scroll-pane w-full min-h-0 flex-1" id="inner-view-slot" ref={scrollPaneRef}>
              {children}
            </div>
          </FeedScrollProvider>
        </main>

        {!isPublicFrontPage && (
          <FeedRightRailColumn
            activeSection={activeSection}
            edgeTransitioning={edgeTransitioning}
          />
        )}
      </div>

      {!isPublicFrontPage && (
        <MobileDrawerHost
          open={mobileDrawerOpen}
          onClose={handleCloseMobileDrawer}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      )}

      {!isPublicFrontPage && (
        <CmdKPalette
          open={cmdKOpen}
          onClose={handleCloseCmdK}
          onNavigate={handleSectionChange}
        />
      )}
    </div>
  );
});

export default React.memo(HomeFeedLayoutBody);
